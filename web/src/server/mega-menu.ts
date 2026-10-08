import 'server-only';
import { and, asc, eq, gt, ne, sql } from 'drizzle-orm';
import type { IconName } from '@/components/Icon';
import { MEGA_TOP, type MegaMenuData, type MegaProduct } from '@/lib/mega-menu';
import { mainImageOf } from './catalog';
import { db, schema } from './db';

const { products: P, productOptions: O, orders: Ord, orderItems: OI } = schema;

/** Số ngày tính "bán chạy" từ đơn thật. */
const SALES_DAYS = 90;

/**
 * Dữ liệu bảng xổ của thanh danh mục: sản phẩm bán chạy theo danh mục và theo nhóm con (kể cả nhóm phụ `extra_subs`).
 * Xếp: số lượng bán thật trong 90 ngày (đơn bán chưa hủy) → "Đã bán" → có ảnh → còn hàng → có giá → mới đăng.
 */
export async function megaMenuData(): Promise<MegaMenuData> {
  const since = new Date(Date.now() - SALES_DAYS * 86_400_000);
  const [rows, opts, sales] = await Promise.all([
    db.select({
      slug: P.slug, name: P.name, category: P.category, sub: P.sub, extraSubs: P.extraSubs, unit: P.unit, icon: P.icon,
      sold: P.sold, createdAt: P.createdAt, image: mainImageOf(P.slug),
    }).from(P).where(eq(P.active, true)),
    db.select({ slug: O.productSlug, price: O.price, oldPrice: O.oldPrice, stock: O.stock })
      .from(O).innerJoin(P, and(eq(P.slug, O.productSlug), eq(P.active, true))).orderBy(asc(O.idx)),
    db.select({ slug: OI.productSlug, qty: sql<number>`sum(${OI.qty})`.mapWith(Number) })
      .from(OI).innerJoin(Ord, eq(Ord.id, OI.orderId))
      .where(and(eq(Ord.kind, 'sale'), ne(Ord.status, 'cancelled'), gt(Ord.createdAt, since)))
      .groupBy(OI.productSlug),
  ]);

  const sold = new Map(sales.map((s) => [s.slug, s.qty]));
  const optsOf = new Map<string, typeof opts>();
  for (const o of opts) optsOf.set(o.slug, [...(optsOf.get(o.slug) ?? []), o]);

  const products: Record<string, MegaProduct> = {};
  const rank = new Map<string, number[]>();
  for (const r of rows) {
    const os = optsOf.get(r.slug) ?? [];
    const priced = os.filter((o) => o.price > 0);
    const cheapest = priced.reduce<(typeof os)[number] | undefined>((b, o) => (!b || o.price < b.price ? o : b), undefined);
    products[r.slug] = {
      slug: r.slug, name: r.name, image: r.image, icon: r.icon as IconName, unit: r.unit,
      price: cheapest?.price ?? 0, oldPrice: cheapest?.oldPrice ?? null,
      from: new Set(priced.map((o) => o.price)).size > 1,
    };
    rank.set(r.slug, [sold.get(r.slug) ?? 0, r.sold, r.image ? 1 : 0, os.some((o) => o.stock > 0) ? 1 : 0, cheapest ? 1 : 0, r.createdAt.getTime()]);
  }
  const byRank = (a: string, b: string) => {
    const x = rank.get(a)!, y = rank.get(b)!;
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] - x[i];
    return a < b ? -1 : 1;
  };

  const groups = new Map<string, string[]>();
  const push = (key: string, slug: string) => groups.set(key, [...(groups.get(key) ?? []), slug]);
  for (const r of rows) {
    push(r.category, r.slug);
    for (const s of new Set([r.sub, ...r.extraSubs])) push(`${r.category}/${s}`, r.slug);
  }

  const top: Record<string, string[]> = {};
  const counts: Record<string, number> = {};
  const used = new Set<string>();
  for (const [key, slugs] of groups) {
    counts[key] = slugs.length;
    top[key] = slugs.sort(byRank).slice(0, MEGA_TOP);
    top[key].forEach((s) => used.add(s));
  }
  // chỉ gửi sản phẩm có mặt trong một danh sách nào đó
  for (const slug of Object.keys(products)) if (!used.has(slug)) delete products[slug];
  return { products, top, counts };
}
