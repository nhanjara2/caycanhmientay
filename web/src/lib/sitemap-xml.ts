/**
 * Phần thuần của sitemap (tên file, giới hạn, dựng XML) — tách khỏi server/sitemap.ts để kiểm thử không cần database
 * (`npm run test:seo`, mục 20.1 checklist SEO). server/sitemap.ts xuất lại các hàm này.
 */

/** Video trên trang (thẻ <video:video> — Google bắt buộc ảnh thu nhỏ, tiêu đề, mô tả, link trình phát). */
export type SitemapVideo = { thumbnail: string; title: string; description: string; player: string; seconds?: number | null; published: Date };
export type SitemapEntry = { loc: string; lastmod?: Date; images?: string[]; videos?: SitemapVideo[] };

/** Google cho tối đa 50.000 URL / 50MB mỗi file; mỗi sản phẩm kèm tới 10 ảnh nên chia nhỏ hơn nhiều cho chắc. */
export const SITEMAP_MAX_URLS = 10_000;

/** Các sitemap con, theo thứ tự trong file chỉ mục. */
export const SITEMAP_KIND_NAMES = ['trang', 'san-pham', 'benh-cay', 'bai-viet', 'cong-trinh'] as const;
export type SitemapKind = (typeof SITEMAP_KIND_NAMES)[number];

/** "san-pham-2.xml" → { kind: 'san-pham', page: 2 }; tên lạ → null (404). */
export function parseSitemapName(name: string): { kind: SitemapKind; page: number } | null {
  const m = /^([a-z-]+?)(?:-(\d+))?\.xml$/.exec(name);
  if (!m || !(SITEMAP_KIND_NAMES as readonly string[]).includes(m[1])) return null;
  const page = m[2] ? Number(m[2]) : 1;
  return page >= 2 || !m[2] ? { kind: m[1] as SitemapKind, page } : null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');

export function urlsetXml(entries: SitemapEntry[]) {
  const body = entries.map((e) => [
    '<url>',
    `<loc>${esc(e.loc)}</loc>`,
    e.lastmod ? `<lastmod>${iso(e.lastmod)}</lastmod>` : '',
    ...(e.images ?? []).slice(0, 1000).map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`),
    ...(e.videos ?? []).map(videoXml),
    '</url>',
  ].join('')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${body}\n</urlset>\n`;
}

/** Một <video:video>: tiêu đề ≤ 100 ký tự, mô tả ≤ 2048, thời lượng 1–28800 giây (giới hạn của Google). */
function videoXml(v: SitemapVideo) {
  return [
    '<video:video>',
    `<video:thumbnail_loc>${esc(v.thumbnail)}</video:thumbnail_loc>`,
    `<video:title>${esc(v.title.slice(0, 100))}</video:title>`,
    `<video:description>${esc(v.description.slice(0, 2048))}</video:description>`,
    `<video:player_loc>${esc(v.player)}</video:player_loc>`,
    v.seconds && v.seconds >= 1 && v.seconds <= 28_800 ? `<video:duration>${Math.round(v.seconds)}</video:duration>` : '',
    `<video:publication_date>${iso(v.published)}</video:publication_date>`,
    '</video:video>',
  ].join('');
}

export function indexXml(items: { loc: string; lastmod?: Date }[]) {
  const body = items.map((i) => `<sitemap><loc>${esc(i.loc)}</loc>${i.lastmod ? `<lastmod>${iso(i.lastmod)}</lastmod>` : ''}</sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

