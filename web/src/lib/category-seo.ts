/**
 * Tiêu đề + mô tả Google của trang danh mục / nhóm con (/danh-muc/<danh mục>[/<nhóm con>]).
 * Admin viết ở /admin/danh-muc/<slug> (ô "Hiện trên Google"); để trống thì web tự tạo từ tên + sản phẩm đang bán,
 * nên mỗi trang một mô tả riêng và tự đổi khi hàng thay đổi. Hàm thuần — dùng chung trang khách + admin (xem trước).
 */

export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 170;

/** Chữ cái đầu viết thường để đặt giữa câu. */
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Mô tả tự tạo: "Cây để bàn tại vườn Cây Cảnh Miền Tây: 12 loại như Kim tiền, Lưỡi hổ, Phú quý… Giá tại vườn, combo 2 cây, giá sỉ cho đối tác, giao toàn quốc." */
export function autoCategoryDescription(name: string, productNames: string[]) {
  const n = productNames.length;
  const tail = 'Giá tại vườn, combo 2 cây, giá sỉ cho đối tác, giao toàn quốc.';
  if (!n) return `${name} tại Cây Cảnh Miền Tây. ${tail}`;
  const head = `${name} tại vườn Cây Cảnh Miền Tây: ${n} loại như `;
  const room = SEO_DESCRIPTION_MAX - head.length - tail.length - 3;
  const picked: string[] = [];
  for (const p of productNames) {
    const next = [...picked, p].join(', ');
    if (next.length > room) break;
    picked.push(p);
  }
  return picked.length ? `${head}${picked.join(', ')}… ${tail}` : `${name} tại vườn Cây Cảnh Miền Tây: ${n} loại ${lower(name)}. ${tail}`;
}

/** Tiêu đề + mô tả cuối cùng: chữ admin viết, không có thì tự tạo. */
export function categorySeo(page: { name: string; seoTitle?: string; seoDescription?: string }, productNames: string[]) {
  return {
    title: page.seoTitle || page.name,
    description: page.seoDescription || autoCategoryDescription(page.name, productNames),
  };
}
