// Sinh tự động từ design-system/components/AdminPOS/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminPOSView() {
  return (
    <>
      {' '}
      <div className="pos">
        <div className="pos-left">
          <div className="pos-top">
            <div className="vx-sfind__search">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10" />
              </svg>
              <span>Quét mã vạch hoặc gõ tên sản phẩm (F2)</span>
            </div>
            <span className="ad-sel">
              Cửa hàng: Vườn Q7
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <span className="ad-me">
              <span className="vx-avatar vx-avatar--sm">LT</span>Lê Thảo
            </span>
          </div>
          <div className="pos-cats">
            <button className="vx-chip" aria-pressed="true">
              Bán chạy
            </button>
            <button className="vx-chip">Cây cảnh</button>
            <button className="vx-chip">Sen đá</button>
            <button className="vx-chip">Chậu</button>
            <button className="vx-chip">Đất – Giá thể</button>
            <button className="vx-chip">Thuốc BVTV</button>
            <button className="vx-chip">Phân bón</button>
          </div>
          <div className="pos-grid">
            <div className="pos-item">
              <span className="q">1</span>
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 12h12l-1.5 8h-9z" />
                  <path d="M12 12V7" />
                  <path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" />
                  <path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" />
                </svg>
              </span>
              <b>Monstera M 65cm</b>
              <span className="pr">289.000đ</span>
              <small>21 tồn</small>
            </div>
            <div className="pos-item">
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="9" r="2" />
                  <path d="M12 5a2 2 0 1 1 0-.1M16 9a2 2 0 1 1 .1 0M12 13a2 2 0 1 1 0 .1M8 9a2 2 0 1 1-.1 0" />
                  <path d="M12 13v8M12 17c-2 0-3-1-4-2" />
                </svg>
              </span>
              <b>Lan hồ điệp 2 cành</b>
              <span className="pr">420.000đ</span>
              <small>14 tồn</small>
            </div>
            <div className="pos-item">
              <span className="q">3</span>
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21V5a2 2 0 0 1 4 0v8M12 13H9a2 2 0 0 1-2-2V8" />
                  <path d="M8 21h8" />
                </svg>
              </span>
              <b>Sen đá mini</b>
              <span className="pr">25.000đ</span>
              <small>86 tồn</small>
            </div>
            <div className="pos-item">
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z" />
                  <path d="M8 13h8" />
                </svg>
              </span>
              <b>Trichoderma 500ml</b>
              <span className="pr">65.000đ</span>
              <small>4 tồn</small>
            </div>
            <div className="pos-item">
              <span className="q">1</span>
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 7h12l1 13H5z" />
                  <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                </svg>
              </span>
              <b>Đất kiểng lá 5dm³</b>
              <span className="pr">42.500đ</span>
              <small>40 tồn</small>
            </div>
            <div className="pos-item">
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 12h12l-1.5 8h-9z" />
                  <path d="M12 12V7" />
                  <path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" />
                  <path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" />
                </svg>
              </span>
              <b>Kim tiền chậu men</b>
              <span className="pr">235.000đ</span>
              <small>9 tồn</small>
            </div>
            <div className="pos-item">
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 7h12l1 13H5z" />
                  <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                </svg>
              </span>
              <b>Đá lót chậu 1kg</b>
              <span className="pr">25.000đ</span>
              <small>52 tồn</small>
            </div>
            <div className="pos-item">
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 12h12l-1.5 8h-9z" />
                  <path d="M12 12V7" />
                  <path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" />
                  <path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" />
                </svg>
              </span>
              <b>Chậu sứ trắng Ø15</b>
              <span className="pr">55.000đ</span>
              <small>30 tồn</small>
            </div>
            <div className="pos-item">
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z" />
                  <path d="M8 13h8" />
                </svg>
              </span>
              <b>Phân bón lá lan</b>
              <span className="pr">89.000đ</span>
              <small>18 tồn</small>
            </div>
            <div className="pos-item">
              <span className="im">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21v-7" />
                  <path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2-5-5-5 0 3 2 5 5 5z" />
                </svg>
              </span>
              <b>Hạt giống húng quế</b>
              <span className="pr">15.000đ</span>
              <small>120 tồn</small>
            </div>
          </div>
        </div>{' '}
        <div className="pos-right">
          <div className="pos-cust">
            <div className="au-phone">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
                </svg>
              </span>
              <input defaultValue="0703 005 001" />
            </div>
            <div className="au-who">
              <span className="vx-avatar vx-avatar--sm">LN</span>
              <span>
                <b>Lê Hoài Nhân</b>
                <small>Bạc · 1.250 điểm · 4 voucher</small>
              </span>
              <span className="ok">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="m5 12 5 5 9-10" />
                </svg>
                Thành viên
              </span>
            </div>
          </div>{' '}
          <div className="pos-lines">
            <div className="pos-line">
              <span>
                Monstera Deliciosa M 65cm<small>289.000đ</small>
              </span>
              <span className="vx-stepper">
                <button>−</button>
                <span>1</span>
                <button>+</button>
              </span>
              <b>289.000đ</b>
            </div>
            <div className="pos-line">
              <span>
                Sen đá mini<small>25.000đ</small>
              </span>
              <span className="vx-stepper">
                <button>−</button>
                <span>3</span>
                <button>+</button>
              </span>
              <b>75.000đ</b>
            </div>
            <div className="pos-line">
              <span>
                Đất kiểng lá 5dm³<small>42.500đ</small>
              </span>
              <span className="vx-stepper">
                <button>−</button>
                <span>1</span>
                <button>+</button>
              </span>
              <b>42.500đ</b>
            </div>
          </div>
          <div className="pos-sum">
            <div className="r">
              <span>Tạm tính (5 món)</span>
              <b>406.500đ</b>
            </div>
            <div className="r">
              <span>Voucher hạng Bạc</span>
              <b className="neg" style={{ color: 'var(--sale)' }}>
                {'-0đ '}
                <small style={{ color: 'var(--ink-muted)', fontWeight: '400' }}>(cần đơn 800k)</small>
              </b>
            </div>
            <div className="r">
              <span>Dùng điểm</span>
              <button className="vx-switch" aria-checked="false" />
            </div>
            <div className="r tot">
              <span>Khách trả</span>
              <b>406.500đ</b>
            </div>{' '}
            <div className="pos-pay">
              <button aria-pressed="true">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
                Tiền mặt
              </button>
              <button>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="6" height="6" />
                  <rect x="14" y="4" width="6" height="6" />
                  <rect x="4" y="14" width="6" height="6" />
                  <path d="M14 14h2v2h-2zM18 18h2v2h-2z" />
                </svg>
                QR
              </button>
              <button>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="3" y="6" width="18" height="13" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                Thẻ
              </button>
            </div>
            <div className="vx-label-row" style={{ fontSize: '12px' }}>
              <span>Gửi hóa đơn và lịch chăm cây qua Zalo</span>
              <button className="vx-switch" aria-checked="true" />
            </div>
            <button className="vx-btn vx-btn--primary vx-btn--block pos-cta">Thanh toán 406.500đ (F9)</button>
          </div>
        </div>
      </div>{' '}
    </>
  );
}
