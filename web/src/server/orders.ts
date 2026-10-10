import 'server-only';
import { and, count, desc, eq, getTableColumns, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import * as z from 'zod';
import type { Product, Unit } from '@/lib/catalog';
import { computeTotals } from '@/lib/pricing';
import { accountPhone, normalizePhone, isPhone, partnerPct, type SessionUser } from './auth';
import { getProducts, mainImageOf } from './catalog';
import { buildSlotOptions, dayLabel, slotTime, vnDate, type ShippingConfig } from '@/lib/shipping';
import { plantZone } from '@/lib/stock';
import { getAddress } from './addresses';
import { applyStock, listStores, restoreOrderStock, type Tx } from './inventory';
import { notifyEvent, orderOwner } from './notify';
import { db, schema } from './db';
import { PAYMENT_METHODS, type OrderStatus } from './db/schema';
import { getShippingConfig, usedSlots } from './shipping';
import { checkVoucher } from './vouchers';

const { orders, orderItems, orderEvents, productOptions } = schema;

/** Mã đơn vừa đặt trên trình duyệt này — cho phép khách vãng lai xem trang Đặt hàng thành công. */
export const LAST_ORDER_COOKIE = 'ccmt_last_order';

export const PlaceOrderSchema = z.object({
  items: z.array(z.object({ slug: z.string().max(120), option: z.number().int().min(0).max(20), qty: z.number().int().min(1).max(99) })).min(1).max(50),
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên').max(80),
  phone: z.string().trim().refine(isPhone, 'Số điện thoại chưa đúng'),
  delivery: z.enum(['ship', 'pickup']),
  address: z.string().trim().max(300).optional(),
  /** Khung giờ giao: ngày + mã khung (do trang thanh toán lấy từ cài đặt giao hàng). `slot` là cách cũ (chữ "Hôm nay, 8:00 – 12:00") — vẫn nhận cho trang thanh toán mở từ trước. */
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  slotKey: z.string().trim().max(20).optional(),
  slot: z.string().trim().max(60).optional(),
  note: z.string().trim().max(500).optional(),
  payment: z.enum(PAYMENT_METHODS),
  safetyAck: z.boolean(),
  /** Địa chỉ chọn từ sổ địa chỉ (nếu có) — để kiểm tra vùng giao cây sống theo ghim bản đồ. */
  addressId: z.number().int().positive().optional(),
  voucherCode: z.string().trim().max(30).optional(),
  /** Mã miễn phí giao (dùng kèm được với mã giảm tiền hàng). */
  shipVoucherCode: z.string().trim().max(30).optional(),
}).superRefine((v, ctx) => {
  if (v.delivery === 'ship' && !v.address) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Vui lòng nhập địa chỉ nhận hàng' });
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;

export type PlaceOrderResult = { ok: true; code: string } | { ok: false; error: string; needsPhone?: boolean };

/** Tạo đơn: giá, phí giao, quy tắc Flash sale & thuốc BVTV đều tính lại từ database — không tin số liệu từ trình duyệt. */
export async function createOrder(input: PlaceOrderInput, user: SessionUser | null): Promise<PlaceOrderResult> {
  // Tài khoản (Google) phải có SĐT liên hệ trước khi đặt — khách vãng lai thì SĐT nằm ngay trong đơn.
  if (user && !accountPhone(user)) return { ok: false, error: 'Vui lòng cập nhật số điện thoại cho tài khoản trước khi đặt hàng', needsPhone: true };
  const cfg = await getShippingConfig();
  const products = new Map((await getProducts([...new Set(input.items.map((i) => i.slug))])).map((p) => [p.slug, p]));
  const lines: { p: Product; u: Unit; it: PlaceOrderInput['items'][number] }[] = [];
  for (const it of input.items) {
    const p = products.get(it.slug);
    const u = p?.options[it.option];
    if (!p || !u) return { ok: false, error: 'Có sản phẩm trong giỏ không còn bán. Vui lòng xem lại giỏ hàng.' };
    if (u.price <= 0) return { ok: false, error: `“${p.name}” chưa có giá bán online — vui lòng liên hệ shop để báo giá rồi bỏ khỏi giỏ.` };
    lines.push({ p, u, it });
  }
  const hasFlash = lines.some((l) => l.p.flash);
  const hasPesticide = lines.some((l) => l.p.pesticide);
  if (hasFlash && input.payment === 'cod') return { ok: false, error: 'Đơn có sản phẩm Flash sale không áp dụng thanh toán khi nhận hàng' };
  if (hasPesticide && !input.safetyAck) return { ok: false, error: 'Vui lòng xác nhận đã đọc hướng dẫn an toàn thuốc BVTV' };

  // Khung giờ giao chỉ bắt buộc khi shop bật hẹn giờ (có xe giao riêng).
  if (input.delivery === 'ship' && cfg.slotsEnabled && !input.slot && !(input.slotDate && input.slotKey)) return { ok: false, error: 'Chọn khung giờ giao' };

  // Giới hạn vùng giao cây sống chỉ áp dụng khi shop bật (mặc định giao toàn quốc); kiểm tra khi địa chỉ đã ghim bản đồ.
  if (cfg.plantZoneEnabled && input.delivery === 'ship' && user && input.addressId && lines.some((l) => l.p.ship === 'plant')) {
    const a = await getAddress(user.id, input.addressId);
    const zone = a?.lat != null && a.lng != null ? plantZone({ lat: a.lat, lng: a.lng }, await listStores(), cfg.plantZoneKm) : null;
    if (zone && !zone.inZone) {
      return { ok: false, error: `Địa chỉ này ngoài vùng giao cây sống (${cfg.plantZoneKm} km quanh cửa hàng). Vui lòng chọn Nhận tại vườn hoặc bỏ cây sống khỏi giỏ.` };
    }
  }

  // Kiểm tra tồn kho theo quy cách
  for (const { p, it } of lines) {
    const [opt] = await db.select({ stock: productOptions.stock }).from(productOptions)
      .where(and(eq(productOptions.productSlug, p.slug), eq(productOptions.idx, it.option)));
    if (!opt || opt.stock < it.qty) return { ok: false, error: `“${p.name}” chỉ còn ${opt?.stock ?? 0} sản phẩm` };
  }

  // Combo 2 cây + chiết khấu đối tác — cùng công thức với giỏ hàng.
  const totals = computeTotals(lines.map(pricedLine), input.delivery, 0, cfg, partnerPct(user));

  try {
    return await db.transaction((tx) => createOrderTx(tx, input, user, lines, totals, cfg));
  } catch (e) {
    if (e instanceof SlotUnavailable) return { ok: false, error: e.message };
    if (e instanceof OutOfStock) return { ok: false, error: `“${e.product}” vừa hết hàng. Vui lòng giảm số lượng hoặc chọn sản phẩm khác.` };
    if (e instanceof InvalidVoucher) return { ok: false, error: e.message };
    throw e;
  }
}

/** Dòng hàng đưa vào computeTotals (giá lẻ, giá gạch ngang, combo 2 cây của quy cách). */
export const pricedLine = ({ p, u, it }: { p: Product; u: Unit; it: { qty: number } }) => ({
  price: u.price, oldPrice: u.oldPrice, combo2: u.combo2, qty: it.qty, ship: p.ship, pesticide: p.pesticide,
});

/** Giá ghi vào dòng đơn: giá lẻ + giá gạch ngang. Combo 2 cây không đổi đơn giá — tiền giảm ghi ở orders.combo_discount. */
export const itemPrice = (u: Unit) => ({ price: u.price, oldPrice: u.oldPrice && u.oldPrice > u.price ? u.oldPrice : null });

/** Ném ra trong transaction khi tồn không đủ, để hủy toàn bộ đơn. */
class OutOfStock extends Error {
  constructor(public product: string) { super('out of stock'); }
}

/** Ném ra trong transaction khi khung giờ giao đã kín / đã qua / không còn nhận đơn. */
class SlotUnavailable extends Error {}

/**
 * Giữ chỗ khung giờ giao: khóa theo "ngày|khung" rồi đếm lại số đơn — hai đơn cùng lúc không vượt số đơn tối đa.
 * Trả về chữ hiển thị + ngày + mã khung để ghi vào đơn.
 */
async function claimSlot(tx: Tx, cfg: ShippingConfig, input: PlaceOrderInput) {
  let date = input.slotDate, key = input.slotKey;
  if (!date || !key) {
    // Trang thanh toán cũ gửi chữ "Hôm nay, 8:00 – 12:00": đổi sang ngày + khung nếu khớp, không khớp thì chỉ lưu chữ.
    const m = /^(Hôm nay|Ngày mai),\s*(.+)$/.exec(input.slot ?? '');
    const def = m && cfg.slots.find((s) => slotTime(s) === m[2].replace(/\s+/g, ' ').trim());
    if (!m || !def) return { text: input.slot ?? '', date: null, key: null };
    date = m[1] === 'Hôm nay' ? vnDate() : vnDate(Date.now() + 86_400_000);
    key = def.key;
  }
  const def = cfg.slots.find((s) => s.key === key);
  if (!def) throw new SlotUnavailable('Khung giờ này không còn nhận đơn, vui lòng chọn khung giờ khác.');
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`order-slot:${date}|${key}`}))`);
  const opt = buildSlotOptions(cfg, await usedSlots([date], tx)).find((d) => d.date === date)?.slots.find((s) => s.key === key);
  if (!opt || opt.past) throw new SlotUnavailable('Khung giờ này không còn nhận đơn, vui lòng chọn khung giờ khác.');
  if (opt.full) throw new SlotUnavailable('Khung giờ này vừa kín, vui lòng chọn khung giờ khác.');
  return { text: `${dayLabel(date)}, ${slotTime(def)}`, date, key };
}

/** Ném ra trong transaction khi mã giảm giá không còn dùng được (hết lượt, hết hạn…) tại thời điểm chốt đơn. */
class InvalidVoucher extends Error {}

/** Mã đơn MT + 7 số, không trùng. Trả về '' nếu 5 lần thử đều trùng. */
export async function newOrderCode(tx: Tx) {
  for (let i = 0; i < 5; i++) {
    const c = `MT${String(randomInt(0, 10_000_000)).padStart(7, '0')}`;
    if (!(await tx.select({ id: orders.id }).from(orders).where(eq(orders.code, c))).length) return c;
  }
  return '';
}

async function createOrderTx(
  tx: Tx,
  input: PlaceOrderInput,
  user: SessionUser | null,
  lines: { p: Product; u: Unit; it: PlaceOrderInput['items'][number] }[],
  totals: ReturnType<typeof computeTotals>,
  cfg: ShippingConfig,
): Promise<PlaceOrderResult> {
  const slot = input.delivery === 'ship' && cfg.slotsEnabled ? await claimSlot(tx, cfg, input) : null;
  const code = await newOrderCode(tx);
  if (!code) return { ok: false as const, error: 'Không tạo được mã đơn, vui lòng thử lại' };

  // Chốt lại mã giảm giá ngay trước khi tạo đơn (khóa dòng mã) để 2 đơn cùng lúc không vượt quá lượt cho phép.
  const picked = await pickVouchers(tx, [input.voucherCode, input.shipVoucherCode], totals, user, normalizePhone(input.phone), true);
  if (picked.errors.length) throw new InvalidVoucher(picked.errors[0].error);
  const voucherCode = picked.discount?.code ?? null;
  const voucherDiscount = picked.discount?.discount ?? 0;
  const shipVoucherCode = picked.ship?.code ?? null;
  const shipVoucherDiscount = picked.ship?.discount ?? 0;
  const total = Math.max(0, totals.total - voucherDiscount - shipVoucherDiscount);

  const [order] = await tx.insert(orders).values({
    code, userId: user?.id ?? null, customerName: input.name, phone: normalizePhone(input.phone),
    delivery: input.delivery, address: input.delivery === 'ship' ? input.address : null,
    slot: slot?.text ?? null, slotDate: slot?.date ?? null, slotKey: slot?.key ?? null, note: input.note || null, paymentMethod: input.payment,
    original: totals.original, subtotal: totals.subtotal, plantShip: totals.plantShip, supplyShip: totals.supplyShip,
    voucherCode, voucherDiscount, shipVoucherCode, shipVoucherDiscount, partnerDiscount: totals.partnerDiscount, comboDiscount: totals.comboDiscount, total,
  }).returning({ id: orders.id });

  for (const { p, u, it } of lines) {
    await tx.insert(orderItems).values({
      orderId: order.id, productSlug: p.slug, optionIdx: it.option, name: p.name, label: u.label, unit: p.unit,
      icon: p.icon, ship: p.ship, ...itemPrice(u), qty: it.qty,
    });
    if (await applyStock(tx, p.slug, it.option, -it.qty, 'order', user ? 'Khách hàng' : 'Khách vãng lai', code) === null) {
      throw new OutOfStock(p.name);
    }
  }
  await tx.insert(orderEvents).values({ orderId: order.id, status: 'pending', actor: user ? 'Khách hàng' : 'Khách vãng lai' });
  if (user) await notifyEvent(tx, user.id, STATUS_EVENT.pending, { ma_don: code }, `/tai-khoan/don-hang/${code}`);
  return { ok: true as const, code };
}

export type PickedVoucher = { code: string; discount: number };
export type PickedVouchers = { discount: PickedVoucher | null; ship: PickedVoucher | null; errors: { code: string; error: string }[] };

/**
 * Kiểm từng mã rồi xếp theo loại: mỗi đơn tối đa một mã giảm tiền hàng + một mã miễn phí giao
 * (mã miễn phí giao giảm tối đa bằng phí giao của đơn). Mã không dùng được nằm ở `errors`.
 */
async function pickVouchers(
  executor: Tx | typeof db, codes: (string | undefined)[], totals: ReturnType<typeof computeTotals>,
  user: SessionUser | null, phone: string, lock = false,
): Promise<PickedVouchers> {
  const out: PickedVouchers = { discount: null, ship: null, errors: [] };
  const ctx = { subtotal: totals.goods, shipFee: totals.plantShip + totals.supplyShip, userId: user?.id ?? null, phone };
  for (const code of [...new Set(codes.map((c) => c?.trim().toUpperCase()).filter((c): c is string => !!c))]) {
    const r = await checkVoucher(executor, code, ctx, { lock });
    if (!r.ok) out.errors.push({ code, error: r.error });
    else if (out[r.kind]) out.errors.push({ code, error: r.kind === 'ship' ? 'Mỗi đơn chỉ dùng một mã miễn phí giao' : 'Mỗi đơn chỉ dùng một mã giảm giá (dùng kèm được một mã miễn phí giao)' });
    else out[r.kind] = { code: r.code, discount: r.discount };
  }
  return out;
}

/** Xem trước các mã khách chọn ở trang thanh toán (chưa chốt lượt dùng — chốt thật khi tạo đơn ở createOrderTx). */
export async function previewVouchers(codes: string[], items: PlaceOrderInput['items'], user: SessionUser | null, phone: string, delivery: 'ship' | 'pickup'): Promise<PickedVouchers> {
  const products = new Map((await getProducts([...new Set(items.map((i) => i.slug))])).map((p) => [p.slug, p]));
  const lines = items
    .map((it) => { const p = products.get(it.slug); const u = p?.options[it.option]; return p && u ? { p, u, it } : null; })
    .filter((x): x is { p: Product; u: Unit; it: PlaceOrderInput['items'][number] } => x !== null);
  const totals = computeTotals(lines.map(pricedLine), delivery, 0, await getShippingConfig());
  return pickVouchers(db, codes, totals, user, phone ? normalizePhone(phone) : '');
}

// ---- Đọc đơn ---------------------------------------------------------------------------------

export type OrderFull = typeof orders.$inferSelect & {
  items: (typeof orderItems.$inferSelect & { image: string | null })[];
  events: (typeof orderEvents.$inferSelect)[];
};

async function withDetails(rows: (typeof orders.$inferSelect)[]): Promise<OrderFull[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [items, events] = await Promise.all([
    db.select({ ...getTableColumns(orderItems), image: mainImageOf(orderItems.productSlug) }).from(orderItems).where(inArray(orderItems.orderId, ids)).orderBy(orderItems.id),
    db.select().from(orderEvents).where(inArray(orderEvents.orderId, ids)).orderBy(orderEvents.id),
  ]);
  return rows.map((r) => ({ ...r, items: items.filter((i) => i.orderId === r.id), events: events.filter((e) => e.orderId === r.id) }));
}

export const getOrderByCode = async (code: string) => (await withDetails(await db.select().from(orders).where(eq(orders.code, code))))[0];

/** Nhóm tab "Đơn hàng của tôi". */
export const ORDER_TABS = {
  'tat-ca': { label: 'Tất cả', statuses: null },
  'dang-xu-ly': { label: 'Đang xử lý', statuses: ['pending', 'confirmed', 'preparing'] },
  'dang-giao': { label: 'Đang giao', statuses: ['shipping'] },
  'da-giao': { label: 'Đã giao', statuses: ['delivered'] },
  'da-huy': { label: 'Đã hủy', statuses: ['cancelled'] },
} as const satisfies Record<string, { label: string; statuses: readonly OrderStatus[] | null }>;
export type OrderTab = keyof typeof ORDER_TABS;

/** Đơn của khách: đặt khi đã đăng nhập, hoặc đặt vãng lai bằng đúng SĐT đã xác thực OTP của tài khoản. */
/** Tài khoản chỉ đăng nhập Google (chưa có SĐT) chỉ thấy đơn đặt khi đã đăng nhập. */
const ownedBy = (u: Pick<SessionUser, 'id' | 'phone'>) => (u.phone ? or(eq(orders.userId, u.id), eq(orders.phone, u.phone)) : eq(orders.userId, u.id));
export const canViewOrder = (o: { userId: number | null; phone: string }, u: Pick<SessionUser, 'id' | 'phone'>) =>
  o.userId === u.id || (!!u.phone && o.phone === u.phone);

export async function listOrdersForUser(user: SessionUser, tab: OrderTab = 'tat-ca') {
  const st = ORDER_TABS[tab].statuses;
  return withDetails(await db.select().from(orders)
    .where(and(ownedBy(user), st ? inArray(orders.status, [...st]) : undefined))
    .orderBy(desc(orders.id)).limit(50));
}

/** Toàn bộ đơn của một khách cụ thể (admin xem chi tiết khách hàng ở server/customers.ts). */
export async function listOrdersForCustomer(user: Pick<SessionUser, 'id' | 'phone'>, limit = 50) {
  return withDetails(await db.select().from(orders).where(ownedBy(user)).orderBy(desc(orders.id)).limit(limit));
}

export async function countOrdersByTab(user: SessionUser) {
  const rows = await db.select({ status: orders.status, n: count() }).from(orders).where(ownedBy(user)).groupBy(orders.status);
  const by = Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<OrderStatus, number>>;
  return Object.fromEntries(Object.entries(ORDER_TABS).map(([k, t]) => [k, t.statuses ? t.statuses.reduce((s, x) => s + (by[x] ?? 0), 0) : rows.reduce((s, r) => s + r.n, 0)])) as Record<OrderTab, number>;
}

// ---- Admin -----------------------------------------------------------------------------------

/** Danh sách đơn cho admin; q tìm theo mã đơn, tên hoặc SĐT khách. */
export async function listOrders({ status, q, unpaid, limit = 100 }: { status?: OrderStatus; q?: string; unpaid?: boolean; limit?: number } = {}) {
  const term = q?.trim() ? `%${q.trim().replace(/[%_]/g, '')}%` : undefined;
  return withDetails(await db.select().from(orders)
    .where(and(
      status ? eq(orders.status, status) : undefined,
      unpaid ? awaitingPayment : undefined,
      term ? or(ilike(orders.code, term), ilike(orders.customerName, term), ilike(orders.phone, term)) : undefined,
    ))
    .orderBy(desc(orders.id)).limit(limit));
}

/** Đơn thanh toán online (QR / ví / thẻ) còn đang chờ shop xác nhận đã nhận tiền. */
const awaitingPayment = and(eq(orders.kind, 'sale'), eq(orders.paid, false), ne(orders.paymentMethod, 'cod'), ne(orders.status, 'cancelled'));

export async function countAwaitingPayment() {
  const [r] = await db.select({ n: count() }).from(orders).where(awaitingPayment);
  return r?.n ?? 0;
}

export async function countOrdersByStatus() {
  const rows = await db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<OrderStatus, number>>;
}

/** Bước tiếp theo hợp lệ của mỗi trạng thái (không nhảy cóc, không mở lại đơn đã xong). */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: [],
};

/** Trạng thái đơn → sự kiện của mẫu tin nhắn. */
const STATUS_EVENT: Record<OrderStatus, string> = {
  pending: 'order_placed', confirmed: 'order_confirmed', preparing: 'order_preparing',
  shipping: 'order_shipping', delivered: 'order_delivered', cancelled: 'order_cancelled',
};

export async function setOrderStatus(code: string, next: OrderStatus, actor: string, note?: string) {
  return db.transaction(async (tx) => {
    // Khóa đơn: hai nhân viên bấm cùng lúc không đổi trạng thái / trả kho hai lần.
    const [o] = await tx.select().from(orders).where(eq(orders.code, code)).for('update');
    if (!o) return { ok: false as const, error: 'Không tìm thấy đơn' };
    if (!NEXT_STATUS[o.status].includes(next)) return { ok: false as const, error: 'Không thể chuyển sang trạng thái này' };
    await tx.update(orders).set({
      status: next,
      updatedAt: new Date(),
      // Tiền mặt: coi như đã thu khi giao xong. Thanh toán online: TODO cập nhật từ webhook cổng thanh toán.
      ...(next === 'delivered' && o.paymentMethod === 'cod' ? { paid: true } : {}),
    }).where(eq(orders.id, o.id));
    await tx.insert(orderEvents).values({ orderId: o.id, status: next, actor, note: note || null });
    // Trả hàng về đúng lô / cửa hàng đã xuất
    if (next === 'cancelled') await restoreOrderStock(tx, o.code, actor);
    const owner = await orderOwner(tx, o);
    // Tích điểm: 10.000đ = 1 điểm, cộng khi nhận hàng — cho tài khoản đặt đơn, hoặc tài khoản có đúng SĐT đặt hàng.
    if (next === 'delivered' && owner && o.total > 0) {
      await tx.update(schema.users).set({ points: sql`${schema.users.points} + ${Math.floor(o.total / 10000)}` }).where(eq(schema.users.id, owner));
    }
    if (owner) await notifyEvent(tx, owner, STATUS_EVENT[next], { ma_don: o.code }, `/tai-khoan/don-hang/${o.code}`);
    return { ok: true as const };
  });
}

/**
 * Nhân viên xác nhận đã nhận tiền (chuyển khoản / ví / thẻ) hoặc bỏ đánh dấu khi bấm nhầm.
 * Tiền mặt (COD) không dùng được: tự tính đã thu khi giao xong. Ghi vào lịch sử đơn; khách nhận thông báo khi đã nhận tiền.
 */
export async function setOrderPaid(code: string, paid: boolean, actor: string, ref?: string) {
  return db.transaction(async (tx) => {
    const [o] = await tx.select().from(orders).where(eq(orders.code, code)).for('update');
    if (!o) return { ok: false as const, error: 'Không tìm thấy đơn' };
    if (o.kind !== 'sale' || o.total <= 0) return { ok: false as const, error: 'Đơn 0đ không cần thu tiền' };
    if (o.paymentMethod === 'cod') return { ok: false as const, error: 'Đơn thanh toán khi nhận hàng: hệ thống tự tính đã thu khi giao xong' };
    if (o.status === 'cancelled') return { ok: false as const, error: 'Đơn đã hủy' };
    if (o.paid === paid) return { ok: true as const };
    await tx.update(orders).set({ paid, updatedAt: new Date() }).where(eq(orders.id, o.id));
    const note = paid ? `Đã nhận tiền${ref ? ` — ${ref}` : ''}` : `Bỏ đánh dấu đã nhận tiền${ref ? ` — ${ref}` : ''}`;
    await tx.insert(orderEvents).values({ orderId: o.id, status: o.status, actor, note });
    const owner = await orderOwner(tx, o);
    if (paid && owner) await notifyEvent(tx, owner, 'order_paid', { ma_don: o.code }, `/tai-khoan/don-hang/${o.code}`);
    return { ok: true as const };
  });
}
