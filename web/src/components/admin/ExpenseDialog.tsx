'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { deleteExpenseAction, removeExpensePhotoAction, saveExpenseAction, uploadExpensePhotoAction } from '@/app/actions/expenses';
import { Icon } from '@/components/Icon';
import { compressImage } from '@/lib/compress-image';
import { EXPENSE_MAX, MAX_EXPENSE_NOTE, MAX_EXPENSE_SUPPLIER } from '@/lib/expense-labels';

export type ExpenseCategoryOpt = { slug: string; name: string; active: boolean };
export type ExpenseStoreOpt = { id: number; name: string };
export type ExpenseFormValue = {
  id?: number;
  spentOn: string;
  category: string;
  amount: number | null;
  storeId: number | null;
  supplier: string;
  note: string;
  /** Tên file ảnh hóa đơn hiện có. */
  photo: string | null;
};

const digits = (s: string) => s.replace(/\D/g, '').slice(0, 10);
const fmt = (n: number | null) => (n ? n.toLocaleString('vi-VN') : '');

/** Nút + hộp thoại thêm / sửa một khoản chi (kèm ảnh hóa đơn tùy chọn). Dùng chung cho nút "+ Thêm khoản chi" và nút "Sửa" từng dòng. */
export function ExpenseDialog({ initial, categories, stores, today, label, primary }: {
  initial?: ExpenseFormValue; categories: ExpenseCategoryOpt[]; stores: ExpenseStoreOpt[]; today: string; label: string; primary?: boolean;
}) {
  const router = useRouter();
  const blank = (): ExpenseFormValue => ({ spentOn: today, category: categories.find((c) => c.active)?.slug ?? '', amount: null, storeId: null, supplier: '', note: '', photo: null });
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<ExpenseFormValue>(initial ?? blank());
  const [amountText, setAmountText] = useState(fmt(initial?.amount ?? null));
  const [file, setFile] = useState<File | null>(null);
  const [dropPhoto, setDropPhoto] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const set = <K extends keyof ExpenseFormValue>(k: K, val: ExpenseFormValue[K]) => setV((x) => ({ ...x, [k]: val }));

  const show = () => {
    const f = initial ?? blank();
    setV(f); setAmountText(fmt(f.amount)); setFile(null); setDropPhoto(false); setError(''); setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // nhóm đang ẩn vẫn hiện nếu khoản chi này đang thuộc nhóm đó
  const options = categories.filter((c) => c.active || c.slug === v.category);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = Number(digits(amountText) || 0);
    start(async () => {
      const r = await saveExpenseAction({ id: v.id, spentOn: v.spentOn, category: v.category, amount, storeId: v.storeId, supplier: v.supplier, note: v.note })
        .catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      // Đã có id thì lần bấm Lưu sau là sửa (không tạo thêm khoản chi nếu ảnh tải lỗi)
      setV((x) => ({ ...x, id: r.id }));
      if (dropPhoto && !file && v.photo) await removeExpensePhotoAction(r.id).catch(() => null);
      if (file) {
        try {
          const fd = new FormData();
          fd.set('expenseId', String(r.id));
          fd.set('photo', await compressImage(file, 1600));
          const up = await uploadExpensePhotoAction(fd);
          if (!up.ok) { setError(`Đã lưu khoản chi nhưng chưa tải được ảnh: ${up.error}`); router.refresh(); return; }
        } catch {
          setError('Đã lưu khoản chi nhưng không đọc được ảnh này (dùng JPG, PNG hoặc WebP)');
          router.refresh();
          return;
        }
      }
      setOpen(false);
      router.refresh();
    });
  };

  const remove = () => {
    if (!v.id || !confirm(`Xóa khoản chi ${fmt(v.amount)}đ này?\nKhông thể hoàn tác.`)) return;
    setError('');
    start(async () => {
      const r = await deleteExpenseAction(v.id).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button type="button" className={primary ? 'vx-btn vx-btn--primary' : 'vx-btn vx-btn--outline vx-btn--sm'} onClick={show}>{label}</button>
      {open && (
        <div className="app-modal" role="dialog" aria-modal="true" aria-label={v.id ? 'Sửa khoản chi' : 'Thêm khoản chi'} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="vx-modal" style={{ maxWidth: 480, textAlign: 'left' }} onSubmit={submit}>
            <div className="vx-modal__head">
              {v.id ? 'Sửa khoản chi' : 'Thêm khoản chi'}
              <button type="button" aria-label="Đóng" onClick={() => setOpen(false)}><Icon name="close" /></button>
            </div>
            <div className="vx-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                <div className="vx-fl">
                  <label htmlFor="ex-amount">Số tiền (đồng)</label>
                  <input id="ex-amount" inputMode="numeric" autoFocus={!v.id} value={amountText} onChange={(e) => setAmountText(fmt(Number(digits(e.target.value)) || null))} placeholder="0" required />
                </div>
                <div className="vx-fl">
                  <label htmlFor="ex-date">Ngày chi</label>
                  <input id="ex-date" type="date" value={v.spentOn} max={today} onChange={(e) => set('spentOn', e.target.value)} required />
                </div>
              </div>
              {Number(digits(amountText) || 0) > EXPENSE_MAX && <span className="vx-err">Tối đa 1 tỷ đồng cho mỗi khoản</span>}
              <div className="vx-fl">
                <label htmlFor="ex-cat">Nhóm chi</label>
                <select id="ex-cat" value={v.category} onChange={(e) => set('category', e.target.value)} required>
                  {options.map((c) => <option key={c.slug} value={c.slug}>{c.name}{c.active ? '' : ' (đang ẩn)'}</option>)}
                </select>
              </div>
              <div className="vx-fl">
                <label htmlFor="ex-note">Nội dung (mua gì, trả cho ai…)</label>
                <input id="ex-note" value={v.note} maxLength={MAX_EXPENSE_NOTE} onChange={(e) => set('note', e.target.value)} placeholder="Ví dụ: Tiền điện tháng 9, mua 20 bao đất trộn…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                <div className="vx-fl">
                  <label htmlFor="ex-store">Cửa hàng</label>
                  <select id="ex-store" value={v.storeId ?? ''} onChange={(e) => set('storeId', e.target.value ? Number(e.target.value) : null)}>
                    <option value="">Chi chung</option>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="vx-fl">
                  <label htmlFor="ex-sup">Nhà cung cấp / người nhận</label>
                  <input id="ex-sup" list="expense-suppliers" value={v.supplier} maxLength={MAX_EXPENSE_SUPPLIER} onChange={(e) => set('supplier', e.target.value)} placeholder="Không bắt buộc" autoComplete="off" />
                </div>
              </div>
              <div className="vx-fl">
                <label htmlFor="ex-photo">Ảnh hóa đơn (không bắt buộc)</label>
                <input id="ex-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setDropPhoto(false); }} />
              </div>
              {v.photo && !dropPhoto && !file && (
                <span className="vx-help">
                  Đã có ảnh hóa đơn · <a href={`/api/expense-photos/${v.photo}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Xem ảnh</a>
                  {' · '}<button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" style={{ color: 'var(--danger)' }} onClick={() => setDropPhoto(true)}>Bỏ ảnh</button>
                </span>
              )}
              {dropPhoto && <span className="vx-help">Ảnh sẽ được bỏ khi bấm Lưu.</span>}
              <span className="vx-help">Hàng nhập kho đã có phiếu nhập thì không ghi ở đây — báo cáo tự cộng tiền hàng nhập.</span>
              {error && <span className="vx-err" role="alert">{error}</span>}
            </div>
            <div className="vx-modal__foot" style={{ display: 'flex', gap: 8 }}>
              {v.id && <button type="button" className="vx-btn vx-btn--outline vx-btn--lg" style={{ color: 'var(--danger)' }} disabled={pending} onClick={remove}>Xóa</button>}
              <button className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={pending || !v.category || !digits(amountText)}>{pending ? 'Đang lưu…' : 'Lưu'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
