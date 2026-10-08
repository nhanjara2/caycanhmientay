import 'server-only';
import { and, asc, count, desc, eq, ilike, like, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { ELEMENTS, findCategory, MAX_PRODUCT_IMAGES, normalize, parseYoutubeId, PRODUCT_ICONS, productImageUrl, specTemplate, type FengShui } from '@/lib/catalog';
import { advisorKeys } from '@/lib/plant-advisor';
import { attrKeys, type ProductAttrs } from '@/lib/product-filters';
import { SEO_NAME_MAX } from '@/lib/seo-name';
import { nextSku, skuPrefix } from '@/lib/sku';
import { tracksLots } from '@/lib/stock';
import { mainImageOf } from './catalog';
import { getCategories } from './categories';
import { db, schema } from './db';
import { applyStock } from './inventory';
import type { SavedImage } from './uploads';

const { products, productOptions, productImages, orderItems, stockLots, stockMoves } = schema;

/** Thông số bắt buộc với thuốc BVTV (BRANDBOOK + AdminProductForm). */
export const PESTICIDE_REQUIRED = ['Số đăng ký', 'Hoạt chất', 'Liều pha', 'Thời gian cách ly'] as const;


const money = z.number().int().min(0).max(1_000_000_000);

export const ProductInputSchema = z.object({
  slug: z.string().max(120).optional(), // có = sửa, không có = tạo mới
  name: z.string().trim().min(5, 'Tên sản phẩm cần ít nhất 5 ký tự').max(120, 'Tên tối đa 120 ký tự'),
  // Tên chi tiết (SEO): trống = web tự tạo theo công thức (lib/seo-name.ts)
  seoName: z.string().trim().max(SEO_NAME_MAX, `Tên chi tiết tối đa ${SEO_NAME_MAX} ký tự`).optional().transform((v) => v || null),
  // danh mục / nhóm con có thật + thông số bắt buộc: kiểm tra trong saveProduct (danh mục nằm trong database)
  category: z.string().min(1, 'Chọn danh mục').max(60),
  sub: z.string().min(1, 'Chọn nhóm con').max(60),
  extraSubs: z.array(z.string().max(60)).max(20).default([]),
  icon: z.enum(PRODUCT_ICONS),
  origin: z.string().trim().min(1, 'Nhập xuất xứ').max(60),
  ship: z.enum(['plant', 'supply']),
  pesticide: z.boolean(),
  unit: z.string().trim().min(1, 'Nhập đơn vị bán').max(20),
  spec: z.string().trim().max(120),
  lead: z.string().trim().min(10, 'Mô tả ngắn cần ít nhất 10 ký tự').max(600),
  specs: z.array(z.tuple([z.string().trim().min(1).max(60), z.string().trim().min(1).max(200)])).max(30),
  // Tên gọi khác / tên khoa học để khách tìm ra sản phẩm, ngăn cách bằng dấu phẩy hoặc xuống dòng → mảng, bỏ trùng (không phân biệt dấu, hoa thường)
  keywords: z.string().max(600, 'Tên gọi khác tối đa 600 ký tự').optional().transform((v, ctx): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const k of (v ?? '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)) {
      if (k.length > 60) { ctx.addIssue({ code: 'custom', message: `Tên gọi khác “${k.slice(0, 20)}…” dài quá 60 ký tự, hãy ngăn cách bằng dấu phẩy` }); continue; }
      if (!seen.has(normalize(k))) { seen.add(normalize(k)); out.push(k); }
    }
    if (out.length > 15) ctx.addIssue({ code: 'custom', message: 'Tối đa 15 tên gọi khác' });
    return out;
  }),
  active: z.boolean(),
  flash: z.boolean(),
  // Link YouTube (bỏ trống = không có video) → lưu mã video
  video: z.string().trim().max(200).optional().transform((v, ctx) => {
    if (!v) return null;
    const id = parseYoutubeId(v);
    if (!id) ctx.addIssue({ code: 'custom', message: 'Link YouTube chưa đúng (ví dụ: https://youtu.be/abc123XYZ_0)' });
    return id;
  }),
  // Phong thủy: điền mục nào lưu mục đó, bỏ trống hết = không có
  fengshui: z.object({
    elements: z.array(z.enum(ELEMENTS.map((e) => e.key) as [string, ...string[]])).max(5),
    ages: z.string().trim().max(80),
    meaning: z.string().trim().max(1000),
    placement: z.string().trim().max(300),
  }).optional().transform((f) => (f && (f.elements.length || f.ages || f.meaning || f.placement) ? (f as FengShui) : null)),
  // Đặc điểm cây cho bộ lọc: chỉ nhận giá trị trong danh sách (lib/product-filters.ts); không chọn gì = null
  attrs: z.object({
    viTri: z.array(z.enum(attrKeys.viTri as [string, ...string[]])).max(5),
    kichThuoc: z.enum(attrKeys.kichThuoc as [string, ...string[]]).nullable(),
    mau: z.array(z.enum(attrKeys.mau as [string, ...string[]])).max(8),
    // Tư vấn chọn cây (lib/plant-advisor.ts); bỏ trống thì trang tư vấn tự đoán từ thông số chữ
    anhSang: z.array(z.enum(advisorKeys.anhSang)).max(5).default([]),
    vaiTro: z.array(z.enum(advisorKeys.vaiTro)).max(10).default([]),
    cham: z.enum(advisorKeys.cham).nullable().default(null),
    thuCung: z.enum(advisorKeys.thuCung).nullable().default(null),
    chiuGio: z.boolean().default(false),
  }).optional().transform((a): ProductAttrs | null => {
    if (!a || !(a.viTri.length || a.kichThuoc || a.mau.length || a.anhSang.length || a.vaiTro.length || a.cham || a.thuCung || a.chiuGio)) return null;
    return {
      viTri: a.viTri, ...(a.kichThuoc ? { kichThuoc: a.kichThuoc } : {}), mau: a.mau,
      ...(a.anhSang.length ? { anhSang: a.anhSang } : {}), ...(a.vaiTro.length ? { vaiTro: a.vaiTro } : {}),
      ...(a.cham ? { cham: a.cham } : {}), ...(a.thuCung ? { thuCung: a.thuCung } : {}), ...(a.chiuGio ? { chiuGio: true } : {}),
    };
  }),
  options: z.array(z.object({
    label: z.string().trim().min(1, 'Nhập tên quy cách').max(40),
    // 0 = chưa có giá → web hiện "Liên hệ báo giá", khách không đặt online được
    price: money.refine((v) => v === 0 || v >= 1000, 'Giá bán tối thiểu 1.000đ (hoặc 0 = Liên hệ báo giá)'),
    oldPrice: money.nullable(),
    stock: z.number().int().min(0).max(100_000).optional(), // chỉ dùng khi tạo quy cách mới
  })).min(1, 'Cần ít nhất 1 quy cách').max(10),
}).superRefine((v, ctx) => {
  v.options.forEach((o, i) => {
    if (o.oldPrice !== null && o.price === 0) ctx.addIssue({ code: 'custom', path: ['options', i, 'oldPrice'], message: `Quy cách “${o.label}”: chưa có giá (Liên hệ báo giá) thì bỏ trống giá gốc` });
    else if (o.oldPrice !== null && o.oldPrice <= o.price) ctx.addIssue({ code: 'custom', path: ['options', i, 'oldPrice'], message: `Quy cách “${o.label}”: giá gốc phải lớn hơn giá bán` });
  });
  if (v.pesticide) {
    const have = new Set(v.specs.map(([k]) => k));
    const miss = PESTICIDE_REQUIRED.filter((k) => !have.has(k));
    if (miss.length) ctx.addIssue({ code: 'custom', path: ['specs'], message: `Thuốc BVTV bắt buộc có: ${miss.join(', ')}` });
  }
});
export type ProductInput = z.infer<typeof ProductInputSchema>;

