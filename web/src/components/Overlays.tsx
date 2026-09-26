'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { Icon } from './Icon';

/** Nút liên hệ nổi góc phải dưới, hiện trên mọi trang. */
export function ContactFab() {
  return (
    <div className="vx-fab app-fab">
      <a className="alt" href="https://zalo.me" target="_blank" rel="noreferrer">
        <Icon name="chat" />
        <span className="app-hide-sm">Chat Zalo</span>
      </a>
      <a href="tel:1800xxxx">
        <Icon name="phone" />
        <span className="app-hide-sm">Gọi tư vấn</span>
      </a>
    </div>
  );
}

export function Toaster() {
  const { toast } = useCart();
  if (!toast) return null;
  return (
    <div className="app-toast" role="status" aria-live="polite">
      <div className="ts">
        <span className="ic ok"><Icon name="check" /></span>
        <span>{toast}</span>
        <Link href="/gio-hang">Xem giỏ</Link>
      </div>
    </div>
  );
}
