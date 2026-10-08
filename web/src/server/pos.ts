import 'server-only';
import { and, asc, eq, gt, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { computeTotals } from '@/lib/pricing';
import { todayVN } from '@/lib/stock';
import { isPhone, normalizePhone, staffName, type SessionUser } from './auth';
import { allProducts, getProducts } from './catalog';
import { db, schema } from './db';
import { applyStock, listStores, type Tx } from './inventory';
import { notifyEvent } from './notify';
import { newOrderCode } from './orders';
import { getShippingConfig } from './shipping';
import { checkVoucher } from './vouchers';

const { orders, orderItems, orderEvents, stockLots, users } = schema;

export type PosItem = {
  slug: string; idx: number; sku: string; name: string; label: string | null; price: number; oldPrice: number | null;
  category: string; icon: string; image: string | null; stock: number; pesticide: boolean; ship: 'plant' | 'supply';
};

/** Sản phẩm bán tại quầy: mỗi quy cách một ô; `stock` = tồn còn hạn tại cửa hàng đang bán. */
export async function posCatalog(storeId: number): Promise<PosItem[]> {
  const [products, lots] = await Promise.all([
    allProducts(),
    db.select({ slug: stockLots.productSlug, idx: stockLots.optionIdx, n: sql<number>`sum(${stockLots.qty})`.mapWith(Number) })
      .from(stockLots)
      .where(and(eq(stockLots.storeId, storeId), gt(stockLots.qty, 0), or(sql`${stockLots.expiry} is null`, sql`${stockLots.expiry} >= ${todayVN()}`)))
      .groupBy(stockLots.productSlug, stockLots.optionIdx),
  ]);
  const stock = new Map(lots.map((l) => [`${l.slug}|${l.idx}`, l.n]));
  // quy cách chưa có giá (Liên hệ báo giá) không bán ở quầy
  return products.flatMap((p) => p.options.flatMap((o, idx): PosItem[] => o.price <= 0 ? [] : [{
    slug: p.slug, idx, sku: `${p.sku}-${idx + 1}`, name: p.name, label: p.options.length > 1 ? o.label : null, price: o.price, oldPrice: o.oldPrice ?? null,
    category: p.category, icon: p.icon, image: p.images?.[0] ?? null, stock: stock.get(`${p.slug}|${idx}`) ?? 0,
    pesticide: !!p.pesticide, ship: p.ship,
  }]));
}

/** Nhận ra khách theo SĐT đã xác thực: tên, điểm, số đơn. */
export async function posCustomer(rawPhone: string) {
  if (!isPhone(rawPhone)) return null;
  const phone = normalizePhone(rawPhone);
  const [u] = await db.select({ id: users.id, name: users.name, points: users.points }).from(users).where(eq(users.phone, phone));
  const [{ n, spend }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number), spend: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number) })
    .from(orders).where(and(eq(orders.kind, 'sale'), sql`${orders.status} <> 'cancelled'`, u ? or(eq(orders.userId, u.id), eq(orders.phone, phone)) : eq(orders.phone, phone)));
  return { phone, name: u?.name ?? null, points: u?.points ?? 0, member: !!u, orders: n, spend };
}

export const PosOrderSchema = z.object({
  storeId: z.number().int().positive(),
  items: z.array(z.object({ slug: z.string().max(120), option: z.number().int().min(0).max(20), qty: z.number().int().min(1).max(99) })).min(1, 'Chưa chọn sản phẩm').max(60),
  phone: z.string().trim().refine((s) => !s || isPhone(s), 'Số điện thoại chưa đúng').optional(),
  name: z.string().trim().max(80).optional(),
  payment: z.enum(['cash', 'qr', 'card']),
  voucherCode: z.string().trim().max(30).optional(),
  safetyAck: z.boolean().optional(),
});
export type PosOrderInput = z.infer<typeof PosOrderSchema>;

const PAY: Record<PosOrderInput['payment'], 'cod' | 'qr' | 'card'> = { cash: 'cod', qr: 'qr', card: 'card' };
export const POS_PAY_LABEL = { cash: 'Tiền mặt', qr: 'Chuyển khoản QR', card: 'Thẻ' } as const;

class PosError extends Error {}
type PosResult = { ok: true; code: string; total: number } | { ok: false; error: string };

/**
 * Bán tại quầy: tính lại giá từ database, trừ kho đúng cửa hàng (lô hết hạn sớm nhất trước), tạo đơn đã giao + đã thu tiền
 * (kênh "pos"). Có SĐT khớp tài khoản thì đơn thuộc tài khoản đó (cộng điểm, cây vào Vườn của tôi, bảo hành như đơn online).
 */