const slugify = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

export async function listProductsAdmin({ q, category }: { q?: string; category?: string } = {}) {
  const term = q?.trim() ? `%${q.trim().replace(/[%_]/g, '')}%` : undefined;
  const rows = await db.select({
    slug: products.slug, sku: products.sku, name: products.name, icon: products.icon, image: mainImageOf(products.slug), category: products.category, sub: products.sub,
    unit: products.unit, active: products.active, pesticide: products.pesticide, ship: products.ship, sold: products.sold,
    minPrice: sql`min(nullif(${productOptions.price}, 0))`.mapWith(Number), stock: sql`coalesce(sum(${productOptions.stock}), 0)`.mapWith(Number), variants: count(productOptions.idx),
  })
    .from(products).leftJoin(productOptions, eq(productOptions.productSlug, products.slug))
    .where(and(category ? eq(products.category, category) : undefined, term ? or(ilike(products.name, term), ilike(products.sku, term)) : undefined))
    .groupBy(products.slug).orderBy(desc(products.active), asc(products.name));
  return rows;
}

export async function getProductAdmin(slug: string) {
  const [p] = await db.select().from(products).where(eq(products.slug, slug));
  if (!p) return undefined;
  const options = await db.select().from(productOptions).where(eq(productOptions.productSlug, slug)).orderBy(asc(productOptions.idx));
  return { ...p, options, images: await listProductImages(slug) };
}

