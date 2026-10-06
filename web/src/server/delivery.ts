import 'server-only';
import { and, asc, eq, gte, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { addDaysYmd, slotTime, toMinutes, vnDate, vnMinutes, type ShippingConfig } from '@/lib/shipping';
import { BIKE_PLANT_WARN, DEFAULT_CAPACITY, orderLoad, VEHICLE_LABEL } from '@/lib/delivery-labels';
import { staffName, type SessionUser } from './auth';
import { db, schema } from './db';
import type { OrderStatus, Vehicle } from './db/schema';
import type { Tx } from './inventory';
import { notifyEvent, orderOwner } from './notify';
import { getShippingConfig } from './shipping';

const { orders, orderItems, orderEvents, deliveryTrips: T, users } = schema;

export type StopOrder = {
  id: number; code: string; kind: 'sale' | 'warranty'; customer: string; phone: string; address: string; slot: string | null;
  slotDate: string | null; slotKey: string | null; status: OrderStatus; paymentMethod: string; paid: boolean; total: number;
  note: string | null; plantQty: number; supplyQty: number; load: number; items: string[]; tripId: number | null; tripPos: number | null;
};

export type TripView = {
  id: number; date: string; slotKey: string; vehicle: Vehicle; name: string; driverId: number | null; driverName: string | null;
  helper: string | null; capacity: number; load: number; stops: StopOrder[]; warnings: string[];
};

const ACTIVE = ['pending', 'confirmed', 'preparing', 'shipping'] as const;

async function loadOrders(where: ReturnType<typeof and>): Promise<StopOrder[]> {
  const rows = await db.select().from(orders).where(where).orderBy(asc(orders.tripPos), asc(orders.id));
  if (!rows.length) return [];
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id))).orderBy(asc(orderItems.id));
  return rows.map((o) => {
    const mine = items.filter((i) => i.orderId === o.id);
    const plantQty = mine.filter((i) => i.ship === 'plant').reduce((a, i) => a + i.qty, 0);
    const supplyQty = mine.filter((i) => i.ship === 'supply').reduce((a, i) => a + i.qty, 0);
    return {
      id: o.id, code: o.code, kind: o.kind, customer: o.customerName, phone: o.phone, address: o.address ?? '', slot: o.slot,
      slotDate: o.slotDate, slotKey: o.slotKey, status: o.status, paymentMethod: o.paymentMethod, paid: o.paid, total: o.total,
      note: o.note, plantQty, supplyQty, load: orderLoad(plantQty, supplyQty), tripId: o.tripId, tripPos: o.tripPos,
      items: mine.map((i) => `${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}`),
    };
  });
}

function tripWarnings(t: { vehicle: Vehicle; capacity: number }, stops: StopOrder[]) {
  const w: string[] = [];
  const load = stops.reduce((a, s) => a + s.load, 0);
  if (load > t.capacity) w.push(`Quá tải: ${load} / ${t.capacity} điểm`);
  const plants = stops.reduce((a, s) => a + s.plantQty, 0);
  if (t.vehicle === 'bike' && plants >= BIKE_PLANT_WARN) w.push(`${plants} cây sống trên xe máy — nên đổi xe tải`);
  return w;
}

/** Bảng xếp chuyến của một ngày: các chuyến (kèm điểm dừng) + đơn chưa xếp chuyến. */
export async function deliveryBoard(date: string) {
  const trips = await db.select({ t: T, driverName: users.name }).from(T).leftJoin(users, eq(users.id, T.driverId)).where(eq(T.date, date)).orderBy(asc(T.slotKey), asc(T.id));
  const tripIds = trips.map((x) => x.t.id);
  const stops = tripIds.length ? await loadOrders(and(inArray(orders.tripId, tripIds), ne(orders.status, 'cancelled'))) : [];
  const unassigned = await loadOrders(and(
    eq(orders.delivery, 'ship'), isNull(orders.tripId), inArray(orders.status, [...ACTIVE]),
    // Đơn đặt cho ngày này; hoặc chưa có ngày hẹn (đơn cũ trước khi có khung giờ có ngày, đơn đổi cây của bảo hành)
    or(eq(orders.slotDate, date), isNull(orders.slotDate)),
  ));
  const views: TripView[] = trips.map(({ t, driverName }) => {
    const mine = stops.filter((s) => s.tripId === t.id).sort((a, b) => (a.tripPos ?? 0) - (b.tripPos ?? 0));
    return { ...t, driverName, stops: mine, load: mine.reduce((a, s) => a + s.load, 0), warnings: tripWarnings(t, mine) };
  });
  return { trips: views, unassigned };
}

