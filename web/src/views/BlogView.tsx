// Sinh tự động từ design-system/components/BlogLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function BlogView() {
  return (
    <>
      {' '}
      <section className="vx-blogtop">
        <div className="vx-crumb">
          <Link href="/">Trang chủ</Link>/<span>Góc chăm cây</span>
        </div>
        <h1>Góc chăm cây</h1>
        <div className="vx-row">
          <button className="vx-chip" aria-pressed="true">
            Tất cả
          </button>
          <button className="vx-chip">Chăm sóc cây</button>
          <button className="vx-chip">Bắt bệnh cây</button>
          <button className="vx-chip">{'Thuốc & Phân bón'}</button>
          <button className="vx-chip">Rau sạch tại nhà</button>
          <button className="vx-chip">Phong thủy</button>
          <button className="vx-chip">{'Decor & Không gian'}</button>
          <button className="vx-chip">Cây theo mùa</button>
          <button className="vx-chip">Tin khuyến mãi</button>
          <button className="vx-chip">{'Workshop & Sự kiện'}</button>
        </div>
        <div className="vx-hero">
          <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hero__main">
            <span className="vx-thumbimg ">
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
            <span className="vx-meta">
              <span className="cat">Chăm sóc cây</span>·<span>22/09/2026</span>·<span>6 phút đọc</span>
            </span>
            <h2>Monstera vàng lá: 5 nguyên nhân thường gặp và cách xử lý dứt điểm</h2>
            <p>
              Lá vàng từ mép, vàng cả lá hay vàng kèm đốm nâu là ba dấu hiệu khác nhau. Kỹ sư Cây Cảnh Miền Tây hướng
              dẫn cách phân biệt và xử lý từng trường hợp.
            </p>
          </Link>
          <div className="vx-hero__list">
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hitem">
              <span className="vx-thumbimg t3">
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
              <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="vx-meta">
                  <span className="cat">Bắt bệnh cây</span>
                </span>
                <b>5 dấu hiệu cây kiểng lá bị thối rễ mùa mưa và cách cứu kịp</b>
              </span>
            </Link>
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hitem">
              <span className="vx-thumbimg ">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A4 4 0 0 1 17 17z" />
                  <path d="M9 20l1-2M13 20l1-2" />
                </svg>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="vx-meta">
                  <span className="cat">Cây theo mùa</span>
                </span>
                <b>Mùa mưa: 7 việc cần làm để cây ban công không úng</b>
              </span>
            </Link>
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hitem">
              <span className="vx-thumbimg t2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
                </svg>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="vx-meta">
                  <span className="cat">{'Thuốc & Phân bón'}</span>
                </span>
                <b>Pha thuốc trừ nấm sinh học đúng liều: hướng dẫn cho người mới</b>
              </span>
            </Link>
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hitem">
              <span className="vx-thumbimg ">
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
              <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="vx-meta">
                  <span className="cat">{'Decor & Không gian'}</span>
                </span>
                <b>Góc làm việc 2m² với 4 chậu cây chịu bóng</b>
              </span>
            </Link>
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hitem">
              <span className="vx-thumbimg t2">
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
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="vx-meta">
                  <span className="cat">Rau sạch tại nhà</span>
                </span>
                <b>Trồng rau muống thùng xốp: 21 ngày có rau ăn</b>
              </span>
            </Link>
          </div>
        </div>
      </section>
      <div className="vx-blog">
        <div className="vx-blog__main">
          <section className="vx-cblock">
            <div className="vx-sect">
              <h2 style={{ fontSize: '18px' }}>
                <span className="vx-sect__mark">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <rect x="3" y="6" width="13" height="12" rx="2" />
                    <path d="m16 10 5-3v10l-5-3" />
                  </svg>
                </span>
                Video ngắn chăm cây
              </h2>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-link">
                {'Xem tất cả '}
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div className="vx-vrow">
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-vcard">
                <span className="vx-vcard__img ">
                  <span className="tag">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '11px', height: '11px' }}>
                      <rect x="3" y="6" width="13" height="12" rx="2" />
                      <path d="m16 10 5-3v10l-5-3" />
                    </svg>
                    VIDEO
                  </span>
                  <span className="play">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <b>Tưới sai cách</b>
                  <small>60 giây</small>
                </span>
                <p>Tưới cây đúng cách: nhiều người sai ngay bước đầu</p>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-vcard">
                <span className="vx-vcard__img alt">
                  <span className="tag">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '11px', height: '11px' }}>
                      <rect x="3" y="6" width="13" height="12" rx="2" />
                      <path d="m16 10 5-3v10l-5-3" />
                    </svg>
                    VIDEO
                  </span>
                  <span className="play">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <b>Cây thối rễ?</b>
                  <small>45 giây</small>
                </span>
                <p>Cứu cây thối rễ trong 3 bước</p>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-vcard">
                <span className="vx-vcard__img ">
                  <span className="tag">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '11px', height: '11px' }}>
                      <rect x="3" y="6" width="13" height="12" rx="2" />
                      <path d="m16 10 5-3v10l-5-3" />
                    </svg>
                    VIDEO
                  </span>
                  <span className="play">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <b>Pha thuốc an toàn</b>
                  <small>50 giây</small>
                </span>
                <p>Pha thuốc trừ nấm: đeo găng, đúng liều</p>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-vcard">
                <span className="vx-vcard__img alt">
                  <span className="tag">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '11px', height: '11px' }}>
                      <rect x="3" y="6" width="13" height="12" rx="2" />
                      <path d="m16 10 5-3v10l-5-3" />
                    </svg>
                    VIDEO
                  </span>
                  <span className="play">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <b>Thay chậu</b>
                  <small>75 giây</small>
                </span>
                <p>Thay chậu Monstera không sốc cây</p>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-vcard">
                <span className="vx-vcard__img ">
                  <span className="tag">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '11px', height: '11px' }}>
                      <rect x="3" y="6" width="13" height="12" rx="2" />
                      <path d="m16 10 5-3v10l-5-3" />
                    </svg>
                    VIDEO
                  </span>
                  <span className="play">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <b>Rệp sáp</b>
                  <small>40 giây</small>
                </span>
                <p>Nhận biết rệp sáp trên sen đá</p>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-vcard">
                <span className="vx-vcard__img alt">
                  <span className="tag">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '11px', height: '11px' }}>
                      <rect x="3" y="6" width="13" height="12" rx="2" />
                      <path d="m16 10 5-3v10l-5-3" />
                    </svg>
                    VIDEO
                  </span>
                  <span className="play">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <b>Rau mầm 7 ngày</b>
                  <small>55 giây</small>
                </span>
                <p>Trồng rau mầm trên khay trong 7 ngày</p>
              </Link>
            </div>
          </section>
          <section className="vx-cblock">
            <div className="vx-cblock__head">
              <h2>Bắt bệnh cây</h2>
              <nav>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Nấm bệnh</Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Sâu hại</Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Thối rễ</Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Thiếu chất</Link>
              </nav>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-link">
                {'Xem tất cả '}
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </div>{' '}
            <div className="vx-cblock__top">
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-feat">
                <span className="vx-thumbimg t3">
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
                <div>
                  <b>Đốm lá do nấm trên kiểng lá: nhận biết và xử lý bằng thuốc sinh học</b>
                  <p>
                    Đốm nâu viền vàng lan dần từ lá già là dấu hiệu nấm. Cắt bỏ lá bệnh, giảm tưới lên lá và phun chế
                    phẩm sinh học định kỳ 7 ngày.
                  </p>
                </div>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-feat">
                <span className="vx-thumbimg" />
                <div>
                  <b>Rệp sáp trên sen đá: vì sao hay tái phát?</b>
                  <p>
                    Rệp sáp ẩn trong nách lá và bầu rễ. Chỉ lau bề mặt là chưa đủ; cần kiểm tra cả rễ khi thay chậu.
                  </p>
                </div>
              </Link>
            </div>
            <div className="vx-cblock__bot">
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">
                <b>Lá vàng từ dưới lên: thiếu đạm hay tưới quá nhiều?</b>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">
                <b>Nhện đỏ phá cây mùa khô: 4 cách phòng</b>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">
                <b>Cây héo dù đất ẩm: kiểm tra rễ ngay</b>
              </Link>
            </div>
          </section>
          <section className="vx-cblock">
            <div className="vx-sect">
              <h2 style={{ fontSize: '18px' }}>
                <span className="vx-sect__mark">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M3 12V4h8l10 10-8 8z" />
                    <circle cx="7.5" cy="8.5" r="1.5" />
                  </svg>
                </span>
                {'Tin khuyến mãi & Sự kiện'}
              </h2>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-link">
                {'Xem tất cả '}
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div className="vx-promo-row">
              <Link href="/khuyen-mai" className="vx-promo-card">
                <span className="vx-thumbimg ">
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
                <b>Tuần lễ kiểng lá: giảm đến 30% và tặng chậu sứ</b>
              </Link>
              <Link href="/khuyen-mai" className="vx-promo-card">
                <span className="vx-thumbimg ">
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
                <b>Workshop làm terrarium cuối tuần tại vườn</b>
              </Link>
              <Link href="/khuyen-mai" className="vx-promo-card">
                <span className="vx-thumbimg ">
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
                <b>Đổi 500 điểm lấy 1 chậu sen đá mini</b>
              </Link>
            </div>
          </section>
          <section className="vx-cblock">
            <div className="vx-cblock__head">
              <h2>Cây theo mùa</h2>
              <nav>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Mùa mưa</Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Mùa khô</Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Cây Tết</Link>
              </nav>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-link">
                {'Xem tất cả '}
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div className="vx-bfeat">
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-bfeat__main">
                <span className="vx-thumbimg ">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A4 4 0 0 1 17 17z" />
                    <path d="M9 20l1-2M13 20l1-2" />
                  </svg>
                </span>
                <b>Mùa mưa miền Nam: lịch chăm cây ban công từ tháng 9 đến tháng 11</b>
                <span className="vx-meta">
                  <span>18/09/2026</span>·<span>8 phút đọc</span>
                </span>
              </Link>
              <div className="vx-bfeat__list">
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hitem">
                  <span className="vx-thumbimg ">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A4 4 0 0 1 17 17z" />
                      <path d="M9 20l1-2M13 20l1-2" />
                    </svg>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="vx-meta">
                      <span className="cat">Cây theo mùa</span>
                    </span>
                    <b>Chống úng cho chậu ban công bằng lớp đá lót và giá thể thô</b>
                  </span>
                </Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hitem">
                  <span className="vx-thumbimg t2">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
                    </svg>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="vx-meta">
                      <span className="cat">{'Thuốc & Phân bón'}</span>
                    </span>
                    <b>Phân tan chậm hay phân nước: chọn gì cho cây văn phòng?</b>
                  </span>
                </Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hitem">
                  <span className="vx-thumbimg t2">
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
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="vx-meta">
                      <span className="cat">Rau sạch tại nhà</span>
                    </span>
                    <b>Lịch gieo hạt rau tháng 10 cho miền Nam</b>
                  </span>
                </Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-hitem">
                  <span className="vx-thumbimg ">
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
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="vx-meta">
                      <span className="cat">Chăm sóc cây</span>
                    </span>
                    <b>Tưới bằng nước máy có hại cho cây không?</b>
                  </span>
                </Link>
              </div>
            </div>
          </section>
          <section className="vx-cblock">
            <div className="vx-cblock__head">
              <h2>{'Thuốc & Phân bón'}</h2>
              <nav>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Phân bón</Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Thuốc sinh học</Link>
                <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">Pha thuốc an toàn</Link>
              </nav>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-link">
                {'Xem tất cả '}
                <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </div>{' '}
            <div className="vx-cblock__top">
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-feat">
                <span className="vx-thumbimg t2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
                  </svg>
                </span>
                <div>
                  <b>NPK là gì? Đọc đúng con số trên bao phân bón</b>
                  <p>
                    Ba con số trên bao phân cho biết tỷ lệ đạm, lân, kali. Cây lá cần nhiều đạm, cây hoa cần nhiều lân
                    và kali hơn.
                  </p>
                </div>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="vx-feat">
                <span className="vx-thumbimg" />
                <div>
                  <b>Thuốc sinh học có an toàn tuyệt đối không?</b>
                  <p>Ít độc hơn thuốc hóa học nhưng vẫn cần găng tay và đúng liều; không phun lúc nắng gắt.</p>
                </div>
              </Link>
            </div>
            <div className="vx-cblock__bot">
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">
                <b>Bón phân cho cây trong nhà: bao lâu một lần?</b>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">
                <b>Phân trùn quế dùng thế nào cho đúng?</b>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua">
                <b>Cách bảo quản thuốc BVTV trong nhà có trẻ nhỏ</b>
              </Link>
            </div>
          </section>
        </div>
        <div className="vx-blog__side">
          <aside className="vx-topics">
            <h3>Chủ đề nổi bật</h3>
            <a>
              <b># Chăm cây văn phòng</b>
              <small>412 bài viết</small>
            </a>
            <a>
              <b># Kiểng lá</b>
              <small>386 bài viết</small>
            </a>
            <a>
              <b># Thối rễ</b>
              <small>154 bài viết</small>
            </a>
            <a>
              <b># Rau sạch ban công</b>
              <small>221 bài viết</small>
            </a>
            <a>
              <b># Cây phong thủy</b>
              <small>198 bài viết</small>
            </a>
            <a>
              <b># Phân bón hữu cơ</b>
              <small>133 bài viết</small>
            </a>
            <a>
              <b># Sen đá</b>
              <small>176 bài viết</small>
            </a>
            <a className="vx-link">
              {'Xem tất cả '}
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                <path d="m9 6 6 6-6 6" />
              </svg>
            </a>
          </aside>
          <aside className="vx-experts">
            <h3>Đội ngũ chuyên môn</h3>
            <div className="vx-expert-row">
              <span className="vx-avatar">KS</span>
              <span>
                <small>Kỹ sư nông nghiệp</small>
                <b>Trần Minh An</b>
                <span className="sp">Cây kiểng lá, giá thể</span>
              </span>
            </div>
            <div className="vx-expert-row">
              <span className="vx-avatar">KS</span>
              <span>
                <small>Kỹ sư BVTV</small>
                <b>Nguyễn Thu Hà</b>
                <span className="sp">Bệnh cây, thuốc BVTV</span>
              </span>
            </div>
            <div className="vx-expert-row">
              <span className="vx-avatar">NN</span>
              <span>
                <small>Nghệ nhân</small>
                <b>Lê Văn Tâm</b>
                <span className="sp">Bonsai, cây thế</span>
              </span>
            </div>
            <div className="vx-expert-row">
              <span className="vx-avatar">KS</span>
              <span>
                <small>Kỹ sư cảnh quan</small>
                <b>Phạm Gia Huy</b>
                <span className="sp">Thiết kế sân vườn</span>
              </span>
            </div>
            <a className="vx-link">
              {'Xem tất cả '}
              <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                <path d="m9 6 6 6-6 6" />
              </svg>
            </a>
          </aside>
        </div>
      </div>{' '}
    </>
  );
}
