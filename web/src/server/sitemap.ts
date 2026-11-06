import 'server-only';
import { hreflangsOf } from '@/lib/i18n';
import { TREE_GUIDES, treeGuidePath } from '@/lib/tree-guides';
import { connection } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { productImageUrl } from '@/lib/catalog';
import { diseaseImageUrl } from '@/lib/diseases';
import { policies } from '@/lib/policies';
import { postImageUrl, postPath, SECTIONS, sectionOf, tiktokPlayer, VIDEO_PAGE, youtubeEmbed } from '@/lib/posts';
import { hasProjectDetail, projectImageUrl, projectPath } from '@/lib/projects';
import { absoluteUrl } from '@/lib/site';
import { canonicalPath } from '@/lib/slug';
import { SITEMAP_KIND_NAMES, SITEMAP_MAX_URLS, type SitemapEntry, type SitemapKind } from '@/lib/sitemap-xml';
import { db, schema } from './db';
import { publishedPosts } from './posts';
import { sitemapExcluded } from './seo-cms';

export { indexXml, parseSitemapName, SITEMAP_MAX_URLS, urlsetXml, type SitemapEntry, type SitemapKind, type SitemapVideo } from '@/lib/sitemap-xml';

/**
 * Sitemap XML (mục 1.5 checklist SEO): /sitemap.xml là file CHỈ MỤC, trỏ tới từng sitemap con theo loại nội dung
 * ở /sitemaps/<loại>.xml. Đọc thẳng database mỗi lần tải (CDN giữ vài phút) nên thêm / sửa / ẩn / xóa là tự cập nhật.
 *
 * CHỈ đưa trang được index và đúng canonical — luật phải khớp metadata của từng trang:
 * sản phẩm / bệnh / dự án đang hiện, bài đã đăng; danh mục, nhóm con, chuyên mục bài viết chỉ khi có nội dung
 * (trang trống đang noindex); KHÔNG có /flash-sale, /cay-tet (giao diện mẫu, noindex), trang lọc / sắp xếp / tìm kiếm,
 * phân trang ?trang=, /video?v=, giỏ, thanh toán, tài khoản. Thêm trang công khai mới → thêm vào `STATIC_PAGES` hoặc một nhóm dưới.
 *
 * lastmod chỉ ghi khi có ngày sửa thật (products.updated_at, diseases / posts / projects.updated_at, ngày cập nhật của
 * trang chính sách); trang không có ngày thật (trang chủ, trang giới thiệu dịch vụ…) thì bỏ trống — không ghi ngày deploy.
 */

const STATIC_PAGES = ['/', '/danh-muc', '/doi-tac', '/bao-gia-si', '/tu-van-chon-cay', '/bang-chon-cay', '/he-thong-cua-hang', '/khuyen-mai'];

const latest = (dates: (Date | undefined)[]) =>
  dates.reduce<Date | undefined>((a, d) => (d && (!a || d > a) ? d : a), undefined);

/** "13/10/2026" → Date (0h giờ Việt Nam). */
const vnDate = (s: string) => {
  const [d, m, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - 7 * 3_600_000);
};

/** Ghép URL tuyệt đối; bỏ đường dẫn không chuẩn (proxy sẽ chuyển hướng 308 → không được nằm trong sitemap). */
function entry(path: string, lastmod?: Date, images?: string[]): SitemapEntry[] {
  const [pathname, query] = path.split('?');
  if (pathname !== '/' && canonicalPath(pathname) !== pathname) return [];
  const imgs = images?.length ? images.map(absoluteUrl) : undefined;
  if (query) return [{ loc: absoluteUrl(`${pathname}?${query}`), lastmod, images: imgs }];
  // Mỗi trang có bản tiếng Anh /en/… (cùng trang, lib/i18n.ts) — liệt kê cả hai, mỗi bản trỏ qua lại bằng xhtml:link.
  const langs = hreflangsOf(pathname);
  const alternates = Object.fromEntries(Object.entries(langs).map(([l, h]) => [l, absoluteUrl(h)]));
  return [
    { loc: absoluteUrl(pathname), lastmod, images: imgs, alternates },
    { loc: absoluteUrl(langs.en), lastmod, alternates },
  ];
}

// ---- Dữ liệu ----------------------------------------------------------------------------------

