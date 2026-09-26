// Sinh tự động từ design-system/components/BusinessLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';

export function BusinessView() {
  return (
    <>
      {' '}
      <div style={{ background: 'var(--surface-page)' }}>
        <section className="sv-hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span className="vx-badge vx-badge--sun" style={{ alignSelf: 'flex-start' }}>
              Cây Cảnh Miền Tây Doanh nghiệp
            </span>
            <h1>Cây xanh cho văn phòng, dự án và quà tặng đối tác</h1>
            <p>
              Giá sỉ theo số lượng, xuất hóa đơn VAT, công nợ theo tháng và một người phụ trách riêng cho doanh nghiệp
              của bạn.
            </p>
            <div className="acts">
              <Link href="/dich-vu/dat-lich-khao-sat" className="vx-btn vx-btn--lg vx-btn--light">
                Yêu cầu báo giá
              </Link>
              <button className="vx-btn vx-btn--lg vx-btn--line">Tải hồ sơ năng lực</button>
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
              <rect x="5" y="3" width="14" height="18" rx="1" />
              <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
            </svg>
            <span className="tag">
              <b>Báo giá trong 24 giờ</b>Cho đơn từ 10 sản phẩm
            </span>
          </div>
        </section>{' '}
        <section className="sv-sec">
          <div className="bz-logos">
            <span>LOGO KHÁCH HÀNG</span>
            <span>LOGO KHÁCH HÀNG</span>
            <span>LOGO KHÁCH HÀNG</span>
            <span>LOGO KHÁCH HÀNG</span>
            <span>LOGO KHÁCH HÀNG</span>
            <span>LOGO KHÁCH HÀNG</span>
          </div>
        </section>{' '}
        <section className="sv-sec" style={{ paddingTop: '0' }}>
          <h2>Quyền lợi khách doanh nghiệp</h2>
          <div className="bz-perks">
            <div>
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M3 12V4h8l10 10-8 8z" />
                  <circle cx="7.5" cy="8.5" r="1.5" />
                </svg>
              </span>
              <b>Giá sỉ theo bậc</b>Giảm 5–15% theo số lượng, áp dụng cả cây, chậu và vật tư
            </div>
            <div>
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M6 3h9l4 4v14H6z" />
                  <path d="M9 12h7M9 16h7" />
                </svg>
              </span>
              <b>{'Hóa đơn VAT & công nợ'}</b>Xuất hóa đơn điện tử, thanh toán cuối tháng cho khách thường xuyên
            </div>
            <div>
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
                  <circle cx="17" cy="9" r="2.5" />
                  <path d="M16 14c2.5 0 4.2 1.4 5 4" />
                </svg>
              </span>
              <b>Người phụ trách riêng</b>Một đầu mối nhận yêu cầu, theo dõi giao hàng và chăm sóc
            </div>
            <div>
              <span>
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="4" y="9" width="16" height="11" />
                  <path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z" />
                </svg>
              </span>
              <b>Quà tặng số lượng lớn</b>Cây quà tặng in thiệp logo công ty, giao đến nhiều địa chỉ
            </div>
          </div>
        </section>{' '}
        <section className="sv-sec" style={{ paddingTop: '0' }}>
          <h2>Giá sỉ theo số lượng</h2>
          <div className="bz-tier">
            <table className="vx-table" style={{ border: '0' }}>
              <thead>
                <tr>
                  <th>Số lượng mỗi đơn</th>
                  <th>Cây cảnh, chậu</th>
                  <th>Thuốc, phân, vật tư</th>
                  <th>Ưu đãi thêm</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>10 – 29 sản phẩm</td>
                  <td>Giảm 5%</td>
                  <td>Giảm 5%</td>
                  <td>Miễn phí giao nội thành</td>
                </tr>
                <tr>
                  <td>30 – 99 sản phẩm</td>
                  <td>Giảm 10%</td>
                  <td>Giảm 8%</td>
                  <td>Tặng thiệp in logo</td>
                </tr>
                <tr>
                  <td>Từ 100 sản phẩm</td>
                  <td>Giảm 15%</td>
                  <td>Giảm 12%</td>
                  <td>Báo giá riêng, công nợ 30 ngày</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>{' '}
        <div className="sv-cta">
          <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: '40px', height: '40px' }}>
            <rect x="5" y="3" width="14" height="18" rx="1" />
            <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
          </svg>
          <span>
            <b>Gửi danh sách, nhận báo giá trong 24 giờ</b>
            <span>Tải lên file Excel hoặc chọn sản phẩm trên web</span>
          </span>
          <Link href="/dich-vu/dat-lich-khao-sat" className="vx-btn vx-btn--lg">
            Yêu cầu báo giá
          </Link>
        </div>
      </div>{' '}
    </>
  );
}
