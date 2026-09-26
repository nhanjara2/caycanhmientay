// Sinh tự động từ design-system/components/NewsCategoryLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function NewsView() {
  return (
    <>
      {' '}
      <div className="nw-page">
        <div className="nw-top">
          <div className="vx-crumb">
            <Link href="/">Trang chủ</Link>/<Link href="/goc-cham-cay">Góc chăm cây</Link>/<span>Truyền thông</span>
          </div>
          <h1>Truyền thông</h1>
          <div className="nw-subs">
            <a className="nw-sub" aria-current="true">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M3 10v4h4l6 4V6L7 10z" />
                  <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
                </svg>
              </span>
              <b>{'Tin tức & Sự kiện'}</b>
              <small>48 bài viết</small>
            </a>
            <a className="nw-sub">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
                </svg>
              </span>
              <b>Hoạt động cộng đồng</b>
              <small>21 bài viết</small>
            </a>
            <a className="nw-sub">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M7 9h6M7 13h10M7 16h8" />
                </svg>
              </span>
              <b>Báo chí nói về chúng tôi</b>
              <small>12 bài viết</small>
            </a>
            <a className="nw-sub">
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
                  <circle cx="17" cy="9" r="2.5" />
                  <path d="M16 14c2.5 0 4.2 1.4 5 4" />
                </svg>
              </span>
              <b>Tuyển dụng</b>
              <small>6 vị trí</small>
            </a>
          </div>
          <div className="nw-hero">
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="nw-hero__main">
              <span className="nw-img deep">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
                  <circle cx="17" cy="9" r="2.5" />
                  <path d="M16 14c2.5 0 4.2 1.4 5 4" />
                </svg>
              </span>
              <span className="nw-row">
                <span className="nw-tag">Truyền thông</span>
                <span className="vx-meta">20/09/2026</span>
              </span>
              <h2>
                Cây Cảnh Miền Tây cùng thành phố trồng 10.000 cây xanh cho các khu dân cư mới, hướng tới đô thị xanh hơn
              </h2>
            </Link>
            <div className="nw-side">
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="nw-sitem">
                <span className="nw-img deep">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="8" r="3.5" />
                    <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
                    <circle cx="17" cy="9" r="2.5" />
                    <path d="M16 14c2.5 0 4.2 1.4 5 4" />
                  </svg>
                </span>
                <span>
                  <span className="nw-row">
                    <span className="nw-tag">Truyền thông</span>
                  </span>
                  <b>Cây Cảnh Miền Tây ra mắt vườn ươm thứ hai tại Củ Chi, mở cửa đón khách tham quan</b>
                </span>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="nw-sitem">
                <span className="nw-img ">
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
                    <span className="nw-tag">Truyền thông</span>
                  </span>
                  <b>{'Chương trình "Mỗi đơn hàng một cây xanh" trồng 5.000 cây tại trường học'}</b>
                </span>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="nw-sitem">
                <span className="nw-img promo">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="9" r="5" />
                    <path d="m9 13-2 8 5-3 5 3-2-8" />
                  </svg>
                </span>
                <span>
                  <span className="nw-row">
                    <span className="nw-tag">Truyền thông</span>
                  </span>
                  <b>Cây Cảnh Miền Tây nhận chứng nhận đủ điều kiện buôn bán thuốc BVTV</b>
                </span>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="nw-sitem">
                <span className="nw-img ">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="8" r="3.5" />
                    <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
                    <circle cx="17" cy="9" r="2.5" />
                    <path d="M16 14c2.5 0 4.2 1.4 5 4" />
                  </svg>
                </span>
                <span>
                  <span className="nw-row">
                    <span className="nw-tag">Truyền thông</span>
                  </span>
                  <b>Workshop terrarium miễn phí cho 200 gia đình dịp Trung thu</b>
                </span>
              </Link>
              <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="nw-sitem">
                <span className="nw-img deep">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M7 9h6M7 13h10M7 16h8" />
                  </svg>
                </span>
                <span>
                  <span className="nw-row">
                    <span className="nw-tag">Truyền thông</span>
                  </span>
                  <b>Hợp tác với ĐH Nông Lâm đào tạo kỹ sư tư vấn cây cảnh</b>
                </span>
              </Link>
            </div>
          </div>
        </div>
        <div className="nw-body">
          <div className="nw-list">
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="nw-card ">
              <span className="nw-img ">
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
                  <span className="nw-tag">Hoạt động cộng đồng</span>
                  <span className="vx-meta">18/09/2026</span>
                </span>
                <b>Mỗi đơn hàng một cây xanh: 5.000 cây đã về với 32 trường học</b>
                <p>
                  Từ tháng 3/2026, mỗi đơn hàng trên website góp 1 cây giống cho chương trình phủ xanh sân trường. Đến
                  nay đã có 32 trường tham gia.
                </p>
              </span>
            </Link>
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="nw-card ">
              <span className="nw-img deep">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
                  <circle cx="17" cy="9" r="2.5" />
                  <path d="M16 14c2.5 0 4.2 1.4 5 4" />
                </svg>
              </span>
              <span>
                <span className="nw-row">
                  <span className="nw-tag">{'Tin tức & Sự kiện'}</span>
                  <span className="vx-meta">10/09/2026</span>
                </span>
                <b>Cây Cảnh Miền Tây mở vườn ươm thứ hai tại Củ Chi, rộng 3 ha</b>
                <p>
                  Vườn ươm mới giúp chủ động nguồn cây kiểng lá, cây công trình, rút ngắn thời gian giao cây lớn cho
                  khách khu vực phía Bắc thành phố.
                </p>
              </span>
            </Link>
            <Link href="/goc-cham-cay/5-dau-hieu-thoi-re-mua-mua" className="nw-card ">
              <span className="nw-img ">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M7 9h6M7 13h10M7 16h8" />
                </svg>
              </span>
              <span>
                <span className="nw-row">
                  <span className="nw-tag">Báo chí nói về chúng tôi</span>
                  <span className="vx-meta">02/09/2026</span>
                </span>
                <b>Mô hình bán cây kèm tư vấn kỹ sư: hướng đi mới của ngành cây cảnh</b>
                <p>
                  Bài viết phân tích cách các cửa hàng cây cảnh chuyển đổi số, trong đó có mô hình bắt bệnh cây trực
                  tuyến của Cây Cảnh Miền Tây.
                </p>
              </span>
            </Link>
            <button className="vx-btn vx-btn--outline nw-more">Xem thêm bài viết</button>
          </div>
          <aside className="nw-aside">
            <div className="nw-box">
              <h3>Xem nhiều</h3>
              <a>
                Workshop terrarium miễn phí dịp Trung thu<small>1,2k lượt xem</small>
              </a>
              <a>
                Chứng nhận đủ điều kiện buôn bán thuốc BVTV<small>860 lượt xem</small>
              </a>
              <a>
                Ra mắt tab Bắt bệnh cây trên app<small>740 lượt xem</small>
              </a>
            </div>
            <div className="nw-box">
              <h3>Liên hệ báo chí</h3>
              <span style={{ fontSize: '13px' }}>
                Email: [email truyền thông]
                <br />
                Điện thoại: [số điện thoại]
              </span>
              <div className="nw-press">
                <span>Bộ nhận diện</span>
                <span>Ảnh báo chí</span>
              </div>
            </div>
          </aside>
        </div>
      </div>{' '}
    </>
  );
}
