import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { botOf } from '@/lib/monitor';
import { canonicalPath } from '@/lib/slug';
import { localePath, stripLang } from '@/lib/i18n';
import { monitorKey } from '@/server/monitor-key';

const STAFF = /^\/(admin|nhan-vien)(\/|$)/;
const STAFF_LOGIN = /^\/admin\/dang-nhap(\/|$)/;
/** Đường dẫn có mã đơn / mã phiếu viết hoa (DH-…, PN-…) — không đổi chữ. */
const KEEP_CASE = /^\/(tai-khoan|dat-hang-thanh-cong)(\/|$)/;

export function proxy(request: NextRequest, event: NextFetchEvent) {
  // Bản tiếng Anh dùng CHUNG trang với tiếng Việt (lib/i18n.ts): /en/a → xử lý như /a, cuối cùng viết lại về /a + header en.
  const full = request.nextUrl.pathname;
  const en = full === '/en' || full.startsWith('/en/');
  const pathname = en ? stripLang(full) : full;
  const prefix = en ? (p: string) => localePath(p, 'en') : (p: string) => p;

  // Kiểm tra sơ bộ: chưa có cookie phiên thì đưa về trang đăng nhập quản trị.
  // Quyền thật được kiểm tra trong layout, trang và server action (requireStaff).
  if (en && STAFF.test(pathname)) return NextResponse.redirect(new URL(pathname, request.url), 308);
  if (STAFF.test(pathname)) {
    if (!STAFF_LOGIN.test(pathname) && !request.cookies.has('ccmt_session')) {
      return NextResponse.redirect(new URL('/admin/dang-nhap', request.url));
    }
    return;
  }
  // Giám sát SEO (mục 19): máy tìm kiếm / mạng xã hội tải trang khách → ghi một lượt (nhóm trang, đã xác minh DNS chưa) ở
  // /api/giam-sat/crawl sau khi đã trả trang (waitUntil — máy tìm kiếm không phải chờ). Người thật không ghi gì.
  const bot = botOf(request.headers.get('user-agent'));
  const key = bot && monitorKey();
  if (bot && key) {
    const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
    event.waitUntil(fetch(new URL('/api/giam-sat/crawl', request.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-monitor-key': key },
      body: JSON.stringify({ bot, ip, path: full, query: request.nextUrl.search.length > 1 }),
    }).then((r) => r.body?.cancel()).catch(() => {}));
  }

  if (KEEP_CASE.test(pathname)) return en ? rewriteEn(request, pathname) : NextResponse.next({ request: { headers: langHeaders(request, false) } });

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
    url.pathname = prefix(clean || pathname);
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
  const res = en ? rewriteEn(request, pathname) : NextResponse.next({ request: { headers: langHeaders(request, false) } });
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').toLowerCase();
  if (host.endsWith('.vercel.app') || params.has('xem-truoc')) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

/** Luôn ghi đè x-ccmt-lang (khách tự gửi header này cũng không đổi được ngôn ngữ). */
function langHeaders(request: NextRequest, en: boolean) {
  const h = new Headers(request.headers);
  if (en) h.set('x-ccmt-lang', 'en');
  else h.delete('x-ccmt-lang');
  return h;
}

function rewriteEn(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url, { request: { headers: langHeaders(request, true) } });
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
