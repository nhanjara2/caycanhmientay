'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { payConsignAction } from '@/app/actions/consign';
import { Icon } from '@/components/Icon';

const digits = (s: string) => s.replace(/\D/g, '').slice(0, 10);

/** Nút "Ghi đã trả" + hộp thoại: số tiền (mặc định = còn nợ), ngày trả, ghi chú → một khoản chi nhóm mua hàng. */
export function ConsignPay({ supplierId, name, due, today }: { supplierId: number; name: string; due: number; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(due > 0 ? String(due) : '');
  const [spentOn, setSpentOn] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    start(async () => {
      const r = await payConsignAction({ supplierId, amount: Number(amount || 0), spentOn, note: note || undefined })
        .catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setOpen(false); setNote('');
      router.refresh();
    });
  };

  return (
    <>
      <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => { setAmount(due > 0 ? String(due) : ''); setOpen(true); }}>Ghi đã trả</button>
      {open && (
        <div className="app-modal" role="dialog" aria-modal="true" aria-label={`Trả tiền ${name}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="vx-modal" style={{ maxWidth: 420, textAlign: 'left' }} onSubmit={submit}>
            <div className="vx-modal__head">
              Trả tiền cây ký gửi
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)}><Icon name="close" /></button>
            </div>
            <div className="vx-modal__body">
              <b>{name}</b>
              <div className="vx-fl">
                <label htmlFor="cp-amount">Số tiền (đ)</label>
                <input id="cp-amount" inputMode="numeric" value={amount ? Number(amount).toLocaleString('vi-VN') : ''} onChange={(e) => setAmount(digits(e.target.value))} required />
              </div>
              <div className="vx-fl">
                <label htmlFor="cp-date">Ngày trả</label>
                <input id="cp-date" type="date" value={spentOn} max={today} onChange={(e) => setSpentOn(e.target.value)} required />
              </div>
              <div className="vx-fl">
                <label htmlFor="cp-note">Ghi chú</label>
                <input id="cp-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Chuyển khoản, tiền mặt, kỳ tháng…" />
              </div>
              {error && <span className="vx-err" role="alert">{error}</span>}
            </div>
            <div className="vx-modal__foot">
              <button type="button" className="vx-btn vx-btn--ghost" onClick={() => setOpen(false)}>Hủy</button>
              <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
