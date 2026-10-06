'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { SALES_PHONE, ZALO_URL } from '@/lib/contact';
import { Icon } from './Icon';

/**
 * Nút liên hệ trên mọi trang. Máy tính / tablet: hai nút nổi góc phải dưới.
 * Điện thoại (< 768px): thanh cố định dưới đáy, nút có chữ — không đè lên nội dung (.app-site chừa chỗ ở đáy, xem globals.css).
 */
export function ContactFab() {
  return (
    <div className="vx-fab app-fab">
      <a className="alt" href={ZALO_URL} target="_blank" rel="noreferrer">
        <img src="/images/social/zalo.svg" alt="" className="app-fab-logo" />
        <span>Chat Zalo</span>
      </a>
      <a href={`tel:${SALES_PHONE}`}>
        <Icon name="phone" />
        <span>Gọi tư vấn</span>
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
