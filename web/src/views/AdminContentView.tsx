// Sinh tự động từ design-system/components/AdminContent/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminContentView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>Sửa bài viết</h1>
          <span className="acts">
            <button className="vx-btn vx-btn--outline">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Xem trước
            </button>
            <button className="vx-btn vx-btn--outline">Lưu nháp</button>
            <button className="vx-btn vx-btn--primary">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <path d="m5 12 5 5 9-10" />
              </svg>
              Gửi kiểm duyệt
            </button>
          </span>
        </div>
        <div className="ad-editor">
          <div className="ad-paper">
            <div className="ad-tools">
              <span className="on">H2</span>
              <span>H3</span>
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                  <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />
                </svg>
              </span>
              <span>• Danh sách</span>
              <span>Ảnh</span>
              <span>Video</span>
              <span>Bảng</span>
              <span>Lưu ý</span>
              <span className="on">+ Sản phẩm</span>
            </div>{' '}
            <div className="ad-doc">
              <h1>5 dấu hiệu cây kiểng lá bị thối rễ mùa mưa và cách cứu kịp</h1>
              <p style={{ color: 'var(--ink-muted)' }}>
                Mùa mưa độ ẩm cao, chậu thoát nước kém là nguyên nhân hàng đầu khiến kiểng lá thối rễ. Nhận biết sớm
                giúp cứu cây trong 1–2 tuần.
              </p>{' '}
              <h2>1. Lá vàng từ dưới lên, mềm oặt</h2>
              <p>Lá già phía dưới vàng đều, cầm vào mềm, không giòn như khi thiếu nước…</p>{' '}
              <div className="ad-block">
                <span className="ad-thumb">
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
                <span>
                  <b style={{ color: 'var(--ink)' }}>Khối sản phẩm:</b>
                  {' Trichoderma trị nấm, thối rễ 500ml · Đất trộn kiểng lá · Đá lót chậu'}
                </span>
              </div>{' '}
              <div className="vx-note">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M12 3 2 20h20z" />
                  <path d="M12 10v4M12 17v.5" />
                </svg>
                <div>
                  <b>Lưu ý an toàn:</b>
                  {' Đeo găng tay khi pha thuốc, để xa trẻ em và vật nuôi.'}
                </div>
              </div>
            </div>
          </div>{' '}
          <div className="ad-fcol">
            <div className="ad-card">
              <div className="ad-card__h">Xuất bản</div>
              <div className="ad-card__b">
                <div className="ad-f">
                  <label>Chuyên mục</label>
                  <div className="vx-input vx-input--select">
                    <span>Bắt bệnh cây</span>
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
                <div className="ad-f">
                  <label>
                    {'Kỹ sư kiểm duyệt '}
                    <i>*</i>
                  </label>
                  <div className="vx-input vx-input--select">
                    <span>Nguyễn Thu Hà · KS BVTV</span>
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
                <div className="ad-f">
                  <label>Gắn bệnh trong thư viện</label>
                  <span className="ad-tags">
                    <span className="vx-badge vx-badge--info">Thối rễ</span>
                    <span className="vx-badge vx-badge--info">Úng rễ</span>
                  </span>
                </div>
                <div className="ad-f">
                  <label>Lịch đăng</label>
                  <div className="vx-input vx-input--select">
                    <span>28/09/2026 · 07:00</span>
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <rect x="4" y="5" width="16" height="15" rx="2" />
                      <path d="M4 10h16M9 3v4M15 3v4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>{' '}
            <div className="ad-card">
              <div className="ad-card__h">Kiểm tra trước khi đăng</div>
              <div className="ad-card__b">
                <div className="ad-check">
                  <div className="ok">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                    Tiêu đề 58 ký tự (tốt cho SEO)
                  </div>
                  <div className="ok">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                    Có ảnh bìa 16:9
                  </div>
                  <div className="ok">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                    Có ít nhất 1 khối sản phẩm
                  </div>
                  <div className="ok">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                    Có hộp lưu ý an toàn (bài có thuốc)
                  </div>
                  <div className="no">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="M12 3 2 20h20z" />
                      <path d="M12 10v4M12 17v.5" />
                    </svg>
                    Chưa có mô tả SEO
                  </div>
                  <div className="no">
                    <svg className="vx-ico" viewBox="0 0 24 24">
                      <path d="M12 3 2 20h20z" />
                      <path d="M12 10v4M12 17v.5" />
                    </svg>
                    Chưa được kỹ sư duyệt
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
