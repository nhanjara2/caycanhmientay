// Nhãn hiển thị cho đơn hàng — dùng chung trang khách và admin.

export const STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Chuẩn bị cây',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
} as const;
export type Status = keyof typeof STATUS_LABEL;

/** Nhãn nút chuyển sang trạng thái đó (phía admin). */
export const STATUS_ACTION: Record<Status, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Xác nhận đơn',
  preparing: 'Bắt đầu chuẩn bị cây',
  shipping: 'Giao cho tài xế',
  delivered: 'Đã giao xong',
  cancelled: 'Hủy đơn',
};

/** 5 bước của OrderTimeline. */
export const TIMELINE: { status: Status; label: string }[] = [
  { status: 'pending', label: 'Đặt hàng' },
  { status: 'confirmed', label: 'Xác nhận' },
  { status: 'preparing', label: 'Chuẩn bị cây' },
  { status: 'shipping', label: 'Đang giao' },
  { status: 'delivered', label: 'Đã giao' },
];

export const PAY_LABEL = {
  cod: 'Tiền mặt khi nhận hàng',
  qr: 'Chuyển khoản ngân hàng (QR)',
  momo: 'Ví MoMo',
  zalopay: 'Ví ZaloPay',
  card: 'Thẻ quốc tế',
} as const;

const tz = { timeZone: 'Asia/Ho_Chi_Minh' } as const;
export const fmtDate = (d: Date) => d.toLocaleDateString('vi-VN', { ...tz, day: '2-digit', month: '2-digit', year: 'numeric' });
export const fmtDateTime = (d: Date) =>
  `${d.toLocaleTimeString('vi-VN', { ...tz, hour: '2-digit', minute: '2-digit' })}, ${d.toLocaleDateString('vi-VN', { ...tz, day: '2-digit', month: '2-digit' })}`;
