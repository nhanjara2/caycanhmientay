import Link from 'next/link';
import { CARE_PHONE, FACEBOOK_URL, formatPhone, LINKEDIN_URL, GOOGLE_REVIEW_URL, SALES_PHONE, SHOP_ADDRESS, SUPPORT_PHONE, TIKTOK_URL, YOUTUBE_URL, ZALO_QR, ZALO_URL } from '@/lib/contact';
import { ASK_AI } from '@/lib/ask-ai';
import { FooterGroup } from './FooterGroup';
import { Icon } from './Icon';

const ABOUT: [string, string][] = [
  ['Giới thiệu', '/chinh-sach/gioi-thieu'], ['Hệ thống cửa hàng & vườn', '/he-thong-cua-hang'],
  ['Giấy phép kinh doanh', '/chinh-sach/giay-phep-kinh-doanh'], ['Quy chế hoạt động', '/chinh-sach/quy-che-hoat-dong'],
  ['Chính sách giao hàng', '/chinh-sach/giao-hang'], ['Chính sách bảo hành cây', '/chinh-sach/bao-hanh-cay'],
  ['Chính sách đổi trả', '/chinh-sach/doi-tra'], ['Chính sách thanh toán', '/chinh-sach/thanh-toan'],
  ['Chính sách đặt cọc', '/chinh-sach/dat-coc'], ['Chính sách bảo mật dữ liệu cá nhân', '/chinh-sach/bao-mat'],
  ['Điều khoản sử dụng', '/chinh-sach/dieu-khoan'],
];
const LEARN: [string, string][] = [
  ['Góc chăm cây', '/goc-cham-cay'], ['Video ngắn', '/video'], ['Bắt bệnh cho cây', '/benh-cay'],
  ['Hướng dẫn dùng thuốc an toàn', '/chinh-sach/thuoc-bvtv-an-toan'], ['Đối tác sỉ', '/doi-tac'], ['Yêu cầu báo giá sỉ', '/bao-gia-si'],
  ['Tư vấn chọn cây', '/tu-van-chon-cay'], ['Tin khuyến mãi', '/khuyen-mai'], ['Truyền thông', '/tin-tuc'],
];
// [nội dung, số điện thoại, người phụ trách]
const HOTLINES: [string, string, string?][] = [
  ['Kinh doanh sỉ, báo giá', SALES_PHONE, 'Nhân'],
  ['Tư vấn chăm cây, bắt bệnh', CARE_PHONE, 'Thịnh'],
  ['Góp ý, khiếu nại, bảo hành', SUPPORT_PHONE, 'Trâm'],
];
// Logo trong public/images/pay/
const PAY: [string, string, string][] = [
  ['Visa', 'visa.svg', 'https://www.visa.com.vn'], ['Mastercard', 'mastercard.svg', 'https://www.mastercard.com.vn'],
  ['JCB', 'jcb.svg', 'https://www.global.jcb'], ['Napas', 'napas.png', 'https://napas.com.vn'],
  ['VietQR', 'vietqr.svg', 'https://vietqr.net'], ['MoMo', 'momo.svg', 'https://www.momo.vn'],
  ['ZaloPay', 'zalopay.svg', 'https://zalopay.vn'], ['VNPay', 'vnpay.svg', 'https://vnpay.vn'],
  ['Apple Pay', 'applepay.svg', 'https://www.apple.com/vn/apple-pay/'],
];

