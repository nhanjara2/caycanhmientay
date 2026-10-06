import { Fragment } from 'react';
import { shortMoney } from '@/lib/expense-labels';
import { money } from '@/lib/format';
import type { Finance } from '@/server/expenses';

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);

/** Hai thẻ "Chi phí khác theo nhóm" + "Theo cửa hàng" — dùng ở trang Chi phí và Báo cáo. */
export function ExpenseBreakdown({ fin }: { fin: Finance }) {
  const empty = <span style={{ color: 'var(--ink-muted)' }}>Chưa có khoản chi nào trong kỳ này.</span>;
  return (
    <div className="ad-grid2">
      <div className="ad-card">
        <div className="ad-card__h">Chi phí khác theo nhóm</div>
        <div className="ad-card__b">
          {fin.byCategory.length ? (
            <div className="ad-bars">
              {fin.byCategory.map((c) => (
                <div key={c.slug} title={`${c.name}: ${money(c.total)}`}>
                  <span>{c.name}</span>
                  <i><em style={{ width: `${pct(c.total, fin.expenses)}%` }} /></i>
                  <b>{shortMoney(c.total)}</b>
                </div>
              ))}
            </div>
          ) : empty}
        </div>
      </div>
      <div className="ad-card">
        <div className="ad-card__h">Chi theo cửa hàng</div>
        <div className="ad-card__b">
          {fin.byStore.length ? (
            <div className="ad-kv">
              {fin.byStore.map((s) => (
                <Fragment key={s.id ?? 'chung'}>
                  <span>{s.name}</span>
                  <span>
                    <b>{shortMoney(s.expenses + s.purchases)}</b>
                    {s.purchases ? <small style={{ color: 'var(--ink-muted)' }}> · chi phí {shortMoney(s.expenses)} + hàng nhập {shortMoney(s.purchases)}</small> : null}
                  </span>
                </Fragment>
              ))}
            </div>
          ) : empty}
        </div>
      </div>
    </div>
  );
}
