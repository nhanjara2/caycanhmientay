// Nạp dữ liệu mẫu khi database còn trống: 3 cửa hàng + sản phẩm mẫu (src/lib/seed-products.ts)
// + bài bệnh cây (src/lib/seed-diseases.ts) + bài Góc chăm cây (src/lib/seed-posts.ts).
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { seedDiseases } from '@/lib/seed-diseases';
import { readMinutes } from '@/lib/posts';
import { seedPosts } from '@/lib/seed-posts';
import { seedProducts } from '@/lib/seed-products';
import { tracksLots } from '@/lib/stock';
import { WELCOME_CODE, WELCOME_DEFAULT } from '@/lib/voucher-labels';
import * as schema from './schema';

/** Tọa độ ước lượng — cần cập nhật đúng vị trí cửa hàng. */
const STORES = [
  { code: 'Q7', name: 'Vườn ươm Quận 7', address: '169 Phạm Hữu Lầu, Phường Tân Mỹ, TP. Hồ Chí Minh', lat: 10.7162, lng: 106.7338, isDefault: true },
  { code: 'NVL', name: 'Cửa hàng Nguyễn Văn Linh', address: '1487 Nguyễn Văn Linh, Phường Tân Hưng, TP. Hồ Chí Minh', lat: 10.7291, lng: 106.7047 },
  { code: 'TD', name: 'Cửa hàng Thảo Điền', address: '25 Quốc Hương, Phường An Khánh, TP. Hồ Chí Minh', lat: 10.8036, lng: 106.7327 },
];

type Db = NodePgDatabase<typeof schema>;

const markSeeded = (db: Db, key: string) =>
  db.insert(schema.appSettings).values({ key, value: true, updatedBy: 'db-setup' }).onConflictDoNothing({ target: schema.appSettings.key });

/**
 * Dữ liệu mẫu chỉ nạp MỘT LẦN cho database mới. `db:setup` chạy mỗi lần deploy, nên "bảng trống thì nạp" một mình sẽ làm
 * sản phẩm / bài mẫu mà chủ shop đã xóa hiện lại sau mỗi lần deploy. Nên:
 *  - đã có dấu `seeded:<nhóm>` trong `app_settings` → không nạp;
 *  - chưa có dấu mà database đã được dùng (đã có tài khoản đăng nhập) → bảng trống là do chủ shop xóa, ghi dấu và không nạp;
 *  - còn lại (database mới tinh) → nạp, rồi ghi dấu (hàm gọi `markSeeded`).
 * Thêm nhóm dữ liệu mẫu mới cho database đã dùng thì phải nạp bằng migration, vì database đã dùng sẽ không bao giờ vào nhánh nạp.
 */
async function shouldSeed(db: Db, key: string) {
  const [done] = await db.select({ key: schema.appSettings.key }).from(schema.appSettings).where(eq(schema.appSettings.key, key));
  if (done) return false;
  const [{ n: users }] = await db.select({ n: count() }).from(schema.users);
  if (users > 0) { await markSeeded(db, key); return false; }
  return true;
}

export async function seedIfEmpty(db: Db) {
  const [{ n: storeCount }] = await db.select({ n: count() }).from(schema.stores);
  if (storeCount === 0) await db.insert(schema.stores).values(STORES);

  const [{ n }] = await db.select({ n: count() }).from(schema.products);
  if (n > 0) return false;
  if (!(await shouldSeed(db, 'seeded:products'))) return false;
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
        attrs: p.attrs ?? null,
      });
      for (const [idx, o] of p.options.entries()) {
        await tx.insert(schema.productOptions).values({ productSlug: p.slug, idx, label: o.label, price: o.price, oldPrice: o.oldPrice ?? null, stock: 100 });
        await tx.insert(schema.stockLots).values(stores.map((s, i) => ({ storeId: s.id, productSlug: p.slug, optionIdx: idx, qty: split[i], ...lot })));
      }
    }
  });
  await markSeeded(db, 'seeded:products');
  return true;
}

/** Gắn đặc điểm cây (vị trí đặt, kích thước, màu) cho các cây mẫu đã có trong database từ trước khi có bộ lọc.
 *  Chỉ điền khi còn trống (attrs is null) — cây admin đã tự gắn thì giữ nguyên. Trả về số cây vừa gắn. */
export async function seedPlantAttrs(db: NodePgDatabase<typeof schema>) {
  let n = 0;
  for (const p of seedProducts) {
    if (!p.attrs) continue;
    const r = await db.update(schema.products).set({ attrs: p.attrs })
      .where(and(eq(schema.products.slug, p.slug), isNull(schema.products.attrs))).returning({ slug: schema.products.slug });
    n += r.length;
  }
  return n;
}

/** Nạp bài bệnh cây mẫu khi bảng `diseases` còn trống (chạy riêng: database đã có sản phẩm vẫn nạp). */
export async function seedDiseasesIfEmpty(db: Db) {
  const [{ n }] = await db.select({ n: count() }).from(schema.diseases);
  if (n > 0) return false;
  if (!(await shouldSeed(db, 'seeded:diseases'))) return false;
  await db.insert(schema.diseases).values(seedDiseases.map((d) => ({
    ...d, aliases: d.aliases ?? [], confusions: d.confusions ?? [], prevention: d.prevention ?? [], safety: d.safety ?? '', products: d.products ?? [],
  })));
  await markSeeded(db, 'seeded:diseases');
  return true;
}

/** Nạp bài Góc chăm cây mẫu (đã đăng, cách nhau 1 ngày) khi bảng `posts` còn trống. */
export async function seedPostsIfEmpty(db: Db) {
  const [{ n }] = await db.select({ n: count() }).from(schema.posts);
  if (n > 0) return false;
  if (!(await shouldSeed(db, 'seeded:posts'))) return false;
  const now = Date.now();
  await db.insert(schema.posts).values(seedPosts.map((p, i) => {
    const at = new Date(now - i * 86_400_000);
    return {
      ...p, kind: 'article' as const, authorName: 'Cây Cảnh Miền Tây', status: 'published' as const,
      readMinutes: readMinutes(p.title, p.excerpt, p.body), publishedAt: at, updatedAt: at, updatedBy: 'Dữ liệu mẫu',
    };
  }));
  await markSeeded(db, 'seeded:posts');
  return true;
}

/** Tạo mã quà tài khoản mới (lib/voucher-labels.ts) nếu chưa có. Có rồi thì giữ nguyên — admin đã có thể sửa số tiền / tắt mã. */
export async function seedWelcomeVoucher(db: NodePgDatabase<typeof schema>) {
  const rows = await db.insert(schema.vouchers).values({
    code: WELCOME_CODE,
    label: 'Quà tài khoản mới',
    discountType: 'amount',
    discountValue: WELCOME_DEFAULT.discountValue,
    minOrder: WELCOME_DEFAULT.minOrder,
    perCustomerLimit: 1,
  }).onConflictDoNothing({ target: schema.vouchers.code }).returning({ id: schema.vouchers.id });
  return rows.length > 0;
}
