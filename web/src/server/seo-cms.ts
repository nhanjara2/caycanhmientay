import 'server-only';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { after } from 'next/server';
import { cache } from 'react';
import { and, desc, eq, lte, ne, sql } from 'drizzle-orm';
import * as z from 'zod';
import { getPolicy } from '@/lib/policies';
import { postPath, sectionOf, SECTIONS } from '@/lib/posts';
import { projectPath } from '@/lib/projects';
import { auditText, isShareImage, redirectable, seoTime, sitePath, type SeoChange } from '@/lib/seo-cms';
import { SITE_ORIGIN } from '@/lib/site';
import { slugify, SLUG_RE } from '@/lib/slug';
import { staffName, type SessionUser } from './auth';
import { db, schema } from './db';

/**
 * SEO trong admin (mục 14 checklist SEO). Ba bảng:
 *  - `seo_overrides`: tiêu đề / mô tả / noindex / canonical / ảnh chia sẻ đặt tay theo đường dẫn. Mọi trang khách công khai
 *    dựng metadata qua `withSeo(withShare(...))` nên ô đặt tay thắng chữ web tự tạo; ô trống = như cũ.
 *  - `redirects`: chuyển hướng 308. Chỉ dùng ở trang nội dung khi đường dẫn KHÔNG còn nội dung (`movedOrNotFound` thay cho
 *    notFound) — trang đang hiện không bao giờ bị chuyển đi; luôn lưu đích cuối (không chuỗi, không vòng).
 *  - `seo_audit`: nhật ký (ai sửa gì, lúc nào).
 * Quyền: tiêu đề / mô tả / ảnh = người sửa được nội dung đó; noindex, canonical, chuyển hướng = chỉ Quản lý.
 */

const O = schema.seoOverrides, R = schema.redirects, A = schema.seoAudit;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Q = typeof db | Tx;

export type SeoOverride = typeof O.$inferSelect;

// ---- Trang khách ----------------------------------------------------------------------------

export const getSeoOverride = cache(async (path: string) => (await db.select().from(O).where(eq(O.path, path)))[0] ?? null);

const canonicalOf = (meta: Metadata) => {
  const c = meta.alternates?.canonical;
  const url = typeof c === 'string' ? c : c instanceof URL ? c.toString() : c?.url?.toString();
  return url ? sitePath(url, true) : null;
};

/**
 * Áp SEO đặt tay lên metadata của trang (sau `withShare`). Khóa = canonical của trang:
 * tiêu đề / mô tả / canonical / ảnh chỉ áp cho trang gốc (không ?tham số — trang 2, 3… giữ "· Trang n");
 * noindex áp cả biến thể. Trang tự noindex theo luật (trang trống, trang lọc…) không bao giờ bị bật index lại.
 */
export async function withSeo(meta: Metadata): Promise<Metadata> {
  const c = canonicalOf(meta);
  if (!c) return meta;
  const [path, query] = c.split('?');
  // Đọc lỗi (database tạm hỏng, lúc build trang tĩnh) thì giữ metadata web tự tạo — SEO đặt tay không được làm sập trang.
  // Trang tĩnh (chính sách, giới thiệu…) được dựng lại khi lưu SEO nhờ revalidatePath trong saveSeoAction.
  const o = await getSeoOverride(path).catch(() => null);
  if (!o) return meta;
  const base = !query;
  const out: Metadata = { ...meta };
  if (base && o.title) out.title = { absolute: o.title };
  if (base && o.description) out.description = o.description;
  if (o.noindex) out.robots = { index: false, follow: true };
  if (base && o.canonical) out.alternates = { ...meta.alternates, canonical: o.canonical };
  if (base && meta.openGraph && (o.canonical || o.image)) {
    out.openGraph = { ...meta.openGraph, ...(o.canonical ? { url: o.canonical } : {}), ...(o.image ? { images: [{ url: o.image }] } : {}) };
  }
  return out;
}

/** Đường dẫn rời sitemap vì đặt tay noindex hoặc canonical trỏ trang khác. */
export async function sitemapExcluded() {
  const rows = await db.select({ path: O.path, noindex: O.noindex, canonical: O.canonical }).from(O).catch(() => []);
  return new Set(rows.filter((r) => r.noindex || (r.canonical && r.canonical !== r.path)).map((r) => r.path));
}