export async function createPosOrder(input: PosOrderInput, staff: SessionUser): Promise<PosResult> {
  const store = (await listStores()).find((s) => s.id === input.storeId);
  if (!store) return { ok: false, error: 'Cửa hàng không hợp lệ' };
  const phone = input.phone ? normalizePhone(input.phone) : '';
  const products = new Map((await getProducts([...new Set(input.items.map((i) => i.slug))])).map((p) => [p.slug, p]));
  const lines: { p: NonNullable<ReturnType<typeof products.get>>; u: { label: string; price: number; oldPrice?: number }; it: PosOrderInput['items'][number] }[] = [];
  for (const it of input.items) {
    const p = products.get(it.slug);
    const u = p?.options[it.option];
    if (!p || !u) return { ok: false, error: 'Có sản phẩm không còn bán — tải lại trang bán hàng' };
    if (u.price <= 0) return { ok: false, error: `“${p.name}” chưa có giá — điền giá ở trang Sản phẩm trước khi bán` };
    lines.push({ p, u, it });
  }
  if (lines.some((l) => l.p.pesticide) && !input.safetyAck) return { ok: false, error: 'Bán thuốc BVTV: xác nhận đã dặn khách đọc hướng dẫn an toàn' };
  if (input.voucherCode && !phone) return { ok: false, error: 'Nhập số điện thoại khách để dùng mã giảm giá' };

  const totals = computeTotals(lines.map(({ p, u, it }) => ({ price: u.price, oldPrice: u.oldPrice, qty: it.qty, ship: p.ship, pesticide: p.pesticide })), 'pickup', 0, await getShippingConfig());
  const actor = staffName(staff);
  try {
    return await db.transaction(async (tx: Tx): Promise<PosResult> => {
      const owner = phone ? (await tx.select({ id: users.id, name: users.name }).from(users).where(eq(users.phone, phone)))[0] : undefined;
      let voucherCode: string | null = null, voucherDiscount = 0;
      if (input.voucherCode) {
        const v = await checkVoucher(tx, input.voucherCode, { subtotal: totals.subtotal, userId: owner?.id ?? null, phone }, { lock: true });
        if (!v.ok) throw new PosError(v.error);
        voucherCode = v.code; voucherDiscount = v.discount;
      }
      const total = Math.max(0, totals.subtotal - voucherDiscount);
      const code = await newOrderCode(tx);
      if (!code) throw new PosError('Không tạo được mã đơn, vui lòng thử lại');
      const [order] = await tx.insert(orders).values({
        code, userId: owner?.id ?? null, status: 'delivered', customerName: input.name || owner?.name || 'Khách lẻ', phone,
        delivery: 'pickup', note: `Bán tại quầy · ${store.name}`, paymentMethod: PAY[input.payment], paid: true,
        original: totals.original, subtotal: totals.subtotal, plantShip: 0, supplyShip: 0, voucherCode, voucherDiscount, total,
        channel: 'pos', storeId: store.id,
      }).returning({ id: orders.id });
      for (const { p, u, it } of lines) {
        await tx.insert(orderItems).values({
          orderId: order.id, productSlug: p.slug, optionIdx: it.option, name: p.name, label: u.label, unit: p.unit,
          icon: p.icon, ship: p.ship, price: u.price, oldPrice: u.oldPrice ?? null, qty: it.qty,
        });
        if (await applyStock(tx, p.slug, it.option, -it.qty, 'order', actor, code, { storeId: store.id }) === null) {
          const [{ n }] = await tx.select({ n: sql<number>`coalesce(sum(${stockLots.qty}), 0)`.mapWith(Number) }).from(stockLots)
            .where(and(eq(stockLots.storeId, store.id), eq(stockLots.productSlug, p.slug), eq(stockLots.optionIdx, it.option)));
          throw new PosError(`“${p.name}${u.label ? ` · ${u.label}` : ''}” chỉ còn ${n} tại ${store.name}`);
        }
      }
      await tx.insert(orderEvents).values({ orderId: order.id, status: 'delivered', actor, note: `Bán tại quầy · ${POS_PAY_LABEL[input.payment]}` });
      if (owner) {
        // Tích điểm như đơn online: 10.000đ = 1 điểm.
        if (total > 0) await tx.update(users).set({ points: sql`${users.points} + ${Math.floor(total / 10000)}` }).where(eq(users.id, owner.id));
        await notifyEvent(tx, owner.id, 'pos_thanks', { cua_hang: store.name, ma_don: code }, `/tai-khoan/don-hang/${code}`);
      }
      return { ok: true, code, total };
    });
  } catch (e) {
    if (e instanceof PosError) return { ok: false, error: e.message };
    throw e;
  }
}

/** Dữ liệu in hóa đơn của một đơn POS. */
export async function posReceipt(code: string) {
  const [o] = await db.select().from(orders).where(and(eq(orders.code, code), eq(orders.channel, 'pos')));
  if (!o) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).orderBy(asc(orderItems.id));
  const [store] = o.storeId ? await db.select().from(schema.stores).where(eq(schema.stores.id, o.storeId)) : [];
  const [ev] = await db.select({ actor: orderEvents.actor, note: orderEvents.note }).from(orderEvents).where(eq(orderEvents.orderId, o.id)).orderBy(asc(orderEvents.id)).limit(1);
  return { o, items, store: store ?? null, cashier: ev?.actor ?? '', payNote: ev?.note ?? '' };
}

