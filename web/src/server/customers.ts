import 'server-only';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db, schema } from './db';
import { categories } from '@/lib/catalog';
import { getProducts } from './catalog';
import { listOrdersForCustomer } from './orders';
import { listAddresses } from './addresses';
import { listWarrantyForUser } from './warranty';

const { users, orders } = schema;

/** Đơn tính vào chi tiêu/số đơn của khách: đơn khách đặt (không phải đơn bảo hành 0đ), chưa hủy — kể cả đơn
 *  đặt vãng lai trước khi có tài khoản, miễn cùng SĐT (khớp cách `ownedBy` trong server/orders.ts). */
const spendExpr = sql<number>`coalesce((
  select sum(o.total) from ${orders} o
  where o.kind = 'sale' and o.status <> 'cancelled' and (o.user_id = ${users.id} or (${users.phone} is not null and o.phone = ${users.phone}))
), 0)`;
const orderCountExpr = sql<number>`(
  select count(*) from ${orders} o
  where o.kind = 'sale' and o.status <> 'cancelled' and (o.user_id = ${users.id} or (${users.phone} is not null and o.phone = ${users.phone}))
)`;
const lastOrderAtExpr = sql<Date | null>`(
  select max(o.created_at) from ${orders} o
  where o.kind = 'sale' and (o.user_id = ${users.id} or (${users.phone} is not null and o.phone = ${users.phone}))
)`;

export type CustomerRow = Awaited<ReturnType<typeof listCustomers>>[number];
export { customerTier } from '@/lib/customer-labels';

/** Danh sách khách hàng cho admin; q tìm theo tên, SĐT hoặc email. */
export async function listCustomers({ q, limit = 200 }: { q?: string; limit?: number } = {}) {
  const term = q?.trim() ? `%${q.trim().replace(/[%_]/g, '')}%` : undefined;
  return db.select({
    id: users.id, name: users.name, phone: users.phone, contactPhone: users.contactPhone, email: users.email, points: users.points, createdAt: users.createdAt,
    orderCount: orderCountExpr, spend: spendExpr, lastOrderAt: lastOrderAtExpr,
  }).from(users)
    .where(and(
      eq(users.role, 'customer'),
      term ? or(ilike(users.name, term), ilike(users.phone, term), ilike(users.contactPhone, term), ilike(users.email, term)) : undefined,
    ))
    .orderBy(desc(sql`coalesce(${lastOrderAtExpr}, ${users.createdAt})`))
    .limit(limit);
}

export async function getCustomerDetail(id: number) {
  const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.role, 'customer')));
  if (!user) return null;

  const orderList = await listOrdersForCustomer(user, 50);
  const sale = orderList.filter((o) => o.kind === 'sale' && o.status !== 'cancelled');
  const spend = sale.reduce((s, o) => s + o.total, 0);

  const [addresses, warranty] = await Promise.all([
    listAddresses(user.id),
    listWarrantyForUser(user.id),
  ]);

  // Quan tâm: nhóm hàng mua nhiều nhất (theo số lượng), tính trên sản phẩm còn đang bán.
  const qtyBySlug = new Map<string, number>();
  for (const o of sale) for (const it of o.items) qtyBySlug.set(it.productSlug, (qtyBySlug.get(it.productSlug) ?? 0) + it.qty);
  const products = await getProducts([...qtyBySlug.keys()]);
  const qtyByCategory = new Map<string, number>();
  for (const p of products) qtyByCategory.set(p.category, (qtyByCategory.get(p.category) ?? 0) + (qtyBySlug.get(p.slug) ?? 0));
  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
  const interests = [...qtyByCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([category]) => categoryName(category));

  return { user, orders: orderList, spend, addresses, warranty, interests };
}

export async function updateCustomerNotes(id: number, notes: string) {
  await db.update(users).set({ notes: notes || null }).where(and(eq(users.id, id), eq(users.role, 'customer')));
}
