import type { Metadata } from 'next';
import Link from 'next/link';
import { ConsignPay } from '@/components/admin/ConsignPay';
import { Icon } from '@/components/Icon';
import { money } from '@/lib/format';
import { fmtYmd, gradeText, todayVN } from '@/lib/stock';
import { requireAccess } from '@/server/auth';
import { consignDetail, consignSummary, MONTH_RE, thisMonth } from '@/server/consign';

export const metadata: Metadata = { title: 'Đối soát nhà vườn' };

type Props = { searchParams: Promise<{ thang?: string; ncc?: string }> };

const muted = { color: 'var(--ink-muted)' } as const;
const vnd = (v: number) => money(v);
/** "2026-10" → "10/2026" */
const monthText = (m: string) => `${m.slice(5)}/${m.slice(0, 4)}`;
const shift = (m: string, d: number) => {
  const [y, mo] = m.split('-').map(Number);
  const t = new Date(Date.UTC(y, mo - 1 + d, 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}`;
};
const REASON = { order: 'Bán', warranty: 'Đổi cây bảo hành', cancel: 'Hủy đơn, trả lại' } as Record<string, string>;

/** Công nợ hàng ký gửi theo từng nhà vườn: cây còn ở vườn họ, cây đã bán trong tháng, phải trả / đã trả / còn nợ. Chỉ Quản lý. */
export default async function AdminConsignPage({ searchParams }: Props) {
  await requireAccess('expenses');
  const sp = await searchParams;
  const month = sp.thang && MONTH_RE.test(sp.thang) ? sp.thang : thisMonth();
  const nccId = Number(sp.ncc) || 0;
  const [rows, detail] = await Promise.all([consignSummary(month), nccId ? consignDetail(nccId, month) : null]);
  const today = todayVN();
  const href = (q: { thang?: string; ncc?: number }) => {
    const p = new URLSearchParams();
    if (q.thang && q.thang !== thisMonth()) p.set('thang', q.thang);
    if (q.ncc) p.set('ncc', String(q.ncc));
    const s = p.toString();
    return `/admin/doi-soat${s ? `?${s}` : ''}`;
  };
  const totalDue = rows.reduce((s, r) => s + Math.max(0, r.owed - r.paid), 0);
  const totalStock = rows.reduce((s, r) => s + r.stockValue, 0);
  const totalSold = rows.reduce((s, r) => s + r.soldValue, 0);
  const cur = detail ? rows.find((r) => r.id === detail.supplier.id) : undefined;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Đối soát nhà vườn</h1>
        <span className="acts">
          <Link href="/admin/nhap-hang" className="vx-btn vx-btn--outline">+ Nhập hàng ký gửi</Link>
        </span>
      </div>

      <div className="ad-filters" style={{ border: 0, padding: 0 }}>
        <span className="vx-seg">
          <Link className="vx-chip" href={href({ thang: shift(month, -1), ncc: nccId })}>‹ {monthText(shift(month, -1))}</Link>
          <span className="vx-chip" aria-pressed="true">Tháng {monthText(month)}</span>
          {month < thisMonth() && <Link className="vx-chip" href={href({ thang: shift(month, 1), ncc: nccId })}>{monthText(shift(month, 1))} ›</Link>}
        </span>
      </div>

      <div className="ad-kpis">
        <div className="ad-kpi"><span><Icon name="cash" />Còn nợ nhà vườn</span><b>{vnd(totalDue)}</b><small>Lũy kế tới hôm nay</small></div>
        <div className="ad-kpi"><span><Icon name="box" />Bán trong tháng</span><b>{vnd(totalSold)}</b><small>Theo giá vườn</small></div>
        <div className="ad-kpi"><span><Icon name="plant" />Cây ký gửi đang bán</span><b>{vnd(totalStock)}</b><small>{rows.reduce((s, r) => s + r.stockQty, 0)} cây ở vườn nhà cung cấp</small></div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Theo nhà vườn</div>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr>
                <th>Nhà vườn</th><th className="num">Đang gửi</th><th className="num">Bán tháng {monthText(month)}</th>
                <th className="num">Phải trả (lũy kế)</th><th className="num">Đã trả</th><th className="num">Còn nợ</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const due = r.owed - r.paid;
                return (
                  <tr key={r.id} style={nccId === r.id ? { background: 'var(--primary-soft)' } : undefined}>
                    <td>
                      <Link href={href({ thang: month, ncc: r.id })} className="app-rowlink" style={{ color: 'inherit' }}>
                        <b>{r.name}</b>
                        {r.uncosted > 0 && <small style={{ color: 'var(--danger, #b42318)' }}>{r.uncosted} cây đã bán chưa có giá vườn</small>}
                      </Link>
                    </td>
                    <td className="num" data-label="Đang gửi" data-m="third">{r.stockQty} cây<small style={muted}>{vnd(r.stockValue)}</small></td>
                    <td className="num" data-label="Bán trong tháng" data-m="third">{r.soldQty} cây<small style={muted}>{vnd(r.soldValue)}</small></td>
                    <td className="num" data-label="Phải trả" data-m="third">{vnd(r.owed)}</td>
                    <td className="num" data-label="Đã trả" data-m="third">{vnd(r.paid)}</td>
                    <td className="num" data-label="Còn nợ" data-m="third"><b>{vnd(due)}</b></td>
                    <td data-m="foot end"><ConsignPay supplierId={r.id} name={r.name} due={Math.max(0, due)} today={today} /></td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, ...muted }}>
                  Chưa có hàng ký gửi. Nhập hàng ở trang Nhập hàng hoặc Kho, tích “Hàng ký gửi” và ghi tên nhà vườn.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="ad-card" style={{ marginTop: 12 }}>
          <div className="ad-card__h">
            {detail.supplier.name} · tháng {monthText(month)}
            <a href={`/admin/doi-soat/xuat?ncc=${detail.supplier.id}&thang=${month}`} className="vx-btn vx-btn--outline vx-btn--sm" style={{ marginLeft: 'auto' }}>Tải bảng đối soát (Excel)</a>
          </div>
          <div className="ad-card__b">
            <b>Cây đã bán trong tháng</b>
            <div className="ad-tablewrap">
              <table className="ad-table app-mtable">
                <thead><tr><th>Ngày</th><th>Đơn</th><th>Cây · quy cách</th><th className="num">SL</th><th className="num">Giá vườn</th><th className="num">Thành tiền</th></tr></thead>
                <tbody>
                  {detail.sold.map((m, i) => (
                    <tr key={i}>
                      <td>{fmtYmd(new Date(m.at.getTime() + 7 * 3_600_000).toISOString().slice(0, 10))}<small style={muted}>{REASON[m.reason] ?? m.reason}</small></td>
                      <td data-label="Đơn">{m.code ? <Link href={`/admin/don-hang/${m.code}`}>{m.code}</Link> : '—'}</td>
                      <td data-label="Cây">{m.name ?? '—'}<small style={muted}>{[m.label, gradeText(m.grade)].filter(Boolean).join(' · ')}</small></td>
                      <td className="num" data-label="SL" data-m="third">{m.qty}</td>
                      <td className="num" data-label="Giá vườn" data-m="third">{m.unitCost == null ? 'Chưa có' : vnd(m.unitCost)}</td>
                      <td className="num" data-label="Thành tiền" data-m="third"><b>{m.unitCost == null ? '—' : vnd(m.qty * m.unitCost)}</b></td>
                    </tr>
                  ))}
                  {!detail.sold.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, ...muted }}>Tháng này chưa bán cây ký gửi nào của nhà vườn này.</td></tr>}
                </tbody>
              </table>
            </div>

            <b style={{ marginTop: 12 }}>Cây ký gửi còn ở vườn ({cur?.stockQty ?? 0} cây)</b>
            <div className="ad-tablewrap">
              <table className="ad-table app-mtable">
                <thead><tr><th>Cây · quy cách</th><th className="num">Còn</th><th className="num">Giá vườn</th></tr></thead>
                <tbody>
                  {detail.stock.map((l) => (
                    <tr key={l.id}>
                      <td>{l.name ?? '—'}<small style={muted}>{[l.label, gradeText(l.grade), l.sku ? `${l.sku}-${l.idx + 1}` : null].filter(Boolean).join(' · ')}</small></td>
                      <td className="num" data-label="Còn" data-m="third">{l.qty}</td>
                      <td className="num" data-label="Giá vườn" data-m="third">{l.unitCost == null ? 'Chưa có' : vnd(l.unitCost)}</td>
                    </tr>
                  ))}
                  {!detail.stock.length && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, ...muted }}>Không còn cây ký gửi.</td></tr>}
                </tbody>
              </table>
            </div>

            <b style={{ marginTop: 12 }}>Các lần đã trả</b>
            <div className="ad-tablewrap">
              <table className="ad-table app-mtable">
                <thead><tr><th>Ngày</th><th className="num">Số tiền</th><th>Ghi chú</th></tr></thead>
                <tbody>
                  {detail.payments.map((p) => (
                    <tr key={p.id}>
                      <td>{fmtYmd(p.spentOn)}<small style={muted}>{p.actor}</small></td>
                      <td className="num" data-label="Số tiền" data-m="third"><b>{vnd(p.amount)}</b></td>
                      <td data-label="Ghi chú" data-m="note">{p.note ?? ''}</td>
                    </tr>
                  ))}
                  {!detail.payments.length && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, ...muted }}>Chưa trả lần nào.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
