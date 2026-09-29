'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useEffect, useState, useTransition } from 'react';
import { toggleWishlistAction } from '@/app/actions/wishlist';
import { saveAfterLogin, takeAfterLogin } from '@/lib/after-login';
import { useAuth } from '@/lib/auth';
import { Icon } from './Icon';

/**
 * Nút tim lưu/bỏ sản phẩm yêu thích — dùng ở BuyBox và trang Yêu thích.
 * Khách chưa đăng nhập bấm thì mở hộp đăng nhập, đăng nhập xong tự lưu (lib/after-login.ts).
 */
export function WishlistHeart({ slug, active, onChange, className, style, labels }: {
  slug: string; active: boolean; onChange?: (active: boolean) => void; className?: string; style?: CSSProperties;
  /** Có chữ kèm icon (BuyBox) — bỏ trống thì chỉ hiện icon (thẻ sản phẩm trang Yêu thích). */
  labels?: { on: string; off: string };
}) {
  const { user, ready, openLogin } = useAuth();
  const router = useRouter();
  const [on, setOn] = useState(active);
  const [pending, start] = useTransition();

  // Trang tải lại dữ liệu (vd. vừa đăng nhập: sản phẩm đã lưu từ trước) → theo trạng thái mới của server.
  useEffect(() => setOn(active), [active]);

  /** addOnly: lưu tiếp sau khi đăng nhập — chỉ lưu, không bỏ sản phẩm đã lưu từ trước. */
  const send = (addOnly: boolean) => start(async () => {
    const r = await toggleWishlistAction(slug, addOnly || undefined).catch(() => ({ ok: false as const, error: '' }));
    if (!r.ok) return;
    setOn(r.wishlisted);
    onChange?.(r.wishlisted);
    if (addOnly) router.refresh(); // lần tải lại lúc đăng nhập có thể về sau lượt lưu này — lấy lại trạng thái đúng
  });

  useEffect(() => {
    if (ready && user && takeAfterLogin('wishlist', (a) => a.slug === slug)) send(true);
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    if (!ready) return; // chưa biết đã đăng nhập hay chưa — tránh mở nhầm hộp đăng nhập
    if (!user) { saveAfterLogin({ kind: 'wishlist', slug }); openLogin(); return; }
    send(false);
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
