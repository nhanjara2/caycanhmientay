'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { setOrderStatusAction } from '@/app/actions/orders';
import { STATUS_ACTION, type Status } from '@/lib/order-labels';

/** Nút chuyển trạng thái đơn (chỉ hiện bước hợp lệ tiếp theo). Hủy đơn cần xác nhận. */
export function StatusActions({ code, next }: { code: string; next: Status[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');

  const go = (s: Status) => {
    if (s === 'cancelled' && !confirm(`Hủy đơn ${code}? Hàng sẽ được trả về kho.`)) return;
    setError('');
    start(async () => {
      const r = await setOrderStatusAction(code, s).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  };

  if (!next.length) return null;
  return (
    <span className="acts">
      {error && <span className="vx-err" role="alert">{error}</span>}
      {next.map((s) => (
        <button
          key={s}
          type="button"
          disabled={pending}
          className={s === 'cancelled' ? 'vx-btn vx-btn--outline' : 'vx-btn vx-btn--primary'}
          onClick={() => go(s)}
        >
          {STATUS_ACTION[s]}
        </button>
      ))}
    </span>
  );
}
