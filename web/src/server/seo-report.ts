import 'server-only';
import { connection } from 'next/server';
import { and, eq, lte } from 'drizzle-orm';
import { plainText } from '@/lib/slug';
import { hasProjectDetail, projectPath } from '@/lib/projects';
import { blockText, parseInline, postPath } from '@/lib/posts';
import { redirectable, seoKindOf, sitePath } from '@/lib/seo-cms';
import { seoNameOf } from '@/lib/seo-name';
import { allProducts } from './catalog';
import { db, schema } from './db';
import { publishedPosts } from './posts';
import { listRedirects, listSeoAudit, listSeoOverrides, pathIsLive, sitemapExcluded, type SeoOverride } from './seo-cms';
import { SITEMAP_KINDS, type SitemapKind } from './sitemap';

/**
 * Bảng kê SEO cho trang admin /admin/seo và file Excel (mục 14 checklist SEO): mọi trang khách công khai (từ chính nguồn
 * dựng sitemap) + trang đang ẩn + trang có SEO đặt tay, kèm cảnh báo thiếu dữ liệu đọc thẳng từ database.
 * Chữ thật Google thấy (title / description đã dựng) do file Excel đọc lại từ trang (`/admin/seo/xuat`).
 */

export type SeoPageRow = {
  path: string;
  kind: string;
  /** Đang hiện / Đang ẩn / … */
  status: string;
  inSitemap: boolean;
  lastmod?: Date;
  /** Trang sửa nội dung trong admin. */
  edit?: string;
  override?: SeoOverride;
  /** Đường dẫn này đang có chuyển hướng (chỉ có tác dụng khi trang không còn nội dung). */
  redirectTo?: string;
};

export type SeoIssue = { path: string; kind: string; text: string; edit?: string; level: 'error' | 'warn' };

async function editLinks() {
  const [posts, projects] = await Promise.all([
    db.select({ id: schema.posts.id, slug: schema.posts.slug, category: schema.posts.category }).from(schema.posts),
    db.select({ id: schema.projects.id, slug: schema.projects.slug }).from(schema.projects),
  ]);
  const byPath = new Map<string, string>();
  for (const p of posts) byPath.set(postPath(p), `/admin/noi-dung/${p.id}`);
  for (const p of projects) byPath.set(projectPath(p.slug), `/admin/du-an/${p.id}`);
  return (path: string) => {
    const [a, b] = path.split('?')[0].split('/').filter(Boolean);
    if (a === 'san-pham' && b) return `/admin/san-pham/${b}`;
    if (a === 'danh-muc' && b) return `/admin/danh-muc/${b}`;
    if (a === 'benh-cay' && b) return `/admin/benh-cay/${b}`;
    return byPath.get(path);
  };
}

export async function seoPages(): Promise<SeoPageRow[]> {
  await connection();
  const P = schema.products, D = schema.diseases, PJ = schema.projects;
  const [overrides, redirects, excluded, editOf, hiddenProducts, hiddenDiseases, hiddenProjects] = await Promise.all([
    listSeoOverrides(), listRedirects(), sitemapExcluded(), editLinks(),
    db.select({ slug: P.slug, updatedAt: P.updatedAt }).from(P).where(eq(P.active, false)),
    db.select({ slug: D.slug, updatedAt: D.updatedAt }).from(D).where(eq(D.active, false)),
    db.select({ slug: PJ.slug, updatedAt: PJ.updatedAt }).from(PJ).where(eq(PJ.published, false)),
  ]);
  const ov = new Map(overrides.map((o) => [o.path, o]));
  const rd = new Map(redirects.map((r) => [r.fromPath, r.toPath]));
  const rows = new Map<string, SeoPageRow>();
  const add = (path: string, status: string, inSitemap: boolean, lastmod?: Date) => {
    if (rows.has(path)) return;
    rows.set(path, {
      path, kind: seoKindOf(path).kind, status, inSitemap, lastmod, edit: editOf(path),
      override: ov.get(path.split('?')[0]), redirectTo: rd.get(path),
    });
  };

  for (const kind of Object.keys(SITEMAP_KINDS) as SitemapKind[]) {
    for (const e of await SITEMAP_KINDS[kind]()) {
      const u = new URL(e.loc);
      const path = u.pathname + u.search;
      add(path, 'Đang hiện', !!u.search || !excluded.has(u.pathname), e.lastmod);
    }
  }
  for (const p of hiddenProducts) add(`/san-pham/${p.slug}`, 'Đang ẩn', false, p.updatedAt);
  for (const d of hiddenDiseases) add(`/benh-cay/${d.slug}`, 'Đang ẩn', false, d.updatedAt);
  for (const p of hiddenProjects) add(projectPath(p.slug), 'Đang ẩn', false, p.updatedAt);
  for (const o of overrides) if (!rows.has(o.path)) add(o.path, (await pathIsLive(o.path)) ? 'Đang hiện (ngoài sitemap)' : 'Không mở được', false, o.updatedAt);
  return [...rows.values()];
}