async function productRows() {
  const P = schema.products, I = schema.productImages;
  const [rows, imgs] = await Promise.all([
    db.select({ slug: P.slug, category: P.category, sub: P.sub, extraSubs: P.extraSubs, updatedAt: P.updatedAt })
      .from(P).where(eq(P.active, true)).orderBy(asc(P.createdAt), asc(P.slug)),
    db.select({ slug: I.productSlug, file: I.file }).from(I).orderBy(asc(I.idx), asc(I.id)),
  ]);
  const files = new Map<string, string[]>();
  for (const i of imgs) files.set(i.slug, [...(files.get(i.slug) ?? []), i.file]);
  return rows.map((r) => ({ ...r, images: (files.get(r.slug) ?? []).map((f) => productImageUrl(f, r.slug)) }));
}

async function products(): Promise<SitemapEntry[]> {
  return (await productRows()).flatMap((p) => entry(`/san-pham/${p.slug}`, p.updatedAt, p.images));
}

/** Trang tĩnh + chính sách + danh mục / nhóm con có hàng + trang danh sách bài, bệnh, video (khi có nội dung). */
async function pages(): Promise<SitemapEntry[]> {
  const C = schema.categories, S = schema.subcategories, D = schema.diseases;
  const [prods, cats, subs, diseases, posts] = await Promise.all([
    productRows(),
    db.select({ slug: C.slug }).from(C).orderBy(asc(C.sort)),
    db.select({ cat: S.categorySlug, slug: S.slug }).from(S).orderBy(asc(S.sort)),
    db.select({ updatedAt: D.updatedAt }).from(D).where(eq(D.active, true)),
    publishedPosts(),
  ]);
  const out = STATIC_PAGES.flatMap((p) => entry(p, p === '/danh-muc' ? latest(prods.map((x) => x.updatedAt)) : undefined));

  for (const c of cats) {
    const inCat = prods.filter((p) => p.category === c.slug);
    if (!inCat.length) continue; // danh mục trống đang noindex
    out.push(...entry(`/danh-muc/${c.slug}`, latest(inCat.map((p) => p.updatedAt))));
    for (const s of subs.filter((x) => x.cat === c.slug)) {
      const inSub = inCat.filter((p) => p.sub === s.slug || p.extraSubs.includes(s.slug));
      if (inSub.length) out.push(...entry(`/danh-muc/${c.slug}/${s.slug}`, latest(inSub.map((p) => p.updatedAt))));
    }
  }

  if (diseases.length) out.push(...entry('/benh-cay', latest(diseases.map((d) => d.updatedAt))));

  const changed = (p: (typeof posts)[number]) => latest([p.publishedAt, p.updatedAt]);
  for (const sec of ['blog', 'news'] as const) {
    const inSec = posts.filter((p) => sectionOf(p.category) === sec);
    if (!inSec.length) continue;
    const base = SECTIONS[sec].path;
    out.push(...entry(base, latest(inSec.map(changed))));
    // Trang từng chuyên mục (?chuyen-muc=…) có canonical riêng, được index khi có bài.
    for (const cat of [...new Set(inSec.map((p) => p.category))]) {
      out.push(...entry(`${base}?chuyen-muc=${encodeURIComponent(cat)}`, latest(inSec.filter((p) => p.category === cat).map(changed))));
    }
  }
  const videos = posts.filter((p) => p.kind === 'video' && (p.youtubeId || p.tiktokId));
  if (videos.length) out.push(...entry(VIDEO_PAGE, latest(videos.map(changed))));

  out.push(...policies.flatMap((p) => entry(`/chinh-sach/${p.slug}`, vnDate(p.updated))));
  out.push(...TREE_GUIDES.flatMap((g) => entry(treeGuidePath(g.slug), vnDate(g.updated))));
  return out;
}

async function diseases(): Promise<SitemapEntry[]> {
  const D = schema.diseases;
  const rows = await db.select({ slug: D.slug, symptoms: D.symptoms, updatedAt: D.updatedAt }).from(D).where(eq(D.active, true)).orderBy(asc(D.name));
  return rows.flatMap((d) => entry(`/benh-cay/${d.slug}`, d.updatedAt, d.symptoms.flatMap((s) => (s.image ? [diseaseImageUrl(s.image, d.slug)] : []))));
}

