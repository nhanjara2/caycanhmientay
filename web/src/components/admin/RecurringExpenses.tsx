'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { deleteRecurringAction, saveRecurringAction } from '@/app/actions/expenses';
import type { ExpenseCategoryOpt, ExpenseStoreOpt } from '@/components/admin/ExpenseDialog';
import { MAX_EXPENSE_NOTE, MAX_EXPENSE_SUPPLIER, RECURRING_BACKFILL_MONTHS } from '@/lib/expense-labels';
import { money } from '@/lib/format';
import type { RecurringRow } from '@/server/expenses';
import { Select } from '@/components/Select';

type Form = { id?: number; category: string; amount: string; day: string; startMonth: string; endMonth: string; storeId: number | null; supplier: string; note: string; active: boolean };

const digits = (s: string) => s.replace(/\D/g, '').slice(0, 10);
const fmt = (s: string) => (digits(s) ? Number(digits(s)).toLocaleString('vi-VN') : '');
const monthText = (m: string) => `${m.slice(5)}/${m.slice(0, 4)}`;

/** Khoản chi lặp hằng tháng (thuê mặt bằng, lương…): tự ghi vào sổ đúng ngày mỗi tháng. */
export function RecurringExpenses({ rows, categories, stores, month }: { rows: RecurringRow[]; categories: ExpenseCategoryOpt[]; stores: ExpenseStoreOpt[]; month: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const set = <K extends keyof Form>(k: K, val: Form[K]) => setForm((f) => (f ? { ...f, [k]: val } : f));

  const blank = (): Form => ({ category: categories.find((c) => c.active)?.slug ?? '', amount: '', day: '1', startMonth: month, endMonth: '', storeId: null, supplier: '', note: '', active: true });
  const toForm = (r: RecurringRow): Form => ({
    id: r.id, category: r.categorySlug, amount: fmt(String(r.amount)), day: String(r.day), startMonth: r.startMonth, endMonth: r.endMonth ?? '',
    storeId: r.storeId, supplier: r.supplier ?? '', note: r.note ?? '', active: r.active,
  });
  const open = (f: Form) => { setForm(f); setError(''); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError('');
    start(async () => {
      const r = await saveRecurringAction({
        id: form.id, category: form.category, amount: Number(digits(form.amount) || 0), day: Number(form.day), startMonth: form.startMonth,
        endMonth: form.endMonth || null, storeId: form.storeId, supplier: form.supplier, note: form.note, active: form.active,
      }).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setForm(null);
      router.refresh();
    });
  };

  const remove = () => {
    if (!form?.id || !confirm('Xóa khoản chi định kỳ này?\nCác khoản đã ghi vào sổ vẫn được giữ lại; từ nay hệ thống không tự ghi thêm.')) return;
    start(async () => {
      const r = await deleteRecurringAction(form.id).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setForm(null);
      router.refresh();
    });
  };

  const options = categories.filter((c) => c.active || c.slug === form?.category);

  return (
    <div className="ad-card">
      <div className="ad-card__h">
        Chi định kỳ hàng tháng
        <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => open(blank())}>+ Thêm</button>
      </div>
      {form && (
        <form className="ad-card__b" onSubmit={submit} style={{ gap: 12, borderBottom: '1px solid var(--border)' }}>
          <b>{form.id ? 'Sửa khoản định kỳ' : 'Thêm khoản định kỳ'}</b>
          <div className="ad-frow">
            <div className="ad-f">
              <label htmlFor="rc-cat">Nhóm chi</label>
              <Select id="rc-cat" className="vx-input" value={form.category} onChange={(e) => set('category', e.target.value)} required>
                {options.map((c) => <option key={c.slug} value={c.slug}>{c.name}{c.active ? '' : ' (đang ẩn)'}</option>)}
              </Select>
            </div>
            <div className="ad-f">
              <label htmlFor="rc-amount">Số tiền mỗi tháng (đồng)</label>
              <input id="rc-amount" className="vx-input" inputMode="numeric" value={form.amount} onChange={(e) => set('amount', fmt(e.target.value))} placeholder="5.000.000" required />
            </div>
            <div className="ad-f">
              <label htmlFor="rc-day">Ghi vào ngày (1–28)</label>
              <input id="rc-day" className="vx-input" type="number" min={1} max={28} value={form.day} onChange={(e) => set('day', e.target.value)} required />
            </div>
          </div>
          <div className="ad-frow two">
            <div className="ad-f">
              <label htmlFor="rc-start">Bắt đầu từ tháng</label>
              <input id="rc-start" className="vx-input" type="month" value={form.startMonth} disabled={!!form.id} onChange={(e) => set('startMonth', e.target.value)} required />
            </div>
            <div className="ad-f">
              <label htmlFor="rc-end">Đến hết tháng (bỏ trống = không kết thúc)</label>
              <input id="rc-end" className="vx-input" type="month" value={form.endMonth} min={form.startMonth} onChange={(e) => set('endMonth', e.target.value)} />
            </div>
          </div>
          <div className="ad-frow two">
            <div className="ad-f">
              <label htmlFor="rc-store">Cửa hàng</label>
              <Select id="rc-store" className="vx-input" value={form.storeId ?? ''} onChange={(e) => set('storeId', e.target.value ? Number(e.target.value) : null)}>
                <option value="">Chi chung</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="ad-f">
              <label htmlFor="rc-sup">Nhà cung cấp / người nhận</label>
              <input id="rc-sup" className="vx-input" list="expense-suppliers" value={form.supplier} maxLength={MAX_EXPENSE_SUPPLIER} onChange={(e) => set('supplier', e.target.value)} autoComplete="off" />
            </div>
          </div>
          <div className="ad-f">
            <label htmlFor="rc-note">Nội dung</label>
            <input id="rc-note" className="vx-input" value={form.note} maxLength={MAX_EXPENSE_NOTE} onChange={(e) => set('note', e.target.value)} placeholder="Ví dụ: Thuê mặt bằng Vườn Q7" />
          </div>
          <label className="vx-check"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Đang chạy (tắt để tạm dừng, bật lại không ghi bù các tháng đã dừng)</label>
          {!form.id && <span className="vx-help" style={{ margin: 0 }}>Chọn tháng bắt đầu trong quá khứ (tối đa {RECURRING_BACKFILL_MONTHS} tháng) thì các tháng đã qua được ghi bù vào sổ ngay.</span>}
          {error && <span className="vx-err" role="alert">{error}</span>}
          <span className="acts" style={{ display: 'flex', gap: 8 }}>
            <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu'}</button>
            <button type="button" className="vx-btn vx-btn--ghost" onClick={() => setForm(null)}>Hủy</button>
            {form.id && <button type="button" className="vx-btn vx-btn--ghost" style={{ color: 'var(--danger)', marginLeft: 'auto' }} disabled={pending} onClick={remove}>Xóa</button>}
          </span>
        </form>
      )}
      <div className="ad-tablewrap">
        <table className="ad-table app-mtable">
          <thead><tr><th>Khoản chi</th><th>Nhóm</th><th className="num">Số tiền / tháng</th><th>Ngày ghi</th><th>Thời gian</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.note || r.category}<small>{[r.store ?? 'Chi chung', r.supplier].filter(Boolean).join(' · ')}</small></td>
                <td data-label="Nhóm">{r.category}</td>
                <td className="num" data-label="Số tiền / tháng"><b>{money(r.amount)}</b></td>
                <td data-label="Ngày ghi">Ngày {r.day} hằng tháng</td>
                <td data-label="Thời gian">{monthText(r.startMonth)} → {r.endMonth ? monthText(r.endMonth) : 'không kết thúc'}{r.generatedThrough && <small>Đã ghi đến {monthText(r.generatedThrough)}</small>}</td>
                <td data-label="Trạng thái"><span className={`ad-pill ${r.active ? 'done' : 'wait'}`}>{r.active ? 'Đang chạy' : 'Tạm dừng'}</span></td>
                <td data-label="Thao tác"><button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => open(toForm(r))}>Sửa</button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} style={{ color: 'var(--ink-muted)' }}>Chưa có khoản định kỳ nào. Thêm tiền thuê mặt bằng, lương nhân viên… để hệ thống tự ghi vào sổ mỗi tháng.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
