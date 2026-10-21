import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchBox } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { NotFoundBeacon } from '@/components/NotFoundBeacon';
import { SiteChrome } from '@/components/SiteChrome';

// Next tự thêm <meta name="robots" content="noindex"> cho mọi trang 404.
export const metadata: Metadata = { title: 'Không tìm thấy trang' };

/**
 * Trang 404. Đường dẫn không khớp trang nào → HTML máy chủ có đủ nội dung. Trang gọi notFound() (sản phẩm, bài… không có):
 * Next 16 trả mã 404 + noindex nhưng HTML máy chủ rỗng (<html id="__next_error__">), giao diện này hiện sau khi chạy JS —
 * hành vi của Next (thử trên app tối giản cũng vậy), không phải lỗi của web. Xem seo:templates.
 */
export default function NotFound() {
  return (
    <SiteChrome>
    {/* Giám sát SEO (mục 19): ghi đường dẫn hỏng từ trình duyệt. KHÔNG ghi ở máy chủ: Next dựng sẵn component này kèm
        MỌI trang (làm khung bắt 404), nên ghi ở đây là trang nào mở ra cũng bị đếm thành "không tìm thấy". */}
    <NotFoundBeacon />
    <main id="noi-dung" tabIndex={-1} className="nf">
      <div className="nf-art" aria-hidden="true">
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
    </main>
    </SiteChrome>
  );
}
