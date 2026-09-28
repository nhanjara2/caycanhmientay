import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from './db';
import { getProducts } from './catalog';

const { wishlists } = schema;

export async function isWishlisted(userId: number, slug: string) {
  const [row] = await db.select({ id: wishlists.id }).from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productSlug, slug)));
  return Boolean(row);
}

export async function toggleWishlist(userId: number, slug: string) {
  const on = await isWishlisted(userId, slug);
  if (on) await db.delete(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.productSlug, slug)));
  else await db.insert(wishlists).values({ userId, productSlug: slug }).onConflictDoNothing();
  return { wishlisted: !on };
}

/** Sản phẩm đã lưu, mới nhất trước; sản phẩm đã ẩn/ngừng bán thì tự bỏ khỏi danh sách (getProducts chỉ lấy hàng đang bán). */
export async function listWishlist(userId: number) {
  const rows = await db.select({ slug: wishlists.productSlug }).from(wishlists)
    .where(eq(wishlists.userId, userId)).orderBy(desc(wishlists.id));
  const bySlug = new Map((await getProducts(rows.map((r) => r.slug))).map((p) => [p.slug, p]));
  return rows.map((r) => bySlug.get(r.slug)).filter((p) => p !== undefined);
}
