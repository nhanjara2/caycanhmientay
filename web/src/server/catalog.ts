import 'server-only';
import { connection } from 'next/server';
import { cache } from 'react';
import { and, asc, eq, getTableName, inArray, isNotNull, or, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import type { IconName } from '@/components/Icon';
import { isNewProduct, normalize, productImageUrl, type Product } from '@/lib/catalog';
import { isStockProductImage } from '@/lib/seed-product-images';
import { db, schema } from './db';

const { products: P, productOptions: O, productImages: I } = schema;

type Row = typeof P.$inferSelect;

async function hydrate(rows: Row[]): Promise<Product[]> {
  if (!rows.length) return [];
  const slugs = rows.map((r) => r.slug);
  const [opts, imgs] = await Promise.all([
    db.select().from(O).where(and(inArray(O.productSlug, slugs), eq(O.deleted, false))).orderBy(asc(O.idx)),
    db.select({ slug: I.productSlug, file: I.file }).from(I).where(inArray(I.productSlug, slugs)).orderBy(asc(I.idx), asc(I.id)),
  ]);
  // ảnh đã xếp theo thứ tự, ảnh đầu của mỗi sản phẩm là ảnh chính
  const mainFile = (slug: string) => imgs.find((i) => i.slug === slug)?.file;
  return rows.map((r) => ({
    slug: r.slug, sku: r.sku, name: r.name, seoName: r.seoName ?? undefined, category: r.category, sub: r.sub, extraSubs: r.extraSubs.length ? r.extraSubs : undefined, icon: r.icon as IconName,
    origin: r.origin, ship: r.ship, pesticide: r.pesticide || undefined, unit: r.unit, spec: r.spec, lead: r.lead,
    specs: r.specs, keywords: r.keywords, rating: r.rating / 10, reviews: r.reviews, sold: r.sold,
    flash: r.flashTotal ? { sold: r.flashSold ?? 0, total: r.flashTotal } : undefined,
    options: opts.filter((o) => o.productSlug === r.slug).map((o) => ({
      idx: o.idx, label: o.label, price: o.price, oldPrice: o.oldPrice ?? undefined, combo2: o.combo2 ?? undefined,
    })),
    images: imgs.filter((i) => i.slug === r.slug).map((i) => productImageUrl(i.file)),
    realImg: (mainFile(r.slug) && !isStockProductImage(mainFile(r.slug))) || undefined,
    youtubeId: r.youtubeId ?? undefined,
    fengshui: r.fengshui ?? undefined,
    attrs: r.attrs ?? undefined,
    inStock: opts.some((o) => o.productSlug === r.slug && o.stock > 0),
    isNew: isNewProduct(r.createdAt) || undefined,
  }));
}

/** Cột phụ cho truy vấn ở nơi khác (đơn, kho, bảo hành…): URL ảnh chính của sản phẩm, null khi chưa có ảnh.
 *  Tự ghi "bảng"."cột": truy vấn một bảng Drizzle bỏ tên bảng, khi đó cột bên ngoài bị hiểu nhầm thành cột của product_images. */
export const mainImageOf = (slug: AnyPgColumn) => {
  const outer = sql`${sql.identifier(getTableName(slug.table))}.${sql.identifier(slug.name)}`;
  return sql<string | null>`(select pi.file from ${I} pi where pi.product_slug = ${outer} order by pi.idx, pi.id limit 1)`
    .mapWith((f: string | null) => (f ? productImageUrl(f) : null));
};

const active = eq(P.active, true);

// Gọi connection() để trang đọc dữ liệu mới mỗi request thay vì chụp lúc build.

/** Toàn bộ sản phẩm đang bán; gọi nhiều lần trong một request chỉ truy vấn một lần. */
export const allProducts = cache(async () => {
  await connection();
  return hydrate(await db.select().from(P).where(active).orderBy(asc(P.createdAt), asc(P.slug)));
});

export async function getProduct(slug: string) {
  await connection();
  return (await hydrate(await db.select().from(P).where(and(eq(P.slug, slug), active))))[0];
}

/** Không gọi connection(): dùng trong server action (luôn chạy lúc request). */
export async function getProducts(slugs: string[]) {
  return slugs.length ? hydrate(await db.select().from(P).where(and(inArray(P.slug, slugs), active))) : [];
}

export async function productsIn(category: string, sub?: string) {
  await connection();
  return hydrate(await db.select().from(P).where(and(active, eq(P.category, category), sub ? or(eq(P.sub, sub), sql`${P.extraSubs} ? ${sub}`) : undefined)).orderBy(asc(P.createdAt), asc(P.slug)));
}

export async function flashProducts() {
  await connection();
  return hydrate(await db.select().from(P).where(and(active, isNotNull(P.flashTotal))).orderBy(asc(P.createdAt), asc(P.slug)));
}

/** Số sản phẩm theo "danh mục" và "danh mục/nhóm con" — cho SidebarMenu. */
export async function categoryCounts(): Promise<Record<string, number>> {
  await connection();
  const out: Record<string, number> = {};
  for (const r of await db.select({ c: P.category, s: P.sub, x: P.extraSubs }).from(P).where(active)) {
    out[r.c] = (out[r.c] ?? 0) + 1;
    for (const s of new Set([r.s, ...r.x])) out[`${r.c}/${s}`] = (out[`${r.c}/${s}`] ?? 0) + 1;
  }
  return out;
}

/**
 * Thông số tra cứu được bằng ô tìm kiếm, không bắt nhập lại vào "Tên gọi khác": tên khoa học (cây),
 * hoạt chất / thành phần / số đăng ký (thuốc BVTV, phân bón) — để khách tra "mancozeb" ra đúng thuốc.
 */
const LOOKUP_SPECS = new Set(['ten khoa hoc', 'hoat chat', 'thanh phan', 'so dang ky']);
const lookupValues = (p: Product) => p.specs.filter(([k]) => LOOKUP_SPECS.has(normalize(k))).map(([, v]) => v);

/** Tìm không phân biệt dấu: "tri nam" khớp "trị nấm". */
export async function searchProducts(q: string, categoryName: (slug: string) => string | undefined) {
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return (await allProducts()).filter((p) => {
    const hay = normalize([p.name, p.spec, categoryName(p.category), ...(p.keywords ?? []), ...lookupValues(p)].join(' '));
    return terms.every((t) => hay.includes(t));
  });
}

/** "Thường mua kèm": cây đi với đất, phân, thuốc; vật tư đi với cây. */
export async function boughtTogether(p: Product) {
  return (await allProducts()).filter((x) => x.slug !== p.slug && x.ship !== p.ship).slice(0, 4);
}
