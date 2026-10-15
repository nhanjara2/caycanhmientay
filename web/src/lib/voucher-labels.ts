// Nhãn mã giảm giá — dùng chung trang khách, thanh toán và admin.
import type { VoucherScope } from './voucher-scope';

export const DISCOUNT_TYPE_LABEL = { percent: 'Phần trăm', amount: 'Số tiền cố định' } as const;
export type DiscountType = keyof typeof DISCOUNT_TYPE_LABEL;

/** Loại mã: giảm tiền hàng, hoặc giảm phí giao (miễn phí giao tối đa một số tiền). Mỗi đơn dùng được một mã mỗi loại. */
export const VOUCHER_KIND_LABEL = { discount: 'Giảm tiền hàng', ship: 'Miễn phí giao' } as const;
export type VoucherKind = keyof typeof VOUCHER_KIND_LABEL;

export type VoucherStatus = 'active' | 'scheduled' | 'expired' | 'off';
export const VOUCHER_STATUS_LABEL: Record<VoucherStatus, string> = {
  active: 'Đang chạy', scheduled: 'Sắp diễn ra', expired: 'Đã hết hạn', off: 'Đã tắt',
};

export function voucherStatus(v: { active: boolean; startsAt: Date | null; endsAt: Date | null }, now = new Date()): VoucherStatus {
  if (!v.active) return 'off';
  if (v.startsAt && v.startsAt > now) return 'scheduled';
  if (v.endsAt && v.endsAt < now) return 'expired';
  return 'active';
}

/** Mô tả ngắn "Giảm 10%, tối đa 50.000đ" / "Giảm 20.000đ" — dùng cả trang khách và admin. */
export function voucherValueText(v: { kind?: VoucherKind; discountType: DiscountType; discountValue: number; maxDiscount: number | null }, money: (n: number) => string) {
  if (v.kind === 'ship') return `Giảm phí giao tối đa ${money(v.discountValue)}`;
  if (v.discountType === 'percent') return `Giảm ${v.discountValue}%${v.maxDiscount ? `, tối đa ${money(v.maxDiscount)}` : ''}`;
  return `Giảm ${money(v.discountValue)}`;
}

// ---- Mã công khai theo giá trị đơn (CAMON5…CAMON20) ------------------------------------------

/** Mã đang áp dụng mà khách thấy ở giỏ / thanh toán / trang sản phẩm (không gồm quà tài khoản mới). */
export type PublicVoucher = {
  code: string; label: string; kind: VoucherKind; discountType: DiscountType; discountValue: number; maxDiscount: number | null; minOrder: number;
  /** Phạm vi áp dụng (null = mọi sản phẩm) + tên phạm vi để hiện cho khách ("Cây sân vườn, Cây kim tiền"). */
  scope?: VoucherScope | null; scopeText?: string | null;
};

/** Số tiền giảm của một mã: mã giảm tiền hàng tính trên `amount`; mã miễn phí giao giảm tối đa bằng phí giao `shipFee`. Dùng chung client (ước tính) và server (chốt). */
export function discountOf(v: Pick<PublicVoucher, 'kind' | 'discountType' | 'discountValue' | 'maxDiscount'>, amount: number, shipFee: number) {
  if (v.kind === 'ship') return Math.max(0, Math.min(v.discountValue, shipFee));
  const raw = v.discountType === 'percent' ? Math.round((amount * v.discountValue) / 100) : v.discountValue;
  return Math.min(raw, v.maxDiscount ?? raw, amount);
}

/** Số tiền ước giảm của mã trên tiền hàng `amount`, phí giao `shipFee` (0 = chưa đủ đơn tối thiểu / đơn không có phí giao). Server kiểm tra lại lượt dùng khi đặt. */
export function voucherDiscount(v: PublicVoucher, amount: number, shipFee = 0) {
  return amount < v.minOrder ? 0 : discountOf(v, amount, shipFee);
}

/** Mã giảm nhiều nhất đang dùng được của một loại (null = chưa có mã nào dùng được). */
export function bestVoucher(list: PublicVoucher[], kind: VoucherKind, amount: number, shipFee: number) {
  return list.filter((v) => v.kind === kind && voucherDiscount(v, amount, shipFee) > 0)
    .sort((a, b) => voucherDiscount(b, amount, shipFee) - voucherDiscount(a, amount, shipFee))[0] ?? null;
}

/** Mã giảm tiền hàng nhiều nhất đang dùng được + mã kế tiếp (đơn tối thiểu cao hơn, giảm nhiều hơn) để gợi ý "mua thêm …". */
export function voucherTiers(all: PublicVoucher[], amountOf: (v: PublicVoucher) => number) {
  const list = all.filter((v) => v.kind === 'discount');
  const est = (v: PublicVoucher) => voucherDiscount(v, amountOf(v));
  const best = list.filter((v) => est(v) > 0).sort((a, b) => est(b) - est(a))[0] ?? null;
  const gain = best ? est(best) : 0;
  // Mã có phạm vi mà đơn chưa có sản phẩm nào thuộc phạm vi thì không gợi ý "mua thêm"
  const next = list
    .filter((v) => amountOf(v) > 0 && v.minOrder > amountOf(v) && voucherDiscount(v, v.minOrder) > gain)
    .sort((a, b) => a.minOrder - amountOf(a) - (b.minOrder - amountOf(b)))[0] ?? null;
  return { best, next };
}

// ---- Quà tài khoản mới ------------------------------------------------------------------------
// Một mã dùng chung (dòng trong bảng vouchers, admin sửa số tiền / đơn tối thiểu / bật-tắt ở /admin/khuyen-mai),
// nhưng chỉ tài khoản đã đăng nhập, trong WELCOME_DAYS ngày kể từ lần đăng nhập đầu tiên (users.created_at) mới dùng được.
// Mỗi tài khoản / mỗi SĐT nhận hàng dùng theo "lượt/khách" của mã (mặc định 1). Luật kiểm ở checkVoucher (server/vouchers.ts).

export const WELCOME_CODE = 'CHAOBANMOI';
export const WELCOME_DAYS = 30;
/** Giá trị lúc tạo mã (seed) — sau đó admin sửa trực tiếp trên mã. */
export const WELCOME_DEFAULT = { discountValue: 50_000, minOrder: 300_000 };

export type WelcomeProgram = {
  code: string; discountType: DiscountType; discountValue: number; maxDiscount: number | null; minOrder: number; days: number;
};
/** Quà của một tài khoản; expiresAt dạng ISO (qua server action). */
export type WelcomeOffer = WelcomeProgram & { expiresAt: string; status: 'available' | 'used' | 'expired' };

/** "Giảm 50.000đ cho đơn từ 300.000đ" */
export const welcomeText = (w: WelcomeProgram, money: (n: number) => string) =>
  `${voucherValueText(w, money)}${w.minOrder > 0 ? ` cho đơn từ ${money(w.minOrder)}` : ''}`;
