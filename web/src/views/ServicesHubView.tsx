// Sinh tự động từ design-system/components/ServicesHubLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function ServicesHubView() {
  return (
    <>
      {' '}
      <div style={{ background: 'var(--surface-page)' }}>
        <section className="sv-hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span className="vx-badge vx-badge--sun" style={{ alignSelf: 'flex-start' }}>
              Dịch vụ Cây Cảnh Miền Tây
            </span>
            <h1>Không gian xanh, không lo chăm sóc</h1>
            <p>
              Từ ban công vài mét vuông đến sân vườn, văn phòng hàng trăm cây: thiết kế, thi công, cho thuê và chăm sóc
              bởi kỹ sư nông nghiệp.
            </p>
            <div className="acts">
              <Link href="/dich-vu/dat-lich-khao-sat" className="vx-btn vx-btn--lg vx-btn--light">
                Đặt lịch khảo sát miễn phí
              </Link>
              <button className="vx-btn vx-btn--lg vx-btn--line">
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
                </svg>
                1800 xxxx
              </button>
            </div>
            <div className="sv-proof">
              <span>
                <b>320+</b>công trình
              </span>
              <span>
                <b>45</b>văn phòng đang thuê cây
              </span>
              <span>
                <b>4,9★</b>đánh giá
              </span>
            </div>
          </div>
          <div className="sv-art">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 11 12 4l8 7v9H4z" />
              <path d="M10 20v-5h4v5" />
            </svg>
            <span className="tag">
              <b>Khảo sát trong 48 giờ</b>TP.HCM và lân cận
            </span>
          </div>
        </section>{' '}
        <section className="sv-sec">
          <h2>Dịch vụ của chúng tôi</h2>
          <div className="sv-cards">
            <div className="sv-card">
              <span className="img">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 11 12 4l8 7v9H4z" />
                  <path d="M10 20v-5h4v5" />
                </svg>
              </span>
              <span className="b">
                <b>{'Thiết kế & thi công sân vườn'}</b>Sân vườn, ban công, sân thượng, tiểu cảnh. Có bản vẽ 3D trước khi
                thi công.<span className="from">Khảo sát miễn phí</span>
                <Link href="/dich-vu/cho-thue-cay-van-phong">
                  {'Xem chi tiết '}
                  <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
              </span>
            </div>
            <div className="sv-card">
              <span className="img">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="3" width="14" height="18" rx="1" />
                  <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
                </svg>
              </span>
              <span className="b">
                <b>Cho thuê cây văn phòng</b>Cây đặt tận nơi, kỹ sư chăm và thay cây định kỳ. Không lo cây chết.
                <span className="from">
                  {'từ '}
                  <strong>45.000đ</strong>
                  {' / cây / tháng'}
                </span>
                <Link href="/dich-vu/cho-thue-cay-van-phong">
                  {'Xem chi tiết '}
                  <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
              </span>
            </div>
            <div className="sv-card">
              <span className="img">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 12a8 8 0 1 1-2.3-5.7L20 8" />
                  <path d="M20 3v5h-5" />
                </svg>
              </span>
              <span className="b">
                <b>Chăm sóc định kỳ</b>Tưới, bón, cắt tỉa, trị bệnh tại nhà hoặc văn phòng theo tuần, tháng.
                <span className="from">
                  {'từ '}
                  <strong>350.000đ</strong>
                  {' / lần'}
                </span>
                <Link href="/dich-vu/cho-thue-cay-van-phong">
                  {'Xem chi tiết '}
                  <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
              </span>
            </div>
            <div className="sv-card">
              <span className="img">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="8" y="7" width="8" height="12" rx="4" />
                  <path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1 2M15 4l-1 2" />
                </svg>
              </span>
              <span className="b">
                <b>{'Khám & chữa cây tại nhà'}</b>Kỹ sư đến tận nơi xem cây bệnh, xử lý và hướng dẫn chăm lại.
                <span className="from">
                  {'từ '}
                  <strong>200.000đ</strong>
                  {' / lượt'}
                </span>
                <Link href="/dich-vu/cho-thue-cay-van-phong">
                  {'Xem chi tiết '}
                  <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
              </span>
            </div>
          </div>
        </section>
        <section className="sv-sec" style={{ background: 'var(--surface)' }}>
          <h2>Quy trình 5 bước</h2>
          <div className="sv-steps">
            <div className="sv-step">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
                </svg>
              </span>
              <b>Gửi yêu cầu</b>Form online hoặc gọi hotline
            </div>
            <div className="sv-step">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M4 16 16 4l4 4L8 20z" />
                  <path d="M8 12l2 2M11 9l2 2M14 6l2 2" />
                </svg>
              </span>
              <b>Khảo sát</b>Kỹ sư đến đo đạc, đánh giá ánh sáng
            </div>
            <div className="sv-step">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M4 20h4L19 9l-4-4L4 16z" />
                </svg>
              </span>
              <b>{'Thiết kế & báo giá'}</b>Phối cảnh 3D, bảng vật tư chi tiết
            </div>
            <div className="sv-step">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M14 4l6 6M17 7l-8 8M6 14l4 4-3 3-4-4z" />
                </svg>
              </span>
              <b>Thi công</b>Đúng tiến độ, dọn dẹp sau khi xong
            </div>
            <div className="sv-step">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <b>Bảo hành</b>Bảo hành cây 30 ngày, chăm sóc tháng đầu
            </div>
          </div>
        </section>
        <section className="sv-sec">
          <h2>Công trình đã thực hiện</h2>
          <div className="sv-gal">
            <div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 11 12 4l8 7v9H4z" />
                <path d="M10 20v-5h4v5" />
              </svg>
              <em>Sân vườn biệt thự · Thủ Đức · 120m²</em>
            </div>
            <div>
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
              <em>Ban công chung cư · 8m²</em>
            </div>
            <div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="3" width="14" height="18" rx="1" />
                <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
              </svg>
              <em>Văn phòng 40 cây · Q1</em>
            </div>
            <div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 12h12l-1.5 8h-9z" />
                <path d="M12 12V7" />
                <path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" />
                <path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" />
              </svg>
              <em>Tiểu cảnh sảnh</em>
            </div>
            <div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21v-7" />
                <path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2-5-5-5 0 3 2 5 5 5z" />
              </svg>
              <em>Vườn rau sân thượng</em>
            </div>
          </div>
        </section>
        <section className="sv-sec" style={{ paddingTop: '0' }}>
          <h2>Khách hàng nói gì</h2>
          <div className="sv-quote">
            <div>
              <span className="vx-stars">★★★★★</span>
              {'"Ban công 8m² nhà mình thành góc xanh đúng như bản vẽ. Kỹ sư tư vấn cây hợp nắng chiều rất kỹ."'}
              <small>
                <span className="vx-avatar vx-avatar--sm">TL</span>Chị Thu Lan · Chung cư Q7
              </small>
            </div>
            <div>
              <span className="vx-stars">★★★★★</span>
              {'"Thuê 40 cây cho văn phòng, 2 tuần có người chăm, cây nào yếu là thay ngay."'}
              <small>
                <span className="vx-avatar vx-avatar--sm">AP</span>Công ty An Phát · Q1
              </small>
            </div>
            <div>
              <span className="vx-stars">★★★★★</span>
              {'"Cây bàng Singapore sắp chết, kỹ sư đến xử lý rễ, 3 tuần sau ra lá mới."'}
              <small>
                <span className="vx-avatar vx-avatar--sm">MH</span>Anh Minh Hoàng · Bình Thạnh
              </small>
            </div>
          </div>
        </section>{' '}
        <div className="sv-cta">
          <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '40px', height: '40px' }}>
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
          <span>
            <b>Nhận tư vấn và báo giá trong 48 giờ</b>
            <span>Gửi ảnh không gian, kỹ sư sẽ gọi lại để hẹn khảo sát</span>
          </span>
          <Link href="/dich-vu/dat-lich-khao-sat" className="vx-btn vx-btn--lg">
            Đặt lịch khảo sát
          </Link>
        </div>
      </div>{' '}
    </>
  );
}
