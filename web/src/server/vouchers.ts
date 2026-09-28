import 'server-only';
import { and, desc, eq, ne, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { money } from '@/lib/format';
import { fmtDate } from '@/lib/order-labels';
import { voucherStatus, WELCOME_CODE, WELCOME_DAYS, welcomeText, type WelcomeOffer, type WelcomeProgram } from '@/lib/voucher-labels';
import { db, schema } from './db';
import type { Tx } from './inventory';
import { notify } from './notify';

const { vouchers, orders, users } = schema;

export type Voucher = typeof vouchers.$inferSelect;

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chưa đúng');

export const VoucherInputSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  code: z.string().trim().min(3, 'Mã tối thiểu 3 ký tự').max(30).regex(/^[A-Za-z0-9]+$/, 'Mã chỉ gồm chữ và số, không dấu cách'),
  label: z.string().trim().min(3, 'Nhập tên hiển thị').max(120),
  discountType: z.enum(['percent', 'amount']),
  discountValue: z.coerce.number().int().min(1, 'Nhập giá trị giảm'),
  maxDiscount: z.coerce.number().int().min(0).optional(),
  minOrder: z.coerce.number().int().min(0).default(0),
  usageLimit: z.coerce.number().int().min(1).optional(),
  perCustomerLimit: z.coerce.number().int().min(1).default(1),
  startsAt: ymd.optional(),
  endsAt: ymd.optional(),
  active: z.boolean().default(true),
}).superRefine((v, ctx) => {
  if (v.discountType === 'percent' && v.discountValue > 100) ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Phần trăm tối đa 100' });
  if (v.startsAt && v.endsAt && v.startsAt > v.endsAt) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Ngày kết thúc phải sau ngày bắt đầu' });
});
export type VoucherInput = z.infer<typeof VoucherInputSchema>;

const toRow = (input: VoucherInput) => ({
  code: input.code.toUpperCase(),
  label: input.label,
  discountType: input.discountType,
  discountValue: input.discountValue,
  maxDiscount: input.discountType === 'percent' ? (input.maxDiscount || null) : null,
  minOrder: input.minOrder,
  usageLimit: input.usageLimit || null,
  perCustomerLimit: input.perCustomerLimit,
  startsAt: input.startsAt ? new Date(`${input.startsAt}T00:00:00`) : null,
  endsAt: input.endsAt ? new Date(`${input.endsAt}T23:59:59`) : null,
  active: input.active,
});

/** Tạo mới — mã không đổi được sau khi tạo (giống slug bệnh cây, slug sản phẩm). */
export async function createVoucher(input: VoucherInput) {
  const code = input.code.toUpperCase();
  const [exists] = await db.select({ id: vouchers.id }).from(vouchers).where(eq(vouchers.code, code));
  if (exists) return { ok: false as const, error: 'Mã này đã tồn tại' };
  const [row] = await db.insert(vouchers).values(toRow(input)).returning({ id: vouchers.id });
  return { ok: true as const, id: row.id };
}

/** Sửa — bỏ qua phần code trong input, giữ nguyên mã gốc. */
export async function updateVoucher(id: number, input: VoucherInput) {
  const { code: _code, ...rest } = toRow(input);
  await db.update(vouchers).set(rest).where(eq(vouchers.id, id));
  return { ok: true as const };
}

export async function setVoucherActive(id: number, active: boolean) {
  await db.update(vouchers).set({ active }).where(eq(vouchers.id, id));
}

export const getVoucher = async (id: number) => (await db.select().from(vouchers).where(eq(vouchers.id, id)))[0];

/** Danh sách cho admin: kèm lượt đã dùng + doanh thu từ đơn có mã (không tính đơn đã hủy). */
export async function listVouchers() {
  return db.select({
    v: vouchers,
    used: sql<number>`(select count(*) from ${orders} o where o.voucher_code = ${vouchers.code} and o.status <> 'cancelled')`.mapWith(Number),
    revenue: sql<number>`coalesce((select sum(o.total) from ${orders} o where o.voucher_code = ${vouchers.code} and o.status <> 'cancelled'), 0)`.mapWith(Number),
  }).from(vouchers).orderBy(desc(vouchers.id));
}

/** Danh sách mã đang áp dụng cho khách xem ở trang Khuyến mãi (chỉ mã còn hiệu lực, chưa hết lượt tổng). */
export async function listActiveVouchers() {
  const now = new Date();
  const rows = await db.select({
    v: vouchers,
    used: sql<number>`(select count(*) from ${orders} o where o.voucher_code = ${vouchers.code} and o.status <> 'cancelled')`.mapWith(Number),
  }).from(vouchers)
    .where(and(eq(vouchers.active, true), sql`(${vouchers.endsAt} is null or ${vouchers.endsAt} >= ${now})`, sql`(${vouchers.startsAt} is null or ${vouchers.startsAt} <= ${now})`))
    .orderBy(desc(vouchers.id));
  return rows.filter((r) => r.v.usageLimit == null || r.used < r.v.usageLimit).map((r) => r.v);
}

export type VoucherCheck = { ok: true; code: string; discount: number } | { ok: false; error: string };

/**
 * Kiểm tra mã còn dùng được không + tính số tiền giảm trên subtotal hiện tại.
 * `lock: true` khóa dòng mã (FOR UPDATE) trong transaction tạo đơn để 2 đơn cùng lúc không vượt quá usageLimit.
 */