const directRedirect = async (path: string) => (await db.select({ to: R.toPath }).from(R).where(eq(R.fromPath, path)))[0]?.to ?? null;

/**
 * Đích chuyển hướng của một đường dẫn đã mất nội dung. Đích cũng đã gỡ và có chuyển hướng riêng (A → B lúc B còn hiện,
 * sau đó B bị gỡ → C) thì đi tiếp tới đích cuối ngay trên máy chủ — khách chỉ qua một bước 308.
 */
const findRedirect = cache(async (path: string) => {
  let to = await directRedirect(path);
  for (let hop = 0; to && hop < 3; hop++) {
    const next = await directRedirect(to);
    if (!next || next === path || (await pathIsLive(to))) break;
    to = next;
  }
  return to;
});

/** Dùng trong generateMetadata khi không còn nội dung: có chuyển hướng thì chuyển luôn (308). */
export async function redirectIfMoved(path: string) {
  const to = await findRedirect(path);
  if (to) permanentRedirect(to);
}

/** Thay cho notFound() ở trang nội dung: đường dẫn cũ có chuyển hướng → 308 tới trang mới (đếm lượt), không thì 404. */
export async function movedOrNotFound(path: string): Promise<never> {
  const to = await findRedirect(path);
  if (to) {
    after(() => db.update(R).set({ hits: sql`${R.hits} + 1`, lastHitAt: new Date() }).where(eq(R.fromPath, path)).then(() => {}, () => {}));
    permanentRedirect(to);
  }
  notFound();
}

// ---- Nhật ký ----------------------------------------------------------------------------------

export async function logSeo(e: { path: string; action: string; detail?: SeoChange[]; user?: SessionUser | null }, q: Q = db) {
  await q.insert(A).values({ path: e.path, action: e.action, detail: e.detail ?? [], actor: e.user ? staffName(e.user) : 'Hệ thống', userId: e.user?.id ?? null });
}

export const listSeoAudit = (limit = 200, path?: string) =>
  db.select().from(A).where(path ? eq(A.path, path) : undefined).orderBy(desc(A.createdAt), desc(A.id)).limit(limit);

/** Dữ liệu cho khung SEO (`components/admin/SeoPanel.tsx`) của một trang: giá trị đặt tay + 5 lần sửa gần nhất. */
export async function seoPanelState(path: string) {
  const [o, log, live] = await Promise.all([getSeoOverride(path), listSeoAudit(5, path), pathIsLive(path)]);
  return {
    initial: o ? { title: o.title, description: o.description, canonical: o.canonical, noindex: o.noindex, image: o.image } : null,
    history: log.map((a) => ({ at: seoTime(a.createdAt), actor: a.actor, text: auditText(a.action, a.detail) })),
    live,
  };
}

// ---- Trang còn sống? (cảnh báo khi thêm chuyển hướng) ------------------------------------------

/** Đường dẫn đang có nội dung hiện cho khách. Trang tĩnh (không thuộc nhóm nội dung) coi như luôn có. */
export async function pathIsLive(path: string): Promise<boolean> {
  const seg = path.split('/').filter(Boolean);
  const [a, b, c] = seg;
  const exists = async (rows: Promise<unknown[]>) => (await rows).length > 0;
  if (a === 'san-pham' && b && seg.length === 2) {
    const P = schema.products;
    return exists(db.select({ s: P.slug }).from(P).where(and(eq(P.slug, b), eq(P.active, true))));
  }
  if (a === 'danh-muc' && b) {
    if (seg.length === 2) return exists(db.select({ s: schema.categories.slug }).from(schema.categories).where(eq(schema.categories.slug, b)));
    const S = schema.subcategories;
    return seg.length === 3 && exists(db.select({ s: S.slug }).from(S).where(and(eq(S.categorySlug, b), eq(S.slug, c))));
  }
  if ((a === 'goc-cham-cay' || a === 'tin-tuc') && b && seg.length === 2) {
    const P = schema.posts;
    const [p] = await db.select({ category: P.category }).from(P).where(and(eq(P.slug, b), eq(P.status, 'published'), lte(P.publishedAt, new Date())));
    return !!p && SECTIONS[sectionOf(p.category)].path === `/${a}`;
  }
  if (a === 'benh-cay' && b && seg.length === 2) {
    const D = schema.diseases;
    return exists(db.select({ s: D.slug }).from(D).where(and(eq(D.slug, b), eq(D.active, true))));
  }
  if (a === 'doi-tac' && b === 'cong-trinh' && c && seg.length === 3) {
    const PJ = schema.projects;
    return exists(db.select({ s: PJ.slug }).from(PJ).where(and(eq(PJ.slug, c), eq(PJ.published, true))));
  }
  if (a === 'chinh-sach') return seg.length === 2 && !!getPolicy(b);
  return !redirectable(path);
}

