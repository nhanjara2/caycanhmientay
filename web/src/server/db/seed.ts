// Nạp dữ liệu mẫu khi database còn trống: 3 cửa hàng + sản phẩm mẫu (src/lib/seed-products.ts)
// + bài bệnh cây (src/lib/seed-diseases.ts).
import { asc, count } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { seedDiseases } from '@/lib/seed-diseases';
import { seedProducts } from '@/lib/seed-products';
import { tracksLots } from '@/lib/stock';
import * as schema from './schema';

/** Tọa độ ước lượng — cần cập nhật đúng vị trí cửa hàng. */
const STORES = [
  { code: 'Q7', name: 'Vườn ươm Quận 7', address: '169 Phạm Hữu Lầu, Phường Tân Mỹ, TP. Hồ Chí Minh', lat: 10.7162, lng: 106.7338, isDefault: true },
  { code: 'NVL', name: 'Cửa hàng Nguyễn Văn Linh', address: '1487 Nguyễn Văn Linh, Phường Tân Hưng, TP. Hồ Chí Minh', lat: 10.7291, lng: 106.7047 },
  { code: 'TD', name: 'Cửa hàng Thảo Điền', address: '25 Quốc Hương, Phường An Khánh, TP. Hồ Chí Minh', lat: 10.8036, lng: 106.7327 },
];

export async function seedIfEmpty(db: NodePgDatabase<typeof schema>) {
  const [{ n: storeCount }] = await db.select({ n: count() }).from(schema.stores);
  if (storeCount === 0) await db.insert(schema.stores).values(STORES);

  const [{ n }] = await db.select({ n: count() }).from(schema.products);
  if (n > 0) return false;
  // Tồn mẫu 100 / quy cách chia cho các cửa hàng.
  const stores = await db.select({ id: schema.stores.id }).from(schema.stores).orderBy(asc(schema.stores.id));
  const split = [60, 25, 15].slice(0, stores.length);
  split[0] += 100 - split.reduce((a, b) => a + b, 0);
  await db.transaction(async (tx) => {
    for (const p of seedProducts) {
      const lot = tracksLots({ pesticide: Boolean(p.pesticide), category: p.category }) ? { lotCode: 'L2609-01', expiry: '2027-09-30' } : {};
      await tx.insert(schema.products).values({
        slug: p.slug, sku: p.sku, name: p.name, category: p.category, sub: p.sub, icon: p.icon,
        origin: p.origin, ship: p.ship, pesticide: Boolean(p.pesticide), unit: p.unit, spec: p.spec,
        lead: p.lead, specs: p.specs, keywords: p.keywords ?? [], rating: Math.round(p.rating * 10),
        reviews: p.reviews, sold: p.sold, flashSold: p.flash?.sold ?? null, flashTotal: p.flash?.total ?? null,
      });
      for (const [idx, o] of p.options.entries()) {
        await tx.insert(schema.productOptions).values({ productSlug: p.slug, idx, label: o.label, price: o.price, oldPrice: o.oldPrice ?? null, stock: 100 });
        await tx.insert(schema.stockLots).values(stores.map((s, i) => ({ storeId: s.id, productSlug: p.slug, optionIdx: idx, qty: split[i], ...lot })));
      }
    }
  });
  return true;
}

/** Nạp bài bệnh cây mẫu khi bảng `diseases` còn trống (chạy riêng: database đã có sản phẩm vẫn nạp). */
export async function seedDiseasesIfEmpty(db: NodePgDatabase<typeof schema>) {
  const [{ n }] = await db.select({ n: count() }).from(schema.diseases);
  if (n > 0) return false;
  await db.insert(schema.diseases).values(seedDiseases.map((d) => ({
    ...d, aliases: d.aliases ?? [], confusions: d.confusions ?? [], prevention: d.prevention ?? [], safety: d.safety ?? '', products: d.products ?? [],
  })));
  return true;
}
