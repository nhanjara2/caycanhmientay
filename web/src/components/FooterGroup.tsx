'use client';

import { usePathname } from '@/components/LocaleLink';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

const MOBILE = '(max-width: 47.9375em)';

/**
 * Nhóm liên kết của Footer. Desktop/tablet: tiêu đề + danh sách luôn hiện như cũ.
 * Mobile < 768px: thu gọn thành accordion (bấm tiêu đề để mở), theo design-system/components/Footer/README.md.
 * Trạng thái đóng/mở chỉ nằm ở thuộc tính data-open — CSS (globals.css, .vx-fcol--fold) quyết định có ẩn danh sách hay không,
 * nên HTML từ server không bị nháy mở rồi đóng trước khi trang tải xong.
 */
export function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const pathname = usePathname();
  const bodyId = useId();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <div className="vx-fcol vx-fcol--fold" data-open={open ? '' : undefined}>
      <h4>
        {/* Desktop không phải nút: bỏ khỏi thứ tự Tab và không báo trạng thái đóng/mở */}
        <button
          type="button"
          className="vx-fcol__head"
          aria-expanded={mobile ? open : undefined}
          aria-controls={mobile ? bodyId : undefined}
          tabIndex={mobile ? undefined : -1}
          onClick={() => setOpen((o) => !o)}
        >
          {title}
          <Icon name="chevron" className="chev" />
        </button>
      </h4>
      <div className="vx-fcol__body" id={bodyId}>{children}</div>
    </div>
  );
}
