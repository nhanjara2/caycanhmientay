// Cách tính tiền đơn hàng — dùng chung: client để hiển thị, server để tính số tiền thật khi đặt hàng.
import type { ScopeItem } from './voucher-scope';
import type { ShipGroup } from './catalog';
import { partnerDiscountOf } from './partners';
import { DEFAULT_SHIPPING, type FeeRule, type PlantRule, type ShipRegion } from './shipping';

// ---- Công thức giá ----------------------------------------------------------------------------
// Chủ shop (10/10/2026) chỉ nhập Giá tại vườn; các giá khác tự tính rồi sửa tay được ở form sản phẩm:
//   Giá gốc = vườn + 10% · Giá lẻ (giá bán) = gốc + 100% · Combo 2 cây = (lẻ × 2) − 10% · Giá gạch ngang = lẻ + ngẫu nhiên 20–30%.
// 18/10/2026 giá lẻ từ gốc + 80% lên gốc + 100%: giá sàn mới (giá vốn = gốc + 5%, thu tối thiểu 152% giá vốn — lib/margin-guard.ts)
// = gốc × 1,596, nên giá lẻ gốc × 2 chừa ~20% để giảm: combo 10% + mã giảm giá ≤ 5% + phí giao shop chịu ≤ 5% (xem mã + mức miễn phí giao).
// Giá sỉ công trình: liên hệ báo giá (không tính trên web).
export const PRICE_FORMULA = { costPct: 10, retailPct: 100, comboPct: 10, strikeMinPct: 20, strikeMaxPct: 30 } as const;

/** Làm tròn giá: từ 10.000đ tròn nghìn, dưới đó tròn trăm. */
export const roundPrice = (n: number) => (n >= 10_000 ? Math.round(n / 1000) * 1000 : Math.round(n / 100) * 100);
export const costFromGarden = (garden: number) => roundPrice(garden * (1 + PRICE_FORMULA.costPct / 100));
export const retailFromCost = (cost: number) => roundPrice(cost * (1 + PRICE_FORMULA.retailPct / 100));
export const comboFromRetail = (retail: number) => roundPrice(retail * 2 * (1 - PRICE_FORMULA.comboPct / 100));
/** Giá gạch ngang = giá lẻ + 20–30% (ngẫu nhiên mỗi lần tính), luôn cao hơn giá lẻ. */
export function strikeFromRetail(retail: number, rand = Math.random()) {
  const pct = PRICE_FORMULA.strikeMinPct + rand * (PRICE_FORMULA.strikeMaxPct - PRICE_FORMULA.strikeMinPct);
  const v = roundPrice(retail * (1 + pct / 100));
  return v > retail ? v : retail + (retail >= 10_000 ? 1000 : 100);
}

/** Còn thiếu bao nhiêu tiền hàng mới đủ đơn tối thiểu để giao (0 = đủ). Nhận tại vườn không áp dụng. */
export const minOrderShort = (goods: number, minOrder: number, delivery: 'ship' | 'pickup' = 'ship') =>
  (delivery === 'ship' && minOrder > 0 && goods < minOrder ? minOrder - goods : 0);

// ---- Tính tiền giỏ / đơn -----------------------------------------------------------------------

// Phí giao tách theo nhóm, như BRANDBOOK: cây sống giao riêng bằng xe (phí theo vùng nhận hàng + phụ phí cây lớn), vật tư giao nhanh.
// Đây là giá trị mặc định; số thật do admin chỉnh ở Cài đặt giao hàng (lib/shipping.ts) và truyền vào `rules`.
export type ShipRules = { plant: PlantRule; supply: FeeRule };
export const SHIP_RULES: ShipRules = { plant: DEFAULT_SHIPPING.plant, supply: DEFAULT_SHIPPING.supply };

/** Mức miễn phí giao cây sống của vùng nhận hàng; chưa biết nơi nhận thì mức thấp nhất (`freeFrom`). */
export const plantFreeFrom = (r: PlantRule, region: ShipRegion | null) => (region ? r.regionFree[region] : r.freeFrom);

