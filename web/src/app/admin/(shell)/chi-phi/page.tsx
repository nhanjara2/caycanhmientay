import type { Metadata } from 'next';
import Link from 'next/link';
import { ExpenseCategories } from '@/components/admin/ExpenseCategories';
import { ExpenseBreakdown } from '@/components/admin/ExpenseBreakdown';
import { ExpenseDialog } from '@/components/admin/ExpenseDialog';
import { RecurringExpenses } from '@/components/admin/RecurringExpenses';
import { Icon } from '@/components/Icon';
import { DEFAULT_EXPENSE_RANGE, EXPENSE_RANGES, expenseRangeBounds, isExpenseRange, shortMoney, type ExpenseRange } from '@/lib/expense-labels';
import { money } from '@/lib/format';
import { fmtYmd, todayVN } from '@/lib/stock';
import { requireAccess } from '@/server/auth';
import {
  EXPENSE_LIST_LIMIT, expenseCategoryUsage, listExpenseCategories, listExpenses, listRecurring, materializeRecurring, periodFinance, ymdStartMs,
} from '@/server/expenses';
import { listStores } from '@/server/inventory';
import { listSupplierNames } from '@/server/receipts';

export const metadata: Metadata = { title: 'Chi phí' };

type Props = { searchParams: Promise<{ ky?: string; nhom?: string; kho?: string; q?: string }> };

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
const fmtPct = (n: number) => `${(Math.round(n * 10) / 10).toString().replace('.', ',')}%`;

