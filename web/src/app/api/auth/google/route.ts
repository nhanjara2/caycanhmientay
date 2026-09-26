import { NextResponse, type NextRequest } from 'next/server';
import { googleEnabled, safeNext, startGoogleLogin } from '@/server/auth';

/** Bấm "Tiếp tục với Google" → chuyển sang trang chọn tài khoản của Google. */
export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get('next'));
  if (!googleEnabled()) return NextResponse.redirect(new URL(`${next}${next.includes('?') ? '&' : '?'}google=chua-bat`, req.url));
  return NextResponse.redirect(await startGoogleLogin(req.nextUrl.origin, next));
}
