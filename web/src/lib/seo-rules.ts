import type { Metadata } from 'next';
import { sitePath } from './seo-cms';

/**
 * Luật SEO dạng hàm thuần (không database, không Next) — để kiểm thử tự động (`npm run test:seo`, mục 20.1 checklist SEO).
 * Trang và server dùng đúng các hàm này, nên kiểm thử ở đây là kiểm luật thật của web.
 */

/** Trang được Google đọc link nhưng không đưa vào kết quả: trang trống, trang lọc / sắp xếp, trang chưa đủ nội dung. */
export const NOINDEX_FOLLOW = { index: false, follow: true } as const;

/** robots của một trang danh sách: một điều kiện đúng (trống, đang lọc, quá mỏng…) là noindex, follow; không thì để mặc định (index). */
export const listingRobots = (...noindexIf: boolean[]): Metadata['robots'] => (noindexIf.some(Boolean) ? NOINDEX_FOLLOW : undefined);

/** Canonical của metadata thành đường dẫn trong web ("/san-pham/x", giữ ?tham số); không có / web khác → null. */
export function canonicalOf(meta: Metadata): string | null {
  const c = meta.alternates?.canonical;
  const url = typeof c === 'string' ? c : c instanceof URL ? c.toString() : c?.url?.toString();
  return url ? sitePath(url, true) : null;
}

/** Ô SEO admin đặt tay cho một đường dẫn (bảng `seo_overrides`). */
export type SeoOverrideFields = { title: string | null; description: string | null; noindex: boolean; canonical: string | null; image: string | null };

/**
 * Áp SEO đặt tay lên metadata web tự tạo. `base` = trang gốc (không ?tham số): tiêu đề / mô tả / canonical / ảnh chỉ áp
 * cho trang gốc (trang 2, 3… giữ "· Trang n"); noindex áp cả biến thể. Không bao giờ BẬT index cho trang tự noindex theo luật.
 */
export function applySeoOverride(meta: Metadata, o: SeoOverrideFields | null, base: boolean): Metadata {
  if (!o) return meta;
  const out: Metadata = { ...meta };
  if (base && o.title) out.title = { absolute: o.title };
  if (base && o.description) out.description = o.description;
  if (o.noindex) out.robots = NOINDEX_FOLLOW;
  if (base && o.canonical) out.alternates = { ...meta.alternates, canonical: o.canonical };
  if (base && meta.openGraph && (o.canonical || o.image)) {
    out.openGraph = { ...meta.openGraph, ...(o.canonical ? { url: o.canonical } : {}), ...(o.image ? { images: [{ url: o.image }] } : {}) };
  }
  return out;
}

/** Số bước chuyển hướng tối đa máy chủ tự đi tiếp (A → B → C…) trước khi trả một bước 308 cho khách. */
export const MAX_REDIRECT_HOPS = 3;

/**
 * Đích cuối của một đường dẫn đã mất nội dung. `direct(p)` = đích ghi trong bảng chuyển hướng của p; `isLive(p)` = p đang
 * có nội dung. Đích còn hiện thì dừng ở đó; đích đã gỡ mà có chuyển hướng riêng thì đi tiếp; gặp vòng lặp thì dừng.
 */
export async function resolveRedirect(
  path: string, direct: (p: string) => Promise<string | null> | string | null, isLive: (p: string) => Promise<boolean> | boolean,
): Promise<string | null> {
  let to = await direct(path);
  const seen = new Set([path]);
  for (let hop = 0; to && hop < MAX_REDIRECT_HOPS; hop++) {
    seen.add(to);
    const next = await direct(to);
    if (!next || seen.has(next) || (await isLive(to))) break;
    to = next;
  }
  return to;
}

/** Trạng thái nội dung với khách: 'live' = 200 + index; 'thin' = 200 + noindex, follow; 'gone' = 404 (hoặc 308 nếu có chuyển hướng). */
export type ContentState = 'live' | 'thin' | 'gone';

/**
 * Một trang nội dung (sản phẩm, bài, bệnh cây, công trình) với khách thường: chưa đăng / đang ẩn / lên lịch → gone;
 * đang hiện nhưng chưa đủ nội dung → thin. `preview` (nhân viên mở ?xem-truoc=1) vẫn xem được nhưng luôn noindex — xử lý ở trang.
 */
export function contentState(c: { visible: boolean; publishedAt?: Date | string | null; hasDetail?: boolean }, now = Date.now()): ContentState {
  if (!c.visible) return 'gone';
  if (c.publishedAt && new Date(c.publishedAt).getTime() > now) return 'gone';
  return c.hasDetail === false ? 'thin' : 'live';
}

/** robots theo trạng thái nội dung (trang 'gone' không tới được đây trừ khi xem trước). */
export const contentRobots = (s: ContentState): Metadata['robots'] =>
  s === 'live' ? undefined : s === 'thin' ? NOINDEX_FOLLOW : { index: false };
