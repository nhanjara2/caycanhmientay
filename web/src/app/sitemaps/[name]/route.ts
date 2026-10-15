import { parseSitemapName, sitemapEntries, urlsetXml, xmlResponse } from '@/server/sitemap';

/** /sitemaps/<loại>.xml — sitemap con: trang, san-pham, benh-cay, bai-viet, cong-trinh (server/sitemap.ts). */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const parsed = parseSitemapName((await ctx.params).name);
  const entries = parsed && (await sitemapEntries(parsed.kind, parsed.page));
  if (!entries) return new Response('Không tìm thấy sitemap', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return xmlResponse(urlsetXml(entries));
}
