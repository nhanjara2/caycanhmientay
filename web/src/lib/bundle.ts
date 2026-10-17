// Sản phẩm bộ (cây + chậu + giá thể…): một quy cách gồm nhiều quy cách thành phần — dùng chung client / server.
// Giá bộ không nhập tay: = tổng giá lẻ các món − BUNDLE_PCT%, giá gạch ngang = tổng giá lẻ (giá thật khi mua lẻ từng món).
// Bộ không có tồn riêng: bán một bộ trừ kho từng món (server/inventory.ts `takeStock`), còn hàng khi mọi món còn đủ.
// Mỗi món chỉ hưởng một mức giảm: bộ không có combo 2 cây, không áp mã giảm giá, không cộng chiết khấu đối tác.
import { roundPrice } from './pricing';

/** Thành phần lưu ở `product_options.parts`: quy cách `idx` của sản phẩm `slug`, `qty` món mỗi bộ. */
export type BundlePart = { slug: string; idx: number; qty: number };

/** Bộ giảm bao nhiêu % so với tổng giá lẻ các món. */
export const BUNDLE_PCT = 10;
export const MAX_BUNDLE_PARTS = 6;
export const MAX_PART_QTY = 20;

/** Giá bộ theo tổng giá lẻ các món. */
export const bundlePrice = (retailSum: number) => (retailSum > 0 ? roundPrice(retailSum * (1 - BUNDLE_PCT / 100)) : 0);

/** Thành phần hiện cho khách trên trang sản phẩm (không có giá vốn). `href` chỉ có khi món đó đang bán trên web. */
export type BundleItem = { name: string; label: string; qty: number; href?: string };

/** Món chọn được làm thành phần bộ (form sản phẩm admin) — `cost` là giá vốn, chỉ admin thấy. */
export type BundleChoice = { slug: string; idx: number; name: string; label: string; price: number; cost: number; category: string; active: boolean };
export const partKey = (slug: string, idx: number) => `${slug}#${idx}`;
