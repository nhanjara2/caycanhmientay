import 'server-only';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { cache } from 'react';
import { addDaysYmd, buildSlotOptions, parseShipping, ShippingConfigSchema, vnDate, type DayOption, type ShippingConfig } from '@/lib/shipping';
import { db, schema } from './db';
import type { Tx } from './inventory';

const { appSettings, orders } = schema;
const KEY = 'shipping';

/** Cài đặt giao hàng hiện hành (thiếu / hỏng → mặc định, đặt hàng không bị chặn). Gọi nhiều lần trong một request chỉ đọc một lần. */
export const getShippingConfig = cache(async (): Promise<ShippingConfig> => {
  const [r] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, KEY));
  return parseShipping(r?.value);
});

export async function saveShippingConfig(raw: unknown, actor: string): Promise<{ ok: true; config: ShippingConfig } | { ok: false; error: string }> {
  const p = ShippingConfigSchema.safeParse(raw);
  if (!p.success) {
    const i = p.error.issues[0];
    return { ok: false, error: i.message || 'Cài đặt chưa hợp lệ' };
  }
  const value = parseShipping(p.data);
  await db.insert(appSettings).values({ key: KEY, value, updatedBy: actor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: actor, updatedAt: new Date() } });
  return { ok: true, config: value };
}

export async function shippingMeta() {
  const [r] = await db.select({ by: appSettings.updatedBy, at: appSettings.updatedAt }).from(appSettings).where(eq(appSettings.key, KEY));
  return r ?? null;
}

/** Số đơn giao tận nơi (chưa hủy) đã giữ chỗ theo "ngày|khung", trong các ngày cho trước. */
export async function usedSlots(dates: string[], conn: Tx | typeof db = db) {
  if (!dates.length) return new Map<string, number>();
  const rows = await conn.select({ d: orders.slotDate, k: orders.slotKey, n: sql<number>`count(*)`.mapWith(Number) })
    .from(orders)
    .where(and(inArray(orders.slotDate, dates), eq(orders.delivery, 'ship'), ne(orders.status, 'cancelled')))
    .groupBy(orders.slotDate, orders.slotKey);
  return new Map(rows.filter((r) => r.d && r.k).map((r) => [`${r.d}|${r.k}`, r.n]));
}

/** Khung giờ khách chọn được ở trang thanh toán (còn chỗ / đã kín / đã qua giờ). */
export async function slotOptions(now = Date.now()): Promise<DayOption[]> {
  const cfg = await getShippingConfig();
  if (!cfg.slotsEnabled) return [];
  const today = vnDate(now);
  const used = await usedSlots(Array.from({ length: cfg.daysAhead }, (_, i) => addDaysYmd(today, i)));
  return buildSlotOptions(cfg, used, now);
}
