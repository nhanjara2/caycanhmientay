import { NextResponse, type NextRequest } from 'next/server';

// Kiểm tra sơ bộ: chưa có cookie phiên thì đưa về trang đăng nhập quản trị.
// Quyền thật được kiểm tra trong layout, trang và server action (requireStaff).
export function proxy(request: NextRequest) {
  if (!request.cookies.has('ccmt_session')) {
    return NextResponse.redirect(new URL('/admin/dang-nhap', request.url));
  }
}

export const config = {
  matcher: ['/admin', '/admin/((?!dang-nhap).*)', '/nhan-vien/:path*'],
};
