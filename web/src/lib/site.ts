/**
 * Địa chỉ chuẩn duy nhất của web. Vercel tự chuyển http → https và caycanhmientay.com → www, nên mọi URL tuyệt đối
 * (canonical, JSON-LD, sitemap) đều ghi theo địa chỉ này — kể cả khi chạy trên máy dev hay tên miền *.vercel.app
 * (các tên miền đó còn bị gắn `X-Robots-Tag: noindex` trong next.config.ts để Google không lập chỉ mục bản trùng).
 * Đổi tên miền: sửa ở đây + `CANONICAL_HOST` trong next.config.ts.
 */
export const SITE_ORIGIN = 'https://www.caycanhmientay.com';

/** "/san-pham/kim-tien" → "https://www.caycanhmientay.com/san-pham/kim-tien" (đường dẫn đã tuyệt đối thì giữ nguyên). */
export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`);
