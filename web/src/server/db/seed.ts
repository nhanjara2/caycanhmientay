// Nạp dữ liệu mẫu khi database còn trống: 3 cửa hàng + sản phẩm mẫu (src/lib/seed-products.ts)
// + bài bệnh cây (src/lib/seed-diseases.ts) + bài Góc chăm cây (src/lib/seed-posts.ts).
import fs from 'node:fs';
import path from 'node:path';
import { and, asc, count, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { SEED_DISEASE_IMAGES } from '@/lib/seed-disease-images';
import { SEED_POST_COVERS } from '@/lib/seed-post-covers';
import { SEED_PRODUCT_IMAGES } from '@/lib/seed-product-images';
import { seedDiseases } from '@/lib/seed-diseases';
import { readMinutes } from '@/lib/posts';
import { seedPosts } from '@/lib/seed-posts';
import { seedProducts } from '@/lib/seed-products';
import { tracksLots } from '@/lib/stock';
import { WELCOME_CODE, WELCOME_DEFAULT } from '@/lib/voucher-labels';
import * as schema from './schema';

/** Q7 / NVL / TD là cửa hàng mẫu (tọa độ ước lượng, không hiện cho khách); SD là cửa hàng thật. Tồn mẫu chỉ chia cho 3 cửa hàng đầu. */
const STORES = [
  { code: 'Q7', name: 'Vườn ươm Quận 7', address: '169 Phạm Hữu Lầu, Phường Tân Mỹ, TP. Hồ Chí Minh', lat: 10.7162, lng: 106.7338, isDefault: true },
  { code: 'NVL', name: 'Cửa hàng Nguyễn Văn Linh', address: '1487 Nguyễn Văn Linh, Phường Tân Hưng, TP. Hồ Chí Minh', lat: 10.7291, lng: 106.7047 },
  { code: 'TD', name: 'Cửa hàng Thảo Điền', address: '25 Quốc Hương, Phường An Khánh, TP. Hồ Chí Minh', lat: 10.8036, lng: 106.7327 },
  // Cửa hàng thật duy nhất (chủ shop cung cấp 07/10/2026) — hiện trên trang Hệ thống cửa hàng; giống dòng migration 0029.
  { code: 'SD', name: 'Vườn ươm Cây Cảnh Miền Tây', address: 'Làng hoa Sa Đéc, Phường Sa Đéc, Tỉnh Đồng Tháp', lat: 10.349176, lng: 105.731775,
    isPublic: true, phone: '0703005001', contactName: 'Lê Hoài Nhân', open24h: true, services: ['nursery', 'clinic'] },
  // Đối tác cung cấp tro trấu (chỉ hiện trên web, không có kho: active = false) — giống dòng migration 0030.
  { code: 'PL', name: 'Hoa Kiểng Tro Trấu Phương Linh', address: 'Ngay cầu Sa Nhiên 2, Ấp Khánh Nhơn, Xã Tân Khánh Đông, TP. Sa Đéc, Đồng Tháp', lat: 10.3411553, lng: 105.7344338,
    active: false, isPublic: true, kind: 'partner' as const, phone: '0707873425', services: ['supply'],
    note: 'Đối tác cung cấp tro trấu cho Cây Cảnh Miền Tây. Bán sỉ và lẻ tro trấu, sơ dừa, phân rơm, phân bò, cỏ nhung, hoa kiểng, vỏ nhựa các loại.' },
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
  const stores = await db.select({ id: schema.stores.id }).from(schema.stores).where(eq(schema.stores.active, true)).orderBy(asc(schema.stores.id));
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
        await tx.insert(schema.stockLots).values(stores.slice(0, split.length).map((s, i) => ({ storeId: s.id, productSlug: p.slug, optionIdx: idx, qty: split[i], ...lot })));
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

/**
 * Gắn ảnh minh họa triệu chứng (lib/seed-disease-images.ts, file ở seed/benh-cay/) vào bài bệnh — chạy MỘT lần (dấu
 * `seeded:disease-images`), kể cả database đã dùng. Chỉ gắn vào triệu chứng còn đúng chữ như bài mẫu và chưa có ảnh: bài
 * admin đã sửa chữ / đã tự thêm ảnh thì giữ nguyên; admin bỏ ảnh sau này thì không nạp lại. Trả về số ảnh đã gắn.
 */
export async function seedDiseaseImages(db: Db) {
  const KEY = 'seeded:disease-images';
  const dir = path.join(process.cwd(), 'seed', 'benh-cay');
  const missing = SEED_DISEASE_IMAGES.filter((x) => !fs.existsSync(path.join(dir, x.source)));
  if (missing.length) {
    console.warn(`[db] Thiếu ${missing.length} ảnh bệnh cây trong ${dir} — bỏ qua, lần deploy sau thử lại`);
    return 0;
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${KEY}))`);
    const [done] = await tx.select({ key: schema.appSettings.key }).from(schema.appSettings).where(eq(schema.appSettings.key, KEY));
    if (done) return 0;
    const slugs = [...new Set(SEED_DISEASE_IMAGES.map((x) => x.disease))];
    const rows = await tx.select({ slug: schema.diseases.slug, symptoms: schema.diseases.symptoms })
      .from(schema.diseases).where(inArray(schema.diseases.slug, slugs)).for('update');
    let n = 0;
    for (const d of rows) {
      const imgs = SEED_DISEASE_IMAGES.filter((x) => x.disease === d.slug);
      const used: typeof imgs = [];
      const symptoms = d.symptoms.map((s) => {
        const m = !s.image && imgs.find((x) => x.symptom === s.text && !used.includes(x));
        if (!m) return s;
        used.push(m);
        return { ...s, image: m.file };
      });
      if (!used.length) continue;
      await tx.insert(schema.diseaseImages).values(used.map((x) => ({
        diseaseSlug: d.slug, file: x.file, mime: 'image/jpeg', data: fs.readFileSync(path.join(dir, x.source)),
      }))).onConflictDoNothing({ target: schema.diseaseImages.file });
      await tx.update(schema.diseases).set({ symptoms }).where(eq(schema.diseases.slug, d.slug));
      n += used.length;
    }
    await tx.insert(schema.appSettings).values({ key: KEY, value: true, updatedBy: 'db-setup' }).onConflictDoNothing({ target: schema.appSettings.key });
    return n;
  });
}

/**
 * Ảnh minh họa cho sản phẩm chưa có ảnh (lib/seed-product-images.ts, file ở seed/san-pham/) — chạy MỘT lần (dấu
 * `seeded:product-images`), kể cả database đã dùng. Sản phẩm đã có ảnh / đã xóa thì bỏ qua; admin xóa ảnh minh họa để thay
 * ảnh thật thì không nạp lại. Ảnh vào `idx` 0 (ảnh đại diện). Trả về số ảnh đã gắn.
 */
export async function seedProductImages(db: Db) {
  const KEY = 'seeded:product-images';
  if (!SEED_PRODUCT_IMAGES.length) return 0;
  const dir = path.join(process.cwd(), 'seed', 'san-pham');
  const missing = SEED_PRODUCT_IMAGES.filter((x) => !fs.existsSync(path.join(dir, x.source)));
  if (missing.length) {
    console.warn(`[db] Thiếu ${missing.length} ảnh sản phẩm trong ${dir} — bỏ qua, lần deploy sau thử lại`);
    return 0;
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${KEY}))`);
    const [done] = await tx.select({ key: schema.appSettings.key }).from(schema.appSettings).where(eq(schema.appSettings.key, KEY));
    if (done) return 0;
    const slugs = SEED_PRODUCT_IMAGES.map((x) => x.product);
    const exists = new Set((await tx.select({ slug: schema.products.slug }).from(schema.products)
      .where(inArray(schema.products.slug, slugs)).for('update')).map((r) => r.slug));
    const hasImage = new Set((await tx.selectDistinct({ slug: schema.productImages.productSlug }).from(schema.productImages)
      .where(inArray(schema.productImages.productSlug, slugs))).map((r) => r.slug));
    const todo = SEED_PRODUCT_IMAGES.filter((x) => exists.has(x.product) && !hasImage.has(x.product));
    // Mỗi ảnh ~150KB → chia nhỏ câu lệnh
    for (let i = 0; i < todo.length; i += 20) {
      await tx.insert(schema.productImages).values(todo.slice(i, i + 20).map((x) => ({
        productSlug: x.product, idx: 0, file: x.file, mime: 'image/jpeg', data: fs.readFileSync(path.join(dir, x.source)),
      }))).onConflictDoNothing({ target: schema.productImages.file });
    }
    await tx.insert(schema.appSettings).values({ key: KEY, value: true, updatedBy: 'db-setup' }).onConflictDoNothing({ target: schema.appSettings.key });
    return todo.length;
  });
}

