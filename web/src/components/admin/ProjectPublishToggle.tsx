'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { setProjectPublishedAction } from '@/app/actions/projects';

/** Hiện / ẩn dự án trên trang Đối tác sỉ ngay trong bảng. */
export function ProjectPublishToggle({ id, published }: { id: number; published: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        className="vx-switch"
        role="switch"
        aria-checked={published}
        aria-label={published ? 'Đang hiện — bấm để ẩn' : 'Đang ẩn — bấm để hiện'}
        disabled={pending}
        onClick={() => start(async () => {
          setError('');
          const r = await setProjectPublishedAction(id, !published).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
          if (!r.ok) setError(r.error);
          router.refresh();
        })}
      />
      <small style={{ display: 'inline' }}>{published ? 'Đang hiện' : 'Ẩn'}</small>
      {error && <small role="alert" style={{ display: 'block', color: 'var(--danger)', maxWidth: 220 }}>{error}</small>}
    </span>
  );
}
