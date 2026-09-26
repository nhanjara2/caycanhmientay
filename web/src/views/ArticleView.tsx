// Sinh tự động từ design-system/components/ArticleDetailLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function ArticleView() {
  return (
    <>
      {' '}
      <div className="ar-page">
        <nav className="vx-toc" style={{ position: 'sticky', top: '16px' }}>
          <b style={{ fontSize: '12px', color: 'var(--ink-muted)', padding: '0 12px 6px' }}>MỤC LỤC</b>
          <a>Dấu hiệu nhận biết</a>
          <a aria-current="true">1. Lá vàng từ dưới lên</a>
          <a>2. Đất ẩm lâu, có mùi</a>
          <a>3. Gốc mềm, thâm</a>
          <a>Cách cứu cây</a>
          <a>Phòng thối rễ mùa mưa</a>
        </nav>{' '}
        <article className="ar-main">
          <div className="vx-crumb">
            <Link href="/goc-cham-cay">Góc chăm cây</Link>/<Link href="/goc-cham-cay">Bắt bệnh cây</Link>
          </div>
          <h1>5 dấu hiệu cây kiểng lá bị thối rễ mùa mưa và cách cứu kịp</h1>
          <p className="ar-lead">
            Mùa mưa độ ẩm cao, chậu thoát nước kém là nguyên nhân hàng đầu khiến kiểng lá thối rễ. Nhận biết sớm giúp
            cứu cây trong 1–2 tuần.
          </p>{' '}
          <div className="ar-by">
            <span className="vx-avatar">TH</span>
            <span>
              <b>Nguyễn Thu Hà</b>
              {' · Kỹ sư BVTV'}
              <small>
                {'Cập nhật 22/09/2026 · 7 phút đọc · '}
                <span className="vx-badge vx-badge--success">Đã kiểm duyệt</span>
              </small>
            </span>
            <span className="acts">
              <button className="vx-btn vx-btn--ghost vx-btn--sm">
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                  <circle cx="6" cy="12" r="2.5" />
                  <circle cx="18" cy="6" r="2.5" />
                  <circle cx="18" cy="18" r="2.5" />
                  <path d="m8.2 11 7.6-4M8.2 13l7.6 4" />
                </svg>
                Chia sẻ
              </button>
              <button className="vx-btn vx-btn--ghost vx-btn--sm">
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                  <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
                </svg>
                Lưu
              </button>
            </span>
          </div>{' '}
          <div className="ar-cover">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
              <path d="M5 19 13 11" />
            </svg>
          </div>
          <h2>1. Lá vàng từ dưới lên, mềm oặt</h2>
          <p>
            Lá già phía dưới vàng đều, cầm vào mềm, không giòn như khi thiếu nước. Đây là dấu hiệu rễ đã không hút được
            nước dù đất vẫn ẩm.
          </p>{' '}
          <div className="ar-prod">
            <b>Dùng trong bài này</b>
            <div className="ar-mini">
              <span className="ad-thumb">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z" />
                  <path d="M8 13h8" />
                </svg>
              </span>
              <span>Trichoderma trị nấm, thối rễ 500ml</span>
              <b className="pr">65.000đ</b>
              <button className="vx-btn vx-btn--primary">Thêm vào giỏ</button>
            </div>
            <div className="ar-mini">
              <span className="ad-thumb">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 7h12l1 13H5z" />
                  <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                </svg>
              </span>
              <span>Đất trộn kiểng lá thoát nước 5dm³</span>
              <b className="pr">42.500đ</b>
              <button className="vx-btn vx-btn--primary">Thêm vào giỏ</button>
            </div>
            <div className="ar-mini">
              <span className="ad-thumb">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7 12 3l9 4v10l-9 4-9-4z" />
                  <path d="M3 7l9 4 9-4M12 11v10" />
                </svg>
              </span>
              <span>Đá lót chậu 1kg</span>
              <b className="pr">25.000đ</b>
              <button className="vx-btn vx-btn--primary">Thêm vào giỏ</button>
            </div>
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
          </div>{' '}
          <div className="ar-help">
            <span>Bài viết có hữu ích?</span>
            <button className="vx-btn vx-btn--outline vx-btn--sm">Có</button>
            <button className="vx-btn vx-btn--ghost vx-btn--sm">Không</button>
          </div>
        </article>{' '}
        <aside className="ar-side">
          <div className="ar-cta">
            <b>Cây của bạn có dấu hiệu này?</b>
            <span>Gửi ảnh cho kỹ sư, phản hồi trong 2 giờ.</span>
            <Link href="/benh-cay" className="vx-btn">
              Bắt bệnh cho cây
            </Link>
          </div>
          <div className="nw-box">
            <h3>Bài liên quan</h3>
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">
              Úng rễ và thối rễ khác nhau thế nào?<small>Bắt bệnh cây</small>
            </Link>
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">
              Chọn giá thể thoát nước cho kiểng lá<small>Chăm sóc cây</small>
            </Link>
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">
              Pha Trichoderma đúng liều<small>{'Thuốc & Phân bón'}</small>
            </Link>
          </div>
        </aside>
      </div>{' '}
    </>
  );
}
