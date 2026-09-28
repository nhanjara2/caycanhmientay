'use client';

import type { CSSProperties } from 'react';
import { useState, useTransition } from 'react';
import { toggleWishlistAction } from '@/app/actions/wishlist';
import { useAuth } from '@/lib/auth';
import { Icon } from './Icon';

/** Nút tim lưu/bỏ sản phẩm yêu thích — dùng ở BuyBox và trang Yêu thích. Khách chưa đăng nhập bấm thì mở hộp đăng nhập. */
export function WishlistHeart({ slug, active, onChange, className, style, labels }: {
  slug: string; active: boolean; onChange?: (active: boolean) => void; className?: string; style?: CSSProperties;
  /** Có chữ kèm icon (BuyBox) — bỏ trống thì chỉ hiện icon (thẻ sản phẩm trang Yêu thích). */
  labels?: { on: string; off: string };
}) {
  const { user, openLogin } = useAuth();
  const [on, setOn] = useState(active);
  const [pending, start] = useTransition();

  const toggle = () => {
    if (!user) { openLogin(); return; }
    start(async () => {
      const r = await toggleWishlistAction(slug).catch(() => ({ ok: false as const, error: '' }));
      if (!r.ok) return;
      setOn(r.wishlisted);
      onChange?.(r.wishlisted);
    });
  };

  return (
    <button
      type="button"
      className={className ?? 'wl-heart'}
      style={on ? { color: 'var(--sale)', ...style } : style}
      aria-pressed={on}
      aria-label={on ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
      onClick={toggle}
      disabled={pending}
    >
      <Icon name="heart" style={on ? { fill: 'currentColor' } : undefined} />
      {labels && (on ? labels.on : labels.off)}
    </button>
  );
}