// ---- SEO đặt tay ------------------------------------------------------------------------------

/** Trang riêng tư / không công khai: không cho đặt SEO. */
const PRIVATE = /^\/(admin|nhan-vien|api|tai-khoan|gio-hang|thanh-toan|dat-hang-thanh-cong|tim-kiem)(\/|$)/;

const text = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`).refine((s) => !/[<>]/.test(s), 'Không dùng dấu < >');

export const SeoOverrideSchema = z.object({
  path: z.string().max(300),
  title: text(120).optional(),
  description: text(320).optional(),
  canonical: z.string().trim().max(300).optional(),
  noindex: z.boolean().optional(),
  image: z.string().trim().max(300).optional(),
});
export type SeoOverrideInput = z.infer<typeof SeoOverrideSchema>;

const FIELDS = ['title', 'description', 'canonical', 'noindex', 'image'] as const;
const show = (v: unknown) => (v === true ? 'Có' : v === false || v == null || v === '' ? null : String(v));

/**
 * Lưu SEO đặt tay cho một trang. Chỉ đổi những ô được gửi lên (ô không gửi giữ nguyên). Ô trống hết → xóa dòng.
 * `admin` = người lưu là Quản lý (được đổi noindex / canonical).
 */
export async function saveSeoOverride(input: SeoOverrideInput, user: SessionUser, admin: boolean) {
  const parsed = SeoOverrideSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const v = parsed.data;
  const path = sitePath(v.path);
  if (!path || PRIVATE.test(path)) return { ok: false as const, error: 'Đường dẫn không hợp lệ (chỉ trang khách công khai)' };
  if (!admin && (v.noindex !== undefined || v.canonical !== undefined)) {
    const cur = await getSeoOverride(path);
    if ((v.noindex !== undefined && v.noindex !== (cur?.noindex ?? false)) || (v.canonical !== undefined && (v.canonical || null) !== (cur?.canonical ?? null))) {
      return { ok: false as const, error: 'Chỉ Quản lý được đổi "Ẩn khỏi Google" và đường dẫn chuẩn' };
    }
  }

  let canonical: string | null | undefined;
  if (v.canonical !== undefined) {
    if (!v.canonical) canonical = null;
    else {
      const c = sitePath(v.canonical);
      if (!c) return { ok: false as const, error: 'Đường dẫn chuẩn phải là một trang trên chính web (vd. /san-pham/kim-tien)' };
      if (c === path) canonical = null;
      else {
        if (c === '/') return { ok: false as const, error: 'Không trỏ đường dẫn chuẩn về trang chủ — Google sẽ bỏ trang này' };
        if (PRIVATE.test(c)) return { ok: false as const, error: 'Đường dẫn chuẩn phải là trang khách công khai' };
        const t = await getSeoOverride(c);
        if (t?.noindex) return { ok: false as const, error: 'Trang đích đang ẩn khỏi Google — chọn trang khác' };
        if (t?.canonical) return { ok: false as const, error: 'Trang đích lại trỏ đường dẫn chuẩn sang trang khác — trỏ thẳng tới trang cuối' };
        if (!(await pathIsLive(c))) return { ok: false as const, error: 'Trang đích không tồn tại hoặc đang ẩn' };
        canonical = c;
      }
    }
  }
  if (v.noindex && path === '/') return { ok: false as const, error: 'Không được ẩn trang chủ khỏi Google' };
  if (v.image && !isShareImage(v.image)) return { ok: false as const, error: 'Ảnh chia sẻ phải là ảnh trên chính web' };

  const next = {
    title: v.title === undefined ? undefined : v.title || null,
    description: v.description === undefined ? undefined : v.description || null,
    canonical,
    noindex: v.noindex,
    image: v.image === undefined ? undefined : v.image || null,
  };

  return db.transaction(async (tx) => {
    const [cur] = await tx.select().from(O).where(eq(O.path, path)).for('update');
    const merged = {
      title: next.title !== undefined ? next.title : cur?.title ?? null,
      description: next.description !== undefined ? next.description : cur?.description ?? null,
      canonical: next.canonical !== undefined ? next.canonical : cur?.canonical ?? null,
      noindex: next.noindex !== undefined ? next.noindex : cur?.noindex ?? false,
      image: next.image !== undefined ? next.image : cur?.image ?? null,
    };
    const detail: SeoChange[] = FIELDS.filter((f) => (merged[f] ?? null) !== (cur?.[f] ?? (f === 'noindex' ? false : null)))
      .map((f) => ({ field: f, from: show(cur?.[f]), to: show(merged[f]) }));
    if (!detail.length) return { ok: true as const, changed: false };

    const empty = !merged.title && !merged.description && !merged.canonical && !merged.noindex && !merged.image;
    if (empty) await tx.delete(O).where(eq(O.path, path));
    else await tx.insert(O).values({ path, ...merged, updatedBy: staffName(user), updatedAt: new Date() })
      .onConflictDoUpdate({ target: O.path, set: { ...merged, updatedBy: staffName(user), updatedAt: new Date() } });
    await logSeo({ path, action: 'override', detail, user }, tx);
    return { ok: true as const, changed: true };
  });
}

export const listSeoOverrides = () => db.select().from(O).orderBy(desc(O.updatedAt));

// ---- Chuyển hướng ----------------------------------------------------------------------------

export const listRedirects = () => db.select().from(R).orderBy(desc(R.createdAt));

/**
 * Thêm / sửa chuyển hướng `from` → `to` (308). Đích đã chuyển tiếp thì trỏ thẳng đích cuối; chuyển hướng cũ đang trỏ
 * vào `from` cũng đổi sang đích mới (không có chuỗi); chặn vòng lặp. Trả kèm cảnh báo (không chặn lưu).
 */
export async function saveRedirect(
  input: { from: string; to: string; note?: string; reason?: 'manual' | 'slug'; fromGone?: boolean }, user: SessionUser | null, q?: Tx,
): Promise<{ ok: true; from: string; to: string; warnings: string[] } | { ok: false; error: string }> {
  const from = sitePath(input.from);
  const to = sitePath(input.to);
  if (!from || !redirectable(from)) return { ok: false, error: 'Đường dẫn cũ phải là trang sản phẩm, danh mục, bài viết, bệnh cây, công trình hoặc chính sách (vd. /san-pham/ten-cu)' };
  if (!to || PRIVATE.test(to)) return { ok: false, error: 'Trang mới phải là một trang khách trên chính web (vd. /san-pham/ten-moi)' };
  if (from === to) return { ok: false, error: 'Đường dẫn cũ và mới trùng nhau' };

  const run = async (tx: Tx) => {
    // Trang mới đang hiện thì chuyển hướng của nó (nếu có) chưa có tác dụng → đích là chính nó.
    const [next] = await tx.select({ to: R.toPath }).from(R).where(eq(R.fromPath, to));
    const final = next && !(await pathIsLive(to)) ? next.to : to;
    if (final === from) return { ok: false as const, error: 'Chuyển hướng này tạo vòng lặp (trang mới lại đang chuyển về trang cũ)' };
    const [old] = await tx.select().from(R).where(eq(R.fromPath, from)).for('update');
    const note = (input.note ?? '').trim().slice(0, 200);
    await tx.insert(R).values({ fromPath: from, toPath: final, reason: input.reason ?? 'manual', note, createdBy: user ? staffName(user) : 'Hệ thống' })
      .onConflictDoUpdate({ target: R.fromPath, set: { toPath: final, note, reason: input.reason ?? 'manual' } });
    // Gom chuỗi: A → from rồi from → final  ⇒  A → final. Chỉ khi trang cũ đã mất nội dung — trang cũ còn hiện thì
    // A → from vẫn đúng (khách tới được trang đang hiện). Link trong bài viết trỏ trang cũ cũng đổi thẳng sang trang mới.
    let relinked = 0;
    if (input.fromGone || !(await pathIsLive(from))) {
      await tx.update(R).set({ toPath: final }).where(and(eq(R.toPath, from), ne(R.fromPath, final)));
      relinked = await relinkPosts(tx, from, final);
    }
    await logSeo({
      path: from, action: old ? 'redirect-edit' : 'redirect-add', user,
      detail: [{ field: 'redirect', from: old?.toPath ?? null, to: final }],
    }, tx);
    return { ok: true as const, final, relinked };
  };
  const r = q ? await run(q) : await db.transaction(run);
  if (!r.ok) return r;

  const warnings: string[] = [];
  if (r.relinked) warnings.push(`Đã đổi link trong ${r.relinked} bài viết sang trang mới.`);
  if (!q) {
    if (await pathIsLive(from)) warnings.push('Trang cũ vẫn đang hiện cho khách — chuyển hướng chỉ có tác dụng khi trang đó bị ẩn / xóa.');
    if (!(await pathIsLive(r.final))) warnings.push('Trang mới hiện không mở được (không tồn tại hoặc đang ẩn) — khách sẽ gặp trang 404.');
  }
  return { ok: true, from, to: r.final, warnings };
}

/** Link "[chữ](/duong-dan-cu…)" trong bài, kể cả link đầy đủ có tên miền; giữ ?tham số / #mục phía sau. */
const linkTo = (path: string) => {
  const host = new URL(SITE_ORIGIN).hostname.replace(/^www\./, '').replace(/\./g, '\\.');
  const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\]\\((?:https?://(?:www\\.)?${host})?${esc}(?=[)?#])`, 'g');
};