/** Cảnh báo thiếu / trùng dữ liệu SEO đọc thẳng từ database (không cần mở trang). */
export async function seoIssues(): Promise<SeoIssue[]> {
  await connection();
  const D = schema.diseases, PJ = schema.projects, P = schema.products;
  const [products, posts, diseases, projects, allSlugs, overrides, redirects, audit, editOf] = await Promise.all([
    allProducts(), publishedPosts(),
    db.select({ slug: D.slug, name: D.name, summary: D.summary, symptoms: D.symptoms }).from(D).where(eq(D.active, true)),
    db.select().from(PJ).where(eq(PJ.published, true)),
    Promise.all([
      db.select({ slug: P.slug }).from(P).then((r) => r.map((x) => `/san-pham/${x.slug}`)),
      db.select({ slug: schema.posts.slug, category: schema.posts.category }).from(schema.posts).then((r) => r.map(postPath)),
      db.select({ slug: D.slug }).from(D).then((r) => r.map((x) => `/benh-cay/${x.slug}`)),
      db.select({ slug: PJ.slug }).from(PJ).then((r) => r.map((x) => projectPath(x.slug))),
    ]).then((x) => x.flat()),
    listSeoOverrides(), listRedirects(), listSeoAudit(500), editLinks(),
  ]);
  const postBodies = await db.select({ slug: schema.posts.slug, category: schema.posts.category, excerpt: schema.posts.excerpt, body: schema.posts.body })
    .from(schema.posts).where(and(eq(schema.posts.status, 'published'), lte(schema.posts.publishedAt, new Date())));
  const out: SeoIssue[] = [];
  const push = (path: string, text: string, level: SeoIssue['level'] = 'warn') => out.push({ path, kind: seoKindOf(path).kind, text, edit: editOf(path), level });
  const ov = new Map(overrides.map((o) => [o.path, o]));

  // Tiêu đề trùng giữa các trang cùng loại (tính cả tiêu đề đặt tay).
  const dupTitles = (items: { path: string; title: string }[]) => {
    const seen = new Map<string, string>();
    for (const it of items) {
      const t = plainText(ov.get(it.path)?.title || it.title);
      const first = seen.get(t);
      if (first) push(it.path, `Tiêu đề Google trùng với ${first}`, 'error');
      else seen.set(t, it.path);
    }
  };

  for (const p of products) {
    const path = `/san-pham/${p.slug}`;
    if (!p.images?.length && !ov.get(path)?.image) push(path, 'Chưa có ảnh — Google và Zalo / Facebook hiện ảnh chung của web');
    if (p.lead.trim().length < 50 && !ov.get(path)?.description) push(path, 'Mô tả ngắn dưới 50 ký tự — mô tả Google lấy từ ô này');
  }
  dupTitles(products.map((p) => ({ path: `/san-pham/${p.slug}`, title: seoNameOf(p) })));

  for (const p of posts) {
    const path = postPath(p);
    if (p.kind === 'article' && !p.coverFile && !ov.get(path)?.image) push(path, 'Bài chưa có ảnh bìa');
    if (!p.excerpt.trim() && !ov.get(path)?.description) push(path, 'Chưa có đoạn dẫn — mô tả Google lấy từ đoạn văn đầu bài');
  }
  dupTitles(posts.map((p) => ({ path: postPath(p), title: p.title })));

  for (const d of diseases) {
    const path = `/benh-cay/${d.slug}`;
    if (d.summary.trim().length < 50 && !ov.get(path)?.description) push(path, 'Tóm tắt dưới 50 ký tự — mô tả Google lấy từ tóm tắt');
    if (!d.symptoms.some((s) => s.image) && !ov.get(path)?.image) push(path, 'Chưa có ảnh triệu chứng');
  }
  dupTitles(diseases.map((d) => ({ path: `/benh-cay/${d.slug}`, title: d.name })));

  for (const p of projects) {
    const path = projectPath(p.slug);
    if (!hasProjectDetail(p)) push(path, 'Công trình chỉ có tên (chưa ảnh / mô tả / hạng mục) — trang đang tự ẩn khỏi Google');
    else if (!p.summary.trim() && !ov.get(path)?.description) push(path, 'Chưa có tóm tắt — mô tả Google đang ghép tự động');
  }

  // Đường dẫn bị thêm "-2", "-3" vì trùng tên với trang khác.
  const all = new Set(allSlugs);
  for (const path of allSlugs) {
    const m = /^(.*)-(\d+)$/.exec(path);
    if (m && all.has(m[1])) push(path, `Đường dẫn bị thêm số vì trùng tên với ${m[1]} — nên đặt tên khác để khách và Google dễ phân biệt`);
  }

  for (const o of overrides) {
    if (o.canonical && !(await pathIsLive(o.canonical))) push(o.path, `Đường dẫn chuẩn trỏ tới ${o.canonical} — trang này không mở được`, 'error');
    if (o.noindex) push(o.path, 'Đang đặt tay "Ẩn khỏi Google" (noindex)');
  }
  for (const r of redirects) {
    if (!(await pathIsLive(r.toPath))) push(r.fromPath, `Chuyển hướng tới ${r.toPath} — trang này không mở được`, 'error');
  }
  // Link trong bài viết đang hiện trỏ tới trang đã gỡ (404) hoặc đi qua chuyển hướng (mục 16 checklist SEO).
  const linkFrom = new Map<string, string[]>();
  for (const p of postBodies) {
    const strings = [p.excerpt, ...p.body.flatMap(blockText)];
    for (const x of strings.flatMap(parseInline)) {
      const path = x.t === 'a' ? sitePath(x.href) : null;
      if (!path || path === '/' || !redirectable(path)) continue;
      linkFrom.set(path, [...(linkFrom.get(path) ?? []), postPath(p)]);
    }
  }
  const rd = new Map(redirects.map((r) => [r.fromPath, r.toPath]));
  for (const [target, from] of linkFrom) {
    if (await pathIsLive(target)) continue;
    const to = rd.get(target);
    for (const path of new Set(from)) {
      push(path, to
        ? `Bài có link tới ${target} — trang này đã chuyển sang ${to}, nên sửa link trỏ thẳng trang mới`
        : `Bài có link hỏng tới ${target} (trang không còn) — sửa / bỏ link hoặc thêm chuyển hướng cho ${target}`, to ? 'warn' : 'error');
    }
  }

  // Trang đã xóa (theo nhật ký) mà chưa có chuyển hướng.
  const moved = new Set(redirects.map((r) => r.fromPath));
  for (const a of audit) {
    if (a.action === 'delete' && !moved.has(a.path) && !(await pathIsLive(a.path))) {
      moved.add(a.path);
      push(a.path, 'Trang đã xóa, chưa có chuyển hướng — nếu có trang thay thế (sản phẩm tương tự, danh mục) thì thêm chuyển hướng');
    }
  }
  return out.sort((a, b) => Number(b.level === 'error') - Number(a.level === 'error'));
}
