import { plainText, postPath, categoryOf } from '@/lib/posts';
import { absoluteUrl } from '@/lib/site';
import { publishedPosts } from '@/server/posts';
import { sitemapExcluded } from '@/server/seo-cms';

/** /rss.xml — 50 bài viết / video mới nhất (Góc chăm cây + Truyền thông) cho máy đọc tin, Bing / máy AI theo dõi bài mới. */
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export async function GET() {
  const [posts, excluded] = await Promise.all([publishedPosts(), sitemapExcluded()]);
  const items = posts.filter((p) => !excluded.has(postPath(p))).slice(0, 50).map((p) => {
    const url = absoluteUrl(postPath(p));
    const img = p.thumb ? absoluteUrl(p.thumb) : null;
    return [
      '<item>',
      `<title>${esc(p.title)}</title>`,
      `<link>${esc(url)}</link>`,
      `<guid isPermaLink="true">${esc(url)}</guid>`,
      `<pubDate>${p.publishedAt.toUTCString()}</pubDate>`,
      categoryOf(p.category) ? `<category>${esc(categoryOf(p.category)!.name)}</category>` : '',
      `<description>${esc(plainText(p.excerpt) || p.title)}</description>`,
      img ? `<enclosure url="${esc(img)}" type="image/jpeg" length="0"/>` : '',
      '</item>',
    ].filter(Boolean).join('');
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Cây Cảnh Miền Tây — Góc chăm cây</title>
<link>${absoluteUrl('/goc-cham-cay')}</link>
<atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml"/>
<description>Hướng dẫn chọn cây, chăm sóc, bắt bệnh cây và tin tức từ vườn Cây Cảnh Miền Tây (Sa Đéc, Đồng Tháp).</description>
<language>vi</language>
${posts[0] ? `<lastBuildDate>${posts[0].publishedAt.toUTCString()}</lastBuildDate>` : ''}
${items.join('\n')}
</channel></rss>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
      'X-Robots-Tag': 'noindex',
    },
  });
}
