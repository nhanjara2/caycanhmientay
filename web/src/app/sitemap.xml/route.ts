import { indexXml, sitemapIndex, xmlResponse } from '@/server/sitemap';

/** /sitemap.xml — file chỉ mục, trỏ tới các sitemap con theo loại nội dung (server/sitemap.ts). Khai trong robots.txt. */
export async function GET() {
  return xmlResponse(indexXml(await sitemapIndex()));
}
