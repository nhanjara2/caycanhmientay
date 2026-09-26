// Nạp dữ liệu mẫu (src/lib/seed-products.ts) khi bảng sản phẩm còn trống.
import { asc, count } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { seedProducts } from '@/lib/seed-products';
import { tracksLots } from '@/lib/stock';
import * as schema from './schema';

export function seedIfEmpty(db: BetterSQLite3Database<typeof schema>) {
  const [{ n }] = db.select({ n: count() }).from(schema.products).all();
  if (n > 0) return;
  // Cửa hàng do migration 0002 tạo. Tồn mẫu 100 / quy cách chia cho các cửa hàng.
  const stores = db.select({ id: schema.stores.id }).from(schema.stores).orderBy(asc(schema.stores.id)).all();
  const split = [60, 25, 15].slice(0, stores.length);
  split[0] += 100 - split.reduce((a, b) => a + b, 0);
  db.transaction((tx) => {
    for (const p of seedProducts) {
      const lot = tracksLots({ pesticide: Boolean(p.pesticide), category: p.category }) ? { lotCode: 'L2609-01', expiry: '2027-09-30' } : {};
      tx.insert(schema.products).values({
        slug: p.slug, sku: p.sku, name: p.name, category: p.category, sub: p.sub, icon: p.icon,
        origin: p.origin, ship: p.ship, pesticide: Boolean(p.pesticide), unit: p.unit, spec: p.spec,
        lead: p.lead, specs: p.specs, keywords: p.keywords ?? [], rating: Math.round(p.rating * 10),
        reviews: p.reviews, sold: p.sold, flashSold: p.flash?.sold ?? null, flashTotal: p.flash?.total ?? null,
      }).run();
      p.options.forEach((o, idx) => {
        tx.insert(schema.productOptions).values({ productSlug: p.slug, idx, label: o.label, price: o.price, oldPrice: o.oldPrice ?? null, stock: 100 }).run();
        stores.forEach((s, i) => tx.insert(schema.stockLots).values({ storeId: s.id, productSlug: p.slug, optionIdx: idx, qty: split[i], ...lot }).run());
      });
    }
  });
}
