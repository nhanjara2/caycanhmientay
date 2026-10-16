import { merchantFeedXml } from '@/server/merchant-feed';

/**
 * /google-merchant.xml — file dữ liệu sản phẩm cho Google Merchant Center (server/merchant-feed.ts). Không nằm trong sitemap,
 * không cần index (X-Robots-Tag noindex); CDN giữ 1 giờ — Google tải lại mỗi ngày nên đổi giá / tồn trên web là file đổi theo.
 * Database hỏng → 500 (Merchant Center giữ bản lần trước, không xóa sản phẩm).
 */
export async function GET() {
  return new Response(await merchantFeedXml(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex',
    },
  });
}
