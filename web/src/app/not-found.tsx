import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { after } from 'next/server';
import { SearchBox } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { SiteChrome } from '@/components/SiteChrome';
import { botOf } from '@/lib/monitor';
import { SITE_ORIGIN } from '@/lib/site';
import { record404 } from '@/server/monitor-store';

// Next tự thêm <meta name="robots" content="noindex"> cho mọi trang 404.
export const metadata: Metadata = { title: 'Không tìm thấy trang' };

/**
 * Trang 404. Đường dẫn không khớp trang nào → HTML máy chủ có đủ nội dung. Trang gọi notFound() (sản phẩm, bài… không có):
 * Next 16 trả mã 404 + noindex nhưng HTML máy chủ rỗng (<html id="__next_error__">), giao diện này hiện sau khi chạy JS —
 * hành vi của Next (thử trên app tối giản cũng vậy), không phải lỗi của web. Xem seo:templates.
 */
export default async function NotFound() {
  // Giám sát SEO (mục 19): ghi đường dẫn hỏng (proxy gửi qua header x-ccmt-path) + trang dẫn tới, sau khi đã trả trang.
  const h = await headers();
  const path = h.get('x-ccmt-path');
  if (path) {
    const ref = h.get('referer') ?? '';
    const host = (() => { try { return new URL(ref).host; } catch { return ''; } })();
    const own = !host || host === new URL(SITE_ORIGIN).host || host === h.get('host');
    after(() => record404({ path, referrer: ref, external: !own, bot: !!botOf(h.get('user-agent')) }));
  }
  return (
    <SiteChrome>
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
