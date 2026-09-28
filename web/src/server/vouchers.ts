import 'server-only';
import { and, desc, eq, ne, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { db, schema } from './db';
import type { Tx } from './inventory';

const { vouchers, orders } = schema;

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
