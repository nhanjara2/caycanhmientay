import 'server-only';
import { and, desc, eq, inArray, ne, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { money } from '@/lib/format';
import { fmtDate } from '@/lib/order-labels';
import { discountOf, voucherStatus, WELCOME_CODE, WELCOME_DAYS, welcomeText, type VoucherKind, type WelcomeOffer, type WelcomeProgram } from '@/lib/voucher-labels';
import type { Totals } from '@/lib/pricing';
import { isScoped, voucherAmount, type VoucherScope } from '@/lib/voucher-scope';
import { getCategories } from './categories';
import { db, schema } from './db';
import type { Tx } from './inventory';
import { notifyEvent } from './notify';

const { vouchers, orders, users, products } = schema;

export type Voucher = typeof vouchers.$inferSelect;

const SLUG_PART = /^[a-z0-9-]+$/;
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chưa đúng');

export const VoucherInputSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  code: z.string().trim().min(3, 'Mã tối thiểu 3 ký tự').max(30).regex(/^[A-Za-z0-9]+$/, 'Mã chỉ gồm chữ và số, không dấu cách'),
  label: z.string().trim().min(3, 'Nhập tên hiển thị').max(120),
  kind: z.enum(['discount', 'ship']).default('discount'),
  discountType: z.enum(['percent', 'amount']),
  discountValue: z.coerce.number().int().min(1, 'Nhập giá trị giảm'),
  maxDiscount: z.coerce.number().int().min(0).optional(),
  minOrder: z.coerce.number().int().min(0).default(0),
  usageLimit: z.coerce.number().int().min(1).optional(),
  perCustomerLimit: z.coerce.number().int().min(1).default(1),
  startsAt: ymd.optional(),
  endsAt: ymd.optional(),
  active: z.boolean().default(true),
  /** Phạm vi áp dụng; bỏ trống / rỗng = mọi sản phẩm. */
  scope: z.object({
    cats: z.array(z.string().regex(SLUG_PART)).max(50).default([]),
    subs: z.array(z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/)).max(200).default([]),
    products: z.array(z.string().regex(SLUG_PART)).max(500).default([]),
  }).nullable().optional(),
}).superRefine((v, ctx) => {
  if (v.kind === 'ship' && v.discountType !== 'amount') ctx.addIssue({ code: 'custom', path: ['discountType'], message: 'Mã miễn phí giao nhập số tiền giảm phí giao tối đa' });
  if (v.discountType === 'percent' && v.discountValue > 100) ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Phần trăm tối đa 100' });
  if (v.startsAt && v.endsAt && v.startsAt > v.endsAt) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Ngày kết thúc phải sau ngày bắt đầu' });
});
export type VoucherInput = z.infer<typeof VoucherInputSchema>;

const toRow = (input: VoucherInput) => ({
  code: input.code.toUpperCase(),
  label: input.label,
  kind: input.kind,
  discountType: input.discountType,
  discountValue: input.discountValue,
  maxDiscount: input.discountType === 'percent' ? (input.maxDiscount || null) : null,
  minOrder: input.minOrder,
  usageLimit: input.usageLimit || null,
  perCustomerLimit: input.perCustomerLimit,
  startsAt: input.startsAt ? new Date(`${input.startsAt}T00:00:00`) : null,
  endsAt: input.endsAt ? new Date(`${input.endsAt}T23:59:59`) : null,
  active: input.active,
  scope: cleanScope(input.scope),
});

/** Bỏ trùng; rỗng hết thì null (= mọi sản phẩm). */
function cleanScope(s: VoucherInput['scope']): VoucherScope | null {
  if (!s) return null;
  const out = { cats: [...new Set(s.cats)], subs: [...new Set(s.subs)], products: [...new Set(s.products)] };
  return isScoped(out) ? out : null;
}

/** Lựa chọn cho ô "Áp dụng cho" ở form mã giảm giá: danh mục + nhóm con, mọi sản phẩm (kể cả đang ẩn). */
export async function scopeOptions() {
  const [cats, list] = await Promise.all([
    getCategories(),
    db.select({ slug: products.slug, name: products.name, active: products.active }).from(products).orderBy(products.name),
  ]);
  return { cats: cats.map((c) => ({ slug: c.slug, name: c.name, subs: c.subs.map((s) => ({ slug: s.slug, name: s.name, active: s.active })) })), products: list };
}
export type ScopeOptions = Awaited<ReturnType<typeof scopeOptions>>;