export async function checkVoucher(
  executor: Tx | typeof db,
  rawCode: string,
  ctx: { subtotal: number; userId: number | null; phone: string },
  opts: { lock?: boolean } = {},
): Promise<VoucherCheck> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: 'Nhập mã giảm giá' };
  const [v] = opts.lock
    ? await (executor as Tx).select().from(vouchers).where(eq(vouchers.code, code)).for('update')
    : await executor.select().from(vouchers).where(eq(vouchers.code, code));
  if (!v) return { ok: false, error: 'Mã giảm giá không tồn tại' };
  const status = v.active ? (v.startsAt && v.startsAt > new Date() ? 'scheduled' : v.endsAt && v.endsAt < new Date() ? 'expired' : 'active') : 'off';
  if (status !== 'active') return { ok: false, error: status === 'off' ? 'Mã đã ngừng áp dụng' : status === 'scheduled' ? 'Mã chưa đến thời gian áp dụng' : 'Mã đã hết hạn' };
  if (v.code === WELCOME_CODE) {
    // Quà tài khoản mới: phải đăng nhập, trong WELCOME_DAYS ngày kể từ lần đăng nhập đầu tiên.
    if (!ctx.userId) return { ok: false, error: 'Mã dành cho tài khoản mới — vui lòng đăng nhập để dùng' };
    const [u] = await executor.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, ctx.userId));
    if (!u || welcomeEnds(u.createdAt) < new Date()) return { ok: false, error: `Mã chỉ dùng trong ${WELCOME_DAYS} ngày đầu kể từ khi tạo tài khoản` };
  }
  if (ctx.subtotal < v.minOrder) return { ok: false, error: `Đơn cần từ ${v.minOrder.toLocaleString('vi-VN')}đ để dùng mã này` };

  if (v.usageLimit != null) {
    const [{ n }] = await executor.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(orders)
      .where(and(eq(orders.voucherCode, v.code), ne(orders.status, 'cancelled')));
    if (n >= v.usageLimit) return { ok: false, error: 'Mã đã hết lượt sử dụng' };
  }
  const [{ n: mine }] = await executor.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(orders)
    .where(and(
      eq(orders.voucherCode, v.code), ne(orders.status, 'cancelled'),
      ctx.userId ? or(eq(orders.userId, ctx.userId), eq(orders.phone, ctx.phone)) : eq(orders.phone, ctx.phone),
    ));
  if (mine >= v.perCustomerLimit) return { ok: false, error: 'Bạn đã dùng hết lượt cho mã này' };

  const raw = v.discountType === 'percent' ? Math.round((ctx.subtotal * v.discountValue) / 100) : v.discountValue;
  const discount = Math.min(raw, v.maxDiscount ?? raw, ctx.subtotal);
  return { ok: true, code: v.code, discount };
}

// ---- Quà tài khoản mới (luật chung ở lib/voucher-labels.ts) ----------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
/** Quà hết hạn WELCOME_DAYS ngày sau lần đăng nhập đầu tiên (lúc tạo tài khoản). */
const welcomeEnds = (createdAt: Date) => new Date(createdAt.getTime() + WELCOME_DAYS * DAY_MS);

const toProgram = (v: Voucher): WelcomeProgram => ({
  code: v.code, discountType: v.discountType, discountValue: v.discountValue, maxDiscount: v.maxDiscount, minOrder: v.minOrder, days: WELCOME_DAYS,
});

const countUses = (where: ReturnType<typeof and>) =>
  db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(orders).where(where).then(([r]) => r.n);

/** Mã quà đang chạy: có mã, đang bật, trong thời gian áp dụng, chưa hết tổng lượt. null = không có quà. */
async function runningWelcome() {
  const [v] = await db.select().from(vouchers).where(eq(vouchers.code, WELCOME_CODE));
  if (!v || voucherStatus(v) !== 'active') return null;
  if (v.usageLimit != null && await countUses(and(eq(orders.voucherCode, v.code), ne(orders.status, 'cancelled'))) >= v.usageLimit) return null;
  return v;
}

/** Hộp đăng nhập hiện quà cho khách chưa có tài khoản. */
export async function welcomeProgram(): Promise<WelcomeProgram | null> {
  const v = await runningWelcome();
  return v && toProgram(v);
}

/** Quà của một tài khoản: còn dùng được / đã dùng / hết hạn. null = không có chương trình quà. */
export async function welcomeOffer(userId: number): Promise<WelcomeOffer | null> {
  const v = await runningWelcome();
  if (!v) return null;
  const [u] = await db.select({ createdAt: users.createdAt, phone: users.phone }).from(users).where(eq(users.id, userId));
  if (!u) return null;
  const ends = welcomeEnds(u.createdAt);
  const expiresAt = v.endsAt && v.endsAt < ends ? v.endsAt : ends;
  const used = await countUses(and(
    eq(orders.voucherCode, v.code), ne(orders.status, 'cancelled'),
    u.phone ? or(eq(orders.userId, userId), eq(orders.phone, u.phone)) : eq(orders.userId, userId),
  ));
  const status = used >= v.perCustomerLimit ? 'used' : expiresAt < new Date() ? 'expired' : 'available';
  return { ...toProgram(v), expiresAt: expiresAt.toISOString(), status };
}

/**
 * Gọi ngay sau khi tạo tài khoản (lần đăng nhập đầu tiên): báo quà vào chuông thông báo (tab Khuyến mãi)
 * và trả về để hộp đăng nhập hiện lời chào. Không gửi Zalo/email — tin khuyến mãi, tránh tốn phí ZNS.
 */
export async function announceWelcome(userId: number): Promise<WelcomeOffer | null> {
  const offer = await welcomeOffer(userId);
  if (offer?.status !== 'available') return null;
  const what = welcomeText(offer, money);
  await notify(db, userId, {
    kind: 'promo',
    text: `Chào mừng bạn! Tặng bạn mã **${offer.code}**: ${what.charAt(0).toLowerCase()}${what.slice(1)}, dùng đến ${fmtDate(new Date(offer.expiresAt))}.`,
    href: '/khuyen-mai',
  });
  return offer;
}
