import Link from 'next/link';
import { categories } from '@/lib/catalog';
import { FACEBOOK_URL, SALES_PHONE, YOUTUBE_URL, ZALO_QR, ZALO_URL } from '@/lib/contact';
import { Icon } from './Icon';

const ABOUT: [string, string][] = [
  ['Giới thiệu', '/chinh-sach/gioi-thieu'], ['Hệ thống cửa hàng & vườn', '/he-thong-cua-hang'],
  ['Giấy phép kinh doanh', '/chinh-sach/giay-phep-kinh-doanh'], ['Quy chế hoạt động', '/chinh-sach/quy-che-hoat-dong'],
  ['Chính sách giao hàng', '/chinh-sach/giao-hang'], ['Chính sách bảo hành cây', '/chinh-sach/bao-hanh-cay'],
  ['Chính sách đổi trả', '/chinh-sach/doi-tra'], ['Chính sách thanh toán', '/chinh-sach/thanh-toan'],
  ['Chính sách đặt cọc', '/chinh-sach/dat-coc'], ['Chính sách bảo mật dữ liệu cá nhân', '/chinh-sach/bao-mat'],
  ['Điều khoản sử dụng', '/chinh-sach/dieu-khoan'], ['Nguồn ảnh minh họa', '/chinh-sach/nguon-anh'],
];
const LEARN: [string, string][] = [
  ['Góc chăm cây', '/goc-cham-cay'], ['Bắt bệnh cho cây', '/benh-cay'], ['Tra cứu thuốc BVTV', '/danh-muc/thuoc-bvtv'],
  ['Hướng dẫn dùng thuốc an toàn', '/chinh-sach/thuoc-bvtv-an-toan'], ['Dịch vụ sân vườn', '/dich-vu'],
  ['Khách doanh nghiệp', '/doanh-nghiep'], ['Tin khuyến mãi', '/khuyen-mai'], ['Truyền thông', '/tin-tuc'],
];
// [nội dung, số điện thoại, người phụ trách]
const HOTLINES: [string, string, string?][] = [
  ['Tư vấn mua hàng', SALES_PHONE, 'Nhân'],
  ['Tư vấn chăm cây, bắt bệnh, dịch vụ sân vườn', '0927291989', 'Thịnh'],
  ['Góp ý, khiếu nại, bảo hành', '0973806842', 'Trâm'],
];
// Logo trong public/images/pay/
const PAY: [string, string][] = [
  ['Visa', 'visa.svg'], ['Mastercard', 'mastercard.svg'], ['JCB', 'jcb.svg'], ['Napas', 'napas.png'],
  ['VietQR', 'vietqr.svg'], ['MoMo', 'momo.svg'], ['ZaloPay', 'zalopay.svg'], ['VNPay', 'vnpay.svg'],
  ['Apple Pay', 'applepay.svg'],
];

/** 0703005001 → 0703 005 001 */
const formatPhone = (p: string) => p.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');

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
        <div className="vx-fcol">
          <h4>VỀ CÂY CẢNH MIỀN TÂY</h4>
          {ABOUT.map(([t, h]) => <Link key={t} href={h}>{t}</Link>)}
        </div>
        <div className="vx-fcol">
          <h4>DANH MỤC</h4>
          {categories.slice(0, 8).map((c) => (
            <Link key={c.slug} href={`/danh-muc/${c.slug}`}>{c.name}</Link>
          ))}
        </div>
        <div className="vx-fcol">
          <h4>TÌM HIỂU THÊM</h4>
          {LEARN.map(([t, h]) => <Link key={t} href={h}>{t}</Link>)}
        </div>
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
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" title="Facebook"><img src="/images/social/facebook.svg" alt="Facebook" /></a>
            <a href={ZALO_URL} target="_blank" rel="noreferrer" title="Zalo"><img src="/images/social/zalo.svg" alt="Zalo" /></a>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" title="YouTube"><img src="/images/social/youtube.svg" alt="YouTube" /></a>
          </div>
          <h4 style={{ marginTop: 8 }}>QUÉT MÃ CHAT ZALO</h4>
          <a className="vx-qr app-qr" href={ZALO_URL} target="_blank" rel="noreferrer">
            <img src={ZALO_QR} alt="Mã QR Zalo Cây Cảnh Miền Tây" loading="lazy" />
          </a>
          <h4 style={{ marginTop: 8 }}>HỖ TRỢ THANH TOÁN</h4>
          <div className="vx-paylogos">
            {PAY.map(([name, file]) => (
              <span key={name} className="vx-payl" title={name}><img src={`/images/pay/${file}`} alt={name} loading="lazy" /></span>
            ))}
          </div>
        </div>
      </div>
      <div className="vx-flegal">
        <span>© 2026 Công ty [Tên pháp nhân] · Mã số doanh nghiệp: [MST] cấp ngày [ngày] tại [nơi cấp]</span>
        <span>Địa chỉ: [địa chỉ trụ sở] · Điện thoại: [số điện thoại] · Email: [email] · Người chịu trách nhiệm nội dung: [họ tên]</span>
      </div>
    </footer>
  );
}
