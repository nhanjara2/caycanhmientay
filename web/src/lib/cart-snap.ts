// Dòng giỏ hàng — dùng chung client/server (server action làm mới giá trả về đúng kiểu này).
import type { IconName } from '@/components/Icon';
import type { Product, ShipGroup } from './catalog';

/** Thông tin sản phẩm chụp lại lúc thêm vào giỏ — để hiển thị. Giá thật do server tính lại. */
export type CartSnap = {
  name: string;
  label: string;
  unit: string;
  icon: IconName;
  ship: ShipGroup;
  pesticide?: boolean;
  flash?: boolean;
  price: number;
  oldPrice?: number;
};
export type CartLine = { slug: string; option: number; qty: number; snap: CartSnap };

export const snapOf = (p: Product, option: number): CartSnap => {
  const u = p.options[option];
  return {
    name: p.name, label: u.label, unit: p.unit, icon: p.icon, ship: p.ship, pesticide: p.pesticide,
    flash: Boolean(p.flash), price: u.price, oldPrice: u.oldPrice,
  };
};

