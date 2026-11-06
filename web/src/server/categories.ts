import 'server-only';
import { connection } from 'next/server';
import { cache } from 'react';
import { and, asc, count, eq, sql } from 'drizzle-orm';
import * as z from 'zod';
import type { IconName } from '@/components/Icon';
import { CATEGORY_ICONS, SLUG_RE, SYSTEM_CATEGORIES, toSlug, type Category } from '@/lib/catalog';
import { INTRO_MAX, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from '@/lib/category-seo';
import { db, schema } from './db';
import { safeLang } from '@/i18n/request';

const { categories: C, subcategories: S, products: P } = schema;

/**
 * Tất cả danh mục + nhóm con theo thứ tự admin xếp, kể cả đang ẩn (admin, tra tên, kiểm tra khi lưu sản phẩm).
 * Gọi nhiều lần trong một request chỉ truy vấn một lần. Không gọi connection(): dùng được trong server action.
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  const [cats, subs] = await Promise.all([
    db.select().from(C).orderBy(asc(C.sort), asc(C.createdAt)),
    db.select().from(S).orderBy(asc(S.sort), asc(S.createdAt)),
  ]);
  const seo = (r: { seoTitle: string | null; seoDescription: string | null; intro: string | null }) => ({
    ...(r.seoTitle ? { seoTitle: r.seoTitle } : {}), ...(r.seoDescription ? { seoDescription: r.seoDescription } : {}),
    ...(r.intro ? { intro: r.intro } : {}),
  });
  const en = (await safeLang()) === 'en';
  return cats.map((c) => ({
    slug: c.slug, name: (en && c.en?.name) || c.name, icon: c.icon as IconName, active: c.active, specs: c.specs, ...seo(c),
    subs: subs.filter((s) => s.categorySlug === c.slug).map((s) => ({ slug: s.slug, name: (en && s.en?.name) || s.name, active: s.active, specs: s.specs, ...seo(s) })),
  }));
});

/**
 * Danh mục + nhóm con đang hiện VÀ có sản phẩm đang bán — cho menu trái, thanh danh mục, trang chủ, chân trang.
 * Danh mục / nhóm con chưa có hàng tự ẩn khỏi menu (trang vẫn mở, noindex) — nhập sản phẩm vào là tự hiện lại.
 */
export const menuCategories = cache(async (): Promise<Category[]> => {
  await connection();
  const [cats, rows] = await Promise.all([
    getCategories(),
    db.select({ c: P.category, s: P.sub, x: P.extraSubs }).from(P).where(eq(P.active, true)),
  ]);
  const has = new Set<string>();
  for (const r of rows) {
    has.add(r.c);
    for (const s of [r.s, ...(r.x ?? [])]) has.add(`${r.c}/${s}`);
  }
  return cats
    .filter((c) => c.active && has.has(c.slug))
    .map((c) => ({ ...c, subs: c.subs.filter((s) => s.active && has.has(`${c.slug}/${s.slug}`)) }));
});

export async function getCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug);
}

// ---- Admin ----------------------------------------------------------------------------------

/** Số sản phẩm (kể cả đang ẩn) theo "danh mục" và "danh mục/nhóm con". */
export async function categoryProductCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const r of await db.select({ c: P.category, s: P.sub, x: P.extraSubs }).from(P)) {
    out[r.c] = (out[r.c] ?? 0) + 1;
    for (const s of new Set([r.s, ...r.x])) out[`${r.c}/${s}`] = (out[`${r.c}/${s}`] ?? 0) + 1;
  }
  return out;
}

/** Tên sản phẩm ĐANG BÁN theo "danh mục" và "danh mục/nhóm con" (cùng thứ tự trang khách) — xem trước mô tả Google tự tạo. */
export async function categoryProductNames(): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  const add = (k: string, n: string) => (out[k] ??= []).push(n);
  for (const r of await db.select({ c: P.category, s: P.sub, x: P.extraSubs, n: P.name }).from(P).where(eq(P.active, true)).orderBy(asc(P.createdAt), asc(P.slug))) {
    add(r.c, r.n);
    for (const s of new Set([r.s, ...r.x])) add(`${r.c}/${s}`, r.n);
  }
  return out;
}

export const SPEC_FIELDS_MAX = 20;

const SpecFields = z.array(z.object({
  name: z.string().trim().min(1, 'Nhập tên thông số').max(60, 'Tên thông số tối đa 60 ký tự'),
  required: z.boolean(),
})).max(SPEC_FIELDS_MAX, `Tối đa ${SPEC_FIELDS_MAX} thông số`).superRefine((list, ctx) => {
  const seen = new Set<string>();
  for (const f of list) {
    const k = f.name.toLowerCase();
    if (seen.has(k)) ctx.addIssue({ code: 'custom', message: `Thông số “${f.name}” bị trùng` });
    seen.add(k);
  }
}).transform((list) => list.map((f) => (f.required ? { name: f.name, required: true } : { name: f.name })));

