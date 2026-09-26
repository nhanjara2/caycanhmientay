// Sinh tự động từ design-system/components/PromoNewsLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function PromoNewsView() {
  return (
    <>
      {' '}
      <div className="nw-page">
        <div className="nw-top">
          <div className="vx-crumb">
            <Link href="/">Trang chủ</Link>/<Link href="/goc-cham-cay">Góc chăm cây</Link>/<span>Tin khuyến mãi</span>
          </div>
          <h1>Tin khuyến mãi</h1>
          <div className="nw-subs">
            <a className="nw-sub" aria-current="true">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M3 12V4h8l10 10-8 8z" />
                  <circle cx="7.5" cy="8.5" r="1.5" />
                </svg>
              </span>
              <b>Chương trình khuyến mãi</b>
              <small>6 đang diễn ra</small>
            </a>
            <a className="nw-sub">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
                </svg>
              </span>
              <b>Ưu đãi thành viên</b>
              <small>4 ưu đãi</small>
            </a>
            <a className="nw-sub">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="6" height="6" />
                  <rect x="14" y="4" width="6" height="6" />
                  <rect x="4" y="14" width="6" height="6" />
                  <path d="M14 14h2v2h-2zM18 18h2v2h-2z" />
                </svg>
              </span>
              <b>Ưu đãi thanh toán</b>
              <small>3 đối tác</small>
            </a>
            <a className="nw-sub">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M4 10h16M9 3v4M15 3v4" />
                </svg>
              </span>
              <b>{'Workshop & Sự kiện'}</b>
              <small>2 sắp tới</small>
            </a>
          </div>
          <div className="nw-hero">
            <Link href="/flash-sale" className="nw-hero__main">
              <span className="nw-img promo">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12V4h8l10 10-8 8z" />
                  <circle cx="7.5" cy="8.5" r="1.5" />
                </svg>
              </span>
              <span className="nw-row">
                <span className="nw-tag">Tin khuyến mãi</span>
                <span className="nw-status on">Đang diễn ra</span>
                <span className="nw-when">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                    <path d="M4 10h16M9 3v4M15 3v4" />
                  </svg>
                  01/10 – 15/10/2026
                </span>
              </span>
              <h2>MÙA MƯA KHỎE CÂY – GIẢM 30% THUỐC SINH HỌC, TẶNG GÓI GIÁ THỂ THOÁT NƯỚC</h2>
            </Link>
            <div className="nw-side">
              <Link href="/flash-sale" className="nw-sitem">
                <span className="nw-img sale">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12V4h8l10 10-8 8z" />
                    <circle cx="7.5" cy="8.5" r="1.5" />
                  </svg>
                </span>
                <span>
                  <span className="nw-row">
                    <span className="nw-tag">Tin khuyến mãi</span>
                    <span className="nw-status on">Đang diễn ra</span>
                  </span>
                  <b>Thể lệ Tuần lễ kiểng lá: giảm đến 30%, tặng chậu sứ</b>
                </span>
              </Link>
              <Link href="/flash-sale" className="nw-sitem">
                <span className="nw-img promo">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="4" y="9" width="16" height="11" />
                    <path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z" />
                  </svg>
                </span>
                <span>
                  <span className="nw-row">
                    <span className="nw-tag">Tin khuyến mãi</span>
                    <span className="nw-status on">Đang diễn ra</span>
                  </span>
                  <b>Đăng ký thành viên – nhận ngay voucher 50.000đ</b>
                </span>
              </Link>
              <Link href="/flash-sale" className="nw-sitem">
                <span className="nw-img deep">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="9" r="2" />
                    <path d="M12 5a2 2 0 1 1 0-.1M16 9a2 2 0 1 1 .1 0M12 13a2 2 0 1 1 0 .1M8 9a2 2 0 1 1-.1 0" />
                    <path d="M12 13v8M12 17c-2 0-3-1-4-2" />
                  </svg>
                </span>
                <span>
                  <span className="nw-row">
                    <span className="nw-tag">Tin khuyến mãi</span>
                    <span className="nw-status soon">Sắp diễn ra</span>
                  </span>
                  <b>Đặt trước cây Tết 2027: cọc 30%, giữ giá, giao đúng ngày</b>
                </span>
              </Link>
              <Link href="/flash-sale" className="nw-sitem">
                <span className="nw-img sale">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
                  </svg>
                </span>
                <span>
                  <span className="nw-row">
                    <span className="nw-tag">Tin khuyến mãi</span>
                    <span className="nw-status on">Đang diễn ra</span>
                  </span>
                  <b>Flash sale giờ vàng mỗi ngày 8h – 12h</b>
                </span>
              </Link>
              <Link href="/flash-sale" className="nw-sitem">
                <span className="nw-img ">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                    <circle cx="7" cy="18" r="1.8" />
                    <circle cx="17" cy="18" r="1.8" />
                  </svg>
                </span>
                <span>
                  <span className="nw-row">
                    <span className="nw-tag">Tin khuyến mãi</span>
                    <span className="nw-status on">Đang diễn ra</span>
                  </span>
                  <b>Miễn phí giao cây sống nội thành cho đơn từ 500.000đ</b>
                </span>
              </Link>
            </div>
          </div>
        </div>
        <div className="nw-body">
          <div className="nw-list">
            <div className="nw-row" style={{ gap: '8px' }}>
              <button className="vx-chip" aria-pressed="true">
                Tất cả
              </button>
              <button className="vx-chip">Đang diễn ra</button>
              <button className="vx-chip">Sắp diễn ra</button>
              <button className="vx-chip">Đã kết thúc</button>
            </div>
            <Link href="/flash-sale" className="nw-card ">
              <span className="nw-img ">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="6" height="6" />
                  <rect x="14" y="4" width="6" height="6" />
                  <rect x="4" y="14" width="6" height="6" />
                  <path d="M14 14h2v2h-2zM18 18h2v2h-2z" />
                </svg>
              </span>
              <span>
                <span className="nw-row">
                  <span className="nw-tag">Ưu đãi thanh toán</span>
                  <span className="nw-status on">Đang diễn ra</span>
                </span>
                <b>ƯU ĐÃI THANH TOÁN QUA VÍ ĐIỆN TỬ KHI MUA TẠI WEB VÀ APP CÂY CẢNH MIỀN TÂY</b>
                <p>
                  Nhận voucher giảm thêm khi thanh toán bằng ví điện tử đối tác. Chỉ vài thao tác, áp dụng ngay ở bước
                  thanh toán.
                </p>
                <span className="foot">
                  <span className="nw-when">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <rect x="4" y="5" width="16" height="15" rx="2" />
                      <path d="M4 10h16M9 3v4M15 3v4" />
                    </svg>
                    Đến 31/10/2026
                  </span>
                  <button className="vx-btn vx-btn--primary vx-btn--sm">Nhận ưu đãi</button>
                </span>
              </span>
            </Link>
            <Link href="/flash-sale" className="nw-card ">
              <span className="nw-img deep">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
                  <path d="M5 19 13 11" />
                </svg>
              </span>
              <span>
                <span className="nw-row">
                  <span className="nw-tag">{'Workshop & Sự kiện'}</span>
                  <span className="nw-status soon">Sắp diễn ra</span>
                </span>
                <b>WORKSHOP LÀM TERRARIUM CUỐI TUẦN TẠI VƯỜN – MIỄN PHÍ CHO THÀNH VIÊN</b>
                <p>
                  Tự tay làm một hộp terrarium mini dưới sự hướng dẫn của nghệ nhân. Số chỗ có hạn, đăng ký trước để giữ
                  chỗ.
                </p>
                <span className="foot">
                  <span className="nw-when">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <rect x="4" y="5" width="16" height="15" rx="2" />
                      <path d="M4 10h16M9 3v4M15 3v4" />
                    </svg>
                    05/10/2026 · 9:00
                  </span>
                  <button className="vx-btn vx-btn--outline vx-btn--sm">Đăng ký</button>
                </span>
              </span>
            </Link>
            <Link href="/flash-sale" className="nw-card ended">
              <span className="nw-img sale">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="9" width="16" height="11" />
                  <path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z" />
                </svg>
              </span>
              <span>
                <span className="nw-row">
                  <span className="nw-tag">Chương trình khuyến mãi</span>
                  <span className="nw-status off">Đã kết thúc</span>
                </span>
                <b>TRUNG THU XANH – MUA CÂY TẶNG ĐÈN LỒNG HANDMADE</b>
                <p>Mỗi đơn cây cảnh từ 300.000đ được tặng 1 đèn lồng làm từ vật liệu tái chế.</p>
                <span className="foot">
                  <span className="nw-when">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <rect x="4" y="5" width="16" height="15" rx="2" />
                      <path d="M4 10h16M9 3v4M15 3v4" />
                    </svg>
                    10/09 – 17/09/2026
                  </span>
                  <button className="vx-btn vx-btn--ghost vx-btn--sm">Xem thể lệ</button>
                </span>
              </span>
            </Link>
          </div>
          <aside className="nw-aside">
            <div className="nw-box deep">
              <h3>Nhận tin khuyến mãi sớm nhất</h3>
              <p>Đăng ký nhận tin qua Zalo để không bỏ lỡ flash sale và ưu đãi thành viên.</p>
              <button className="vx-btn" style={{ background: 'var(--surface)', color: 'var(--primary)' }}>
                Quan tâm Zalo OA
              </button>
            </div>
            <div className="nw-box">
              <h3>Sắp hết hạn</h3>
              <a>
                Tuần lễ kiểng lá giảm đến 30%<small>Còn 2 ngày</small>
              </a>
              <a>
                Voucher hạng Bạc 50.000đ<small>Còn 12 ngày</small>
              </a>
            </div>
          </aside>
        </div>
      </div>{' '}
    </>
  );
}
