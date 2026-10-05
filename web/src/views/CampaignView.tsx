// Sinh tự động từ design-system/components/CampaignLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';
import { CatalogCard } from '@/components/CatalogCard';
import { TetHeroMedia } from '@/components/TetHeroMedia';

export function CampaignView() {
  return (
    <>
      {' '}
      <div style={{ background: 'var(--surface-page)' }}>
        <section className="cp-hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span
              className="vx-badge"
              style={{ background: 'var(--surface)', color: 'var(--sale)', alignSelf: 'flex-start' }}
            >
              Đặt trước · Tết Đinh Mùi 2027
            </span>
            <h1>Cây Tết đặt sớm – giữ giá, giao đúng ngày</h1>
            <p>Chọn cây từ bây giờ, cọc 30%. Vườn chăm và canh hoa nở đúng Tết, giao tận nhà theo lịch bạn chọn.</p>
            <div className="cp-count">
              <span style={{ fontSize: '13px', marginRight: '6px' }}>Ưu đãi đặt sớm kết thúc sau</span>
              <div>
                <b>18</b>
                <small>ngày</small>
              </div>
              <div>
                <b>06</b>
                <small>giờ</small>
              </div>
              <div>
                <b>42</b>
                <small>phút</small>
              </div>
            </div>
            <Link
              href="/danh-muc/cay-canh/lan"
              className="vx-btn vx-btn--lg"
              style={{ alignSelf: 'flex-start', background: 'var(--surface)', color: 'var(--sale)' }}
            >
              Chọn cây Tết ngay
            </Link>
          </div>
          <TetHeroMedia />
        </section>{' '}
        <section className="sv-sec">
          <div className="cp-steps">
            <div>
              <b className="n">1</b>
              <span>
                <b>Chọn cây</b>
                <br />
                Xem ảnh cây thật tại vườn
              </span>
            </div>
            <div>
              <b className="n">2</b>
              <span>
                <b>Cọc 30%</b>
                <br />
                Giữ cây và giữ giá
              </span>
            </div>
            <div>
              <b className="n">3</b>
              <span>
                <b>Chọn ngày giao</b>
                <br />
                Lịch giao Tết có hạn
              </span>
            </div>
            <div>
              <b className="n">4</b>
              <span>
                <b>Nhận cây</b>
                <br />
                Trả phần còn lại khi nhận
              </span>
            </div>
          </div>{' '}
          <div className="cp-tabs">
            <button className="vx-chip" aria-pressed="true">
              Tất cả
            </button>
            <button className="vx-chip">Mai</button>
            <button className="vx-chip">Đào</button>
            <button className="vx-chip">Quất</button>
            <button className="vx-chip">Lan Tết</button>
            <button className="vx-chip">Dưới 1 triệu</button>
            <button className="vx-chip">Quà Tết doanh nghiệp</button>
          </div>{' '}
          <div className="vx-grid app-cols" style={{ '--cols': 'repeat(4,1fr)' }}>
            <CatalogCard name="Mai vàng bonsai dáng trực" />
            <CatalogCard name="Quất bonsai sai quả" />
            <CatalogCard name="Lan hồ điệp 5 cành vàng" />
            <CatalogCard name="Đào thất thốn chậu sứ" />
          </div>
        </section>{' '}
        <section className="sv-sec" style={{ paddingTop: '0' }}>
          <div className="vx-sect">
            <h2 style={{ fontSize: '18px' }}>
              <span className="vx-sect__mark">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M4 10h16M9 3v4M15 3v4" />
                </svg>
              </span>
              Lịch giao cây Tết
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
              Mỗi ngày giới hạn số chuyến để giao đúng giờ
            </span>
          </div>
          <div className="cp-cal">
            <div className="">
              T5<b>22/01</b>
              <span>Còn chỗ</span>
            </div>
            <div className="">
              T6<b>23/01</b>
              <span>Còn chỗ</span>
            </div>
            <div className="few">
              T7<b>24/01</b>
              <span>Còn 6 chuyến</span>
            </div>
            <div className="few">
              CN<b>25/01</b>
              <span>Còn 2 chuyến</span>
            </div>
            <div className="full">
              T2<b>26/01</b>
              <span>Đã kín</span>
            </div>
            <div className="full">
              T3<b>27/01</b>
              <span>Đã kín</span>
            </div>
            <div className="full">
              T4<b>28/01</b>
              <span>Đã kín</span>
            </div>
          </div>
        </section>
      </div>{' '}
    </>
  );
}
