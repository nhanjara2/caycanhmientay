import { megaMenuData } from '@/server/mega-menu';

/**
 * Bảng xổ của thanh danh mục ở đầu trang: sản phẩm bán chạy theo danh mục / nhóm con.
 * Công khai, giống nhau cho mọi khách → cho CDN giữ 2 phút (admin ẩn / sửa sản phẩm thì tối đa ~2 phút sau menu mới đổi).
 */
export async function GET() {
  return Response.json(await megaMenuData(), {
    headers: { 'cache-control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600' },
  });
}