/** Tên phạm vi cho khách xem: "Cây sân vườn, Cây công trình, Cây kim tiền" (tối đa 3 tên, còn lại "+N"). null = mọi sản phẩm. */
export async function scopeTexts(list: Pick<Voucher, 'code' | 'scope'>[]): Promise<Map<string, string | null>> {
  const scoped = list.filter((v) => isScoped(v.scope));
  const out = new Map<string, string | null>(list.map((v) => [v.code, null]));
  if (!scoped.length) return out;
  const slugs = [...new Set(scoped.flatMap((v) => v.scope!.products))];
  const [cats, names] = await Promise.all([
    getCategories(),
    slugs.length ? db.select({ slug: products.slug, name: products.name }).from(products).where(inArray(products.slug, slugs)) : Promise.resolve([]),
  ]);
  const productName = new Map(names.map((p) => [p.slug, p.name]));
  for (const v of scoped) {
    const s = v.scope!;
    const parts = [
      ...s.cats.map((c) => cats.find((x) => x.slug === c)?.name),
      ...s.subs.map((k) => { const [c, sub] = k.split('/'); return cats.find((x) => x.slug === c)?.subs.find((x) => x.slug === sub)?.name; }),
      ...s.products.map((p) => productName.get(p)),
    ].filter((x): x is string => !!x);
    out.set(v.code, parts.length ? (parts.length > 3 ? `${parts.slice(0, 3).join(', ')} +${parts.length - 3}` : parts.join(', ')) : 'Sản phẩm chọn riêng');
  }
  return out;
}

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
    used: sql<number>`(select count(*) from ${orders} o where (o.voucher_code = ${vouchers.code} or o.ship_voucher_code = ${vouchers.code}) and o.status <> 'cancelled')`.mapWith(Number),
    revenue: sql<number>`coalesce((select sum(o.total) from ${orders} o where (o.voucher_code = ${vouchers.code} or o.ship_voucher_code = ${vouchers.code}) and o.status <> 'cancelled'), 0)`.mapWith(Number),
  }).from(vouchers).orderBy(desc(vouchers.id));
}

/** Danh sách mã đang áp dụng cho khách xem ở trang Khuyến mãi (chỉ mã còn hiệu lực, chưa hết lượt tổng). */
export async function listActiveVouchers() {
  const now = new Date();
  const rows = await db.select({
    v: vouchers,
    used: sql<number>`(select count(*) from ${orders} o where (o.voucher_code = ${vouchers.code} or o.ship_voucher_code = ${vouchers.code}) and o.status <> 'cancelled')`.mapWith(Number),
  }).from(vouchers)
    .where(and(eq(vouchers.active, true), sql`(${vouchers.endsAt} is null or ${vouchers.endsAt} >= ${now})`, sql`(${vouchers.startsAt} is null or ${vouchers.startsAt} <= ${now})`))
    .orderBy(desc(vouchers.id));
  return rows.filter((r) => r.v.usageLimit == null || r.used < r.v.usageLimit).map((r) => r.v);
}

export type VoucherCheck = { ok: true; code: string; kind: VoucherKind; discount: number } | { ok: false; error: string };

/** Đơn nào đã dùng mã này (mã giảm tiền hàng nằm ở voucher_code, mã miễn phí giao ở ship_voucher_code; mã không trùng nhau giữa hai loại). */
const usedCode = (code: string) => or(eq(orders.voucherCode, code), eq(orders.shipVoucherCode, code));

/**
 * Kiểm tra mã còn dùng được không + tính số tiền giảm: mã giảm tiền hàng tính trên `subtotal`, mã miễn phí giao giảm tối đa bằng `shipFee`.
 * `lock: true` khóa dòng mã (FOR UPDATE) trong transaction tạo đơn để 2 đơn cùng lúc không vượt quá usageLimit.
 */
export async function checkVoucher(
  executor: Tx | typeof db,
  rawCode: string,
  ctx: { subtotal: number; /** Có thì mã có phạm vi tính trên đúng sản phẩm thuộc phạm vi (voucherAmount); không có thì dùng `subtotal`. */ totals?: Totals; shipFee?: number; userId: number | null; phone: string },
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
  const amount = ctx.totals ? voucherAmount(v.scope, ctx.totals) : ctx.subtotal;
  if (isScoped(v.scope) && amount <= 0) return { ok: false, error: 'Mã không áp dụng cho sản phẩm trong đơn này' };
  if (amount < v.minOrder) return { ok: false, error: isScoped(v.scope) ? `Sản phẩm thuộc phạm vi mã cần từ ${v.minOrder.toLocaleString('vi-VN')}đ để dùng mã này` : `Đơn cần từ ${v.minOrder.toLocaleString('vi-VN')}đ để dùng mã này` };

  if (v.usageLimit != null) {
    const [{ n }] = await executor.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(orders)
      .where(and(usedCode(v.code), ne(orders.status, 'cancelled')));
    if (n >= v.usageLimit) return { ok: false, error: 'Mã đã hết lượt sử dụng' };
  }
  const [{ n: mine }] = await executor.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(orders)
    .where(and(
      usedCode(v.code), ne(orders.status, 'cancelled'),
      ctx.userId ? or(eq(orders.userId, ctx.userId), eq(orders.phone, ctx.phone)) : eq(orders.phone, ctx.phone),
    ));
  if (mine >= v.perCustomerLimit) return { ok: false, error: 'Bạn đã dùng hết lượt cho mã này' };

  const discount = discountOf(v, amount, ctx.shipFee ?? 0);
  if (v.kind === 'ship' && discount <= 0) return { ok: false, error: 'Đơn này không có phí giao nên không cần mã miễn phí giao' };
  return { ok: true, code: v.code, kind: v.kind, discount };
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
  await notifyEvent(db, userId, 'welcome_gift', { ma_voucher: offer.code, noi_dung_qua: `${what.charAt(0).toLowerCase()}${what.slice(1)}`, han_dung: fmtDate(new Date(offer.expiresAt)) }, '/khuyen-mai');
  return offer;
}
