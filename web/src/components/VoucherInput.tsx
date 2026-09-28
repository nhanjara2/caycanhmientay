'use client';

import { useState, useTransition } from 'react';
import { applyVoucherAction } from '@/app/actions/vouchers';
import { money } from '@/lib/format';

export type AppliedVoucher = { code: string; discount: number };

/** Ô nhập mã giảm giá ở OrderSummary trang thanh toán — xem trước số tiền giảm, chốt thật lúc đặt hàng. */
export function VoucherInput({ items, phone, applied, onApply, onRemove }: {
  items: { slug: string; option: number; qty: number }[];
  phone: string;
  applied: AppliedVoucher | null;
  onApply: (v: AppliedVoucher) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const apply = () => {
    if (!code.trim() || pending) return;
    setError('');
    start(async () => {
      const r = await applyVoucherAction(code, items, phone).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      onApply({ code: r.code, discount: r.discount });
      setCode('');
    });
  };

  if (applied) {
    return (
      <div className="vx-check" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Mã <b>{applied.code}</b> — giảm {money(applied.discount)}</span>
        <button type="button" className="vx-link" onClick={onRemove}>Bỏ mã</button>
      </div>
    );
  }

  return (
    <div className="vx-field">
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="vx-input"
          style={{ flex: 1 }}
          placeholder="Nhập mã giảm giá"
          value={code}
          maxLength={30}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
        />
        <button type="button" className={`vx-btn vx-btn--sm ${code.trim() ? 'vx-btn--primary' : 'vx-btn--outline'}`} disabled={!code.trim() || pending} onClick={apply}>
          {pending ? 'Đang kiểm tra…' : 'Áp dụng'}
        </button>
      </div>
      {error && <span className="vx-err">{error}</span>}
    </div>
  );
}
