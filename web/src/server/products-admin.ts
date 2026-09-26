import 'server-only';
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { categories, getCategory, normalize } from '@/lib/catalog';
import { db, schema } from './db';
import { applyStock } from './inventory';

const { products, productOptions } = schema;

/** Thông số bắt buộc với thuốc BVTV (BRANDBOOK + AdminProductForm). */
export const PESTICIDE_REQUIRED = ['Số đăng ký', 'Hoạt chất', 'Liều pha', 'Thời gian cách ly'] as const;

export const PRODUCT_ICONS = ['plant', 'leaf', 'flower', 'sprout', 'bottle', 'flask', 'drop', 'pot', 'box', 'tool', 'gauge'] as const;

const money = z.number().int().min(0).max(1_000_000_000);

export const ProductInputSchema = z.object({
  slug: z.string().max(120).optional(), // có = sửa, không có = tạo mới
  name: z.string().trim().min(5, 'Tên sản phẩm cần ít nhất 5 ký tự').max(120, 'Tên tối đa 120 ký tự'),
  category: z.string().refine((c) => categories.some((x) => x.slug === c), 'Chọn danh mục'),
  sub: z.string().min(1, 'Chọn nhóm con'),
  icon: z.enum(PRODUCT_ICONS),
  origin: z.string().trim().min(1, 'Nhập xuất xứ').max(60),
  ship: z.enum(['plant', 'supply']),
  pesticide: z.boolean(),
  unit: z.string().trim().min(1, 'Nhập đơn vị bán').max(20),
  spec: z.string().trim().max(120),
  lead: z.string().trim().min(10, 'Mô tả ngắn cần ít nhất 10 ký tự').max(600),
  specs: z.array(z.tuple([z.string().trim().min(1).max(60), z.string().trim().min(1).max(200)])).max(20),
  active: z.boolean(),
  flash: z.boolean(),
  options: z.array(z.object({
    label: z.string().trim().min(1, 'Nhập tên quy cách').max(40),
    price: money.min(1000, 'Giá bán tối thiểu 1.000đ'),
    oldPrice: money.nullable(),
    stock: z.number().int().min(0).max(100_000).optional(), // chỉ dùng khi tạo quy cách mới
  })).min(1, 'Cần ít nhất 1 quy cách').max(10),
}).superRefine((v, ctx) => {
  const cat = getCategory(v.category);
  if (cat && !cat.subs.some((s) => s.slug === v.sub)) ctx.addIssue({ code: 'custom', path: ['sub'], message: 'Nhóm con không thuộc danh mục' });
  v.options.forEach((o, i) => {
    if (o.oldPrice !== null && o.oldPrice <= o.price) ctx.addIssue({ code: 'custom', path: ['options', i, 'oldPrice'], message: `Quy cách “${o.label}”: giá gốc phải lớn hơn giá bán` });
  });
  if (v.pesticide) {
    const have = new Set(v.specs.map(([k]) => k));
    const miss = PESTICIDE_REQUIRED.filter((k) => !have.has(k));
    if (miss.length) ctx.addIssue({ code: 'custom', path: ['specs'], message: `Thuốc BVTV bắt buộc có: ${miss.join(', ')}` });
  }
});
export type ProductInput = z.infer<typeof ProductInputSchema>;

const slugify = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

export function listProductsAdmin({ q, category }: { q?: string; category?: string } = {}) {
  const term = q?.trim() ? `%${q.trim().replace(/[%_]/g, '')}%` : undefined;
  const rows = db.select({
    slug: products.slug, sku: products.sku, name: products.name, icon: products.icon, category: products.category, sub: products.sub,
    unit: products.unit, active: products.active, pesticide: products.pesticide, ship: products.ship, sold: products.sold,
    minPrice: sql<number>`min(${productOptions.price})`, stock: sql<number>`sum(${productOptions.stock})`, variants: sql<number>`count(${productOptions.idx})`,
  })
    .from(products).leftJoin(productOptions, eq(productOptions.productSlug, products.slug))
    .where(and(category ? eq(products.category, category) : undefined, term ? or(like(products.name, term), like(products.sku, term)) : undefined))
    .groupBy(products.slug).orderBy(desc(products.active), asc(products.name)).all();
  return rows;
}

