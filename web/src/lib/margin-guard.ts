// Giá sàn: mức lãi tối thiểu sau MỌI khoản giảm của một đơn (combo, giảm phí giao, mã giảm giá, mã miễn phí giao, chiết khấu đối tác).
// Chủ shop chốt 16/10/2026: lãi tối thiểu 25% trên tiền thu, cây sống hao hụt (chết, bảo hành) 5%; 10% cộng vào giá vườn đã gồm tiền xe chở về.
// Số % lưu ở app_settings (khóa `margin-guard`, sửa ở /admin/bang-gia). Tính toán thuần — giá vốn chỉ đưa vào ở server, không xuống trình duyệt khách.
import * as z from 'zod';

export type MarginGuard = {
  /** Lãi tối thiểu trên tiền shop thực thu của đơn (%). */
  minMarginPct: number;
  /** Hao hụt cây sống (%): cộng vào giá vốn cây sống khi tính giá sàn. Vật tư không tính. */
  plantLossPct: number;
};

export const DEFAULT_MARGIN_GUARD: MarginGuard = { minMarginPct: 25, plantLossPct: 5 };

export const MarginGuardSchema = z.object({
  minMarginPct: z.number().int('Lãi tối thiểu là số nguyên').min(0, 'Lãi tối thiểu không được âm').max(80, 'Lãi tối thiểu tối đa 80%'),
  plantLossPct: z.number().int('Hao hụt là số nguyên').min(0, 'Hao hụt không được âm').max(50, 'Hao hụt tối đa 50%'),
});

export function parseMarginGuard(raw: unknown): MarginGuard {
  const r = MarginGuardSchema.safeParse(raw);
  return r.success ? r.data : DEFAULT_MARGIN_GUARD;
}

/** Vốn thật một đơn vị: giá gốc (vườn + 10% tiền xe) + hao hụt nếu là cây sống. */
export const trueCost = (cost: number, plant: boolean, g: MarginGuard) => cost * (1 + (plant ? g.plantLossPct : 0) / 100);

/** Tiền thu tối thiểu cho một đơn vị để còn đủ lãi tối thiểu (chưa làm tròn). */
export const floorOf = (cost: number, plant: boolean, g: MarginGuard) => trueCost(cost, plant, g) / (1 - g.minMarginPct / 100);

/** Giá sàn một đơn vị để hiện ở bảng giá: làm tròn lên nghìn (dưới 10.000đ lên trăm). */
export const floorPrice = (cost: number, plant: boolean, g: MarginGuard) => {
  const v = floorOf(cost, plant, g);
  return v >= 10_000 ? Math.ceil(v / 1000) * 1000 : Math.ceil(v / 100) * 100;
};

export type Discounts = { partner: number; voucher: number; ship: number };
export type GuardResult = Discounts & {
  /** Khoản nào bị cắt bớt vì chạm giá sàn. */
  capped: { partner: boolean; voucher: boolean; ship: boolean };
};

/**
 * Cắt bớt các khoản giảm khách chọn để tiền shop thực thu của đơn không xuống dưới giá sàn.
 * - `goods`: tiền hàng sau combo 2 cây; `absorbed`: phí giao shop chịu vì đơn đủ mức miễn phí giao.
 *   Combo và miễn phí giao là luật cố định của giá / Cài đặt giao hàng nên không cắt — chỉ trừ vào phần còn lại.
 * - Thứ tự ưu tiên: chiết khấu đối tác → mã giảm giá → mã miễn phí giao (khoản sau bị cắt trước).
 * `floor` = tổng `floorOf` × số lượng của các dòng.
 */
export function guardDiscounts({ goods, absorbed, floor }: { goods: number; absorbed: number; floor: number }, want: Discounts): GuardResult {
  let room = Math.max(0, Math.floor(goods - absorbed - floor));
  const take = (v: number) => { const t = Math.min(Math.max(0, v), room); room -= t; return t; };
  const partner = take(want.partner), voucher = take(want.voucher), ship = take(want.ship);
  return { partner, voucher, ship, capped: { partner: partner < want.partner, voucher: voucher < want.voucher, ship: ship < want.ship } };
}
