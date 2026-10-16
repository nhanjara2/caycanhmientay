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
  // Tham số lặp lại (?q=a&q=b, ?trang=2&trang=3) → giữ giá trị đầu, cùng một bước chuyển hướng: trang đọc tham số như
  // một chuỗi (lặp thì Next đưa mảng → lỗi 500) và tổ hợp lặp không sinh thêm URL trùng (mục 6 checklist SEO).
  const clean = canonicalPath(pathname);
  const params = request.nextUrl.searchParams;
  const names = [...params.keys()];
  const repeated = new Set(names).size !== names.length;
  if ((clean && clean !== pathname) || repeated) {
    const url = request.nextUrl.clone();
    if (clean) url.pathname = clean;
    if (repeated) {
      const first = new URLSearchParams();
      for (const [k, v] of params) if (!first.has(k)) first.append(k, v);
      url.search = first.toString();
    }
    return NextResponse.redirect(url, 308);
  }

  // Bản trên *.vercel.app trùng nội dung tên miền chính → noindex (canonical trong trang vẫn trỏ về tên miền chính).
  // Chỉ xét đuôi .vercel.app: lỡ đọc sai host thì tên miền chính cũng không bao giờ bị noindex.
  // Link xem trước của admin (?xem-truoc=1 — bài / dự án chưa đăng) cũng noindex ngay ở header, kể cả khi lỡ bị chia sẻ
  // ra ngoài (SEO mục 13); trang chưa đăng còn tự có meta noindex.
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').toLowerCase();
  if (host.endsWith('.vercel.app') || params.has('xem-truoc')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
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
