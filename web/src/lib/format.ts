const vnd = new Intl.NumberFormat('vi-VN');

/** 289000 -> "289.000đ" */
export const money = (n: number) => `${vnd.format(n)}đ`;
/** Chỉ phần số của giá (không có "đ") — thẻ sản phẩm vẽ "đ" nhỏ riêng sau số, kiểu Shopee. */
export const moneyNum = (n: number) => vnd.format(n);

export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '').replace('.', ',')}k` : String(n));
