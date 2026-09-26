import Link from 'next/link';
import { SearchBox } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { SiteChrome } from '@/components/SiteChrome';

export default function NotFound() {
  return (
    <SiteChrome>
    <div className="nf">
      <div className="nf-art">
        4
        <span style={{ position: 'relative', display: 'inline-grid', transform: 'none', left: 'auto', top: 'auto', verticalAlign: 'middle', margin: '0 8px' }}>
          <Icon name="leaf" />
        </span>
        4
      </div>
      <h1>Trang này đã &ldquo;chuyển chậu&rdquo; mất rồi</h1>
      <p>Đường dẫn có thể đã thay đổi hoặc sản phẩm không còn bán. Bạn thử tìm lại hoặc quay về trang chủ nhé.</p>
      <SearchBox placeholder="Tìm cây, thuốc, phân bón…" />
      <div className="vx-row" style={{ justifyContent: 'center' }}>
        <Link href="/" className="vx-btn vx-btn--primary">Về trang chủ</Link>
        <Link href="/tim-kiem?q=bán chạy" className="vx-btn vx-btn--outline">Xem cây bán chạy</Link>
      </div>
    </div>
    </SiteChrome>
  );
}
