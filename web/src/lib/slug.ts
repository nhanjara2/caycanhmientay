/**
 * Quy ước đường dẫn (slug) DUY NHẤT của web — dùng chung khi tạo slug (sản phẩm, bài viết, bệnh cây, dự án, danh mục)
 * và khi chuẩn hóa đường dẫn khách gõ (src/proxy.ts). File này không import gì để proxy nạp nhẹ.
 * Slug: chữ thường không dấu, số, nối bằng "-" ("Cây Đuôi Công Tím" → "cay-duoi-cong-tim"). Sản phẩm, bệnh cây, danh mục
 * cố định từ lúc tạo; bài viết đã đăng và công trình đổi được ở khung SEO trong admin — tự thêm chuyển hướng 308 từ đường dẫn
 * cũ (server/seo-cms.ts, bảng `redirects`).
 */

/** Bỏ dấu tiếng Việt + chữ thường: "Trị Nấm" → "tri nam". */
export const plainText = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

/** "Cây nội thất" → "cay-noi-that"; dài hơn `max` thì cắt (không để "-" ở cuối). */
export const slugify = (s: string, max = 80) =>
  plainText(s).replace(/[^a-z0-9]+/g, '-').slice(0, max).replace(/^-+|-+$/g, '');

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Đường dẫn chuẩn của một đường dẫn khách gõ / link ngoài: từng đoạn đổi theo `slugify`
 * ("/San-Pham/Kim%20Tiền" → "/san-pham/kim-tien"), bỏ "//". null = không chuẩn hóa được (để trang báo 404).
 */
export function canonicalPath(pathname: string): string | null {
  const out: string[] = [];
  for (const part of pathname.split('/')) {
    if (!part) continue;
    let text: string;
    try {
      text = decodeURIComponent(part);
    } catch {
      return null;
    }
    const slug = slugify(text, 200);
    if (!slug) return null;
    out.push(slug);
  }
  return `/${out.join('/')}`;
}
