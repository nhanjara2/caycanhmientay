/**
 * Hai ngôn ngữ trên CÙNG một bộ trang (06/11/2026, chủ shop: "không tách 2 trang, dùng chung giao diện").
 * Tiếng Việt: /san-pham/kim-tien — tiếng Anh: /en/san-pham/kim-tien. src/proxy.ts viết lại /en/… về đúng trang đó
 * và gắn header `x-ccmt-lang: en`; chữ giao diện lấy từ messages/<lang>.json qua next-intl (src/i18n/request.ts).
 * Link nội bộ của web khách đi qua components/LocaleLink.tsx (tự thêm /en khi đang xem tiếng Anh).
 * Mọi trang khách có hreflang vi / en / x-default (= tiếng Việt) — gắn ở withSeo (server/seo-cms.ts) + sitemap.
 */
export type Lang = 'vi' | 'en';
export const LANGS: Lang[] = ['vi', 'en'];

export const langOfPath = (path: string): Lang => (path === '/en' || path.startsWith('/en/') ? 'en' : 'vi');

/** Đường dẫn không có /en ("/en" → "/", "/en/a" → "/a"). */
export const stripLang = (path: string) => (path === '/en' ? '/' : path.startsWith('/en/') ? path.slice(3) : path);

/** Phần không thuộc web khách — không bao giờ thêm /en. */
const NO_LANG = /^\/(admin|nhan-vien|api|_next|images|icons|videos)(\/|$)|\.[a-z0-9]+$/i;

/** Đường dẫn của trang theo ngôn ngữ ("/a?x=1#y" + en → "/en/a?x=1#y"). Link ngoài / admin / file giữ nguyên. */
export function localePath(href: string, lang: Lang): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const m = href.match(/^([^?#]*)(.*)$/)!;
  const path = stripLang(m[1] || '/');
  if (lang === 'vi' || NO_LANG.test(path)) return path + m[2];
  return (path === '/' ? '/en' : `/en${path}`) + m[2];
}

/** hreflang của một trang (đường dẫn tiếng Việt hoặc /en đều được). */
export function hreflangsOf(path: string): Record<string, string> {
  const vi = stripLang(path);
  return { vi, en: localePath(vi, 'en'), 'x-default': vi };
}

export const OG_LOCALE: Record<Lang, string> = { vi: 'vi_VN', en: 'en_US' };
