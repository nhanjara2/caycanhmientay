'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setVoucherActiveAction } from '@/app/actions/vouchers';

/** Bật/tắt mã giảm giá nhanh ngay trong bảng. */
export function VoucherActiveToggle({ id, active }: { id: number; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        className="vx-switch"
        role="switch"
        aria-checked={active}
        aria-label={active ? 'Đang bật — bấm để tắt' : 'Đang tắt — bấm để bật'}
        disabled={pending}
        onClick={() => start(async () => { await setVoucherActiveAction(id, !active); router.refresh(); })}
      />
      <small style={{ display: 'inline' }}>{active ? 'Bật' : 'Tắt'}</small>
    </span>
  );
}
