// Sinh tự động từ design-system/components/FlashSaleLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import { FlashSaleGrid } from '@/components/FlashSaleGrid';

export function FlashSaleView() {
  return (
    <>
      {' '}
      <div style={{ background: 'var(--surface-page)' }}>
        <section className="fs-hero">
          <h1>
            <svg className="vx-ico" viewBox="0 0 24 24">
              <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
            </svg>
            Flash sale giờ vàng
          </h1>
          <div className="fs-slots">
            <div className="fs-slot" style={{ opacity: '.6' }}>
              Đã kết thúc<b>00:00</b>
            </div>
            <div className="fs-slot" aria-current="true">
              Đang diễn ra<b>08:00 – 12:00</b>
            </div>
            <div className="fs-slot soon">
              Sắp diễn ra<b>12:00 – 16:00</b>
            </div>
            <div className="fs-slot soon">
              Sắp diễn ra<b>20:00 – 22:00</b>
            </div>
            <div className="fs-slot soon">
              Ngày mai<b>08:00</b>
            </div>
          </div>
        </section>{' '}
        <section className="sv-sec">
          <div className="fs-bar">
            <span className="rem">Kết thúc sau</span>
            <span className="vx-count">
              <b>02</b>:<b>14</b>:<b>37</b>
            </span>
            <span className="vx-seg" style={{ marginLeft: '16px' }}>
              <button className="vx-chip" aria-pressed="true">
                Tất cả
              </button>
              <button className="vx-chip">Cây cảnh</button>
              <button className="vx-chip">Phân, thuốc</button>
              <button className="vx-chip">Chậu, vật tư</button>
            </span>
            <span className="note">Mỗi khách mua tối đa 2 sản phẩm / mã trong khung giờ</span>
          </div>
          <FlashSaleGrid />
        </section>
      </div>{' '}
    </>
  );
}
