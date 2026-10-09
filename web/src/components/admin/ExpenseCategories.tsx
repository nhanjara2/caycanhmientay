'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { deleteExpenseCategoryAction, saveExpenseCategoryAction } from '@/app/actions/expenses';
import { FALLBACK_EXPENSE_CATEGORY } from '@/lib/expense-labels';

export type ExpenseCategoryRow = { slug: string; name: string; active: boolean; used: number };

/** Nhóm chi: thêm, đổi tên, ẩn / hiện, xóa (khi chưa có khoản chi nào). */
export function ExpenseCategories({ rows }: { rows: ExpenseCategoryRow[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [edit, setEdit] = useState<{ slug: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const run = (job: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) => {
    setError('');
    start(async () => {
      const r = await job().catch(() => ({ ok: false, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error ?? 'Có lỗi, vui lòng thử lại'); return; }
      done?.();
      router.refresh();
    });
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    run(() => saveExpenseCategoryAction({ name, active: true }), () => setName(''));
  };

  return (
    <div className="ad-card">
      <div className="ad-card__h">Nhóm chi</div>
      <div className="ad-tablewrap">
        <table className="ad-table app-mtable">
          <thead><tr><th>Tên nhóm</th><th className="num">Số khoản</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.slug}>
                <td>
                  {edit?.slug === c.slug ? (
                    <form style={{ display: 'flex', gap: 6 }} onSubmit={(e) => { e.preventDefault(); run(() => saveExpenseCategoryAction({ slug: c.slug, name: edit.name, active: c.active }), () => setEdit(null)); }}>
                      <input className="vx-input" value={edit.name} maxLength={40} autoFocus onChange={(e) => setEdit({ slug: c.slug, name: e.target.value })} aria-label="Tên nhóm" />
                      <button className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending}>Lưu</button>
                      <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => setEdit(null)}>Hủy</button>
                    </form>
                  ) : <b>{c.name}</b>}
                </td>
                <td className="num" data-label="Số khoản">{c.used}</td>
                <td data-label="Trạng thái" data-m="aside"><span className={`ad-pill ${c.active ? 'done' : 'wait'}`}>{c.active ? 'Đang dùng' : 'Đã ẩn'}</span></td>
                <td data-label="Thao tác" data-m="foot" style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => setEdit({ slug: c.slug, name: c.name })}>Đổi tên</button>{' '}
                  {c.slug !== FALLBACK_EXPENSE_CATEGORY && (
                    <>
                      <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => run(() => saveExpenseCategoryAction({ slug: c.slug, name: c.name, active: !c.active }))}>{c.active ? 'Ẩn' : 'Hiện'}</button>{' '}
                      <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" style={{ color: 'var(--danger)' }} disabled={pending || c.used > 0} title={c.used ? 'Nhóm đã có khoản chi — hãy ẩn thay vì xóa' : undefined}
                        onClick={() => confirm(`Xóa nhóm “${c.name}”?`) && run(() => deleteExpenseCategoryAction(c.slug))}>Xóa</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="ad-card__b" onSubmit={add} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="vx-input" style={{ flex: '1 1 220px' }} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Tên nhóm chi mới, ví dụ: Phí sàn thương mại điện tử" aria-label="Tên nhóm chi mới" />
        <button className="vx-btn vx-btn--primary" disabled={pending || name.trim().length < 2}>+ Thêm nhóm</button>
      </form>
      {error && <div className="ad-card__b"><span className="vx-err" role="alert">{error}</span></div>}
    </div>
  );
}