// ---- Ảnh sản phẩm ---------------------------------------------------------------------------

export async function listProductImages(slug: string) {
  const rows = await db.select({ id: productImages.id, file: productImages.file }).from(productImages)
    .where(eq(productImages.productSlug, slug)).orderBy(asc(productImages.idx), asc(productImages.id));
  return rows.map((r) => ({ id: r.id, url: productImageUrl(r.file) }));
}

export async function addProductImage(slug: string, img: SavedImage): Promise<{ ok: true } | { ok: false; error: string }> {
  return db.transaction(async (tx) => {
    // khóa dòng sản phẩm để 2 lần tải cùng lúc không vượt giới hạn / trùng thứ tự
    const [p] = await tx.select({ slug: products.slug }).from(products).where(eq(products.slug, slug)).for('update');
    if (!p) return { ok: false as const, error: 'Không tìm thấy sản phẩm' };
    const [{ n, last }] = await tx.select({ n: count(), last: sql<number | null>`max(${productImages.idx})` }).from(productImages).where(eq(productImages.productSlug, slug));
    if (n >= MAX_PRODUCT_IMAGES) return { ok: false as const, error: `Mỗi sản phẩm tối đa ${MAX_PRODUCT_IMAGES} ảnh` };
    await tx.insert(productImages).values({ productSlug: slug, idx: (last ?? -1) + 1, file: img.file, mime: img.mime, data: img.data });
    return { ok: true as const };
  });
}

export async function deleteProductImage(slug: string, id: number) {
  const r = await db.delete(productImages).where(and(eq(productImages.productSlug, slug), eq(productImages.id, id))).returning({ id: productImages.id });
  return r.length > 0;
}

/** Đưa một ảnh lên đầu (ảnh đại diện) hoặc dời trái/phải một bậc. */
export async function moveProductImage(slug: string, id: number, to: 'first' | 'left' | 'right') {
  return db.transaction(async (tx) => {
    await tx.select({ slug: products.slug }).from(products).where(eq(products.slug, slug)).for('update');
    const ids = (await tx.select({ id: productImages.id }).from(productImages).where(eq(productImages.productSlug, slug))
      .orderBy(asc(productImages.idx), asc(productImages.id))).map((r) => r.id);
    const i = ids.indexOf(id);
    if (i < 0) return false;
    ids.splice(i, 1);
    ids.splice(to === 'first' ? 0 : to === 'left' ? Math.max(0, i - 1) : Math.min(ids.length, i + 1), 0, id);
    for (const [idx, imgId] of ids.entries()) await tx.update(productImages).set({ idx }).where(eq(productImages.id, imgId));
    return true;
  });
}

export type SaveResult = { ok: true; slug: string } | { ok: false; error: string };

/** Danh mục + nhóm con phải có thật; thông số đánh dấu bắt buộc trong danh mục / nhóm con phải có giá trị. */
async function checkCategory(input: ProductInput): Promise<string | null> {
  const cat = findCategory(await getCategories(), input.category);
  if (!cat) return 'Chọn danh mục';
  if (!cat.subs.some((s) => s.slug === input.sub)) return 'Chọn nhóm con thuộc danh mục';
  const has = new Set(input.specs.map(([k]) => k.toLowerCase()));
  const miss = specTemplate(cat, input.sub).filter((f) => f.required && !has.has(f.name.toLowerCase()));
  return miss.length ? `Danh mục “${cat.name}” bắt buộc nhập thông số: ${miss.map((f) => f.name).join(', ')}` : null;
}

/** Hàng theo lô (thuốc BVTV, phân bón, hạt giống) phải có Số lô + Hạn dùng khi nhập kho, mà Tồn đầu kỳ không có hai thông tin đó. */
function lotStockError(input: ProductInput, firstNew: number): string | null {
  if (!tracksLots({ pesticide: input.pesticide, category: input.category })) return null;
  if (!input.options.some((o, i) => i >= firstNew && (o.stock ?? 0) > 0)) return null;
  return 'Hàng theo lô (thuốc BVTV, phân bón, hạt giống) không nhập Tồn đầu kỳ ở đây. Để Tồn đầu kỳ = 0, lưu sản phẩm rồi nhập hàng ở trang Nhập hàng kèm Số lô và Hạn dùng.';
}

