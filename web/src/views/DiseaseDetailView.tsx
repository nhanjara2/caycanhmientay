// Sinh tự động từ design-system/components/DiseaseDetailLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';
import { CatalogCard } from '@/components/CatalogCard';

export function DiseaseDetailView() {
  return (
    <>
      {' '}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px 24px 32px',
          background: 'var(--surface)',
        }}
      >
        <div className="dd-hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="vx-crumb">
              <Link href="/benh-cay">Bệnh cây trồng</Link>/<Link href="/benh-cay">Rễ</Link>/<span>Thối rễ</span>
            </div>
            <h1>Thối rễ (úng rễ do nấm)</h1>
            <span className="ad-tags">
              <span className="vx-badge vx-badge--info">Nấm bệnh</span>
              <span className="vx-badge vx-badge--info">Rễ, gốc</span>
              <span className="vx-badge vx-badge--info">Mùa mưa</span>
            </span>
            <p style={{ margin: '0', color: 'var(--ink-muted)', fontSize: '15px', lineHeight: '24px' }}>
              Bệnh do nấm (thường là Pythium, Phytophthora, Fusarium) tấn công bộ rễ khi đất ẩm kéo dài và thiếu thoáng
              khí. Rễ thối không hút được nước, cây héo dù đất ướt.
            </p>{' '}
            <div className="dd-facts">
              <div>
                Mức nguy hiểm<b>Cao</b>
                <span className="dd-sev">
                  <i className="on" />
                  <i className="on" />
                  <i className="on" />
                  <i className="on" />
                  <i />
                </span>
              </div>
              <div>
                Lây lan<b>Qua đất, nước</b>
              </div>
              <div>
                Hay gặp ở<b>Kiểng lá, lan, sen đá</b>
              </div>
              <div>
                Mùa<b>Mưa, nồm ẩm</b>
              </div>
            </div>
          </div>{' '}
          <div className="ar-cta">
            <b>Chưa chắc cây bị thối rễ?</b>
            <span>Trả lời 5 câu hỏi hoặc gửi 3 ảnh cho kỹ sư.</span>
            <Link href="/benh-cay" className="vx-btn">
              Bắt bệnh cho cây
            </Link>
          </div>
        </div>{' '}
        <h2 style={{ margin: '8px 0 0', fontSize: '20px' }}>Triệu chứng</h2>
        <div className="dd-sym">
          <div>
            <span className="img">
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
              <em>Lá</em>
            </span>
            Lá dưới vàng, mềm, rũ; lan dần lên lá non
          </div>
          <div>
            <span className="img">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21V3M12 9l-4-3M12 14l4-3" />
              </svg>
              <em>Gốc</em>
            </span>
            Gốc thâm, mềm, ấn vào lõm; có thể có mùi hôi
          </div>
          <div>
            <span className="img">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v8M12 11l-5 8M12 11l5 8M12 11v9" />
              </svg>
              <em>Rễ</em>
            </span>
            Rễ nâu đen, nhũn, vỏ rễ tuột khi kéo nhẹ
          </div>
        </div>{' '}
        <div className="dd-cmp">
          <div>
            <b>Dễ nhầm với: Thiếu nước</b>Thiếu nước lá giòn, đất khô; thối rễ lá mềm, đất ẩm.
          </div>
          <div>
            <b>Dễ nhầm với: Thiếu đạm</b>Thiếu đạm vàng đều, gốc và rễ trắng khỏe.
          </div>
        </div>{' '}
        <h2 style={{ margin: '8px 0 0', fontSize: '20px' }}>Cách xử lý</h2>
        <div className="dd-steps">
          <div className="dd-step">
            <b className="n">1</b>
            <span>
              <b>Ngừng tưới, nhấc cây khỏi chậu</b>
              <small>Gỡ bớt đất cũ, rửa nhẹ bộ rễ</small>
            </span>
          </div>
          <div className="dd-step">
            <b className="n">2</b>
            <span>
              <b>Cắt bỏ rễ thối</b>
              <small>Dùng kéo sạch, cắt đến phần rễ trắng chắc</small>
            </span>
          </div>
          <div className="dd-step">
            <b className="n">3</b>
            <span>
              <b>Ngâm rễ bằng chế phẩm Trichoderma</b>
              <small>Pha theo hướng dẫn trên bao bì, ngâm 15–20 phút</small>
            </span>
          </div>
          <div className="dd-step">
            <b className="n">4</b>
            <span>
              <b>Trồng lại bằng giá thể thoát nước</b>
              <small>Lót đá đáy chậu, tưới lại sau 3–5 ngày</small>
            </span>
          </div>
        </div>{' '}
        <div className="vx-note">
          <svg className="vx-ico" viewBox="0 0 24 24">
            <path d="M12 3 2 20h20z" />
            <path d="M12 10v4M12 17v.5" />
          </svg>
          <div>
            <b>Lưu ý an toàn:</b>
            {' Đeo găng tay khi pha thuốc. Không dùng chung kéo cho cây khỏe khi chưa khử trùng.'}
          </div>
        </div>{' '}
        <section className="vx-panel" style={{ padding: '0', background: 'none' }}>
          <div className="vx-sect">
            <h2 style={{ fontSize: '18px' }}>
              <span className="vx-sect__mark">
                <svg className="vx-ico" viewBox="0 0 24 24">
                  <path d="M9 3h6M10 3v6L5 19a1 1 0 0 0 1 2h12a1 1 0 0 0 1-1l-5-11V3" />
                </svg>
              </span>
              Sản phẩm xử lý thối rễ
            </h2>
            <a className="vx-link">Xem tất cả</a>
          </div>
          <div className="vx-grid app-cols" style={{ '--cols': 'repeat(4,1fr)' }}>
            <CatalogCard name="Chế phẩm sinh học Trichoderma trị nấm, thối rễ" />
            <CatalogCard name="Đất trộn kiểng lá thoát nước tốt" />
            <CatalogCard name="Đá lót chậu pumice" />
            <CatalogCard name="Chậu nhựa có lỗ thoát nước Ø25" />
          </div>
        </section>
      </div>{' '}
    </>
  );
}
