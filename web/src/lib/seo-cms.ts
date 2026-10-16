// SEO trong admin (mục 14 checklist SEO) — phần dùng chung trình duyệt + server: giới hạn, kiểm tra đường dẫn, quyền theo loại trang.
// Dữ liệu: bảng `seo_overrides` (tiêu đề / mô tả / noindex / canonical / ảnh chia sẻ đặt tay theo đường dẫn),
// `redirects` (chuyển hướng 308 khi đổi đường dẫn / gỡ trang), `seo_audit` (nhật ký). Code server ở `server/seo-cms.ts`.
import { canonicalPath } from './slug';
import { SITE_ORIGIN } from './site';

export const SEO_TITLE_MAX = 70;
export const SEO_DESC_MAX = 170;
/** Dưới mức này chỉ cảnh báo (Google tự viết lại mô tả quá ngắn). */
export const SEO_TITLE_MIN = 15;
export const SEO_DESC_MIN = 50;

/** Một dòng thay đổi trong nhật ký SEO. */
export type SeoChange = { field: string; from: string | null; to: string | null };

/** Tên trường hiện trong nhật ký / Excel. */
export const SEO_FIELD_LABEL: Record<string, string> = {
  title: 'Tiêu đề Google', description: 'Mô tả Google', noindex: 'Ẩn khỏi Google (noindex)', canonical: 'Đường dẫn chuẩn (canonical)',
  image: 'Ảnh chia sẻ', slug: 'Đường dẫn', redirect: 'Chuyển hướng',
};

export const SEO_ACTION_LABEL: Record<string, string> = {
  override: 'Sửa SEO trang', 'redirect-add': 'Thêm chuyển hướng', 'redirect-edit': 'Sửa chuyển hướng', 'redirect-delete': 'Xóa chuyển hướng',
  slug: 'Đổi đường dẫn', delete: 'Xóa trang',
};

/**
 * Chuyển hướng chỉ có tác dụng ở các trang nội dung có thể bị gỡ / đổi đường dẫn: trang đó tra bảng `redirects`
 * khi không còn nội dung (thay cho 404) — trang đang hiện thì nội dung luôn thắng, không bao giờ bị chuyển đi.
 */
export const REDIRECT_PREFIXES = ['/san-pham/', '/danh-muc/', '/goc-cham-cay/', '/tin-tuc/', '/benh-cay/', '/doi-tac/cong-trinh/'] as const;
export const redirectable = (path: string) => REDIRECT_PREFIXES.some((p) => path.startsWith(p) && path.length > p.length);

/**
 * Đường dẫn trong web từ chữ admin gõ: "/san-pham/kim-tien", "san-pham/kim-tien/",
 * "https://www.caycanhmientay.com/san-pham/kim-tien?utm=…" → "/san-pham/kim-tien" (bỏ tham số, chuẩn hóa như proxy).
 * Link sang web khác / không chuẩn hóa được → null.
 */
export function sitePath(input: string, keepQuery = false): string | null {
  let s = input.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const host = u.hostname.replace(/^www\./, '');
      if (host !== new URL(SITE_ORIGIN).hostname.replace(/^www\./, '')) return null;
      s = u.pathname + (keepQuery ? u.search : '');
    } catch {
      return null;
    }
  }
  if (!s.startsWith('/')) s = `/${s}`;
  const [pathname, query] = s.split(/[?#]/, 2);
  if (pathname === '/' || pathname === '') return keepQuery && query ? `/?${query}` : '/';
  const clean = canonicalPath(pathname);
  if (!clean) return null;
  return keepQuery && query && s.includes('?') ? `${clean}?${query}` : clean;
}

/** Ảnh chia sẻ đặt tay: chỉ ảnh công khai trên chính web (ảnh database hoặc /images tĩnh). */
export const isShareImage = (url: string) => /^\/(api\/[a-z-]+-images\/[a-z0-9._-]+|images\/[a-z0-9/._-]+\.(jpe?g|png|webp))$/i.test(url);

/** Loại trang theo đường dẫn — quyết định ai được sửa tiêu đề / mô tả (noindex, canonical, chuyển hướng: chỉ Quản lý). */
export function seoKindOf(path: string): { kind: string; area: 'products' | 'content' | 'settings' } {
  if (path.startsWith('/san-pham/')) return { kind: 'Sản phẩm', area: 'products' };
  if (path === '/danh-muc' || path.startsWith('/danh-muc/')) return { kind: 'Danh mục', area: 'products' };
  if (path.startsWith('/goc-cham-cay') || path.startsWith('/tin-tuc') || path === '/video') return { kind: 'Bài viết', area: 'content' };
  if (path.startsWith('/benh-cay')) return { kind: 'Bệnh cây', area: 'content' };
  if (path.startsWith('/doi-tac/cong-trinh/')) return { kind: 'Công trình', area: 'content' };
  if (path.startsWith('/chinh-sach/')) return { kind: 'Chính sách', area: 'settings' };
  return { kind: 'Trang chung', area: 'settings' };
}

/** Cảnh báo độ dài (không chặn lưu). */
export function lengthHint(kind: 'title' | 'description', s: string) {
  const n = s.trim().length;
  if (!n) return null;
  const [min, max] = kind === 'title' ? [SEO_TITLE_MIN, SEO_TITLE_MAX] : [SEO_DESC_MIN, SEO_DESC_MAX];
  if (n < min) return `Hơi ngắn (nên từ ${min} ký tự)`;
  if (n > max) return `Dài quá ${max} ký tự — Google sẽ cắt bớt`;
  return null;
}

const VN_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const vnParts = (d: Date | string) => Object.fromEntries(VN_PARTS.formatToParts(new Date(d)).map((p) => [p.type, p.value]));

/** "16/10/2026" theo giờ Việt Nam. */
export const seoDate = (d: Date | string) => { const p = vnParts(d); return `${p.day}/${p.month}/${p.year}`; };
/** "16/10/2026 14:05" theo giờ Việt Nam. */
export const seoTime = (d: Date | string) => { const p = vnParts(d); return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`; };

/** Một dòng nhật ký thành chữ: "Sửa SEO trang: Tiêu đề Google: (trống) → Cây kim tiền…". */
export function auditText(action: string, detail: SeoChange[]) {
  const head = SEO_ACTION_LABEL[action] ?? action;
  if (!detail.length) return head;
  const one = (c: SeoChange) => `${SEO_FIELD_LABEL[c.field] ?? c.field}: ${c.from ?? '(trống)'} → ${c.to ?? '(trống)'}`;
  return `${head} — ${detail.map(one).join('; ')}`;
}