/** create: `slug` = đường dẫn mong muốn ('' = tự sinh từ tên); update: `slug` = danh mục / nhóm con đang sửa (không đổi). */
const Base = {
  mode: z.enum(['create', 'update']),
  slug: z.string().trim().max(60, 'Đường dẫn tối đa 60 ký tự'),
  name: z.string().trim().min(2, 'Tên cần ít nhất 2 ký tự').max(60, 'Tên tối đa 60 ký tự'),
  active: z.boolean(),
  specs: SpecFields,
  // Chữ trên Google: trống = web tự tạo. Không nhận < > (không để thẻ HTML / mã lọt vào thẻ meta).
  seoTitle: z.string().trim().max(SEO_TITLE_MAX, `Tiêu đề Google tối đa ${SEO_TITLE_MAX} ký tự`).refine((v) => !/[<>]/.test(v), 'Tiêu đề Google không dùng dấu < >').default('').transform((v) => v || null),
  seoDescription: z.string().trim().max(SEO_DESCRIPTION_MAX, `Mô tả Google tối đa ${SEO_DESCRIPTION_MAX} ký tự`).refine((v) => !/[<>]/.test(v), 'Mô tả Google không dùng dấu < >').default('').transform((v) => v || null),
  // Đoạn giới thiệu cuối trang: chữ trơn (React tự escape), bỏ dòng trống thừa.
  intro: z.string().trim().max(INTRO_MAX, `Giới thiệu tối đa ${INTRO_MAX} ký tự`).refine((v) => !/[<>]/.test(v), 'Giới thiệu không dùng dấu < >').default('')
    .transform((v) => v.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n') || null),
};
export const CategorySchema = z.object({ ...Base, icon: z.enum(CATEGORY_ICONS) });
export const SubcategorySchema = z.object({ ...Base, category: z.string().max(60) });
export type CategoryInput = z.infer<typeof CategorySchema>;
export type SubcategoryInput = z.infer<typeof SubcategorySchema>;

export type CatResult = { ok: true; slug: string } | { ok: false; error: string };

const BAD_SLUG = 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang (ví dụ: cay-noi-that)';

/** Slug mới: tự sinh từ tên thì thêm -2, -3… khi trùng; tự nhập mà trùng thì báo lỗi. */
async function newSlug(input: { slug: string; name: string }, taken: (s: string) => Promise<boolean>): Promise<CatResult> {
  if (input.slug) {
    if (!SLUG_RE.test(input.slug)) return { ok: false, error: BAD_SLUG };
    return (await taken(input.slug)) ? { ok: false, error: `Đường dẫn “${input.slug}” đã có, hãy chọn đường dẫn khác` } : { ok: true, slug: input.slug };
  }
  const base = toSlug(input.name) || 'danh-muc';
  let slug = base;
  for (let i = 2; await taken(slug); i++) slug = `${base}-${i}`;
  return { ok: true, slug };
}

export async function saveCategory(v: CategoryInput): Promise<CatResult> {
  const values = { name: v.name, icon: v.icon, active: v.active, specs: v.specs, seoTitle: v.seoTitle, seoDescription: v.seoDescription, intro: v.intro };
  if (v.mode === 'update') {
    const r = await db.update(C).set(values).where(eq(C.slug, v.slug)).returning({ slug: C.slug });
    return r.length ? { ok: true, slug: v.slug } : { ok: false, error: 'Không tìm thấy danh mục' };
  }
  const s = await newSlug(v, async (slug) => (await db.select({ s: C.slug }).from(C).where(eq(C.slug, slug))).length > 0);
  if (!s.ok) return s;
  const [{ last }] = await db.select({ last: sql<number | null>`max(${C.sort})` }).from(C);
  await db.insert(C).values({ slug: s.slug, ...values, sort: (last ?? -1) + 1 });
  return s;
}

export async function saveSubcategory(v: SubcategoryInput): Promise<CatResult> {
  const values = { name: v.name, active: v.active, specs: v.specs, seoTitle: v.seoTitle, seoDescription: v.seoDescription, intro: v.intro };
  if (v.mode === 'update') {
    const r = await db.update(S).set(values).where(and(eq(S.categorySlug, v.category), eq(S.slug, v.slug))).returning({ slug: S.slug });
    return r.length ? { ok: true, slug: v.slug } : { ok: false, error: 'Không tìm thấy nhóm con' };
  }
  return db.transaction(async (tx) => {
    // khóa danh mục: 2 lần thêm cùng lúc không trùng thứ tự, danh mục không bị xóa giữa chừng
    const [cat] = await tx.select({ slug: C.slug }).from(C).where(eq(C.slug, v.category)).for('update');
    if (!cat) return { ok: false as const, error: 'Không tìm thấy danh mục' };
    const s = await newSlug(v, async (slug) => (await tx.select({ s: S.slug }).from(S).where(and(eq(S.categorySlug, v.category), eq(S.slug, slug)))).length > 0);
    if (!s.ok) return s;
    const [{ last }] = await tx.select({ last: sql<number | null>`max(${S.sort})` }).from(S).where(eq(S.categorySlug, v.category));
    await tx.insert(S).values({ categorySlug: v.category, slug: s.slug, ...values, sort: (last ?? -1) + 1 });
    return s;
  });
}

/** Đổi chỗ với danh mục / nhóm con liền trước (-1) hoặc liền sau (1), rồi đánh số lại 0, 1, 2… */
export async function moveCategory(slug: string, dir: -1 | 1) {
  return db.transaction(async (tx) => {
    const list = (await tx.select({ slug: C.slug }).from(C).orderBy(asc(C.sort), asc(C.createdAt)).for('update')).map((r) => r.slug);
    if (!reorder(list, slug, dir)) return false;
    for (const [sort, s] of list.entries()) await tx.update(C).set({ sort }).where(eq(C.slug, s));
    return true;
  });
}

export async function moveSubcategory(category: string, slug: string, dir: -1 | 1) {
  return db.transaction(async (tx) => {
    const list = (await tx.select({ slug: S.slug }).from(S).where(eq(S.categorySlug, category)).orderBy(asc(S.sort), asc(S.createdAt)).for('update')).map((r) => r.slug);
    if (!reorder(list, slug, dir)) return false;
    for (const [sort, s] of list.entries()) await tx.update(S).set({ sort }).where(and(eq(S.categorySlug, category), eq(S.slug, s)));
    return true;
  });
}

function reorder(list: string[], slug: string, dir: -1 | 1) {
  const i = list.indexOf(slug);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return false;
  [list[i], list[j]] = [list[j], list[i]];
  return true;
}

export async function setCategoryActive(slug: string, active: boolean) {
  return (await db.update(C).set({ active }).where(eq(C.slug, slug)).returning({ slug: C.slug })).length > 0;
}

export async function setSubcategoryActive(category: string, slug: string, active: boolean) {
  return (await db.update(S).set({ active }).where(and(eq(S.categorySlug, category), eq(S.slug, slug))).returning({ slug: S.slug })).length > 0;
}

export type DeleteCatResult = { ok: true } | { ok: false; error: string };

/** Chỉ xóa danh mục không còn sản phẩm nào (kể cả sản phẩm đang ẩn) và không phải danh mục hệ thống. Nhóm con xóa theo. */
export async function deleteCategory(slug: string): Promise<DeleteCatResult> {
  if (SYSTEM_CATEGORIES[slug]) return { ok: false, error: 'Danh mục hệ thống không xóa được — có thể đổi tên hoặc ẩn khỏi menu.' };
  return db.transaction(async (tx) => {
    const [cat] = await tx.select({ slug: C.slug }).from(C).where(eq(C.slug, slug)).for('update');
    if (!cat) return { ok: false as const, error: 'Không tìm thấy danh mục' };
    const [{ n }] = await tx.select({ n: count() }).from(P).where(eq(P.category, slug));
    if (n > 0) return { ok: false as const, error: `Danh mục còn ${n} sản phẩm (kể cả sản phẩm đang ẩn). Chuyển các sản phẩm sang danh mục khác rồi mới xóa được.` };
    await tx.delete(C).where(eq(C.slug, slug));
    return { ok: true as const };
  });
}

/**
 * Xóa nhóm con. Còn sản phẩm thì phải chọn `moveTo` (nhóm con khác cùng danh mục) — sản phẩm được chuyển sang đó
 * trong cùng transaction (gộp hai nhóm con).
 */
export async function deleteSubcategory(category: string, slug: string, moveTo?: string): Promise<DeleteCatResult> {
  return db.transaction(async (tx) => {
    await tx.select({ slug: C.slug }).from(C).where(eq(C.slug, category)).for('update');
    const subs = (await tx.select({ slug: S.slug }).from(S).where(eq(S.categorySlug, category))).map((r) => r.slug);
    if (!subs.includes(slug)) return { ok: false as const, error: 'Không tìm thấy nhóm con' };
    const [{ n }] = await tx.select({ n: count() }).from(P).where(and(eq(P.category, category), eq(P.sub, slug)));
    if (n > 0) {
      if (subs.length <= 1) return { ok: false as const, error: `Nhóm con còn ${n} sản phẩm và là nhóm con duy nhất — thêm nhóm con khác để chuyển sản phẩm sang trước.` };
      if (!moveTo) return { ok: false as const, error: `Nhóm con còn ${n} sản phẩm — chọn nhóm con sẽ nhận các sản phẩm này.` };
      if (moveTo === slug || !subs.includes(moveTo)) return { ok: false as const, error: 'Nhóm con nhận sản phẩm không hợp lệ' };
      await tx.update(P).set({ sub: moveTo }).where(and(eq(P.category, category), eq(P.sub, slug)));
    }
    // Bỏ nhóm bị xóa khỏi danh sách nhóm phụ (và nhóm phụ trùng nhóm chính sau khi chuyển)
    await tx.update(P).set({ extraSubs: sql`${P.extraSubs} - ${slug}::text - ${P.sub}` }).where(and(eq(P.category, category), sql`${P.extraSubs} ? ${slug}`));
    await tx.delete(S).where(and(eq(S.categorySlug, category), eq(S.slug, slug)));
    return { ok: true as const };
  });
}
