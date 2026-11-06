'use client';

import Link from '@/components/LocaleLink';
import { Icon } from './Icon';

/**
 * Giao diện lỗi máy chủ / lỗi dựng trang (dùng trong error.tsx). Khi lỗi xảy ra lúc dựng trang trên máy chủ,
 * Next vẫn trả mã 500 kèm giao diện này (không phải 200) nên Google không lập chỉ mục trang lỗi;
 * thẻ noindex là lớp thứ hai cho trường hợp trang đã gửi mã 200 trước khi lỗi.
 */
export function ErrorView({ retry }: { retry: () => void }) {
  return (
    <div className="nf">
      <meta name="robots" content="noindex" />
      <div className="nf-art" aria-hidden="true">
        5
        <span style={{ position: 'relative', display: 'inline-grid', transform: 'none', left: 'auto', top: 'auto', verticalAlign: 'middle', margin: '0 8px' }}>
          <Icon name="leaf" />
        </span>
        0
      </div>
      <h1>Đã có lỗi xảy ra</h1>
      <div className="vx-row" style={{ justifyContent: 'center' }}>
        <button type="button" className="vx-btn vx-btn--primary" onClick={() => retry()}>Thử lại</button>
        <Link href="/" className="vx-btn vx-btn--outline">Về trang chủ</Link>
      </div>
    </div>
  );
}
