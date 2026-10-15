import { NextResponse, type NextRequest } from 'next/server';
import { canonicalPath } from '@/lib/slug';

const STAFF = /^\/(admin|nhan-vien)(\/|$)/;
const STAFF_LOGIN = /^\/admin\/dang-nhap(\/|$)/;
/** Đường dẫn có mã đơn / mã phiếu viết hoa (DH-…, PN-…) — không đổi chữ. */
const KEEP_CASE = /^\/(tai-khoan|dat-hang-thanh-cong)(\/|$)/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kiểm tra sơ bộ: chưa có cookie phiên thì đưa về trang đăng nhập quản trị.
  // Quyền thật được kiểm tra trong layout, trang và server action (requireStaff).
  if (STAFF.test(pathname)) {
    if (!STAFF_LOGIN.test(pathname) && !request.cookies.has('ccmt_session')) {
      return NextResponse.redirect(new URL('/admin/dang-nhap', request.url));
    }
    return;
  }
  if (KEEP_CASE.test(pathname)) return;

  // SEO: mỗi trang chỉ một đường dẫn — "/San-Pham/Kim%20Tiền" chuyển hẳn (308) về "/san-pham/kim-tien" (giữ ?tham số).
  // Dấu "/" cuối và "//" do Next / Vercel tự chuyển trước khi tới đây.
  const clean = canonicalPath(pathname);
  if (clean && clean !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = clean;
    return NextResponse.redirect(url, 308);
  }
}

export const config = {
  matcher: [
    '/admin',
    '/admin/((?!dang-nhap).*)',
    '/nhan-vien/:path*',
    // Trang khách: bỏ file tĩnh (có dấu chấm), /api và đường dẫn nội bộ của Next (bắt đầu bằng "_").
    '/((?!_|api/)[^.]*)',
  ],
};
