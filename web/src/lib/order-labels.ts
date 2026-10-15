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
  deposit: 'Đặt cọc (shop liên hệ)',
  cod: 'Tiền mặt khi nhận hàng',
  qr: 'Chuyển khoản ngân hàng (QR)',
  momo: 'Ví MoMo',
  zalopay: 'Ví ZaloPay',
  card: 'Thẻ quốc tế',
} as const;

/** Logo cổng thanh toán trong public/images/pay/ (tiền mặt, thẻ, đặt cọc dùng icon). */
export const PAY_LOGO: Partial<Record<keyof typeof PAY_LABEL, string>> = {
  qr: 'vietqr.svg',
  momo: 'momo.svg',
  zalopay: 'zalopay.svg',
};

/**
 * Cổng thanh toán trực tuyến (VietQR / MoMo / ZaloPay / thẻ) đã nối chưa.
 * false (hiện tại): trang thanh toán chỉ cho chọn "Đặt cọc" (shop gọi / nhắn Zalo hướng dẫn) hoặc tiền mặt khi nhận hàng,
 * và `createOrder` đổi mọi đơn chọn cổng trực tuyến (trang mở từ trước) thành "Đặt cọc".
 * Nối cổng xong: đổi thành true, rồi làm bước chuyển sang cổng + webhook đánh dấu đã trả ở trang thanh toán / `createOrder`.
 */
export const ONLINE_PAYMENTS_READY = false;
export const ONLINE_PAYMENT_METHODS: readonly string[] = ['qr', 'momo', 'zalopay', 'card'];

/** Dòng trạng thái thanh toán của một đơn chưa trả đủ / đã trả (trang khách + admin). */
export function payStatus(method: string, paid: boolean) {
  if (paid) return 'Đã thanh toán';
  if (method === 'cod') return 'Trả khi nhận hàng';
  if (method === 'deposit') return 'Chờ đặt cọc';
  return 'Chờ thanh toán';
}

const tz = { timeZone: 'Asia/Ho_Chi_Minh' } as const;
export const fmtDate = (d: Date) => d.toLocaleDateString('vi-VN', { ...tz, day: '2-digit', month: '2-digit', year: 'numeric' });
export const fmtDateTime = (d: Date) =>
  `${d.toLocaleTimeString('vi-VN', { ...tz, hour: '2-digit', minute: '2-digit' })}, ${d.toLocaleDateString('vi-VN', { ...tz, day: '2-digit', month: '2-digit' })}`;
