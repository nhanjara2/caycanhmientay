// Nhãn khách hàng — dùng chung trang admin Khách hàng và chi tiết khách.

/** Chữ viết tắt hiện trong vx-avatar. */
export const customerInitials = (name: string | null) =>
  (name ?? 'Khách hàng').trim().split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase();

/** Hạng khách theo tổng chi tiêu — chỉ để hiển thị, không ảnh hưởng giá/ưu đãi. */
export function customerTier(spend: number): { label: string; gold?: boolean } {
  if (spend >= 20_000_000) return { label: 'Vàng', gold: true };
  if (spend >= 5_000_000) return { label: 'Bạc' };
  return { label: 'Thành viên' };
}