const mapStrings = (v: unknown, fn: (s: string) => string): unknown =>
  typeof v === 'string' ? fn(v) : Array.isArray(v) ? v.map((x) => mapStrings(x, fn))
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mapStrings(x, fn)])) : v;

/**
 * Trang `from` đã chuyển sang `to`: sửa link trong mọi bài viết (cả bài nháp) trỏ thẳng trang mới — link nội bộ không đi
 * qua chuyển hướng (mục 16 checklist SEO). Không đổi ngày sửa của bài (nội dung không đổi). Trả số bài đã sửa.
 */
export async function relinkPosts(q: Q, from: string, to: string) {
  const P = schema.posts;
  const rows = await q.select({ id: P.id, body: P.body, excerpt: P.excerpt }).from(P)
    .where(sql`(${P.body}::text || ${P.excerpt}) like ${`%${from.replace(/[\\%_]/g, '\\$&')}%`}`);
  const re = linkTo(from);
  let n = 0;
  for (const p of rows) {
    const fix = (s: string) => s.replace(re, `](${to}`);
    const body = mapStrings(p.body, fix) as typeof p.body;
    const excerpt = fix(p.excerpt);
    if (JSON.stringify(body) === JSON.stringify(p.body) && excerpt === p.excerpt) continue;
    await q.update(P).set({ body, excerpt }).where(eq(P.id, p.id));
    n++;
  }
  return n;
}