export function getProductAdmin(slug: string) {
  const p = db.select().from(products).where(eq(products.slug, slug)).get();
  if (!p) return undefined;
  const options = db.select().from(productOptions).where(eq(productOptions.productSlug, slug)).orderBy(asc(productOptions.idx)).all();
  return { ...p, options };
}

export type SaveResult = { ok: true; slug: string } | { ok: false; error: string };

export function saveProduct(input: ProductInput, actor: string): SaveResult {
  const values = {
    name: input.name, category: input.category, sub: input.sub, icon: input.icon, origin: input.origin, ship: input.ship,
    pesticide: input.pesticide, unit: input.unit, spec: input.spec, lead: input.lead, specs: input.specs, active: input.active,
  };

  if (input.slug) {
    const existing = getProductAdmin(input.slug);
    if (!existing) return { ok: false, error: 'Không tìm thấy sản phẩm' };
    // Không xóa quy cách cũ: đơn hàng cũ tham chiếu theo thứ tự quy cách.
    if (input.options.length < existing.options.length) return { ok: false, error: 'Không thể xóa quy cách đã có. Hãy ẩn sản phẩm hoặc đổi tên quy cách.' };
    db.transaction((tx) => {
      tx.update(products).set({
        ...values,
        flashTotal: input.flash ? (existing.flashTotal ?? 50) : null,
        flashSold: input.flash ? (existing.flashSold ?? 0) : null,
      }).where(eq(products.slug, input.slug!)).run();
      input.options.forEach((o, idx) => {
        if (idx < existing.options.length) {
          tx.update(productOptions).set({ label: o.label, price: o.price, oldPrice: o.oldPrice })
            .where(and(eq(productOptions.productSlug, input.slug!), eq(productOptions.idx, idx))).run();
        } else {
          tx.insert(productOptions).values({ productSlug: input.slug!, idx, label: o.label, price: o.price, oldPrice: o.oldPrice, stock: 0 }).run();
          if (o.stock) applyStock(tx, input.slug!, idx, o.stock, 'import', actor, 'Tồn đầu kỳ');
        }
      });
    });
    return { ok: true, slug: input.slug };
  }

  let slug = slugify(input.name) || 'san-pham';
  for (let i = 2; db.select({ s: products.slug }).from(products).where(eq(products.slug, slug)).get(); i++) slug = `${slugify(input.name)}-${i}`;
  const prefix = input.ship === 'plant' ? 'MT' : 'VT';
  const n = (db.select({ n: sql<number>`count(*)` }).from(products).get()?.n ?? 0) + 1;
  let sku = `${prefix}-${String(90000 + n)}`;
  for (let i = 1; db.select({ s: products.sku }).from(products).where(eq(products.sku, sku)).get(); i++) sku = `${prefix}-${String(90000 + n + i)}`;

  db.transaction((tx) => {
    tx.insert(products).values({ slug, sku, ...values, keywords: [], flashTotal: input.flash ? 50 : null, flashSold: input.flash ? 0 : null }).run();
    input.options.forEach((o, idx) => {
      tx.insert(productOptions).values({ productSlug: slug, idx, label: o.label, price: o.price, oldPrice: o.oldPrice, stock: 0 }).run();
      if (o.stock) applyStock(tx, slug, idx, o.stock, 'import', actor, 'Tồn đầu kỳ');
    });
  });
  return { ok: true, slug };
}

export function setProductActive(slug: string, active: boolean) {
  const r = db.update(products).set({ active }).where(eq(products.slug, slug)).run();
  return r.changes > 0;
}
