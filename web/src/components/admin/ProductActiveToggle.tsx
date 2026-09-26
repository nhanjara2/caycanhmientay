'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setProductActiveAction } from '@/app/actions/admin';

/** Bật/tắt bán nhanh ngay trong bảng sản phẩm. */
export function ProductActiveToggle({ slug, active }: { slug: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        className="vx-switch"
        role="switch"
        aria-checked={active}
        aria-label={active ? 'Đang bán — bấm để ẩn' : 'Đang ẩn — bấm để bán'}
        disabled={pending}
        onClick={() => start(async () => { await setProductActiveAction(slug, !active); router.refresh(); })}
      />
      <small style={{ display: 'inline' }}>{active ? 'Đang bán' : 'Ẩn'}</small>
    </span>
  );
}
