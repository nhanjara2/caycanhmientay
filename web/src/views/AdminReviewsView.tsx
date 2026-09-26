// Sinh tự động từ design-system/components/AdminReviews/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.

export function AdminReviewsView() {
  return (
    <>
      <div className="ad-body">
        <div className="ad-title">
          <h1>{'Hỏi đáp & đánh giá'}</h1>
          <span className="acts">
            <span className="ad-sel">
              Tất cả sản phẩm
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <span className="ad-sel">
              7 ngày qua
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </span>
        </div>
        <div className="ad-kpis">
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
              </svg>
              Điểm trung bình
            </span>
            <b>4,7</b>
            <small>382 đánh giá</small>
          </div>
          <div className="ad-kpi warn">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M4 5h16v11H9l-5 4z" />
              </svg>
              Câu hỏi chưa trả lời
            </span>
            <b>8</b>
            <small>Cam kết trả lời trong 2 giờ</small>
          </div>
          <div className="ad-kpi warn">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="M5 21V4h11l-2 4 2 4H5" />
              </svg>
              Đánh giá chờ duyệt
            </span>
            <b>5</b>
            <small>2 dưới 3 sao</small>
          </div>
          <div className="ad-kpi ">
            <span>
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m5 12 5 5 9-10" />
              </svg>
              Tỉ lệ đã phản hồi
            </span>
            <b>96%</b>
            <small>30 ngày qua</small>
          </div>
        </div>{' '}
        <div className="ad-card">
          <div className="ad-stabs">
            <a aria-current="true">
              Chờ duyệt<em>5</em>
            </a>
            <a>
              Câu hỏi<em>8</em>
            </a>
            <a>Đã duyệt</a>
            <a>Đã ẩn</a>
          </div>
          <div className="ad-filters">
            <div className="vx-sfind__search">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '15px', height: '15px' }}>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span>Nội dung, tên khách, sản phẩm</span>
            </div>
            <span className="ad-sel">
              Số sao
              <svg className="vx-ico" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <span className="ad-sel">
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="m21 16-5-5-9 8" />
              </svg>
              Có ảnh
            </span>
          </div>
          <div className="rv-item">
            <span className="ad-thumb">
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
            <span>
              <span className="meta">
                <b style={{ color: 'var(--ink)' }}>Chị Ngọc</b>
                <span className="vx-stars">★★☆☆☆</span>· Lan hồ điệp 2 cành
              </span>
              <p className="txt" style={{ margin: '4px 0' }}>
                Hoa rụng 2 bông sau 3 ngày, không biết do mình tưới sai hay cây yếu?
              </p>
              <div className="ao-photo" style={{ margin: '4px 0' }}>
                <span style={{ width: '48px', height: '48px' }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
                    <path d="M5 19 13 11" />
                  </svg>
                </span>
                <span style={{ width: '48px', height: '48px' }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
                    <path d="M5 19 13 11" />
                  </svg>
                </span>
              </div>
              <span className="flags">
                <span className="vx-badge vx-badge--danger">Dưới 3 sao</span>
                <span className="vx-badge vx-badge--info">Có thể cần bảo hành</span>
              </span>
            </span>
            <span className="rv-act">
              <div className="rv-ai">
                <b>
                  <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '11px', height: '11px' }}>
                    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
                  </svg>
                  {' GỢI Ý TRẢ LỜI'}
                </b>
                Chào chị Ngọc, lan hay rụng nụ khi đổi chỗ đặt. Chị gửi ảnh qua mục Bảo hành để kỹ sư xem giúp nhé…
              </div>
              <div className="ao-input">
                <input className="vx-input" placeholder="Trả lời công khai…" />
              </div>
              <span style={{ display: 'flex', gap: '4px' }}>
                <button className="vx-btn vx-btn--primary vx-btn--sm">{'Duyệt & trả lời'}</button>
                <button className="vx-btn vx-btn--ghost vx-btn--sm">Ẩn</button>
              </span>
            </span>
          </div>
          <div className="rv-item">
            <span className="ad-thumb">
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
            <span>
              <span className="meta">
                <b style={{ color: 'var(--ink)' }}>Tuấn Quang</b>
                <span className="vx-stars">★★★★☆</span>· Monstera M 65cm
              </span>
              <p className="txt" style={{ margin: '4px 0' }}>
                Cây khỏe, giao trễ 1 tiếng so với khung giờ.
              </p>
              <span className="flags">
                <span className="vx-badge vx-badge--info">Góp ý giao hàng</span>
              </span>
            </span>
            <span className="rv-act">
              <div className="ao-input">
                <input className="vx-input" placeholder="Trả lời công khai…" />
              </div>
              <span style={{ display: 'flex', gap: '4px' }}>
                <button className="vx-btn vx-btn--primary vx-btn--sm">{'Duyệt & trả lời'}</button>
                <button className="vx-btn vx-btn--ghost vx-btn--sm">Ẩn</button>
              </span>
            </span>
          </div>
          <div className="rv-item">
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
              <span className="meta">
                <b style={{ color: 'var(--ink)' }}>Khách ẩn danh</b>
                <span className="vx-stars">★☆☆☆☆</span>· Trichoderma 500ml
              </span>
              <p className="txt" style={{ margin: '4px 0' }}>
                Mua ở chỗ khác rẻ hơn, liên hệ zalo 09xx…
              </p>
              <span className="flags">
                <span className="vx-badge vx-badge--danger">Nghi quảng cáo / chưa mua hàng</span>
              </span>
            </span>
            <span className="rv-act">
              <div className="ao-input">
                <input className="vx-input" placeholder="Trả lời công khai…" />
              </div>
              <span style={{ display: 'flex', gap: '4px' }}>
                <button className="vx-btn vx-btn--primary vx-btn--sm">{'Duyệt & trả lời'}</button>
                <button className="vx-btn vx-btn--ghost vx-btn--sm">Ẩn</button>
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