export async function listDrivers() {
  const rows = await db.select({ id: users.id, name: users.name, role: users.role, staffRole: users.staffRole, phone: users.phone })
    .from(users).where(inArray(users.role, ['staff', 'admin'])).orderBy(asc(users.name));
  const rank = (r: { staffRole: string | null }) => (r.staffRole === 'delivery' ? 0 : 1);
  return rows.sort((a, b) => rank(a) - rank(b)).map((r) => ({ id: r.id, name: r.name ?? (r.phone ? `NV ${r.phone.slice(-3)}` : `#${r.id}`), delivery: r.staffRole === 'delivery' }));
}

/** KPI: số chuyến, đơn trong ngày, chưa xếp, tỉ lệ đúng khung giờ 7 ngày qua. */
export async function deliveryKpis(date: string, board: Awaited<ReturnType<typeof deliveryBoard>>, cfg: ShippingConfig) {
  const dayOrders = await db.select({ id: orders.id, tripId: orders.tripId }).from(orders)
    .where(and(eq(orders.slotDate, date), eq(orders.delivery, 'ship'), ne(orders.status, 'cancelled')));
  const plantOrders = new Set<number>();
  if (dayOrders.length) {
    const r = await db.select({ id: orderItems.orderId }).from(orderItems).where(and(inArray(orderItems.orderId, dayOrders.map((o) => o.id)), eq(orderItems.ship, 'plant')));
    r.forEach((x) => plantOrders.add(x.id));
  }
  // Đúng khung giờ: đơn giao xong trong 7 ngày qua, lúc giao ≤ giờ kết thúc khung (theo giờ VN) của ngày hẹn.
  const from = addDaysYmd(vnDate(), -7);
  const done = await db.select({ date: orders.slotDate, key: orders.slotKey, at: sql<Date>`(select min(e.created_at) from order_events e where e.order_id = orders.id and e.status = 'delivered')`.mapWith((v) => new Date(v)) })
    .from(orders).where(and(eq(orders.status, 'delivered'), gte(orders.slotDate, from), lt(orders.slotDate, addDaysYmd(vnDate(), 1))));
  let onTime = 0, total = 0;
  for (const d of done) {
    const slot = cfg.slots.find((s) => s.key === d.key);
    if (!d.date || !slot || Number.isNaN(d.at.getTime())) continue;
    total++;
    const day = vnDate(d.at.getTime());
    if (day < d.date || (day === d.date && vnMinutes(d.at.getTime()) <= toMinutes(slot.to))) onTime++;
  }
  return {
    trips: board.trips.length,
    trucks: board.trips.filter((t) => t.vehicle === 'truck').length,
    bikes: board.trips.filter((t) => t.vehicle === 'bike').length,
    orders: dayOrders.length,
    plantOrders: plantOrders.size,
    unassigned: board.unassigned.length,
    onTime: total ? Math.round((onTime / total) * 100) : null,
    onTimeN: total,
  };
}

export type DeliveryResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): DeliveryResult => ({ ok: false, error });

export type TripInput = { date: string; slotKey: string; vehicle: Vehicle; name?: string; driverId: number | null; helper?: string; capacity?: number };

async function checkDriver(driverId: number | null) {
  if (driverId === null) return true;
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, driverId));
  return !!u && u.role !== 'customer';
}

export async function createTrip(v: TripInput, actor: SessionUser): Promise<DeliveryResult & { id?: number }> {
  const cfg = await getShippingConfig();
  if (!cfg.slots.some((s) => s.key === v.slotKey)) return fail('Khung giờ không tồn tại');
  if (!(await checkDriver(v.driverId))) return fail('Tài xế phải là nhân viên');
  const same = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(T).where(and(eq(T.date, v.date), eq(T.vehicle, v.vehicle)));
  const name = v.name?.trim() || `${VEHICLE_LABEL[v.vehicle]} ${String((same[0]?.n ?? 0) + 1).padStart(2, '0')}`;
  const [r] = await db.insert(T).values({
    date: v.date, slotKey: v.slotKey, vehicle: v.vehicle, name, driverId: v.driverId, helper: v.helper?.trim() || null,
    capacity: v.capacity ?? DEFAULT_CAPACITY[v.vehicle], createdBy: staffName(actor),
  }).returning({ id: T.id });
  return { ok: true, id: r.id };
}

