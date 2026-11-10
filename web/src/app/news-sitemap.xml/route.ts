import { categoryOf, postPath } from '@/lib/posts';
import { absoluteUrl } from '@/lib/site';
import { publishedPosts } from '@/server/posts';
import { sitemapExcluded } from '@/server/seo-cms';

/**
 * /news-sitemap.xml — Google News sitemap: chỉ bài chuyên mục Truyền thông (/tin-tuc) đăng trong 2 ngày gần nhất
 * (luật của Google), tối đa 1000 bài. Không có bài thì trả urlset rỗng (hợp lệ). Khai trong robots.txt.
 */
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
const TWO_DAYS = 2 * 24 * 3600 * 1000;

export async function GET() {
  const [posts, excluded] = await Promise.all([publishedPosts(), sitemapExcluded()]);
  const since = Date.now() - TWO_DAYS;
  const urls = posts
    .filter((p) => categoryOf(p.category)?.section === 'news' && p.publishedAt.getTime() >= since && !excluded.has(postPath(p)))
    .slice(0, 1000)
    .map((p) => `<url><loc>${esc(absoluteUrl(postPath(p)))}</loc><news:news><news:publication><news:name>Cây Cảnh Miền Tây</news:name><news:language>vi</news:language></news:publication><news:publication_date>${p.publishedAt.toISOString()}</news:publication_date><news:title>${esc(p.title)}</news:title></news:news></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join('\n')}
</urlset>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
      'X-Robots-Tag': 'noindex',
    },
  });
}
