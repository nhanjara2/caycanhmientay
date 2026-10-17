// Dòng giỏ hàng — dùng chung client/server (server action làm mới giá trả về đúng kiểu này).
import type { IconName } from '@/components/Icon';
import { optionOf, type Product, type ShipGroup } from './catalog';

/** Thông tin sản phẩm chụp lại lúc thêm vào giỏ — để hiển thị. Giá thật do server tính lại. */
export type CartSnap = {
  name: string;
  label: string;
  unit: string;
  icon: IconName;
  /** Ảnh đại diện (nếu có) — không có thì hiện biểu tượng. */
  image?: string;
  ship: ShipGroup;
  pesticide?: boolean;
  flash?: boolean;
  price: number;
  oldPrice?: number;
  /** Giá 2 cây cùng quy cách — giỏ tự tính mỗi cặp (server tính lại khi đặt). */
  combo2?: number;
  /** Cây lớn: có phụ phí giao (giỏ tự cộng, server tính lại khi đặt). */
  bulky?: boolean;
  /** Không áp mã giảm giá (giỏ không tính tiền dòng này vào tiền hàng xét mã; server tính lại). */
  noVoucher?: boolean;
  /** Quy cách là bộ: không áp mã, không chiết khấu đối tác (giỏ tự tính; server tính lại). */
  bundle?: boolean;
  /** Danh mục + nhóm con (chính + phụ) — xét phạm vi mã giảm giá. */
  category?: string;
  subs?: string[];
};
export type CartLine = { slug: string; option: number; qty: number; snap: CartSnap };

/** `option` = số thứ tự quy cách trong database (`Unit.idx`) — gọi khi đã chắc quy cách còn bán. */
export const snapOf = (p: Product, option: number): CartSnap => {
  const u = optionOf(p, option)!;
  return {
    name: p.name, label: u.label, unit: p.unit, icon: p.icon, image: p.images?.[0], ship: p.ship, pesticide: p.pesticide,
    flash: Boolean(p.flash), price: u.price, oldPrice: u.oldPrice, combo2: u.combo2, bulky: u.bulky, noVoucher: p.noVoucher, bundle: u.parts ? true : undefined,
    category: p.category, subs: [p.sub, ...(p.extraSubs ?? [])],
  };
};