export async function deleteRedirect(fromInput: string, user: SessionUser) {
  const from = sitePath(fromInput);
  if (!from) return { ok: false as const };
  return db.transaction(async (tx) => {
    const [r] = await tx.delete(R).where(eq(R.fromPath, from)).returning();
    if (!r) return { ok: false as const };
    await logSeo({ path: from, action: 'redirect-delete', user, detail: [{ field: 'redirect', from: r.toPath, to: null }] }, tx);
    return { ok: true as const };
  });
}

// ---- Đổi đường dẫn (bài viết, công trình) ----------------------------------------------------

export const SlugSchema = z.string().trim().transform((s) => slugify(s, 90))
  .refine((s) => s.length >= 3 && SLUG_RE.test(s), 'Đường dẫn cần ít nhất 3 ký tự: chữ không dấu, số, dấu "-"');

/** Dời SEO đặt tay + bỏ chuyển hướng đang chiếm đường dẫn mới (đường dẫn mới đã có nội dung). */
async function moveSeo(tx: Tx, oldPath: string, newPath: string) {
  await tx.delete(R).where(eq(R.fromPath, newPath));
  const [taken] = await tx.select({ p: O.path }).from(O).where(eq(O.path, newPath));
  if (!taken) await tx.update(O).set({ path: newPath }).where(eq(O.path, oldPath));
}

