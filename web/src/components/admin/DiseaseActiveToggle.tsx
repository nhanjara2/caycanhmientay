'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setDiseaseActiveAction } from '@/app/actions/diseases';

/** Hiện/ẩn bài bệnh ngay trong bảng. */
export function DiseaseActiveToggle({ slug, active }: { slug: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        className="vx-switch"
        role="switch"
        aria-checked={active}
        aria-label={active ? 'Đang hiện — bấm để ẩn' : 'Đang ẩn — bấm để hiện'}
        disabled={pending}
        onClick={() => start(async () => { await setDiseaseActiveAction(slug, !active); router.refresh(); })}
      />
      <small style={{ display: 'inline' }}>{active ? 'Đang hiện' : 'Ẩn'}</small>
    </span>
  );
}
