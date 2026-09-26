import 'server-only';
import { connection } from 'next/server';
import { cache } from 'react';
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';
import type { IconName } from '@/components/Icon';
import { normalize, type Product } from '@/lib/catalog';
import { db, schema } from './db';

const { products: P, productOptions: O } = schema;

type Row = typeof P.$inferSelect;

function hydrate(rows: Row[]): Product[] {
  if (!rows.length) return [];
  const opts = db.select().from(O).where(inArray(O.productSlug, rows.map((r) => r.slug))).orderBy(asc(O.idx)).all();
  return rows.map((r) => ({
    slug: r.slug, sku: r.sku, name: r.name, category: r.category, sub: r.sub, icon: r.icon as IconName,
    origin: r.origin, ship: r.ship, pesticide: r.pesticide || undefined, unit: r.unit, spec: r.spec, lead: r.lead,
    specs: r.specs, keywords: r.keywords, rating: r.rating / 10, reviews: r.reviews, sold: r.sold,
    flash: r.flashTotal ? { sold: r.flashSold ?? 0, total: r.flashTotal } : undefined,
    options: opts.filter((o) => o.productSlug === r.slug).map((o) => ({ label: o.label, price: o.price, oldPrice: o.oldPrice ?? undefined })),
  }));
}

const active = eq(P.active, true);

// better-sqlite3 chạy đồng bộ: gọi connection() để trang đọc dữ liệu mới mỗi request thay vì chụp lúc build.

/** Toàn bộ sản phẩm đang bán; gọi nhiều lần trong một request chỉ truy vấn một lần. */
export const allProducts = cache(async () => {
  await connection();
  return hydrate(db.select().from(P).where(active).all());
});

export async function getProduct(slug: string) {
  await connection();
  return hydrate(db.select().from(P).where(and(eq(P.slug, slug), active)).all())[0];
}

/** Không gọi connection(): dùng trong server action (luôn chạy lúc request). */
export function getProducts(slugs: string[]) {
  return slugs.length ? hydrate(db.select().from(P).where(and(inArray(P.slug, slugs), active)).all()) : [];
}

export async function productsIn(category: string, sub?: string) {
  await connection();
  return hydrate(db.select().from(P).where(and(active, eq(P.category, category), sub ? eq(P.sub, sub) : undefined)).all());
}

export async function flashProducts() {
  await connection();
  return hydrate(db.select().from(P).where(and(active, isNotNull(P.flashTotal))).all());
}

/** Số sản phẩm theo "danh mục" và "danh mục/nhóm con" — cho SidebarMenu. */
export async function categoryCounts(): Promise<Record<string, number>> {
  await connection();
  const out: Record<string, number> = {};
  for (const r of db.select({ c: P.category, s: P.sub }).from(P).where(active).all()) {
    out[r.c] = (out[r.c] ?? 0) + 1;
    out[`${r.c}/${r.s}`] = (out[`${r.c}/${r.s}`] ?? 0) + 1;
  }
  return out;
}

/** Tìm không phân biệt dấu: "tri nam" khớp "trị nấm". */
export async function searchProducts(q: string, categoryName: (slug: string) => string | undefined) {
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return (await allProducts()).filter((p) => {
    const hay = normalize([p.name, p.spec, categoryName(p.category), ...(p.keywords ?? [])].join(' '));
    return terms.every((t) => hay.includes(t));
  });
}

/** "Thường mua kèm": cây đi với đất, phân, thuốc; vật tư đi với cây. */
export async function boughtTogether(p: Product) {
  return (await allProducts()).filter((x) => x.slug !== p.slug && x.ship !== p.ship).slice(0, 4);
}
