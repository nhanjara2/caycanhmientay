// Sinh tự động từ design-system/components/StaffDeliveryApp/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function StaffDeliveryView() {
  return (
    <>
      {' '}
      <div className="m-stage">
        <div>
          <p className="m-cap">Chuyến đang chạy</p>
          <div className="m-phone">
            <div className="m-status deep">
              <span>9:41</span>
              <span>5G · 100%</span>
            </div>
            <div className="s-head">
              <div className="row">
                <span>
                  <b>Chuyến chiều · Xe máy 03</b>
                  <small>24/09 · 14:00 – 18:00</small>
                </span>
                <span className="pill">Đang giao</span>
              </div>
              <div className="s-prog">
                <div>
                  <b>1/3</b>Điểm đã giao
                </div>
                <div>
                  <b>455k</b>Thu hộ COD
                </div>
                <div>
                  <b>12 km</b>Còn lại
                </div>
              </div>
            </div>{' '}
            <div className="m-scroll" style={{ paddingTop: '12px', gap: '10px' }}>
              <div className="s-stop done">
                <div className="top">
                  <b className="n">
                    <svg
                      className="vx-ico"
                      viewBox="0 0 24 24"
                      style={{ width: '13px', height: '13px', strokeWidth: '3' }}
                    >
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </b>
                  <span>Sen đá mini x6</span>
                  <small>14:22</small>
                </div>
              </div>{' '}
              <div className="s-stop cur">
                <div className="top">
                  <b className="n">2</b>
                  <span>Chị Ngọc · MT0095398</span>
                  <small>Dự kiến 14:50</small>
                </div>
                <span className="addr">Hẻm 43/46 Vườn Lài, Phường Tân Thuận</span>
                <span className="flags">
                  <span className="vx-badge vx-badge--info">Lan hồ điệp · 1 chậu</span>
                  <span className="vx-badge vx-badge--info">Hẻm nhỏ</span>
                  <span className="vx-badge vx-badge--info">Dễ vỡ</span>
                </span>
                <div className="s-cod">
                  <span>Thu hộ (COD)</span>
                  <b>455.000đ</b>
                </div>
                <div className="acts">
                  <button className="vx-btn vx-btn--soft">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
                    </svg>
                    Gọi
                  </button>
                  <button className="vx-btn vx-btn--outline">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                      <path d="m3 11 18-8-8 18-2-8z" />
                    </svg>
                    Chỉ đường
                  </button>
                  <button className="vx-btn vx-btn--primary">Đã đến</button>
                </div>
              </div>{' '}
              <div className="s-stop">
                <div className="top">
                  <b className="n">3</b>
                  <span>Đất 20dm³ x2</span>
                  <small>16:10</small>
                </div>
                <span className="addr">Phường Võ Thị Sáu</span>
              </div>
            </div>
            <nav className="s-tabbar">
              <a aria-current="true">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="6" cy="18" r="2" />
                  <circle cx="18" cy="6" r="2" />
                  <path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
                </svg>
                Chuyến
              </a>
              <a>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
                  <path d="M9 4v14M15 6v14" />
                </svg>
                Bản đồ
              </a>
              <a>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
                Thu tiền
              </a>
              <a>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
                </svg>
                Tôi
              </a>
            </nav>
          </div>
        </div>
        <div>
          <p className="m-cap">Xác nhận giao</p>
          <div className="m-phone">
            <div className="m-status deep">
              <span>9:41</span>
              <span>5G · 100%</span>
            </div>
            <div
              className="m-topbar"
              style={{ background: 'var(--primary-deep)', color: 'var(--on-deep)', border: '0' }}
            >
              <button className="m-ibtn" style={{ color: 'var(--on-deep)' }}>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <b>Xác nhận giao · Điểm 2</b>
            </div>
            <div className="m-scroll" style={{ paddingTop: '12px', gap: '12px' }}>
              <div className="m-pad">
                <div className="s-bigbtn">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  Chụp ảnh cây tại nơi giao<small>Bắt buộc với cây sống · dùng làm căn cứ bảo hành</small>
                </div>
              </div>{' '}
              <div className="m-section" style={{ margin: '0 12px', borderRadius: '12px' }}>
                <h3>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Kiểm tra với khách
                </h3>
                <label className="vx-check">
                  <span className="vx-box">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </span>
                  Cây nguyên vẹn, không dập lá
                </label>
                <label className="vx-check">
                  <span className="vx-box">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </span>
                  Đã đưa thẻ hướng dẫn chăm cây
                </label>
                <label className="vx-check">
                  <span className="vx-box" style={{ background: 'var(--surface)', color: 'var(--surface)' }}>
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </span>
                  Đặt cây đúng vị trí khách yêu cầu
                </label>
              </div>{' '}
              <div className="m-section" style={{ margin: '0 12px', borderRadius: '12px' }}>
                <h3>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                  Thu tiền
                </h3>
                <div className="vx-toggle app-cols" style={{ display: 'grid', '--cols': '1fr 1fr' }}>
                  <button aria-pressed="true" style={{ justifyContent: 'center' }}>
                    Tiền mặt 455.000đ
                  </button>
                  <button style={{ justifyContent: 'center' }}>Khách quét QR</button>
                </div>
              </div>{' '}
              <div className="m-pad">
                <button className="vx-btn vx-btn--ghost vx-btn--block" style={{ color: 'var(--danger)' }}>
                  Không giao được · báo lý do
                </button>
              </div>
            </div>
            <div className="m-buybar">
              <button className="vx-btn vx-btn--primary">Hoàn tất giao hàng</button>
            </div>
          </div>
        </div>
      </div>{' '}
    </>
  );
}
