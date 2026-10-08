import type { IconName } from '@/components/Icon';

/** Thanh danh mục ngang ở đầu trang (`CategoryNav`) + bảng xổ: dữ liệu tải lười từ `/api/mega-menu`. */

/** Một thẻ sản phẩm nhỏ trong bảng xổ. `price` = quy cách rẻ nhất có giá (0 = chỉ "Liên hệ báo giá"); `from` = các quy cách có giá khác nhau. */
export type MegaProduct = {
  slug: string; name: string; image: string | null; icon: IconName; unit: string;
  price: number; oldPrice: number | null; from: boolean;
};

export type MegaMenuData = {
  products: Record<string, MegaProduct>;
  /** Khóa "danh mục" hoặc "danh mục/nhóm con" → slug sản phẩm bán chạy, tối đa `MEGA_TOP`. */
  top: Record<string, string[]>;
  /** Số sản phẩm đang bán theo cùng khóa. */
  counts: Record<string, number>;
};

export const MEGA_TOP = 6;

/** Tên ngắn trên thanh ngang: "Phân bón – Dinh dưỡng" → "Phân bón" (tên đầy đủ hiện trong bảng xổ). */
export const shortCategoryName = (name: string) => name.split(/\s+[–—-]\s+/)[0] || name;
