// Sinh tự động từ design-system/components/AdminDelivery/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminDeliveryView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>Giao hàng · 24/09</h1>
          <span className="acts">
            <span className="ad-sel">
              Kho: Vườn Q7
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <button className="vx-btn vx-btn--outline">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
                <path d="M9 4v14M15 6v14" />
              </svg>
              Xem bản đồ
            </button>
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <circle cx="6" cy="18" r="2" />
                <circle cx="18" cy="6" r="2" />
                <path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
              </svg>
              Tối ưu tuyến
            </button>
          </span>
        </div>{' '}
        <div className="ad-kpis">
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                <circle cx="7" cy="18" r="1.8" />
                <circle cx="17" cy="18" r="1.8" />
              </svg>
              Chuyến hôm nay
            </span>
            <b>6</b>
            <small>3 xe tải · 3 xe máy</small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M6 12h12l-1.5 8h-9z" />
                <path d="M12 12V7" />
                <path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" />
                <path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" />
              </svg>
              Đơn có cây sống
            </span>
            <b>23</b>
            <small>4 đơn cây ≥ size L</small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m5 12 5 5 9-10" />
              </svg>
              Đúng khung giờ
            </span>
            <b>96%</b>
            <small>7 ngày qua</small>
          </div>
          <div className="ad-kpi warn">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="m21 16-5-5-9 8" />
              </svg>
              Thiếu ảnh cây
            </span>
            <b>2</b>
            <small>Chưa được xuất kho</small>
          </div>
        </div>{' '}
        <div className="ad-board">
          <div className="ad-col">
            <div className="ad-col__h">
              Chưa xếp chuyến<small>3 đơn</small>
            </div>
            <div className="ad-trip ad-unassigned">
              <span className="t">
                MT0095398<small>14–18h</small>
              </span>
              <span style={{ fontSize: '12px' }}>Hẻm 43/46 Vườn Lài · Tân Thuận</span>
              <span className="ad-tags">
                <span className="vx-badge vx-badge--info">Hẻm nhỏ</span>
                <span className="vx-badge vx-badge--info">Lan</span>
              </span>
            </div>
            <div className="ad-trip ad-unassigned">
              <span className="t">
                MT0095350<small>8–12h mai</small>
              </span>
              <span style={{ fontSize: '12px' }}>1487 Nguyễn Văn Linh · Tầng 12</span>
              <span className="ad-tags">
                <span className="vx-badge vx-badge--info">12 cây</span>
                <span className="vx-badge vx-badge--info">Thang máy</span>
              </span>
            </div>
          </div>{' '}
          <div className="ad-col">
            <div className="ad-col__h">
              Ca sáng 8–12h<small>2 chuyến</small>
            </div>
            <div className="ad-trip">
              <span className="t">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                  <circle cx="7" cy="18" r="1.8" />
                  <circle cx="17" cy="18" r="1.8" />
                </svg>
                Xe tải 01<small>1,25 tấn</small>
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Tài xế Hùng + 1 phụ</span>
              <span className="ad-load">
                Tải 70%
                <i>
                  <em style={{ width: '70%' }} />
                </i>
              </span>
              <div className="ad-stop">
                <b>1</b>
                <span>
                  Công ty An Phát · 12 cây<small>Q7 · 08:30</small>
                </span>
              </div>
              <div className="ad-stop">
                <b>2</b>
                <span>
                  Monstera L · Phạm Hữu Lầu<small>Q7 · 09:40</small>
                </span>
              </div>
            </div>
            <div className="ad-trip">
              <span className="t">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                  <circle cx="7" cy="18" r="1.8" />
                  <circle cx="17" cy="18" r="1.8" />
                </svg>
                Xe máy 02<small>Xe máy</small>
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Tài xế Tâm</span>
              <span className="ad-load">
                Tải 40%
                <i>
                  <em style={{ width: '40%' }} />
                </i>
              </span>
              <div className="ad-stop">
                <b>1</b>
                <span>
                  Trichoderma x2<small>Q4 · 09:00</small>
                </span>
              </div>
            </div>
          </div>{' '}
          <div className="ad-col">
            <div className="ad-col__h">
              Ca chiều 14–18h<small>1 chuyến</small>
            </div>
            <div className="ad-trip">
              <span className="t">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                  <circle cx="7" cy="18" r="1.8" />
                  <circle cx="17" cy="18" r="1.8" />
                </svg>
                Xe máy 03<small>Xe máy</small>
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Tài xế Lộc</span>
              <span className="ad-load">
                Tải 85%
                <i>
                  <em style={{ width: '85%' }} />
                </i>
              </span>
              <div className="ad-stop">
                <b>1</b>
                <span>
                  Lan hồ điệp · Tân Thuận<small>14:30</small>
                </span>
              </div>
              <div className="ad-stop">
                <b>2</b>
                <span>
                  Sen đá mini x6 · Q1<small>15:20</small>
                </span>
              </div>
              <div className="ad-stop">
                <b>3</b>
                <span>
                  Đất 20dm³ x2 · Q3<small>16:10</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