/**
 * Đổi đường dẫn bài viết. Bài đã từng đăng (có thể đã lên Google, Zalo, Facebook) → tự thêm chuyển hướng 308
 * đường dẫn cũ → mới. Quyền: người có quyền nội dung toàn quyền (kiểm ở action).
 */
export async function changePostSlug(id: number, slug: string, user: SessionUser) {
  const P = schema.posts;
  return db.transaction(async (tx) => {
    const [cur] = await tx.select({ slug: P.slug, category: P.category, status: P.status, publishedAt: P.publishedAt }).from(P).where(eq(P.id, id)).for('update');
    if (!cur) return { ok: false as const, error: 'Không tìm thấy bài' };
    if (cur.slug === slug) return { ok: true as const, slug, path: postPath(cur), redirected: false };
    const [clash] = await tx.select({ id: P.id }).from(P).where(and(eq(P.slug, slug), ne(P.id, id)));
    if (clash) return { ok: false as const, error: 'Đường dẫn này đã có bài khác dùng' };
    await tx.update(P).set({ slug }).where(eq(P.id, id));
    const oldPath = postPath(cur), newPath = postPath({ slug, category: cur.category });
    await moveSeo(tx, oldPath, newPath);
    const wasPublic = cur.status === 'published' && !!cur.publishedAt && cur.publishedAt <= new Date();
    if (wasPublic) {
      const r = await saveRedirect({ from: oldPath, to: newPath, reason: 'slug', note: 'Tự tạo khi đổi đường dẫn bài', fromGone: true }, user, tx);
      if (!r.ok) throw new Error(r.error);
    }
    await logSeo({ path: newPath, action: 'slug', user, detail: [{ field: 'slug', from: oldPath, to: newPath }] }, tx);
    return { ok: true as const, slug, path: newPath, redirected: wasPublic };
  });
}

/** Đổi đường dẫn công trình — công trình đang hiện thì tự chuyển hướng đường dẫn cũ. */
export async function changeProjectSlug(id: number, slug: string, user: SessionUser) {
  const PJ = schema.projects;
  return db.transaction(async (tx) => {
    const [cur] = await tx.select({ slug: PJ.slug, published: PJ.published }).from(PJ).where(eq(PJ.id, id)).for('update');
    if (!cur) return { ok: false as const, error: 'Không tìm thấy công trình' };
    if (cur.slug === slug) return { ok: true as const, slug, path: projectPath(slug), redirected: false };
    const [clash] = await tx.select({ id: PJ.id }).from(PJ).where(and(eq(PJ.slug, slug), ne(PJ.id, id)));
    if (clash) return { ok: false as const, error: 'Đường dẫn này đã có công trình khác dùng' };
    await tx.update(PJ).set({ slug }).where(eq(PJ.id, id));
    const oldPath = projectPath(cur.slug), newPath = projectPath(slug);
    await moveSeo(tx, oldPath, newPath);
    if (cur.published) {
      const r = await saveRedirect({ from: oldPath, to: newPath, reason: 'slug', note: 'Tự tạo khi đổi đường dẫn công trình', fromGone: true }, user, tx);
      if (!r.ok) throw new Error(r.error);
    }
    await logSeo({ path: newPath, action: 'slug', user, detail: [{ field: 'slug', from: oldPath, to: newPath }] }, tx);
    return { ok: true as const, slug, path: newPath, redirected: cur.published };
  });
}

