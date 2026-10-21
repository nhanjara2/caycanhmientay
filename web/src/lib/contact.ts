/** Kênh liên hệ của shop — dùng chung cho chân trang, nút liên hệ nổi, trang chủ, trang sản phẩm. */
export const SALES_PHONE = '0703005001';
export const ZALO_URL = `https://zalo.me/${SALES_PHONE}`;
/** Tài khoản nhận chuyển khoản (trang đặt hàng thành công). bin = mã ngân hàng theo chuẩn VietQR (TPBank 970423). */
export const BANK = { name: 'TPBank – Ngân hàng Tiên Phong', bin: '970423', account: '0703005001' };
/** Ảnh mã VietQR (img.vietqr.io, miễn phí) — quét bằng app ngân hàng bất kỳ, điền sẵn số tiền + nội dung. */
export const vietQrUrl = (amount: number, info: string) =>
  `https://img.vietqr.io/image/${BANK.bin}-${BANK.account}-compact2.svg?amount=${Math.max(0, Math.round(amount))}&addInfo=${encodeURIComponent(info)}`;
export const FACEBOOK_URL = 'https://facebook.com/caycanhmientayy';
export const YOUTUBE_URL = 'https://www.youtube.com/channel/UCLnO5s6HZWpud5z0S-Byqnw';
/** Tên kênh của shop, ghi cạnh logo trên thẻ video ngắn. */
export const YOUTUBE_NAME = 'Cây Cảnh Miền Tây';
export const TIKTOK_NAME = 'caycanhmientay.com';
export const TIKTOK_URL = `https://www.tiktok.com/@${TIKTOK_NAME}`;
export const LINKEDIN_URL = 'https://www.linkedin.com/company/c%C3%A2y-c%E1%BA%A3nh-mi%E1%BB%81n-t%C3%A2y/';
/** Ảnh mã QR Zalo trong public/ (mở trang Zalo cá nhân của shop). */
export const ZALO_QR = '/images/zalo-qr.png';

/** Số hotline theo bộ phận (chân trang, trang Chính sách). Giờ làm việc 8:00 – 21:00. */
export const CARE_PHONE = '0927291989';
export const SUPPORT_PHONE = '0973806842';
export const SHOP_EMAIL = 'nhanjara@gmail.com';
export const SHOP_ADDRESS = 'Làng Hoa Sa Đéc, Đồng Tháp';
/** Vị trí vườn ươm trên Google Maps (trang Đối tác sỉ, mục Thông tin doanh nghiệp). */
export const SHOP_MAP_URL = 'https://maps.app.goo.gl/KMP5LKbNBavaTHRj7';
/** Nơi khách chọn "Nhận tại vườn" (thanh toán, đơn hàng, trang thành công). */
export const PICKUP_PLACE = `Vườn ươm Cây Cảnh Miền Tây, ${SHOP_ADDRESS}`;
/** 0703005001 → 0703 005 001 */
export const formatPhone = (p: string) => p.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');

/** Thông tin đăng ký kinh doanh (trùng chân trang + trang Giấy phép kinh doanh) — trang Đối tác sỉ đọc từ đây. */
export const LEGAL = {
  name: 'Cây Cảnh Miền Tây',
  owner: 'Lê Hoài Nhân',
  regNo: '087096010726',
  regIssued: '04/2026',
  taxOffice: 'Thuế cơ sở 6 tỉnh Đồng Tháp',
  taxOfficeMapUrl: 'https://maps.app.goo.gl/4x4YD9f1py1b1C34A',
};