/**
 * Ảnh bìa cho bài Góc chăm cây mẫu chưa có ảnh bìa (lib/seed-post-covers.ts, file ở seed/bai-viet/) — chạy MỘT lần (dấu
 * `seeded:post-covers`), kể cả database đã dùng. Bài đã xóa / đã có ảnh bìa thì bỏ qua. Trả về số ảnh đã gắn.
 */
export async function seedPostCovers(db: Db) {
  const KEY = 'seeded:post-covers';
  const dir = path.join(process.cwd(), 'seed', 'bai-viet');
  if (SEED_POST_COVERS.some((x) => !fs.existsSync(path.join(dir, x.source)))) {
    console.warn(`[db] Thiếu ảnh bìa bài viết trong ${dir} — bỏ qua, lần deploy sau thử lại`);
    return 0;
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${KEY}))`);
    const [done] = await tx.select({ key: schema.appSettings.key }).from(schema.appSettings).where(eq(schema.appSettings.key, KEY));
    if (done) return 0;
    const rows = await tx.select({ id: schema.posts.id, slug: schema.posts.slug }).from(schema.posts)
      .where(and(inArray(schema.posts.slug, SEED_POST_COVERS.map((x) => x.post)), isNull(schema.posts.coverFile))).for('update');
    for (const r of rows) {
      const c = SEED_POST_COVERS.find((x) => x.post === r.slug)!;
      await tx.insert(schema.postImages).values({ postId: r.id, file: c.file, mime: 'image/jpeg', data: fs.readFileSync(path.join(dir, c.source)) })
        .onConflictDoNothing({ target: schema.postImages.file });
      await tx.update(schema.posts).set({ coverFile: c.file }).where(eq(schema.posts.id, r.id));
    }
    await tx.insert(schema.appSettings).values({ key: KEY, value: true, updatedBy: 'db-setup' }).onConflictDoNothing({ target: schema.appSettings.key });
    return rows.length;
  });
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
