'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { setOrderPaidAction } from '@/app/actions/orders';

/** Xác nhận đã nhận tiền cho đơn thanh toán online; quản trị viên bỏ đánh dấu được khi bấm nhầm. */
export function PaymentActions({ code, paid, isAdmin }: { code: string; paid: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [ref, setRef] = useState('');
  const [error, setError] = useState('');

  const run = (next: boolean) => {
    if (!next && !confirm(`Bỏ đánh dấu đã nhận tiền của đơn ${code}?`)) return;
    setError('');
    start(async () => {
      const r = await setOrderPaidAction(code, next, ref).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) setError(r.error);
      else setRef('');
      router.refresh();
    });
  };

  if (paid) {
    return isAdmin ? (
      <div className="app-pay-actions">
        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={() => run(false)}>Bỏ đánh dấu đã nhận tiền</button>
        {error && <span className="vx-err" role="alert">{error}</span>}
      </div>
    ) : null;
  }
  return (
    <div className="app-pay-actions">
      <label htmlFor={`pay-ref-${code}`}>Mã giao dịch / ghi chú (không bắt buộc)</label>
      <input id={`pay-ref-${code}`} className="vx-input" value={ref} maxLength={120} onChange={(e) => setRef(e.target.value)} placeholder="VD: mã giao dịch ngân hàng, tên người chuyển" />
      <button type="button" className="vx-btn vx-btn--primary" disabled={pending} onClick={() => run(true)}>Đã nhận tiền</button>
      {error && <span className="vx-err" role="alert">{error}</span>}
    </div>
  );
}
