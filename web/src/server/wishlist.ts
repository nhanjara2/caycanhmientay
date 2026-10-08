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

/** addOnly: chỉ lưu, đã lưu rồi thì giữ nguyên (lưu tiếp sau khi đăng nhập — không được bỏ sản phẩm khách đã lưu từ trước). */
export async function toggleWishlist(userId: number, slug: string, addOnly = false) {
  const on = await isWishlisted(userId, slug);
  if (on && !addOnly) await db.delete(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.productSlug, slug)));
  else if (!on) await db.insert(wishlists).values({ userId, productSlug: slug }).onConflictDoNothing();
  return { wishlisted: addOnly || !on };
}

export async function wishlistSlugs(userId: number) {
  return (await db.select({ slug: wishlists.productSlug }).from(wishlists).where(eq(wishlists.userId, userId))).map((r) => r.slug);
}

/** Sản phẩm đã lưu, mới nhất trước; sản phẩm đã ẩn/ngừng bán thì tự bỏ khỏi danh sách (getProducts chỉ lấy hàng đang bán). */
export async function listWishlist(userId: number) {
  const rows = await db.select({ slug: wishlists.productSlug }).from(wishlists)
    .where(eq(wishlists.userId, userId)).orderBy(desc(wishlists.id));
  const bySlug = new Map((await getProducts(rows.map((r) => r.slug))).map((p) => [p.slug, p]));
  return rows.map((r) => bySlug.get(r.slug)).filter((p) => p !== undefined);
}
