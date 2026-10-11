import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import { CashEntryDialog } from '@/components/admin/CashEntryDialog';
import { Icon } from '@/components/Icon';
import { CASH_KIND_IN, CASH_KIND_LABEL } from '@/lib/cash-labels';
import { DEFAULT_EXPENSE_RANGE, EXPENSE_RANGES, expenseRangeBounds, isExpenseRange, shortMoney, type ExpenseRange } from '@/lib/expense-labels';
import { money } from '@/lib/format';
import { fmtYmd, todayVN } from '@/lib/stock';
import { requireAccess } from '@/server/auth';
import { CASH_LIST_LIMIT, cashFlow, listCashEntries } from '@/server/cashflow';
import { materializeRecurring } from '@/server/expenses';

export const metadata: Metadata = { title: 'Thu chi' };

type Props = { searchParams: Promise<{ ky?: string }> };

const muted = { color: 'var(--ink-muted)' } as const;

/** Một bảng "tên khoản | số tiền | ghi chú" + dòng tổng. */
function Lines({ rows, total }: { rows: { name: ReactNode; amount: number; hint?: ReactNode }[]; total: { name: string; amount: number } }) {
  return (
    <div className="ad-kv">
      {rows.map((r, i) => (
        <Fragment key={i}>
          <span>{r.name}</span>
          <span><b>{money(r.amount)}</b>{r.hint ? <small style={muted}> · {r.hint}</small> : null}</span>
        </Fragment>
      ))}
      <span><b>{total.name}</b></span>
      <span><b style={{ fontSize: '1.0625rem' }}>{money(total.amount)}</b></span>
    </div>
  );
}

