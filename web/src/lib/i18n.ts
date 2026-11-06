/**
 * Bản tiếng Anh (SEO quốc tế, 06/11/2026). Web vẫn tiếng Việt là chính; bản tiếng Anh nằm dưới /en, chỉ những trang đã
 * viết tay tiếng Anh mới có (không dịch máy, không tạo trang rỗng).
 *
 * `LANG_PAIRS` là chỗ DUY NHẤT khai cặp trang tương đương — từ đây sinh ra hreflang trong <head> (withShare ở lib/seo.ts),
 * xhtml:link trong sitemap (server/sitemap.ts) và nút chuyển VI / EN. Thêm trang tiếng Anh mới: tạo trang dưới app/en,
 * thêm một dòng ở đây (+ vào STATIC_PAGES của sitemap nếu là trang tĩnh).
 */
export type Lang = 'vi' | 'en';

export const LANG_PAIRS: { vi: string; en: string }[] = [
  { vi: '/', en: '/en' },
  { vi: '/chinh-sach/gioi-thieu', en: '/en/about' },
  { vi: '/bao-gia-si', en: '/en/wholesale' },
];

export const langOfPath = (path: string): Lang => (path === '/en' || path.startsWith('/en/') ? 'en' : 'vi');

/** Cặp trang chứa đường dẫn này (không có → trang chỉ một ngôn ngữ, không hreflang). */
export const pairOf = (path: string) => LANG_PAIRS.find((p) => p.vi === path || p.en === path);

/** Bảng hreflang cho trang có cặp: vi, en và x-default (= bản tiếng Việt, thị trường chính). */
export function hreflangsOf(path: string): Record<string, string> | undefined {
  const p = pairOf(path);
  return p ? { vi: p.vi, en: p.en, 'x-default': p.vi } : undefined;
}

export const OG_LOCALE: Record<Lang, string> = { vi: 'vi_VN', en: 'en_US' };