export async function updateTrip(id: number, v: Partial<Pick<TripInput, 'name' | 'vehicle' | 'driverId' | 'helper' | 'capacity'>>): Promise<DeliveryResult> {
  if (v.driverId !== undefined && !(await checkDriver(v.driverId))) return fail('Tài xế phải là nhân viên');
  const set: Partial<typeof T.$inferInsert> = {};
  if (v.name !== undefined) set.name = v.name.trim() || 'Chuyến';
  if (v.vehicle !== undefined) set.vehicle = v.vehicle;
  if (v.driverId !== undefined) set.driverId = v.driverId;
  if (v.helper !== undefined) set.helper = v.helper.trim() || null;
  if (v.capacity !== undefined) set.capacity = v.capacity;
  if (!Object.keys(set).length) return { ok: true };
  const r = await db.update(T).set(set).where(eq(T.id, id)).returning({ id: T.id });
  return r.length ? { ok: true } : fail('Không tìm thấy chuyến');
}

/** Xóa chuyến: các đơn trong chuyến quay về "Chưa xếp chuyến". */
export async function deleteTrip(id: number): Promise<DeliveryResult> {
  const r = await db.delete(T).where(eq(T.id, id)).returning({ id: T.id });
  return r.length ? { ok: true } : fail('Không tìm thấy chuyến');
}

/** Xếp đơn vào chuyến (cuối danh sách) hoặc bỏ khỏi chuyến (tripId = null). Chỉ xếp đúng ngày + khung giờ khách đã chọn. */
export async function assignOrder(orderId: number, tripId: number | null): Promise<DeliveryResult> {
  return db.transaction(async (tx): Promise<DeliveryResult> => {
    const [o] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
    if (!o) return fail('Không tìm thấy đơn');
    if (tripId === null) {
      await tx.update(orders).set({ tripId: null, tripPos: null }).where(eq(orders.id, orderId));
      if (o.tripId) await renumber(tx, o.tripId);
      return { ok: true };
    }
    if (o.delivery !== 'ship') return fail('Đơn nhận tại vườn không cần xếp chuyến');
    if (!(ACTIVE as readonly string[]).includes(o.status)) return fail('Đơn đã giao hoặc đã hủy');
    const [t] = await tx.select().from(T).where(eq(T.id, tripId)).for('update');
    if (!t) return fail('Không tìm thấy chuyến');
    // Đơn có ngày hẹn phải vào đúng khung của khách; đơn chưa có ngày hẹn (đơn cũ, đơn bảo hành) nhận ngày + khung của chuyến.
    if (o.slotDate && (o.slotDate !== t.date || o.slotKey !== t.slotKey)) return fail('Chuyến này khác ngày hoặc khung giờ khách đã chọn');
    const [{ m }] = await tx.select({ m: sql<number>`coalesce(max(${orders.tripPos}), 0)`.mapWith(Number) }).from(orders).where(eq(orders.tripId, tripId));
    const cfg = await getShippingConfig();
    const slot = cfg.slots.find((s) => s.key === t.slotKey);
    await tx.update(orders).set({
      tripId, tripPos: m + 1,
      ...(o.slotDate ? {} : { slotDate: t.date, slotKey: t.slotKey, slot: slot ? `${t.date.slice(8, 10)}/${t.date.slice(5, 7)}, ${slotTime(slot)}` : o.slot }),
    }).where(eq(orders.id, orderId));
    if (o.tripId && o.tripId !== tripId) await renumber(tx, o.tripId);
    return { ok: true };
  });
}

async function renumber(tx: Tx, tripId: number) {
  const rows = await tx.select({ id: orders.id }).from(orders).where(eq(orders.tripId, tripId)).orderBy(asc(orders.tripPos), asc(orders.id));
  for (let i = 0; i < rows.length; i++) await tx.update(orders).set({ tripPos: i + 1 }).where(eq(orders.id, rows[i].id));
}