/** Ba vùng khác mức phí thì khách chưa chọn nơi nhận chỉ thấy số tạm tính (theo vùng rẻ nhất). */
export const plantFeeVaries = (r: PlantRule) => new Set(Object.values(r.regionFee)).size > 1 || new Set(Object.values(r.regionFree)).size > 1;

export type PricedLine = { price: number; oldPrice?: number | null; combo2?: number | null; qty: number; ship: ShipGroup; pesticide?: boolean; /** Cây lớn / cồng kềnh: tính thêm phụ phí giao mỗi cây. */ bulky?: boolean; /** Không áp mã giảm giá: không tính vào `voucherBase`. */ noVoucher?: boolean;
  /** Quy cách là bộ (lib/bundle.ts): giá bộ đã giảm — không áp mã, không tính chiết khấu đối tác. */ bundle?: boolean;
  /** Để xét phạm vi mã giảm giá (lib/voucher-scope.ts): slug, danh mục, nhóm con chính + phụ. */ slug?: string; category?: string; subs?: string[] };

/** Giá thật của một dòng sau khi xét combo 2 cây (cùng thứ tự với dòng đưa vào). */
export type LinePrice = {
  /** Thành tiền sau combo. */
  total: number;
  /** Giá gạch ngang của cả dòng (giá gạch × SL; không có giá gạch thì giá lẻ × SL). */
  strike: number;
  /** Số cặp tính giá combo và tiền bớt nhờ combo. */
  combos: number;
  comboSaving: number;
  /** Sản phẩm của dòng — xét phạm vi mã giảm giá. */
  item: ScopeItem;
};

export type Totals = {
  count: number;
  /** Tiền hàng theo giá lẻ, chưa trừ combo. */
  subtotal: number;
  /** Tiền hàng theo giá gạch ngang. */
  original: number;
  /** Giảm so với giá gạch ngang (giá lẻ thấp hơn giá gạch). */
  directDiscount: number;
  comboDiscount: number;
  /** Tiền hàng phải trả trước phí giao, mã giảm giá, chiết khấu đối tác = subtotal − comboDiscount (mã giảm giá tính trên số này). */
  goods: number;
  /** Tiền hàng xét mã giảm giá / miễn phí giao (đơn tối thiểu, % giảm) = `goods` trừ sản phẩm không áp mã. */
  voucherBase: number;
  plantSubtotal: number;
  supplySubtotal: number;
  /** Phí giao cây sống PHẢI TRẢ: đã gồm phụ phí cây lớn (`bulkyShip`) và đã trừ phần được miễn (`plantShipFree`). */
  plantShip: number;
  supplyShip: number;
  /** Phí giao được miễn vì tiền hàng đủ mức miễn phí giao (đã trừ khỏi `plantShip` / `supplyShip`; cộng lại để ra phí giao gốc). 0 = không có phí để miễn (nhận tại vườn…). */
  plantShipFree: number;
  supplyShipFree: number;
  /** Phần phụ phí cây lớn nằm trong `plantShip`. */
  bulkyShip: number;
  /** Vùng nhận hàng đã dùng để tính phí cây sống; null = chưa biết nơi nhận (số tạm tính theo vùng rẻ nhất). */
  shipRegion: ShipRegion | null;
  voucherDiscount: number;
  /** Mã miễn phí giao: số tiền phí giao được giảm (không quá tổng phí giao). */
  shipVoucherDiscount: number;
  /** Chiết khấu đối tác sỉ (% riêng của tài khoản, tính trên tiền hàng). */
  partnerDiscount: number;
  total: number;
  hasPesticide: boolean;
  lines: LinePrice[];
  /** Khoản giảm bị cắt bớt vì chạm giá sàn (lib/margin-guard.ts) — chỉ có sau khi server tính. */
  capped?: { partner: boolean; voucher: boolean; ship: boolean };
};

/** Mỗi 2 cây cùng quy cách tính giá combo (khi combo rẻ hơn 2 lần giá lẻ). */
export function linePrice(l: PricedLine): LinePrice {
  const ok = !!l.combo2 && l.combo2 > 0 && l.combo2 < 2 * l.price;
  const combos = ok ? Math.floor(l.qty / 2) : 0;
  const comboSaving = combos * (2 * l.price - (l.combo2 ?? 0));
  return {
    total: l.price * l.qty - comboSaving,
    strike: (l.oldPrice && l.oldPrice > l.price ? l.oldPrice : l.price) * l.qty,
    combos, comboSaving,
    item: { slug: l.slug, category: l.category, subs: l.subs, noVoucher: l.noVoucher || l.bundle },
  };
}

