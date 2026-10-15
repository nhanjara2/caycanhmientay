import 'server-only';
import { connection } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { productImageUrl } from '@/lib/catalog';
import { diseaseImageUrl } from '@/lib/diseases';
import { policies } from '@/lib/policies';
import { postImageUrl, postPath, SECTIONS, sectionOf, VIDEO_PAGE } from '@/lib/posts';
import { projectImageUrl, projectPath } from '@/lib/projects';
import { absoluteUrl } from '@/lib/site';
import { canonicalPath } from '@/lib/slug';
import { db, schema } from './db';
import { publishedPosts } from './posts';

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

export type SitemapEntry = { loc: string; lastmod?: Date; images?: string[] };

/** Google cho tối đa 50.000 URL / 50MB mỗi file; mỗi sản phẩm kèm tới 10 ảnh nên chia nhỏ hơn nhiều cho chắc. */
export const SITEMAP_MAX_URLS = 10_000;

const STATIC_PAGES = ['/', '/danh-muc', '/doi-tac', '/bao-gia-si', '/tu-van-chon-cay', '/he-thong-cua-hang', '/khuyen-mai'];

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
  return [{ loc: absoluteUrl(query ? `${pathname}?${query}` : pathname), lastmod, images: images?.length ? images.map(absoluteUrl) : undefined }];
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
  return rows.map((r) => ({ ...r, images: (files.get(r.slug) ?? []).map(productImageUrl) }));
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
  return out;
}

async function diseases(): Promise<SitemapEntry[]> {
  const D = schema.diseases;
  const rows = await db.select({ slug: D.slug, symptoms: D.symptoms, updatedAt: D.updatedAt }).from(D).where(eq(D.active, true)).orderBy(asc(D.name));
  return rows.flatMap((d) => entry(`/benh-cay/${d.slug}`, d.updatedAt, d.symptoms.flatMap((s) => (s.image ? [diseaseImageUrl(s.image)] : []))));
}

async function posts(): Promise<SitemapEntry[]> {
  // Ảnh: chỉ ảnh bìa trên web mình (ảnh YouTube / TikTok nằm ở tên miền khác).
  return (await publishedPosts()).flatMap((p) => entry(postPath(p), latest([p.publishedAt, p.updatedAt]), p.coverFile ? [postImageUrl(p.coverFile)] : undefined));
}

async function projects(): Promise<SitemapEntry[]> {
  const PJ = schema.projects;
  const rows = await db.select({ slug: PJ.slug, images: PJ.images, updatedAt: PJ.updatedAt }).from(PJ).where(eq(PJ.published, true)).orderBy(asc(PJ.id));
  return rows.flatMap((p) => entry(projectPath(p.slug), p.updatedAt, p.images.map((i) => projectImageUrl(i.file))));
}

/** Các loại sitemap con: tên file /sitemaps/<key>.xml (trang thứ 2 trở đi: <key>-2.xml…). */
export const SITEMAP_KINDS = { 'trang': pages, 'san-pham': products, 'benh-cay': diseases, 'bai-viet': posts, 'cong-trinh': projects } as const;
export type SitemapKind = keyof typeof SITEMAP_KINDS;

/** "san-pham-2.xml" → { kind: 'san-pham', page: 2 }; tên lạ → null (404). */
export function parseSitemapName(name: string): { kind: SitemapKind; page: number } | null {
  const m = /^([a-z-]+?)(?:-(\d+))?\.xml$/.exec(name);
  if (!m || !(m[1] in SITEMAP_KINDS)) return null;
  const page = m[2] ? Number(m[2]) : 1;
  return page >= 2 || !m[2] ? { kind: m[1] as SitemapKind, page } : null;
}

const fileName = (kind: SitemapKind, page: number) => `${kind}${page > 1 ? `-${page}` : ''}.xml`;

export async function sitemapEntries(kind: SitemapKind, page: number) {
  await connection();
  const all = await SITEMAP_KINDS[kind]();
  return page === 1 || (page - 1) * SITEMAP_MAX_URLS < all.length ? all.slice((page - 1) * SITEMAP_MAX_URLS, page * SITEMAP_MAX_URLS) : null;
}

/** Danh sách sitemap con cho file chỉ mục — bỏ loại chưa có trang nào. */
export async function sitemapIndex() {
  await connection();
  const out: { loc: string; lastmod?: Date }[] = [];
  for (const [kind, load] of Object.entries(SITEMAP_KINDS) as [SitemapKind, () => Promise<SitemapEntry[]>][]) {
    const all = await load();
    for (let page = 1; (page - 1) * SITEMAP_MAX_URLS < all.length; page++) {
      const part = all.slice((page - 1) * SITEMAP_MAX_URLS, page * SITEMAP_MAX_URLS);
      out.push({ loc: absoluteUrl(`/sitemaps/${fileName(kind, page)}`), lastmod: latest(part.map((e) => e.lastmod)) });
    }
  }
  return out;
}

// ---- XML ----------------------------------------------------------------------------------

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');

export function urlsetXml(entries: SitemapEntry[]) {
  const body = entries.map((e) => [
    '<url>',
    `<loc>${esc(e.loc)}</loc>`,
    e.lastmod ? `<lastmod>${iso(e.lastmod)}</lastmod>` : '',
    ...(e.images ?? []).slice(0, 1000).map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`),
    '</url>',
  ].join('')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

export function indexXml(items: { loc: string; lastmod?: Date }[]) {
  const body = items.map((i) => `<sitemap><loc>${esc(i.loc)}</loc>${i.lastmod ? `<lastmod>${iso(i.lastmod)}</lastmod>` : ''}</sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

/** Trả XML: CDN giữ 10 phút (sửa nội dung là sitemap đổi trong ≤ 10 phút); bản thân file sitemap không cần lên Google. */
export const xmlResponse = (xml: string) => new Response(xml, {
  headers: {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    'X-Robots-Tag': 'noindex',
  },
});
