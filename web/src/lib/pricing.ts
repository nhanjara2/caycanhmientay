// Cách tính tiền đơn hàng — dùng chung: client để hiển thị, server để tính số tiền thật khi đặt hàng.
import type { ShipGroup } from './catalog';

// Phí giao tách theo nhóm, như BRANDBOOK: cây sống giao riêng bằng xe, vật tư giao nhanh.
export const SHIP_RULES = {
  plant: { fee: 35000, freeFrom: 800000 },
  supply: { fee: 20000, freeFrom: 300000 },
} as const;

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
  total: number;
  hasPesticide: boolean;
};

export function computeTotals(lines: PricedLine[], delivery: 'ship' | 'pickup' = 'ship'): Totals {
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
  const plantShip = ship(plantSubtotal, SHIP_RULES.plant);
  const supplyShip = ship(supplySubtotal, SHIP_RULES.supply);
  return {
    count, subtotal, original, plantSubtotal, supplySubtotal, plantShip, supplyShip,
    directDiscount: original - subtotal,
    total: subtotal + plantShip + supplyShip,
    hasPesticide: lines.some((l) => l.pesticide),
  };
}
