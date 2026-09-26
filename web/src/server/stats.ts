import 'server-only';
import { and, asc, eq, gte, lt, ne, sql } from 'drizzle-orm';
import { db, schema } from './db';

const { orders, orderItems, products, productOptions } = schema;
const DAY = 86_400_000;
const VN_OFFSET = 7 * 3600_000; // giờ Việt Nam UTC+7

/** Mốc 0h hôm nay theo giờ Việt Nam (ms UTC). */
const startOfTodayVN = () => Math.floor((Date.now() + VN_OFFSET) / DAY) * DAY - VN_OFFSET;

// Doanh thu / số đơn chỉ tính đơn bán (bỏ đơn 0đ do bảo hành tạo).
const notCancelled = and(ne(orders.status, 'cancelled'), eq(orders.kind, 'sale'));

function revenueBetween(from: number, to: number) {
  const r = db.select({ sum: sql<number>`coalesce(sum(${orders.total}), 0)`, n: sql<number>`count(*)` })
    .from(orders).where(and(notCancelled, gte(orders.createdAt, new Date(from)), lt(orders.createdAt, new Date(to)))).get();
  return { revenue: r?.sum ?? 0, orders: r?.n ?? 0 };
}

/** Số liệu trang Tổng quan admin. */
export function dashboardStats() {
  const today0 = startOfTodayVN();
  const today = revenueBetween(today0, today0 + DAY);
  const yesterday = revenueBetween(today0 - DAY, today0);
  const pending = db.select({ n: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'pending')).get()?.n ?? 0;
  const preparingPlants = db.select({ n: sql<number>`count(distinct ${orders.id})` }).from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.status, 'preparing'), eq(orderItems.ship, 'plant'))).get()?.n ?? 0;

  const days = Array.from({ length: 14 }, (_, i) => {
    const from = today0 - (13 - i) * DAY;
    return { label: new Date(from + VN_OFFSET).getUTCDate(), ...revenueBetween(from, from + DAY) };
  });

  const byCategory = db.select({ category: products.category, sum: sql<number>`sum(${orderItems.price} * ${orderItems.qty})` })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.slug, orderItems.productSlug))
    .where(and(notCancelled, gte(orders.createdAt, new Date(today0 - 29 * DAY))))
    .groupBy(products.category).all();

  const lowStock = db.select({ name: products.name, label: productOptions.label, unit: products.unit, icon: products.icon, stock: productOptions.stock, pesticide: products.pesticide })
    .from(productOptions).innerJoin(products, eq(products.slug, productOptions.productSlug))
    .where(lt(productOptions.stock, 10)).orderBy(asc(productOptions.stock)).limit(6).all();

  return { today, yesterday, pending, preparingPlants, days, byCategory, lowStock };
}