async function posts(): Promise<SitemapEntry[]> {
  // Ảnh: chỉ ảnh bìa trên web mình (ảnh YouTube / TikTok nằm ở tên miền khác).
  // Video: bài video có ảnh thu nhỏ (YouTube luôn có; TikTok chỉ khi đã có ảnh bìa — TikTok không có link ảnh cố định).
  return (await publishedPosts()).flatMap((p) => entry(postPath(p), latest([p.publishedAt, p.updatedAt]), p.coverFile ? [postImageUrl(p.coverFile, p.slug)] : undefined)
    .map((e) => {
      const player = p.kind !== 'video' ? null : p.tiktokId ? tiktokPlayer(p.tiktokId) : p.youtubeId ? youtubeEmbed(p.youtubeId) : null;
      if (!player || !p.thumb) return e;
      return { ...e, videos: [{ thumbnail: absoluteUrl(p.thumb), title: p.title, description: p.excerpt || p.title, player, seconds: p.videoSeconds, published: p.publishedAt }] };
    }));
}

async function projects(): Promise<SitemapEntry[]> {
  const PJ = schema.projects;
  const rows = await db.select({ slug: PJ.slug, images: PJ.images, body: PJ.body, scope: PJ.scope, quote: PJ.quote, updatedAt: PJ.updatedAt }).from(PJ).where(eq(PJ.published, true)).orderBy(asc(PJ.id));
  // Dự án chỉ có tên (chưa ảnh / mô tả / hạng mục / ý kiến khách): trang mỏng, noindex, không link từ /doi-tac → không vào sitemap.
  return rows.filter(hasProjectDetail).flatMap((p) => entry(projectPath(p.slug), p.updatedAt, p.images.map((i) => projectImageUrl(i.file, p.slug))));
}

/** Các loại sitemap con: tên file /sitemaps/<key>.xml (trang thứ 2 trở đi: <key>-2.xml…). */
export const SITEMAP_KINDS: Record<SitemapKind, () => Promise<SitemapEntry[]>> = { 'trang': pages, 'san-pham': products, 'benh-cay': diseases, 'bai-viet': posts, 'cong-trinh': projects };

const fileName = (kind: SitemapKind, page: number) => `${kind}${page > 1 ? `-${page}` : ''}.xml`;

/**
 * Trang của một loại, bỏ trang admin đặt tay "Ẩn khỏi Google" hoặc canonical trỏ trang khác (SEO mục 14 —
 * `seo_overrides`): sitemap chỉ chứa trang được index + tự trỏ canonical chính nó.
 */
async function load(kind: SitemapKind, excluded: Set<string>) {
  const all = await SITEMAP_KINDS[kind]();
  if (!excluded.size) return all;
  return all.filter((e) => {
    const u = new URL(e.loc);
    return u.search || !excluded.has(u.pathname);
  });
}

export async function sitemapEntries(kind: SitemapKind, page: number) {
  await connection();
  const all = await load(kind, await sitemapExcluded());
  return page === 1 || (page - 1) * SITEMAP_MAX_URLS < all.length ? all.slice((page - 1) * SITEMAP_MAX_URLS, page * SITEMAP_MAX_URLS) : null;
}

/** Danh sách sitemap con cho file chỉ mục — bỏ loại chưa có trang nào. */
export async function sitemapIndex() {
  await connection();
  const out: { loc: string; lastmod?: Date }[] = [];
  const excluded = await sitemapExcluded();
  for (const kind of SITEMAP_KIND_NAMES) {
    const all = await load(kind, excluded);
    for (let page = 1; (page - 1) * SITEMAP_MAX_URLS < all.length; page++) {
      const part = all.slice((page - 1) * SITEMAP_MAX_URLS, page * SITEMAP_MAX_URLS);
      out.push({ loc: absoluteUrl(`/sitemaps/${fileName(kind, page)}`), lastmod: latest(part.map((e) => e.lastmod)) });
    }
  }
  return out;
}

/** Trả XML: CDN giữ 10 phút (sửa nội dung là sitemap đổi trong ≤ 10 phút); bản thân file sitemap không cần lên Google. */
export const xmlResponse = (xml: string) => new Response(xml, {
  headers: {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    'X-Robots-Tag': 'noindex',
  },
});