/** Đổi thứ tự điểm dừng: lên / xuống một bước. */
export async function moveStop(orderId: number, dir: 'up' | 'down'): Promise<DeliveryResult> {
  return db.transaction(async (tx): Promise<DeliveryResult> => {
    const [o] = await tx.select({ tripId: orders.tripId }).from(orders).where(eq(orders.id, orderId));
    if (!o?.tripId) return fail('Đơn chưa nằm trong chuyến nào');
    await tx.select({ id: T.id }).from(T).where(eq(T.id, o.tripId)).for('update');
    await renumber(tx, o.tripId);
    const rows = await tx.select({ id: orders.id, pos: orders.tripPos }).from(orders).where(eq(orders.tripId, o.tripId)).orderBy(asc(orders.tripPos));
    const i = rows.findIndex((r) => r.id === orderId);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= rows.length) return { ok: true };
    await tx.update(orders).set({ tripPos: rows[j].pos }).where(eq(orders.id, rows[i].id));
    await tx.update(orders).set({ tripPos: rows[i].pos }).where(eq(orders.id, rows[j].id));
    return { ok: true };
  });
}

// ---- App tài xế -----------------------------------------------------------------------------

/** Chuyến của một tài xế trong ngày (kèm điểm dừng theo thứ tự). */
export async function driverTrips(userId: number, date: string) {
  const trips = await db.select().from(T).where(and(eq(T.date, date), eq(T.driverId, userId))).orderBy(asc(T.slotKey), asc(T.id));
  if (!trips.length) return [];
  const stops = await loadOrders(and(inArray(orders.tripId, trips.map((t) => t.id)), ne(orders.status, 'cancelled')));
  return trips.map((t) => {
    const mine = stops.filter((s) => s.tripId === t.id).sort((a, b) => (a.tripPos ?? 0) - (b.tripPos ?? 0));
    return { ...t, stops: mine, load: mine.reduce((a, s) => a + s.load, 0) };
  });
}

/** Đơn thuộc chuyến của tài xế này (admin thao tác thay cũng được). */
async function ownedStop(orderId: number, user: SessionUser) {
  const [o] = await db.select({ o: orders, driverId: T.driverId }).from(orders).leftJoin(T, eq(T.id, orders.tripId)).where(eq(orders.id, orderId));
  if (!o) return null;
  if (user.role !== 'admin' && o.driverId !== user.id) return null;
  return o.o;
}

export const driverOwns = async (orderId: number, user: SessionUser) => !!(await ownedStop(orderId, user));

/** "Đã đến": nhắn khách tài xế đã tới (thông báo + Zalo/email khi đã cấu hình), ghi lịch sử đơn. */
export async function markArrived(orderId: number, user: SessionUser): Promise<DeliveryResult> {
  const o = await ownedStop(orderId, user);
  if (!o) return fail('Đơn này không thuộc chuyến của bạn');
  if (o.status !== 'shipping') return fail('Đơn chưa được kho giao cho tài xế');
  return db.transaction(async (tx) => {
    await tx.insert(orderEvents).values({ orderId: o.id, status: o.status, actor: staffName(user), note: 'Tài xế đã đến điểm giao' });
    const owner = await orderOwner(tx, o);
    if (owner) await notifyEvent(tx, owner, 'order_arrived', { ma_don: o.code }, `/tai-khoan/don-hang/${o.code}`);
    return { ok: true } as const;
  });
}

/** "Không giao được": đơn quay về bảng xếp chuyến (trạng thái Chuẩn bị) kèm lý do trong lịch sử. */
export async function failDelivery(orderId: number, reason: string, user: SessionUser): Promise<DeliveryResult> {
  const o = await ownedStop(orderId, user);
  if (!o) return fail('Đơn này không thuộc chuyến của bạn');
  if (o.status !== 'shipping') return fail('Chỉ báo không giao được với đơn đang giao');
  return db.transaction(async (tx) => {
    const tripId = o.tripId;
    await tx.update(orders).set({ status: 'preparing', tripId: null, tripPos: null, updatedAt: new Date() }).where(eq(orders.id, o.id));
    await tx.insert(orderEvents).values({ orderId: o.id, status: 'preparing', actor: staffName(user), note: `Không giao được: ${reason}` });
    if (tripId) await renumber(tx, tripId);
    return { ok: true } as const;
  });
}
