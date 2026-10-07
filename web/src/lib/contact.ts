/** Kênh liên hệ của shop — dùng chung cho chân trang, nút liên hệ nổi, trang chủ, trang sản phẩm. */
export const SALES_PHONE = '0703005001';
export const ZALO_URL = `https://zalo.me/${SALES_PHONE}`;
export const FACEBOOK_URL = 'https://facebook.com/caycanhmientayy';
export const YOUTUBE_URL = 'https://www.youtube.com/channel/UCLnO5s6HZWpud5z0S-Byqnw';
/** Ảnh mã QR Zalo trong public/ (mở trang Zalo cá nhân của shop). */
export const ZALO_QR = '/images/zalo-qr.png';

/** Số hotline theo bộ phận (chân trang, trang Chính sách). Giờ làm việc 8:00 – 21:00. */
export const CARE_PHONE = '0927291989';
export const SUPPORT_PHONE = '0973806842';
export const SHOP_EMAIL = 'nhanjara@gmail.com';
export const SHOP_ADDRESS = 'Làng Hoa Sa Đéc, Đồng Tháp';
/** Nơi khách chọn "Nhận tại vườn" (thanh toán, đơn hàng, trang thành công). */
export const PICKUP_PLACE = `Vườn ươm Cây Cảnh Miền Tây, ${SHOP_ADDRESS}`;
/** 0703005001 → 0703 005 001 */
export const formatPhone = (p: string) => p.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');
