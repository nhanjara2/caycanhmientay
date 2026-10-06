// Cách tính tiền đơn hàng — dùng chung: client để hiển thị, server để tính số tiền thật khi đặt hàng.
import type { ShipGroup } from './catalog';

// Phí giao tách theo nhóm, như BRANDBOOK: cây sống giao riêng bằng xe, vật tư giao nhanh.
// Đây là giá trị mặc định; số thật do admin chỉnh ở Cài đặt giao hàng (lib/shipping.ts) và truyền vào `rules`.
export type ShipRules = { plant: { fee: number; freeFrom: number }; supply: { fee: number; freeFrom: number } };
export const SHIP_RULES: ShipRules = {
  plant: { fee: 35000, freeFrom: 800000 },
  supply: { fee: 20000, freeFrom: 300000 },
};

export type PricedLine = { price: number; oldPrice?: number | null; qty: number; ship: ShipGroup; pesticide?: boolean };

export type Totals = {
  count: number;
  subtotal: number;
  original: number;
  directDiscount: number;
  plantSubtotal: number;
  supplySubtotal: number;
  plantShip: number;
  supplyShip: number;
  voucherDiscount: number;
  total: number;
  hasPesticide: boolean;
};

export function computeTotals(lines: PricedLine[], delivery: 'ship' | 'pickup' = 'ship', voucherDiscount = 0, rules: ShipRules = SHIP_RULES): Totals {
  let subtotal = 0, original = 0, plantSubtotal = 0, supplySubtotal = 0, count = 0;
  for (const l of lines) {
    const line = l.price * l.qty;
    subtotal += line;
    original += (l.oldPrice ?? l.price) * l.qty;
    count += l.qty;
    if (l.ship === 'plant') plantSubtotal += line;
    else supplySubtotal += line;
  }
  const ship = (sub: number, rule: { fee: number; freeFrom: number }) =>
    delivery === 'pickup' || sub === 0 || sub >= rule.freeFrom ? 0 : rule.fee;
  const plantShip = ship(plantSubtotal, rules.plant);
  const supplyShip = ship(supplySubtotal, rules.supply);
  return {
    count, subtotal, original, plantSubtotal, supplySubtotal, plantShip, supplyShip,
    directDiscount: original - subtotal,
    voucherDiscount,
    total: Math.max(0, subtotal + plantShip + supplyShip - voucherDiscount),
    hasPesticide: lines.some((l) => l.pesticide),
  };
}
