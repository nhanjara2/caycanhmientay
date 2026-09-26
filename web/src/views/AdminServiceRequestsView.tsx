// Sinh tự động từ design-system/components/AdminServiceRequests/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminServiceRequestsView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>Yêu cầu dịch vụ</h1>
          <span className="acts">
            <span className="ad-sel">
              Tất cả dịch vụ
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <span className="ad-sel">
              Kỹ sư: Tất cả
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tạo yêu cầu
            </button>
          </span>
        </div>
        <div className="ad-kpis">
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M6 3h9l4 4v14H6z" />
                <path d="M9 12h7M9 16h7" />
              </svg>
              Yêu cầu tháng này
            </span>
            <b>24</b>
            <small>
              <span className="ad-up">▲ 6</span>
              {' so với tháng trước'}
            </small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m5 12 5 5 9-10" />
              </svg>
              Tỉ lệ chốt
            </span>
            <b>38%</b>
            <small>Báo giá → ký hợp đồng</small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              Doanh thu dịch vụ
            </span>
            <b>312 tr</b>
            <small>Đang thi công: 186 tr</small>
          </div>
          <div className="ad-kpi warn">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l3 2" />
              </svg>
              Chưa gọi lại quá 2 giờ
            </span>
            <b>1</b>
            <small>Cần xử lý ngay</small>
          </div>
        </div>
        <div className="kb">
          <div className="kb-col">
            <div className="kb-col__h">
              Mới<small>3</small>
            </div>
            <div className="kb-card">
              <b>Chị Thu Lan</b>
              <span>Ban công 8m² · Q7</span>
              <span className="row">
                <span className="val">10–30 tr</span>
                <span className="late">Gọi trong 1 giờ</span>
              </span>
            </div>
            <div className="kb-card">
              <b>Cty Minh Phát</b>
              <span>Thuê 30 cây văn phòng</span>
              <span className="row">
                <span className="val">~2,4 tr/th</span>
                <span className="">Mới 20 phút</span>
              </span>
            </div>
          </div>
          <div className="kb-col">
            <div className="kb-col__h">
              Đã hẹn khảo sát<small>4</small>
            </div>
            <div className="kb-card">
              <b>Anh Hoàng</b>
              <span>Sân vườn 60m² · Thủ Đức</span>
              <span className="vx-badge vx-badge--info">KS: Phạm Gia Huy</span>
              <span className="row">
                <span className="val">30–100 tr</span>
                <span className="">KS 28/09 · 9h</span>
              </span>
            </div>
            <div className="kb-card">
              <b>Chị Mai</b>
              <span>Chăm sóc định kỳ</span>
              <span className="row">
                <span className="val">350k/lần</span>
                <span className="">KS 27/09 · 14h</span>
              </span>
            </div>
          </div>
          <div className="kb-col">
            <div className="kb-col__h">
              Đã báo giá<small>3</small>
            </div>
            <div className="kb-card">
              <b>Nhà hàng Lá</b>
              <span>Tiểu cảnh sảnh</span>
              <span className="row">
                <span className="val">42 tr</span>
                <span className="late">Gửi 3 ngày trước</span>
              </span>
            </div>
            <div className="kb-card">
              <b>Cty An Phát</b>
              <span>Đổi mẫu cây Tết</span>
              <span className="row">
                <span className="val">8,5 tr</span>
                <span className="">Gửi hôm qua</span>
              </span>
            </div>
          </div>
          <div className="kb-col">
            <div className="kb-col__h">
              Đang thi công<small>2</small>
            </div>
            <div className="kb-card">
              <b>Villa Thảo Điền</b>
              <span>Sân vườn 120m²</span>
              <span className="row">
                <span className="val">186 tr</span>
                <span className="">Xong 60% · 02/10</span>
              </span>
            </div>
          </div>
          <div className="kb-col">
            <div className="kb-col__h">
              Hoàn thành<small>18</small>
            </div>
            <div className="kb-card">
              <b>Chị Phương</b>
              <span>Ban công 6m²</span>
              <span className="row">
                <span className="val">14 tr</span>
                <span className="">Bảo hành đến 20/10</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
