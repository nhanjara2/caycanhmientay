/**
 * Ảnh công khai lưu trong database (sản phẩm, bài viết, bệnh cây, dự án, banner) — quy ước dùng chung client / server.
 *
 * - Tên file trên URL: "<slug>-<mã ngẫu nhiên>.jpg" ("/api/product-images/cay-kim-tien-3fa1….jpg") để tên ảnh có nghĩa
 *   với Google Hình ảnh. Mã ngẫu nhiên vẫn là khóa thật; phần slug chỉ để đọc (máy chủ bỏ đi khi tìm ảnh) — slug không
 *   bao giờ đổi nên URL ảnh ổn định. URL cũ chỉ có mã vẫn mở được.
 * - Bản thu nhỏ: thêm "?w=<bề rộng>" (chỉ nhận số trong IMAGE_WIDTHS) → máy chủ thu nhỏ, trả WebP (trình duyệt không
 *   nhận WebP thì JPEG), CDN giữ 1 năm. URL không có "?w=" là ảnh gốc (≤ 1600px, JPEG) — dùng làm `src` dự phòng,
 *   trong sitemap ảnh và khi phóng to.
 */

import { STATIC_IMAGE_WIDTHS } from './static-images';

/** Bề rộng bản thu nhỏ được phép — số lạ trả 404 (chống tạo vô số bản cache). */
export const IMAGE_WIDTHS = [160, 320, 480, 640, 960, 1280, 1920] as const;

/** Tên file ảnh trong database: 32 ký tự hex + đuôi (khớp `isSafeName` ở server/uploads.ts). */
const FILE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

/** "/api/<kind>/<slug>-<file>" — slug trống / không hợp lệ thì chỉ còn file. */
export function imageUrl(kind: 'product-images' | 'post-images' | 'disease-images' | 'project-images' | 'banner-images', file: string, slug?: string | null) {
  const name = typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? `${slug.slice(0, 80).replace(/-+$/, '')}-${file}` : file;
  return `/api/${kind}/${name}`;
}

/** Tách mã file thật khỏi tên trên URL ("cay-kim-tien-3fa1….jpg" → "3fa1….jpg"); null = tên sai dạng. */
export function imageFileOf(name: string): string | null {
  if (FILE.test(name)) return name;
  const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([a-f0-9]{32}\.(?:jpg|png|webp))$/.exec(name);
  return m && m[1].length <= 80 ? m[2] : null;
}

const RESIZABLE = /^\/api\/(product|post|disease|project|banner)-images\/[^?]+$/;

/**
 * Thuộc tính ảnh co giãn cho <img>: `srcSet` các bản thu nhỏ ≤ `max` px + `sizes` (bề rộng hiển thị, theo cú pháp HTML).
 * Ảnh tĩnh /images có bản thu nhỏ sẵn (STATIC_IMAGE_WIDTHS) cũng có srcSet; ảnh khác (YouTube…) thì chỉ có `src`.
 */
export function responsive(src: string, sizes: string, max = 1280): { src: string; srcSet?: string; sizes?: string } {
  const fixed = STATIC_IMAGE_WIDTHS[src];
  if (fixed) {
    // Ảnh tĩnh có bản thu nhỏ sẵn (npm run images:static): số cuối là ảnh gốc — luôn có trong srcSet cho màn hình rất nét.
    const full = fixed[fixed.length - 1];
    const srcSet = [...fixed.slice(0, -1).filter((w) => w <= max).map((w) => `${staticVariant(src, w)} ${w}w`), `${src} ${full}w`].join(', ');
    return { src, srcSet, sizes };
  }
  if (!RESIZABLE.test(src)) return { src };
  const srcSet = IMAGE_WIDTHS.filter((w) => w <= max).map((w) => `${src}?w=${w} ${w}w`).join(', ');
  return { src, srcSet, sizes };
}

/** Một bản thu nhỏ cố định (ảnh nhỏ bề rộng biết trước, vd. ảnh 64px trong giỏ → w=160 cho màn hình nét). */
export function thumbUrl(src: string, w: (typeof IMAGE_WIDTHS)[number] = 320): string {
  if (RESIZABLE.test(src)) return `${src}?w=${w}`;
  // Ảnh tĩnh: bản thu nhỏ sẵn nhỏ nhất mà vẫn ≥ w (không có thì ảnh gốc).
  const fixed = STATIC_IMAGE_WIDTHS[src]?.slice(0, -1).find((x) => x >= w);
  return fixed ? staticVariant(src, fixed) : src;
}

/** "/images/banner/x.webp" → "/images/banner/x-w640.webp" (tên do scripts/resize-static-images.mts đặt). */
const staticVariant = (src: string, w: number) => src.replace(/\.[^./]+$/, `-w${w}.webp`);