export function computeTotals(lines: PricedLine[], delivery: 'ship' | 'pickup' = 'ship', voucherDiscount = 0, rules: ShipRules = SHIP_RULES, partnerPct = 0, region: ShipRegion | null = null): Totals {
  const priced = lines.map(linePrice);
  let subtotal = 0, original = 0, comboDiscount = 0, plantSubtotal = 0, supplySubtotal = 0, bulkyQty = 0, count = 0, noVoucher = 0, bundles = 0;
  lines.forEach((l, i) => {
    const p = priced[i];
    subtotal += l.price * l.qty;
    original += p.strike;
    comboDiscount += p.comboSaving;
    count += l.qty;
    if (l.noVoucher || l.bundle) noVoucher += p.total;
    if (l.bundle) bundles += p.total;
    if (l.ship === 'plant') {
      plantSubtotal += p.total;
      if (l.bulky) bulkyQty += l.qty;
    } else supplySubtotal += p.total;
  });
  const goods = subtotal - comboDiscount;
  // Phí giao luôn tính đủ theo bảng phí, đủ mức miễn phí giao thì ghi thành khoản được miễn (khách thấy phí gốc rồi dòng trừ ra, không phải chữ "Miễn phí").
  const ship = (sub: number, rule: { fee: number; freeFrom: number }) => {
    const fee = delivery === 'pickup' || sub === 0 ? 0 : rule.fee;
    const free = sub >= rule.freeFrom ? fee : 0;
    return { pay: fee - free, free };
  };
  // Phí cây sống theo vùng nhận hàng (chưa biết thì mức thấp nhất); phụ phí cây lớn tính thêm cho từng cây, kể cả khi đơn đã miễn phí giao.
  const bulkyShip = delivery === 'ship' ? bulkyQty * rules.plant.bulky : 0;
  const plant = ship(plantSubtotal, { fee: region ? rules.plant.regionFee[region] : rules.plant.fee, freeFrom: plantFreeFrom(rules.plant, region) });
  const supply = ship(supplySubtotal, rules.supply);
  const plantShip = plant.pay + bulkyShip;
  const supplyShip = supply.pay;
  // Mỗi món chỉ một mức giảm: bộ đã giảm giá nên không cộng chiết khấu đối tác.
  const partnerDiscount = partnerDiscountOf(goods - bundles, partnerPct);
  return {
    count, subtotal, original, plantSubtotal, supplySubtotal, plantShip, supplyShip, bulkyShip, shipRegion: region,
    plantShipFree: plant.free, supplyShipFree: supply.free,
    directDiscount: original - subtotal,
    comboDiscount,
    goods,
    voucherBase: Math.max(0, goods - noVoucher),
    voucherDiscount,
    shipVoucherDiscount: 0,
    partnerDiscount,
    total: Math.max(0, goods + plantShip + supplyShip - voucherDiscount - partnerDiscount),
    hasPesticide: lines.some((l) => l.pesticide),
    lines: priced,
  };
}

/**
 * Trừ thêm mã khách đã chọn (mã giảm tiền hàng + mã miễn phí giao) vào tổng đã tính — giỏ hàng, thanh toán hiển thị; server tự tính lại khi tạo đơn.
 * `partner` = chiết khấu đối tác server đã cắt theo giá sàn (null = chưa hỏi server, giữ số tính ở trình duyệt). `capped` = khoản bị cắt bớt vì giá sàn.
 */
export function withVouchers(t: Totals, discount: number, shipDiscount: number, partner: number | null = null, capped?: Totals['capped']): Totals {
  const ship = Math.min(shipDiscount, t.plantShip + t.supplyShip);
  const pd = partner ?? t.partnerDiscount;
  return {
    ...t, voucherDiscount: discount, shipVoucherDiscount: ship, partnerDiscount: pd, capped,
    total: Math.max(0, t.total + t.voucherDiscount + t.partnerDiscount - discount - ship - pd),
  };
}
