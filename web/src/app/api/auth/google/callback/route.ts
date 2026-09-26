import { NextResponse, type NextRequest } from 'next/server';
import { finishGoogleLogin } from '@/server/auth';

/** Google trả về đây. Đã gắn → vào thẳng; chưa gắn → mở hộp đăng nhập để xác thực SĐT một lần. */
export async function GET(req: NextRequest) {
  const r = await finishGoogleLogin(req.nextUrl.origin, req.nextUrl.searchParams);
  // Trang quản trị chưa có phiên sẽ bị proxy chuyển đi, nên quay về trang đăng nhập quản trị.
  const back = /^\/(admin|nhan-vien)(\/|$)/.test(r.next) ? '/admin/dang-nhap' : r.next;
  const status = !r.ok ? r.error : r.linked ? null : 'gan-sdt';
  const to = status ? `${back}${back.includes('?') ? '&' : '?'}google=${status}` : r.next;
  return NextResponse.redirect(new URL(to, req.url));
}
