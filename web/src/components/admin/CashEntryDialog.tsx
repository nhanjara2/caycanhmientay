'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { deleteCashEntryAction, saveCashEntryAction } from '@/app/actions/cashflow';
import { Icon } from '@/components/Icon';
import { CASH_KIND_HINT, CASH_KIND_LABEL, CASH_KINDS, MAX_CASH_NOTE, type CashKind } from '@/lib/cash-labels';
import { EXPENSE_MAX } from '@/lib/expense-labels';

export type CashFormValue = { id?: number; kind: CashKind; entryOn: string; amount: number | null; note: string };

const digits = (s: string) => s.replace(/\D/g, '').slice(0, 10);
const fmt = (n: number | null) => (n ? n.toLocaleString('vi-VN') : '');

/** Nút + hộp thoại ghi một khoản thu khác / vốn bỏ vào / rút vốn của sổ Thu chi (thêm hoặc sửa). */
export function CashEntryDialog({ initial, today, label, primary }: { initial?: CashFormValue; today: string; label: string; primary?: boolean }) {
  const router = useRouter();
  const blank = (): CashFormValue => ({ kind: 'income', entryOn: today, amount: null, note: '' });
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<CashFormValue>(initial ?? blank());
  const [amountText, setAmountText] = useState(fmt(initial?.amount ?? null));
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const set = <K extends keyof CashFormValue>(k: K, val: CashFormValue[K]) => setV((x) => ({ ...x, [k]: val }));

  const show = () => {
    const f = initial ?? blank();
    setV(f); setAmountText(fmt(f.amount)); setError(''); setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const amount = Number(digits(amountText) || 0);
  const run = (job: () => Promise<{ ok: boolean; error?: string }>) => {
    setError('');
    start(async () => {
      const r = await job().catch(() => ({ ok: false, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error ?? 'Có lỗi, vui lòng thử lại'); return; }
      setOpen(false);
      router.refresh();
    });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(() => saveCashEntryAction({ id: v.id, kind: v.kind, entryOn: v.entryOn, amount, note: v.note }));
  };
  const remove = () => {
    if (!v.id || !confirm(`Xóa khoản ${fmt(v.amount)}đ này?\nKhông thể hoàn tác.`)) return;
    run(() => deleteCashEntryAction(v.id));
  };
  const title = v.id ? 'Sửa khoản tiền' : 'Ghi khoản tiền';

  return (
    <>
      <button type="button" className={primary ? 'vx-btn vx-btn--primary' : 'vx-btn vx-btn--outline vx-btn--sm'} onClick={show}>{label}</button>
      {open && (
        <div className="app-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="vx-modal" style={{ maxWidth: 440, textAlign: 'left' }} onSubmit={submit}>
            <div className="vx-modal__head">
              {title}
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)}><Icon name="close" /></button>
            </div>
            <div className="vx-modal__body">
              <span className="vx-seg" role="group" aria-label="Loại khoản tiền" style={{ flexWrap: 'wrap' }}>
                {CASH_KINDS.map((k) => (
                  <button key={k} type="button" className="vx-chip" aria-pressed={v.kind === k} onClick={() => set('kind', k)}>{CASH_KIND_LABEL[k]}</button>
                ))}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                <div className="vx-fl">
                  <label htmlFor="ce-amount">Số tiền (đồng)</label>
                  <input id="ce-amount" inputMode="numeric" autoFocus={!v.id} value={amountText} onChange={(e) => setAmountText(fmt(Number(digits(e.target.value)) || null))} placeholder="0" required />
                </div>
                <div className="vx-fl">
                  <label htmlFor="ce-date">Ngày</label>
                  <input id="ce-date" type="date" value={v.entryOn} max={today} onChange={(e) => set('entryOn', e.target.value)} required />
                </div>
              </div>
              {amount > EXPENSE_MAX && <span className="vx-err">Tối đa 1 tỷ đồng cho mỗi khoản</span>}
              <div className="vx-fl">
                <label htmlFor="ce-note">Nội dung</label>
                <input id="ce-note" value={v.note} maxLength={MAX_CASH_NOTE} onChange={(e) => set('note', e.target.value)} placeholder={CASH_KIND_HINT[v.kind]} />
              </div>
              {error && <span className="vx-err" role="alert">{error}</span>}
            </div>
            <div className="vx-modal__foot" style={{ display: 'flex', gap: 8 }}>
              {v.id && <button type="button" className="vx-btn vx-btn--outline vx-btn--lg" style={{ color: 'var(--danger)' }} disabled={pending} onClick={remove}>Xóa</button>}
              <button className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={pending || !amount}>{pending ? 'Đang lưu…' : 'Lưu'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