/** Sổ chi phí: mọi khoản chi ngoài hàng nhập kho (mặt bằng, điện nước, nhân công…), chi định kỳ, nhóm chi. Chỉ Quản lý. */
export default async function AdminExpensesPage({ searchParams }: Props) {
  await requireAccess('expenses');
  await materializeRecurring();
  const sp = await searchParams;
  const range: ExpenseRange = isExpenseRange(sp.ky) ? sp.ky : DEFAULT_EXPENSE_RANGE;
  const today = todayVN();
  const b = expenseRangeBounds(range, today);

  const [stores, cats, usage, suppliers, recurring] = await Promise.all([listStores(), listExpenseCategories(), expenseCategoryUsage(), listSupplierNames(), listRecurring()]);
  const category = cats.find((c) => c.slug === sp.nhom)?.slug;
  const store = sp.kho === 'chung' ? ('chung' as const) : stores.find((s) => String(s.id) === sp.kho)?.id;
  const q = sp.q?.trim().slice(0, 60) || undefined;
  const [fin, prev, list] = await Promise.all([
    periodFinance(ymdStartMs(b.from), ymdStartMs(b.to)),
    b.prev ? periodFinance(ymdStartMs(b.prev.from), ymdStartMs(b.prev.to)) : null,
    listExpenses({ from: b.from, to: b.to, category, store, q }),
  ]);

  const total = fin.expenses + fin.purchases;
  const top = fin.byCategory[0];
  const filtered = !!(category || store || q);
  const href = (p: { ky?: string }) => {
    const u = new URLSearchParams();
    const k = p.ky ?? range;
    if (k !== DEFAULT_EXPENSE_RANGE) u.set('ky', k);
    if (category) u.set('nhom', category);
    if (store) u.set('kho', String(store));
    if (q) u.set('q', q);
    return `/admin/chi-phi${u.size ? `?${u}` : ''}`;
  };
  const exportHref = `${href({}).replace('/admin/chi-phi', '/admin/chi-phi/xuat')}`;
  const catOpts = cats.map((c) => ({ slug: c.slug, name: c.name, active: c.active }));
  const storeOpts = stores.map((s) => ({ id: s.id, name: s.name }));
  const prevText = (now: number, before: number | undefined) => (before === undefined ? null : <>Kỳ trước: {shortMoney(before)}{before ? <> · <span className={now > before ? 'ad-down' : 'ad-up'}>{now > before ? '▲' : '▼'} {Math.abs(Math.round(((now - before) / before) * 100))}%</span></> : null}</>);

  return (
    <div className="ad-body">
      <datalist id="expense-suppliers">{suppliers.map((n) => <option key={n} value={n} />)}</datalist>
      <div className="ad-title">
        <h1>Chi phí</h1>
        <span className="acts">
          <Link href="/admin/bao-cao" className="vx-btn vx-btn--outline">Lãi lỗ</Link>
          <a className="vx-btn vx-btn--outline" href={exportHref}>
            <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: 15, height: 15 }} aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>Xuất Excel
          </a>
          <ExpenseDialog categories={catOpts} stores={storeOpts} today={today} label="+ Thêm khoản chi" primary />
        </span>
      </div>

      <div className="ad-filters" style={{ border: 0, padding: 0 }}>
        <span className="vx-seg">
          {(Object.keys(EXPENSE_RANGES) as ExpenseRange[]).map((k) => (
            <Link key={k} href={href({ ky: k })} className="vx-chip" aria-pressed={range === k}>{EXPENSE_RANGES[k]}</Link>
          ))}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
        Sổ này ghi các khoản chi <b>ngoài hàng nhập kho</b>. Tiền hàng nhập lấy tự động từ <Link href="/admin/nhap-hang" style={{ color: 'var(--primary)' }}>phiếu nhập</Link> (số lượng × giá nhập) — đừng ghi lại ở đây để khỏi tính hai lần.
      </p>

      <div className="ad-kpis">
        <div className="ad-kpi">
          <span><Icon name="cash" />Chi phí khác</span>
          <b>{shortMoney(fin.expenses)}</b>
          <small>{fin.expenseCount} khoản{prev ? <> · {prevText(fin.expenses, prev.expenses)}</> : null}</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="box" />Tiền hàng nhập</span>
          <b>{shortMoney(fin.purchases)}</b>
          <small>{fin.uncosted ? `${fin.uncosted} dòng phiếu nhập chưa ghi giá nhập` : prev ? prevText(fin.purchases, prev.purchases) : 'Từ phiếu nhập'}</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="cash" />Tổng chi</span>
          <b>{shortMoney(total)}</b>
          <small>{prev ? prevText(total, prev.expenses + prev.purchases) : 'Chi phí khác + hàng nhập'}</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="alert" />Nhóm chi lớn nhất</span>
          <b style={{ fontSize: top ? '1.125rem' : undefined }}>{top ? top.name : '—'}</b>
          <small>{top ? `${shortMoney(top.total)} · ${fmtPct(pct(top.total, fin.expenses))} chi phí khác` : 'Chưa có khoản chi trong kỳ'}</small>
        </div>
      </div>

      <ExpenseBreakdown fin={fin} />

      <div className="ad-card">
        <form className="ad-filters" action="/admin/chi-phi">
          {range !== DEFAULT_EXPENSE_RANGE && <input type="hidden" name="ky" value={range} />}
          <select className="vx-input" name="nhom" defaultValue={category ?? ''} aria-label="Nhóm chi" style={{ width: 'auto' }}>
            <option value="">Tất cả nhóm</option>
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select className="vx-input" name="kho" defaultValue={store ? String(store) : ''} aria-label="Cửa hàng" style={{ width: 'auto' }}>
            <option value="">Tất cả cửa hàng</option>
            <option value="chung">Chi chung</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input className="app-bare" name="q" defaultValue={q} placeholder="Nội dung, nhà cung cấp, nhóm" aria-label="Tìm khoản chi" />
          </label>
          <button className="vx-btn vx-btn--outline vx-btn--sm">Lọc</button>
          {filtered && <Link href={href({}).split('?')[0] + (range !== DEFAULT_EXPENSE_RANGE ? `?ky=${range}` : '')} className="vx-btn vx-btn--ghost vx-btn--sm">Bỏ lọc</Link>}
        </form>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Ngày</th><th>Nội dung</th><th>Nhóm</th><th>Cửa hàng</th><th className="num">Số tiền</th><th>Người ghi</th><th /></tr></thead>
            <tbody>
              {list.rows.map((e) => (
                <tr key={e.id}>
                  <td data-label="Ngày" style={{ whiteSpace: 'nowrap' }}>{fmtYmd(e.spentOn)}</td>
                  <td>
                    {e.note || e.category}
                    <small>
                      {e.supplier}
                      {e.photo && <>{e.supplier ? ' · ' : ''}<a href={`/api/expense-photos/${e.photo}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Ảnh hóa đơn</a></>}
                    </small>
                  </td>
                  <td data-label="Nhóm">{e.category}</td>
                  <td data-label="Cửa hàng">{e.store ?? 'Chi chung'}</td>
                  <td className="num" data-label="Số tiền"><b>{money(e.amount)}</b></td>
                  <td data-label="Người ghi">{e.recurringId ? 'Tự động' : e.actor}{e.recurringId ? <small>Chi định kỳ</small> : null}</td>
                  <td data-label="Thao tác">
                    <ExpenseDialog label="Sửa" categories={catOpts} stores={storeOpts} today={today}
                      initial={{ id: e.id, spentOn: e.spentOn, category: e.categorySlug, amount: e.amount, storeId: e.storeId, supplier: e.supplier ?? '', note: e.note ?? '', photo: e.photo }} />
                  </td>
                </tr>
              ))}
              {!list.rows.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>{filtered ? 'Không có khoản chi nào khớp bộ lọc.' : 'Chưa có khoản chi nào trong kỳ này. Bấm “+ Thêm khoản chi” để ghi khoản đầu tiên.'}</td></tr>}
            </tbody>
            {list.rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4}><b>{filtered ? 'Tổng các khoản đang lọc' : 'Tổng chi phí khác trong kỳ'}</b> ({list.count} khoản)</td>
                  <td className="num"><b>{money(list.total)}</b></td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {list.truncated && <div className="ad-card__b"><span className="vx-help" style={{ margin: 0 }}>Đang hiện {EXPENSE_LIST_LIMIT} khoản mới nhất trong {list.count} khoản — dùng bộ lọc hoặc Xuất Excel để xem đủ.</span></div>}
      </div>

      <RecurringExpenses rows={recurring} categories={catOpts} stores={storeOpts} month={today.slice(0, 7)} />
      <ExpenseCategories rows={cats.map((c) => ({ slug: c.slug, name: c.name, active: c.active, used: usage[c.slug] ?? 0 }))} />
    </div>
  );
}
