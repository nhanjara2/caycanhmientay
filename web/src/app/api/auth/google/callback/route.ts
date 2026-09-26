import { NextResponse, type NextRequest } from 'next/server';
import { finishGoogleLogin } from '@/server/auth';

/** Google trả về đây: đăng nhập xong quay lại trang cũ; lỗi thì mở lại hộp đăng nhập kèm thông báo. */
export async function GET(req: NextRequest) {
  const r = await finishGoogleLogin(req.nextUrl.origin, req.nextUrl.searchParams);
  if (r.ok) return NextResponse.redirect(new URL(r.next, req.url));
  // Trang quản trị chưa có phiên sẽ bị proxy chuyển đi, nên báo lỗi ở trang đăng nhập quản trị.
  const back = /^\/(admin|nhan-vien)(\/|$)/.test(r.next) ? '/admin/dang-nhap' : r.next;
  return NextResponse.redirect(new URL(`${back}${back.includes('?') ? '&' : '?'}google=${r.error}`, req.url));
}
