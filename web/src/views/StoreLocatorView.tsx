// Sinh tự động từ design-system/components/StoreLocatorLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function StoreLocatorView() {
  return (
    <>
      {' '}
      <div className="vx-storepage">
        <div className="vx-crumb">
          <Link href="/">Trang chủ</Link>/<span>Hệ thống cửa hàng</span>
        </div>
        <h1>{'Hệ thống cửa hàng & vườn ươm'}</h1>
        <span className="sub">Giờ mở cửa: 7:00 – 21:00 hằng ngày (tùy từng cửa hàng)</span>
        <div className="vx-stores">
          <aside className="vx-sfind">
            <div className="vx-sfind__tabs">
              <Link href="/he-thong-cua-hang" aria-current="true">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                Tìm cửa hàng
              </Link>
              <a>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
                Gần bạn
              </a>
            </div>
            <div className="vx-sfind__body">
              {' '}
              <div className="vx-sfind__search">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <span>Tìm theo tên đường, phường, tỉnh thành</span>
              </div>{' '}
              <div className="vx-or">hoặc chọn nhanh</div>{' '}
              <div className="vx-input vx-input--select">
                <span>TP. Hồ Chí Minh · Tất cả phường</span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </div>{' '}
              <div className="vx-sfilter">
                <button className="vx-chip" aria-pressed="true">
                  Tất cả
                </button>
                <button className="vx-chip">Vườn ươm</button>
                <button className="vx-chip">Có workshop</button>
                <button className="vx-chip">Đang mở</button>
              </div>{' '}
              <div className="vx-sres">
                <div className="vx-sres__head">Có 3 cửa hàng tại TP. Hồ Chí Minh</div>{' '}
                <div className="vx-sres__item" aria-checked="true">
                  <span className="vx-radio" style={{ marginTop: '2px' }} />
                  <span>
                    <b>Cây Cảnh Miền Tây Phạm Hữu Lầu</b>
                    <small>169 Phạm Hữu Lầu, Phường Tân Mỹ, TP. Hồ Chí Minh</small>
                    <small>Địa chỉ cũ: 169 Phạm Hữu Lầu, Phường Phú Mỹ, Quận 7</small>
                    <span className="row">
                      <span className="vx-open">Đang mở</span>
                      <span style={{ color: 'var(--ink-muted)' }}>· 2,1 km</span>
                      <span className="vx-badge vx-badge--info">Vườn ươm</span>
                    </span>
                  </span>
                </div>{' '}
                <div className="vx-sres__item">
                  <span className="vx-radio" style={{ marginTop: '2px' }} />
                  <span>
                    <b>Cây Cảnh Miền Tây Nguyễn Văn Linh</b>
                    <small>1487 Nguyễn Văn Linh, Phường Tân Hưng, TP. Hồ Chí Minh</small>
                    <span className="row">
                      <span className="vx-open">Đang mở</span>
                      <span style={{ color: 'var(--ink-muted)' }}>· 3,4 km</span>
                      <span className="vx-badge vx-badge--info">Workshop</span>
                    </span>
                  </span>
                </div>{' '}
                <div className="vx-sres__item">
                  <span className="vx-radio" style={{ marginTop: '2px' }} />
                  <span>
                    <b>Cây Cảnh Miền Tây Thảo Điền</b>
                    <small>25 Quốc Hương, Phường An Khánh, TP. Hồ Chí Minh</small>
                    <span className="row">
                      <span className="vx-closed">Đã đóng</span>
                      <span style={{ color: 'var(--ink-muted)' }}>· 9,8 km</span>
                    </span>
                  </span>
                </div>{' '}
              </div>
            </div>
          </aside>
          <section className="vx-sdetail">
            <h2>
              {'Cây Cảnh Miền Tây Phạm Hữu Lầu '}
              <span className="vx-badge vx-badge--info" style={{ verticalAlign: 'middle' }}>
                Vườn ươm
              </span>
            </h2>{' '}
            <div className="vx-sdetail__top">
              <div className="vx-map">
                <svg className="bg" viewBox="0 0 600 320" preserveAspectRatio="xMidYMid slice">
                  <rect className="blk" x="20" y="30" width="120" height="80" rx="6" />
                  <rect className="blk" x="160" y="30" width="90" height="80" rx="6" />
                  <rect className="blk" x="20" y="200" width="150" height="90" rx="6" />
                  <rect className="park" x="330" y="30" width="110" height="90" rx="10" />
                  <rect className="blk" x="330" y="200" width="100" height="90" rx="6" />
                  <path className="water" d="M470 320 C 500 240 560 230 600 180 L600 320 Z" />
                  <path className="road" strokeWidth="10" d="M0 160 H600" />
                  <path className="road" strokeWidth="10" d="M300 0 V320" />
                  <path className="road" strokeWidth="6" d="M0 120 H280 M150 0 V320 M320 250 H600" />
                  <path className="major" strokeWidth="12" d="M520 0 C 510 120 480 200 470 320" />
                </svg>
                <div className="vx-map__pin">
                  <span>
                    <i />
                  </span>
                </div>
              </div>{' '}
              <div className="vx-sinfo">
                <span className="lab">Địa chỉ</span>
                <b>169 Phạm Hữu Lầu, Phường Tân Mỹ, TP. Hồ Chí Minh</b>
                <span className="old">Địa chỉ cũ: 169 Phạm Hữu Lầu, Phường Phú Mỹ, Quận 7, TP. Hồ Chí Minh</span>{' '}
                <span>
                  <span className="vx-open">Đang mở</span>
                  {' · Đóng cửa lúc 21:00 · Mở 7:00 – 21:00 hằng ngày'}
                </span>
                <span>
                  {'Điện thoại: '}
                  <b>0703 005 001</b>
                </span>{' '}
                <div className="vx-svc">
                  <span className="vx-badge vx-badge--info">Bãi đỗ ô tô</span>
                  <span className="vx-badge vx-badge--info">Workshop cuối tuần</span>
                  <span className="vx-badge vx-badge--info">Khám bệnh cây</span>
                </div>{' '}
                <a>Thông tin pháp lý cửa hàng</a>{' '}
                <div className="vx-sinfo__cta">
                  <Link href="/he-thong-cua-hang" className="vx-btn vx-btn--primary">
                    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                      <path d="m3 11 18-8-8 18-2-8z" />
                    </svg>
                    Xem chỉ đường
                  </Link>
                  <button className="vx-btn vx-btn--soft">Gọi tư vấn</button>
                  <button className="vx-btn vx-btn--outline">Đặt lịch đến xem cây</button>
                </div>
              </div>
            </div>{' '}
            <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
              Cây Cảnh Miền Tây có vườn ươm riêng và hệ thống cửa hàng, nơi bạn xem cây tận mắt và nhận tư vấn trực tiếp
              từ kỹ sư:
            </p>{' '}
            <div className="vx-perks">
              <div className="vx-perk">
                <span>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
                    <path d="M5 19 13 11" />
                  </svg>
                </span>
                <span>
                  <b>Xem cây tận nơi</b>Chọn đúng cây mình thích, kỹ sư hướng dẫn chọn cây hợp vị trí đặt.
                </span>
              </div>
              <div className="vx-perk">
                <span>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <rect x="8" y="7" width="8" height="12" rx="4" />
                    <path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1 2M15 4l-1 2" />
                  </svg>
                </span>
                <span>
                  <b>Mang lá bệnh đến khám</b>Mang mẫu lá, ảnh cây để kỹ sư bắt bệnh và kê thuốc phù hợp miễn phí.
                </span>
              </div>
              <div className="vx-perk">
                <span>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                <span>
                  <b>Vật tư chính hãng</b>Thuốc BVTV có số đăng ký, phân bón có nguồn gốc rõ ràng.
                </span>
              </div>
              <div className="vx-perk">
                <span>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M6 12h12l-1.5 8h-9z" />
                    <path d="M12 12V7" />
                    <path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" />
                    <path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" />
                  </svg>
                </span>
                <span>
                  <b>Thay chậu, sang chậu tại chỗ</b>Mua chậu và đất, nhân viên thay chậu giúp trong 15 phút.
                </span>
              </div>
              <div className="vx-perk">
                <span>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                    <circle cx="7" cy="18" r="1.8" />
                    <circle cx="17" cy="18" r="1.8" />
                  </svg>
                </span>
                <span>
                  <b>Giao cây tận nơi</b>Cây lớn giao bằng xe tải nhỏ, có người khiêng và đặt đúng vị trí.
                </span>
              </div>
              <div className="vx-perk">
                <span>
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M3 7 12 3l9 4v10l-9 4-9-4z" />
                    <path d="M3 7l9 4 9-4M12 11v10" />
                  </svg>
                </span>
                <span>
                  <b>Đổi trả, bảo hành tại cửa hàng</b>Mang cây hoặc hóa đơn đến bất kỳ cửa hàng nào để được hỗ trợ.
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>{' '}
    </>
  );
}
