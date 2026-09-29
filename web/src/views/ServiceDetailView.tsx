// Sinh tự động từ design-system/components/ServiceDetailLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';
import { CatalogCard } from '@/components/CatalogCard';

export function ServiceDetailView() {
  return (
    <>
      {' '}
      <div style={{ background: 'var(--surface-page)' }}>
        <div style={{ padding: '16px 24px 0' }}>
          <div className="vx-crumb">
            <Link href="/">Trang chủ</Link>/<Link href="/dich-vu">Dịch vụ</Link>/<span>Cho thuê cây văn phòng</span>
          </div>
        </div>
        <section className="sv-sec">
          <h2>Cho thuê cây văn phòng</h2>
          <p className="sub">Cây đẹp quanh năm, không cần tự chăm. Cây yếu được thay miễn phí.</p>
          <div className="pk-grid" style={{ marginTop: '12px' }}>
            <div className="pk">
              <b className="n">Cơ bản</b>
              <span className="p">
                45.000đ<small>{' / cây / tháng'}</small>
              </span>
              <ul>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Cây cao 40–80cm, chậu nhựa cao cấp
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Chăm sóc 2 tuần/lần
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Thay cây khi yếu, không giới hạn
                </li>
                <li className="no">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                  Chậu gốm, cây trên 1m2
                </li>
                <li className="no">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                  Báo cáo tình trạng cây hằng tháng
                </li>
              </ul>
              <Link href="/dich-vu/dat-lich-khao-sat?loai=van-phong" className="vx-btn vx-btn--outline vx-btn--block">
                Chọn gói này
              </Link>
            </div>
            <div className="pk hot">
              <span className="badge">Được chọn nhiều nhất</span>
              <b className="n">Tiêu chuẩn</b>
              <span className="p">
                75.000đ<small>{' / cây / tháng'}</small>
              </span>
              <ul>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Cây cao đến 1m5, chậu gốm/composite
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Chăm sóc hằng tuần
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Thay cây khi yếu, không giới hạn
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Đổi mẫu cây theo mùa (2 lần/năm)
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Báo cáo tình trạng cây hằng tháng
                </li>
              </ul>
              <Link href="/dich-vu/dat-lich-khao-sat?loai=van-phong" className="vx-btn vx-btn--primary vx-btn--block">
                Chọn gói này
              </Link>
            </div>
            <div className="pk">
              <b className="n">Cao cấp</b>
              <span className="p">
                Liên hệ<small> </small>
              </span>
              <ul>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Cây lớn, tiểu cảnh sảnh, vườn đứng
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Chăm sóc 2 lần/tuần
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Kỹ sư phụ trách riêng
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Trang trí theo sự kiện, Tết
                </li>
                <li className="">
                  <svg className="vx-ico" viewBox="0 0 24 24">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Báo cáo tình trạng cây hằng tháng
                </li>
              </ul>
              <Link href="/dich-vu/dat-lich-khao-sat?loai=van-phong" className="vx-btn vx-btn--outline vx-btn--block">
                Chọn gói này
              </Link>
            </div>
          </div>
        </section>
        <section className="sv-sec" style={{ paddingTop: '0' }}>
          <div className="calc">
            <div>
              <b style={{ fontSize: '16px' }}>Ước tính chi phí</b>
              <div className="calc-row">
                <span>
                  Số cây<small>Gợi ý: 1 cây cho mỗi 5–8m² văn phòng</small>
                </span>
                <span className="vx-stepper">
                  <button>−</button>
                  <span>24</span>
                  <button>+</button>
                </span>
              </div>
              <div className="calc-row">
                <span>
                  Gói
                  <small />
                </span>
                <span className="vx-seg">
                  <button className="vx-chip">Cơ bản</button>
                  <button className="vx-chip" aria-pressed="true">
                    Tiêu chuẩn
                  </button>
                </span>
              </div>
              <div className="calc-row">
                <span>
                  Thời hạn thuê<small>Thuê 12 tháng giảm 10%</small>
                </span>
                <span className="vx-seg">
                  <button className="vx-chip">6 tháng</button>
                  <button className="vx-chip" aria-pressed="true">
                    12 tháng
                  </button>
                </span>
              </div>
              <div className="calc-row">
                <span>
                  Xuất hóa đơn VAT
                  <small />
                </span>
                <button className="vx-switch" aria-checked="true" />
              </div>
            </div>
            <div className="calc-out">
              <span>Chi phí ước tính</span>
              <span className="big">
                1.620.000đ<small>{' / tháng'}</small>
              </span>
              <span>24 cây × 75.000đ, đã giảm 10% cho hợp đồng 12 tháng. Giá chính xác sau khảo sát.</span>
              <Link href="/dich-vu/dat-lich-khao-sat?loai=van-phong" className="vx-btn vx-btn--primary vx-btn--block">
                Nhận báo giá chính thức
              </Link>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                Không cần đặt cọc. Lắp đặt trong 3–5 ngày.
              </span>
            </div>
          </div>
        </section>
        <section className="sv-sec" style={{ paddingTop: '0' }}>
          <div className="vx-sect">
            <h2 style={{ fontSize: '18px' }}>Cây thường dùng cho văn phòng</h2>
            <a className="vx-link">Xem tất cả</a>
          </div>
          <div className="vx-grid app-cols" style={{ '--cols': 'repeat(4,1fr)' }}>
            <CatalogCard name="Kim tiền chậu composite trắng" />
            <CatalogCard name="Lưỡi hổ Thái viền vàng" />
            <CatalogCard name="Bàng Singapore chậu gốm" />
            <CatalogCard name="Trầu bà leo cột" />
          </div>
        </section>
      </div>{' '}
    </>
  );
}