export function Footer() {
  return (
    <footer className="vx-footer">
      <div className="vx-fband">
        <span className="vx-fband__t">
          <Icon name="pin" size={24} />
          <span>
            Ghé thăm vườn và cửa hàng Cây Cảnh Miền Tây
            <small>Xem cây tận nơi, nhận tư vấn trực tiếp từ kỹ sư</small>
          </span>
        </span>
        <Link className="vx-btn" href="/he-thong-cua-hang">Xem danh sách cửa hàng</Link>
      </div>
      <div className="vx-fnews">
        <Icon name="mail" style={{ color: 'var(--primary)' }} />
        <span>
          <b>Nhận lịch chăm cây theo mùa</b>
          <br />
          <span>Mỗi tháng một email: việc cần làm cho cây, ưu đãi thành viên.</span>
        </span>
        <form className="f">
          <input className="vx-input" type="email" placeholder="Email của bạn" aria-label="Email" />
          <button className="vx-btn vx-btn--primary" type="button">Đăng ký</button>
        </form>
      </div>
      <div className="vx-fcols">
        <FooterGroup title="VỀ CÂY CẢNH MIỀN TÂY">
          {ABOUT.map(([t, h]) => <Link key={t} href={h}>{t}</Link>)}
        </FooterGroup>
        <FooterGroup title="TÌM HIỂU THÊM">
          {LEARN.map(([t, h]) => <Link key={t} href={h}>{t}</Link>)}
        </FooterGroup>
        <div className="vx-fcol">
          <h4>HOTLINE (8:00 – 21:00)</h4>
          {HOTLINES.map(([label, phone, name]) => (
            <div key={label} className="vx-hot">
              <span>{label}</span>
              <b><a href={`tel:${phone}`}>{formatPhone(phone)}</a>{name && <small> ({name})</small>}</b>
            </div>
          ))}
          <h4 style={{ marginTop: 8 }}>CHỨNG NHẬN BỞI</h4>
          <div className="vx-certs">
            <span className="vx-cert"><Icon name="shield" />Đã thông báo Bộ Công Thương</span>
            <span className="vx-cert"><Icon name="shield" />Đủ điều kiện buôn bán thuốc BVTV</span>
          </div>
        </div>
        <div className="vx-fcol">
          <h4>KẾT NỐI VỚI CHÚNG TÔI</h4>
          <div className="vx-social">
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" title="Facebook"><img src="/images/social/facebook.svg" alt="Facebook" width={36} height={36} loading="lazy" /></a>
            <a href={ZALO_URL} target="_blank" rel="noreferrer" title="Zalo"><img src="/images/social/zalo.svg" alt="Zalo" width={36} height={36} loading="lazy" /></a>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" title="YouTube"><img src="/images/social/youtube.svg" alt="YouTube" width={36} height={36} loading="lazy" /></a>
            <a href={TIKTOK_URL} target="_blank" rel="noreferrer" title="TikTok"><img src="/images/social/tiktok.svg" alt="TikTok" width={36} height={36} loading="lazy" /></a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" title="LinkedIn"><img src="/images/social/linkedin.svg" alt="LinkedIn" width={36} height={36} loading="lazy" /></a>
            <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noreferrer" title="Đánh giá trên Google"><img src="/images/social/google.svg" alt="Đánh giá trên Google" width={36} height={36} loading="lazy" /></a>
          </div>
          <h4 style={{ marginTop: 8 }}>HỎI AI VỀ CÂY CẢNH MIỀN TÂY</h4>
          <div className="app-askai">
            {ASK_AI.map((a) => (
              <a key={a.name} href={a.href} target="_blank" rel="noopener noreferrer nofollow" title={a.name} aria-label={`Hỏi ${a.name} về Cây Cảnh Miền Tây`}><img src={`/images/ai/${a.name.toLowerCase()}.svg`} alt="" width={36} height={36} loading="lazy" /></a>
            ))}
          </div>
          {/* Mã QR chỉ có ích khi xem trên máy tính; điện thoại đã có nút "Chat Zalo" ở thanh dưới. */}
          <div className="vx-fcol app-qrbox">
            <h4 style={{ marginTop: 8 }}>QUÉT MÃ CHAT ZALO</h4>
            <a className="vx-qr app-qr" href={ZALO_URL} target="_blank" rel="noreferrer">
              <img src={ZALO_QR} alt="Mã QR Zalo Cây Cảnh Miền Tây" loading="lazy" />
            </a>
          </div>
          <h4 style={{ marginTop: 8 }}>HỖ TRỢ THANH TOÁN</h4>
          <div className="vx-paylogos">
            {PAY.map(([name, file, url]) => (
              <a key={name} className="vx-payl" href={url} target="_blank" rel="noopener noreferrer" title={`Tìm hiểu ${name}`} aria-label={`Trang chủ ${name} (mở tab mới)`}><img src={`/images/pay/${file}`} alt="" loading="lazy" /></a>
            ))}
          </div>
        </div>
      </div>
      <div className="vx-flegal">
        <span>© 2007 - 2026 Cây Cảnh Miền Tây · Số ĐKKD 087096010726 cấp 04/2026 · được quản lý bởi Thuế cơ sở 6 tỉnh Đồng Tháp</span>
        <span><a className="app-langlink" href="/en" hrefLang="en" lang="en">🌐 English</a></span>
        <span>Địa chỉ: {SHOP_ADDRESS} · Điện thoại: {SALES_PHONE} · Email: sale@caycanhmientay.com</span>
      </div>
    </footer>
  );
}
