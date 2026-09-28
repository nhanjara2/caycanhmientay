// Nhãn mã giảm giá — dùng chung trang khách, thanh toán và admin.

export const DISCOUNT_TYPE_LABEL = { percent: 'Phần trăm', amount: 'Số tiền cố định' } as const;
export type DiscountType = keyof typeof DISCOUNT_TYPE_LABEL;

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
export function voucherValueText(v: { discountType: DiscountType; discountValue: number; maxDiscount: number | null }, money: (n: number) => string) {
  if (v.discountType === 'percent') return `Giảm ${v.discountValue}%${v.maxDiscount ? `, tối đa ${money(v.maxDiscount)}` : ''}`;
  return `Giảm ${money(v.discountValue)}`;
}
