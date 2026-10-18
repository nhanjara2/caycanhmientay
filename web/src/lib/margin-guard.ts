// Giá sàn: tiền thu tối thiểu của một đơn sau MỌI khoản giảm (combo, giảm phí giao, mã giảm giá, mã miễn phí giao, chiết khấu đối tác).
// Chủ shop chốt 18/10/2026: giá vốn = giá gốc + 5% (giá gốc = vườn + 10% tiền xe chở về), giá bán lẻ thu về tối thiểu 152% giá vốn,
// chưa gồm phí giao cho khách (phí giao shop chịu — miễn phí giao, mã miễn phí giao — trừ vào phần trên giá sàn).
// Số % lưu ở app_settings (khóa `margin-guard`). Tính toán thuần — giá gốc chỉ đưa vào ở server, không xuống trình duyệt khách.
import * as z from 'zod';

export type MarginGuard = {
  /** Giá vốn = giá gốc + % này (hao hụt, công chăm trước khi bán). */
  costExtraPct: number;
  /** Tiền thu tối thiểu = giá vốn + % này (152% giá vốn → 52). */
  minMarkupPct: number;
};

export const DEFAULT_MARGIN_GUARD: MarginGuard = { costExtraPct: 5, minMarkupPct: 52 };

export const MarginGuardSchema = z.object({
  costExtraPct: z.number().int('Phần cộng vào giá vốn là số nguyên').min(0, 'Không được âm').max(50, 'Tối đa 50%'),
  minMarkupPct: z.number().int('Lãi tối thiểu là số nguyên').min(0, 'Lãi tối thiểu không được âm').max(300, 'Lãi tối thiểu tối đa 300%'),
});

export function parseMarginGuard(raw: unknown): MarginGuard {
  const r = MarginGuardSchema.safeParse(raw);
  return r.success ? r.data : DEFAULT_MARGIN_GUARD;
}

/** Giá vốn một đơn vị = giá gốc + `costExtraPct`. */
export const trueCost = (cost: number, g: MarginGuard) => cost * (1 + g.costExtraPct / 100);

/** Tiền thu tối thiểu cho một đơn vị (chưa làm tròn) = giá vốn × (1 + `minMarkupPct`). */
export const floorOf = (cost: number, g: MarginGuard) => trueCost(cost, g) * (1 + g.minMarkupPct / 100);

/** Giá sàn một đơn vị để hiện ở bảng giá: làm tròn lên nghìn (dưới 10.000đ lên trăm). */
export const floorPrice = (cost: number, g: MarginGuard) => {
  const v = floorOf(cost, g);
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