/** Sổ Thu chi: tiền vô, tiền ra, tiền còn lại theo sổ và lãi của kỳ. Chỉ Quản lý. */
export default async function AdminCashPage({ searchParams }: Props) {
  await requireAccess('expenses');
  await materializeRecurring(); // ghi các khoản chi định kỳ đã đến hạn trước khi cộng tiền ra
  const sp = await searchParams;
  const range: ExpenseRange = isExpenseRange(sp.ky) ? sp.ky : DEFAULT_EXPENSE_RANGE;
  const today = todayVN();
  const b = expenseRangeBounds(range, today);
  const [c, entries] = await Promise.all([cashFlow(b.from, b.to), listCashEntries(b.from, b.to)]);
  const receipts = c.fin.purchases - c.fin.goods;
  const link = { color: 'var(--primary)' } as const;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Thu chi</h1>
        <span className="acts">
          <Link href="/admin/chi-phi" className="vx-btn vx-btn--outline">+ Ghi khoản chi</Link>
          <CashEntryDialog today={today} label="+ Ghi thu / vốn" primary />
        </span>
      </div>

      <div className="ad-filters" style={{ border: 0, padding: 0 }}>
        <span className="vx-seg">
          {(Object.keys(EXPENSE_RANGES) as ExpenseRange[]).map((k) => (
            <Link key={k} href={k === DEFAULT_EXPENSE_RANGE ? '/admin/thu-chi' : `/admin/thu-chi?ky=${k}`} className="vx-chip" aria-pressed={range === k}>{EXPENSE_RANGES[k]}</Link>
          ))}
        </span>
      </div>

      <div className="ad-kpis">
        <div className="ad-kpi">
          <span><Icon name="cash" />Tiền vô</span>
          <b>{shortMoney(c.in.total)}</b>
          <small>{c.in.salesCount} đơn đã thu tiền</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="cash" />Tiền ra</span>
          <b>{shortMoney(c.out.total)}</b>
          <small>Mua hàng {shortMoney(c.out.goods)}</small>
        </div>
        <div className={`ad-kpi${c.closing < 0 ? ' warn' : ''}`}>
          <span><Icon name="cash" />Tiền còn lại theo sổ</span>
          <b>{shortMoney(c.closing)}</b>
          <small>Đầu kỳ {shortMoney(c.opening)}</small>
        </div>
        <div className={`ad-kpi${c.profit < 0 ? ' warn' : ''}`}>
          <span><Icon name={c.profit < 0 ? 'alert' : 'cash'} />{c.profit < 0 ? 'Lỗ kỳ này' : 'Lãi kỳ này'}</span>
          <b>{shortMoney(c.profit)}</b>
          <small>Doanh thu {shortMoney(c.sales.revenue)}</small>
        </div>
      </div>

      <div className="ad-grid2">
        <div className="ad-card">
          <div className="ad-card__h">Tiền vô<Link href="/admin/don-hang">Đơn hàng</Link></div>
          <div className="ad-card__b">
            <Lines
              rows={[
                { name: 'Bán hàng đã thu', amount: c.in.sales, hint: `${c.in.salesCount} đơn` },
                { name: CASH_KIND_LABEL.income, amount: c.in.other },
                { name: CASH_KIND_LABEL.capital_in, amount: c.in.capital },
              ]}
              total={{ name: 'Tổng tiền vô', amount: c.in.total }}
            />
            {c.receivable.n > 0 && (
              <span className="vx-help" style={{ margin: 0 }}>
                Khách chưa trả: <b>{money(c.receivable.total)}</b> ({c.receivable.n} đơn) · <Link href="/admin/don-hang?thanh_toan=cho" style={link}>Đơn chờ nhận tiền</Link>
              </span>
            )}
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__h">Tiền ra<Link href="/admin/chi-phi">Sổ chi phí</Link></div>
          <div className="ad-card__b">
            <Lines
              rows={[
                { name: 'Mua hàng', amount: c.out.goods, hint: receipts ? `sổ chi ${shortMoney(c.fin.goods)} + phiếu nhập ${shortMoney(receipts)}` : undefined },
                { name: 'Chi phí khác', amount: c.out.expenses, hint: `${c.fin.expenseCount} khoản` },
                { name: 'Hoàn tiền khách', amount: c.out.refunds },
                { name: CASH_KIND_LABEL.capital_out, amount: c.out.capital },
              ]}
              total={{ name: 'Tổng tiền ra', amount: c.out.total }}
            />
          </div>
        </div>
      </div>

      <div className="ad-grid2">
        <div className="ad-card">
          <div className="ad-card__h">Tiền còn lại theo sổ</div>
          <div className="ad-card__b">
            <div className="ad-kv">
              <span>Đầu kỳ</span><span><b>{money(c.opening)}</b></span>
              <span>+ Tiền vô</span><span><b>{money(c.in.total)}</b></span>
              <span>− Tiền ra</span><span><b>{money(c.out.total)}</b></span>
              <span><b>Cuối kỳ</b></span><span><b style={{ fontSize: '1.0625rem', color: c.closing < 0 ? 'var(--danger)' : undefined }}>{money(c.closing)}</b></span>
            </div>
            <span className="vx-help" style={{ margin: 0 }}>Web chỉ ghi sổ, không nối ngân hàng. Số này lệch với tiền thật thì còn khoản chưa ghi.</span>
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__h">Lãi lỗ kỳ này<Link href="/admin/bao-cao">Báo cáo</Link></div>
          <div className="ad-card__b">
            <div className="ad-kv">
              <span>Doanh thu</span><span><b>{money(c.sales.revenue)}</b><small style={muted}> · {c.sales.orders} đơn</small></span>
              <span>− Tiền vốn hàng đã bán</span><span><b>{money(c.sales.cogs)}</b></span>
              <span>− Chi phí khác</span><span><b>{money(c.fin.expenses)}</b></span>
              <span>− Hoàn tiền khách</span><span><b>{money(c.sales.refunds)}</b></span>
              <span><b>{c.profit < 0 ? 'Lỗ' : 'Lãi'}</b></span><span><b style={{ fontSize: '1.0625rem', color: c.profit < 0 ? 'var(--danger)' : undefined }}>{money(c.profit)}</b></span>
            </div>
            <span className="vx-help" style={{ margin: 0 }}>
              Doanh thu tính cả đơn chưa thu tiền. Tiền vốn = giá gốc của từng quy cách × số lượng đã bán.
              {c.sales.uncosted > 0 && <> <b>{c.sales.uncosted} dòng hàng chưa có giá gốc</b> nên chưa tính vốn — khai ở <Link href="/admin/san-pham" style={link}>Sản phẩm</Link>.</>}
            </span>
          </div>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Thu khác, vốn bỏ vào, rút vốn</div>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Ngày</th><th>Nội dung</th><th>Loại</th><th className="num">Số tiền</th><th>Người ghi</th><th /></tr></thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td data-label="Ngày" data-m="aside" style={{ whiteSpace: 'nowrap' }}>{fmtYmd(e.entryOn)}</td>
                  <td data-m="title">{e.note || CASH_KIND_LABEL[e.kind]}</td>
                  <td data-label="Loại">{CASH_KIND_LABEL[e.kind]}</td>
                  <td className="num" data-label="Số tiền"><b>{CASH_KIND_IN[e.kind] ? '+' : '−'}{money(e.amount)}</b></td>
                  <td data-label="Người ghi">{e.actor}</td>
                  <td data-label="Thao tác" data-m="foot end">
                    <CashEntryDialog label="Sửa" today={today} initial={{ id: e.id, kind: e.kind, entryOn: e.entryOn, amount: e.amount, note: e.note ?? '' }} />
                  </td>
                </tr>
              ))}
              {!entries.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, ...muted }}>Chưa ghi khoản nào trong kỳ này.</td></tr>}
            </tbody>
          </table>
        </div>
        {entries.length >= CASH_LIST_LIMIT && <div className="ad-card__b"><span className="vx-help" style={{ margin: 0 }}>Đang hiện {CASH_LIST_LIMIT} khoản mới nhất — chọn kỳ ngắn hơn để xem đủ.</span></div>}
      </div>
    </div>
  );
}
