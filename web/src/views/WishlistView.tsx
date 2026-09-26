// Sinh tự động từ design-system/components/WishlistLayout/preview.html — không sửa tay.
// Chạy `npm run gen-views` sau khi đổi preview.html hoặc scripts/views.config.mjs.
import Link from 'next/link';
import { AccountSidebar } from '@/components/AccountSidebar';
import { CatalogCard } from '@/components/CatalogCard';

export function WishlistView() {
  return (
    <>
      <div className="vx-acctpage">
        <div className="vx-crumb">
          <Link href="/">Trang chủ</Link>/<Link href="/tai-khoan">Tài khoản</Link>/<span>Sản phẩm yêu thích</span>
        </div>
        <div className="vx-acctgrid">
          <AccountSidebar />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '0' }}>
            <div className="gd-head">
              <h2>
                {'Sản phẩm yêu thích '}
                <small style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink-muted)' }}>(6)</small>
              </h2>
              <span className="acts">
                <span className="vx-seg">
                  <button className="vx-chip" aria-pressed="true">
                    Tất cả
                  </button>
                  <button className="vx-chip">Đang giảm giá</button>
                  <button className="vx-chip">Có hàng lại</button>
                </span>
              </span>
            </div>{' '}
            <div className="vx-grid app-cols" style={{ '--cols': 'repeat(3,1fr)' }}>
              <CatalogCard name="Cây Monstera Deliciosa chậu sứ trắng" />
              <CatalogCard name="Alocasia Polly lá mũi tên" />
              <CatalogCard name="Bonsai sam hương dáng trực" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