export async function saveProduct(input: ProductInput, actor: string): Promise<SaveResult> {
  const bad = await checkCategory(input);
  if (bad) return { ok: false, error: bad };
  // Nhóm phụ: chỉ giữ nhóm con có thật của cùng danh mục, khác nhóm chính
  const subsOfCat = findCategory(await getCategories(), input.category)?.subs.map((s) => s.slug) ?? [];
  const extraSubs = [...new Set(input.extraSubs)].filter((s) => s !== input.sub && subsOfCat.includes(s));
  const values = {
    name: input.name, seoName: input.seoName, category: input.category, sub: input.sub, extraSubs, icon: input.icon, origin: input.origin, ship: input.ship,
    pesticide: input.pesticide, unit: input.unit, spec: input.spec, lead: input.lead, specs: input.specs, active: input.active,
    youtubeId: input.video, keywords: input.keywords,
    fengshui: input.fengshui,
    attrs: input.attrs,
  };

  if (input.slug) {
    const existing = await getProductAdmin(input.slug);
    if (!existing) return { ok: false, error: 'Không tìm thấy sản phẩm' };
    // Không xóa quy cách cũ: đơn hàng cũ tham chiếu theo thứ tự quy cách.
    if (input.options.length < existing.options.length) return { ok: false, error: 'Không thể xóa quy cách đã có. Hãy ẩn sản phẩm hoặc đổi tên quy cách.' };
    const lotBad = lotStockError(input, existing.options.length);
    if (lotBad) return { ok: false, error: lotBad };
    await db.transaction(async (tx) => {
      await tx.update(products).set({
        ...values,
        flashTotal: input.flash ? (existing.flashTotal ?? 50) : null,
        flashSold: input.flash ? (existing.flashSold ?? 0) : null,
      }).where(eq(products.slug, input.slug!));
      for (const [idx, o] of input.options.entries()) {
        if (idx < existing.options.length) {
          await tx.update(productOptions).set({ label: o.label, price: o.price, oldPrice: o.oldPrice })
            .where(and(eq(productOptions.productSlug, input.slug!), eq(productOptions.idx, idx)));
        } else {
          await tx.insert(productOptions).values({ productSlug: input.slug!, idx, label: o.label, price: o.price, oldPrice: o.oldPrice, stock: 0 });
          if (o.stock) await applyStock(tx, input.slug!, idx, o.stock, 'import', actor, 'Tồn đầu kỳ');
        }
      }
    });
    return { ok: true, slug: input.slug };
  }

  const lotBad = lotStockError(input, 0);
  if (lotBad) return { ok: false, error: lotBad };

  let slug = slugify(input.name) || 'san-pham';
  for (let i = 2; (await db.select({ s: products.slug }).from(products).where(eq(products.slug, slug))).length; i++) slug = `${slugify(input.name)}-${i}`;
  const prefix = skuPrefix(input.category);
  const sku = nextSku(prefix, (await db.select({ s: products.sku }).from(products).where(like(products.sku, `${prefix}-%`))).map((r) => r.s));

  await db.transaction(async (tx) => {
    await tx.insert(products).values({ slug, sku, ...values, flashTotal: input.flash ? 50 : null, flashSold: input.flash ? 0 : null });
    for (const [idx, o] of input.options.entries()) {
      await tx.insert(productOptions).values({ productSlug: slug, idx, label: o.label, price: o.price, oldPrice: o.oldPrice, stock: 0 });
      if (o.stock) await applyStock(tx, slug, idx, o.stock, 'import', actor, 'Tồn đầu kỳ');
    }
  });
  return { ok: true, slug };
}

export async function setProductActive(slug: string, active: boolean) {
  const r = await db.update(products).set({ active }).where(eq(products.slug, slug)).returning({ slug: products.slug });
  return r.length > 0;
}

export type DeleteResult = { ok: true } | { ok: false; error: string };

/**
 * Xóa hẳn sản phẩm (kèm quy cách, ảnh, đánh giá, hỏi đáp, yêu thích… theo khóa ngoại) và lô/lịch sử tồn kho.
 * Sản phẩm đã có trong đơn hàng thì không xóa: bảo hành, vườn của tôi và báo cáo còn tham chiếu — chỉ ẩn.
 */
export async function deleteProduct(slug: string): Promise<DeleteResult> {
  return db.transaction(async (tx) => {
    const [p] = await tx.select({ slug: products.slug }).from(products).where(eq(products.slug, slug)).for('update');
    if (!p) return { ok: false as const, error: 'Không tìm thấy sản phẩm' };
    const [{ n }] = await tx.select({ n: count() }).from(orderItems).where(eq(orderItems.productSlug, slug));
    if (n > 0) return { ok: false as const, error: `Sản phẩm đã có trong ${n} dòng đơn hàng nên không thể xóa. Hãy chuyển sang “Ẩn” để ngừng bán.` };
    await tx.delete(stockMoves).where(eq(stockMoves.productSlug, slug));
    await tx.delete(stockLots).where(eq(stockLots.productSlug, slug));
    await tx.delete(products).where(eq(products.slug, slug));
    return { ok: true as const };
  });
}
