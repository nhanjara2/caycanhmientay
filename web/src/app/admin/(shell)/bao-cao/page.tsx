import type { Metadata } from 'next';
import Link from 'next/link';
import { ExpenseBreakdown } from '@/components/admin/ExpenseBreakdown';
import { Icon } from '@/components/Icon';
import { shortMoney } from '@/lib/expense-labels';
import { findCategory } from '@/lib/catalog';
import { money } from '@/lib/format';
import { PAY_LABEL } from '@/lib/order-labels';
import { requireAccess } from '@/server/auth';
import { getCategories } from '@/server/categories';
import { materializeRecurring } from '@/server/expenses';
import { buildReport, DEFAULT_RANGE, isReportRange, REPORT_RANGES, type ReportRange } from '@/server/reports';

export const metadata: Metadata = { title: 'Báo cáo' };

type Props = { searchParams: Promise<{ ky?: string }> };

const short = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(2).replace('.', ',')} tỷ` : n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} tr` : money(Math.round(n)));
const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
const fmtPct = (n: number) => `${(Math.round(n * 10) / 10).toString().replace('.', ',')}%`;

function Delta({ now, before, suffix = '%' }: { now: number; before: number; suffix?: string }) {
  if (!before) return <span>chưa có kỳ trước để so</span>;
  const d = suffix === '%' ? Math.round(((now - before) / before) * 100) : Math.round((now - before) * 10) / 10;
  if (d === 0) return <span>không đổi so với kỳ trước</span>;
  return (
    <span><span className={d > 0 ? 'ad-up' : 'ad-down'}>{d > 0 ? '▲' : '▼'} {Math.abs(d).toString().replace('.', ',')}{suffix === '%' ? '%' : ' điểm'}</span> so với kỳ trước</span>
  );
}

const DELIVERY_LABEL: Record<string, string> = { ship: 'Giao tận nơi', pickup: 'Nhận tại vườn' };
const CHANNEL_LABEL: Record<string, string> = { web: 'Website', pos: 'Tại cửa hàng' };

/** AdminReports với số liệu thật: doanh thu, đơn, khách quay lại, bảo hành, kênh thanh toán, bán kèm, chăm sóc khách. */
export default async function AdminReportsPage({ searchParams }: Props) {
  await requireAccess('reports');
  await materializeRecurring(); // ghi các khoản chi định kỳ đã đến hạn trước khi tính lãi lỗ
  const sp = await searchParams;
  const range: ReportRange = isReportRange(sp.ky) ? sp.ky : DEFAULT_RANGE;
  const [r, cats] = await Promise.all([buildReport(range), getCategories()]);

  const maxBar = Math.max(1, ...r.chart.flatMap((p) => (r.daily ? [p.revenue] : [p.revenue, p.before])));
  const retNow = pct(r.returning.back, r.returning.buyers), retBefore = pct(r.returning.prev.back, r.returning.prev.buyers);
  const warrantyRate = pct(r.warranty.claims, r.warranty.plantItems);
  const groupName = (category: string, sub: string) => {
    const c = findCategory(cats, category);
    return c?.subs.find((s) => s.slug === sub)?.name ?? c?.name ?? category;
  };
  const catName = (slug: string) => findCategory(cats, slug)?.name ?? slug;
  const payTotal = r.pay.reduce((a, p) => a + p.n, 0);
  const shipTotal = r.delivery.reduce((a, d) => a + d.n, 0);
  const channelTotal = r.channel.reduce((a, d) => a + d.n, 0);
  const empty = !r.orders;
  const f = r.finance;
  const margin = r.revenue ? (f.profit / r.revenue) * 100 : 0;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Báo cáo</h1>
        <span className="acts">
          <a className="vx-btn vx-btn--outline" href={`/admin/bao-cao/xuat?ky=${range}`}>
            <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: 15, height: 15 }} aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>Xuất Excel
          </a>
        </span>
      </div>
      <div className="ad-filters" style={{ border: 0, padding: 0 }}>
        <span className="vx-seg">
          {(Object.keys(REPORT_RANGES) as ReportRange[]).map((k) => (
            <Link key={k} href={`/admin/bao-cao?ky=${k}`} className="vx-chip" aria-pressed={range === k}>{REPORT_RANGES[k]}</Link>
          ))}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
        Tính từ đơn bán chưa hủy (không tính đơn 0đ do bảo hành tạo). Kỳ trước = khoảng thời gian liền trước, dài bằng kỳ đang xem.
      </p>

      <div className="ad-kpis k5">
        <div className="ad-kpi">
          <span><Icon name="cash" />Doanh thu</span>
          <b>{short(r.revenue)}</b>
          <small><Delta now={r.revenue} before={r.prevRevenue} /></small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="box" />Số đơn</span>
          <b>{r.orders.toLocaleString('vi-VN')}</b>
          <small>{r.orders ? `Giá trị TB ${short(r.revenue / r.orders)}` : 'Chưa có đơn trong kỳ'}</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="user" />Khách quay lại</span>
          <b>{r.returning.buyers ? fmtPct(retNow) : '—'}</b>
          <small>{r.returning.buyers ? <>{r.returning.back}/{r.returning.buyers} khách đã mua trước kỳ{r.returning.prev.buyers ? <> · <Delta now={retNow} before={retBefore} suffix=" điểm" /></> : null}</> : 'Chưa có khách mua trong kỳ'}</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="shield" />Tỉ lệ bảo hành cây</span>
          <b>{r.warranty.plantItems ? fmtPct(warrantyRate) : '—'}</b>
          <small>{r.warranty.plantItems ? `${r.warranty.claims} yêu cầu / ${r.warranty.plantItems} cây đã giao` : 'Chưa giao cây nào trong kỳ'}</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="tag" />Đơn dùng mã giảm giá</span>
          <b>{r.orders ? fmtPct(pct(r.voucherOrders, r.orders)) : '—'}</b>
          <small>{r.voucherOrders ? `${r.voucherOrders} đơn · đã giảm ${short(r.voucherDiscount)}` : 'Chưa có đơn dùng mã'}</small>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Lãi lỗ<Link href="/admin/thu-chi">Thu chi</Link></div>
        <div className="ad-card__b">
          <div className="ad-kpis">
            <div className="ad-kpi">
              <span><Icon name="cash" />Doanh thu</span>
              <b>{shortMoney(r.revenue)}</b>
              <small>{r.orders} đơn trong kỳ</small>
            </div>
            <div className="ad-kpi">
              <span><Icon name="box" />Tiền vốn hàng đã bán</span>
              <b>{shortMoney(f.cogs)}</b>
              <small>{f.uncostedItems ? `${f.uncostedItems} dòng hàng chưa có giá gốc nên chưa tính` : <>Kỳ trước: {shortMoney(f.prev.cogs)}</>}</small>
            </div>
            <div className="ad-kpi">
              <span><Icon name="cash" />Chi phí khác</span>
              <b>{shortMoney(f.expenses)}</b>
              <small>{f.expenseCount} khoản{f.refunds ? ` · hoàn tiền khách ${shortMoney(f.refunds)}` : ''} · kỳ trước: {shortMoney(f.prev.expenses)}</small>
            </div>
            <div className={`ad-kpi${f.profit < 0 ? ' warn' : ''}`}>
              <span><Icon name={f.profit < 0 ? 'alert' : 'cash'} />{f.profit < 0 ? 'Lỗ' : 'Lãi'}</span>
              <b>{shortMoney(f.profit)}</b>
              <small>{r.revenue ? `Biên ${fmtPct(margin)} doanh thu · ` : ''}kỳ trước: {shortMoney(f.prev.profit)}</small>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
            Lãi = doanh thu − tiền vốn hàng đã bán − chi phí khác − hoàn tiền khách, cùng kỳ. Doanh thu là đơn chưa hủy (kể cả chưa giao / chưa thu tiền); tiền vốn = giá gốc của từng quy cách × số lượng đã bán. Tiền mua hàng đã chi xem ở Thu chi.
          </span>
        </div>
      </div>
      <ExpenseBreakdown fin={f} />

      <div className="ad-grid2">
        <div className="ad-card">
          <div className="ad-card__h">
            {r.daily ? 'Doanh thu theo ngày' : 'Doanh thu theo tháng'}
            <span className="ad-legend">{r.daily ? <span>Doanh thu</span> : <><span>Năm nay</span><span className="b">Cùng tháng năm trước</span></>}</span>
          </div>
          <div className="ad-card__b" style={{ paddingBottom: r.daily ? undefined : 28 }}>
            {empty && !r.chart.some((p) => p.before) ? (
              <span style={{ color: 'var(--ink-muted)' }}>Chưa có đơn hàng trong kỳ này.</span>
            ) : r.daily ? (
              <div className="ad-chart" role="img" aria-label="Doanh thu từng ngày trong kỳ">
                {r.chart.map((p, i) => (
                  <div key={p.key} title={`${p.label}: ${money(p.revenue)} · ${p.orders} đơn`}>
                    <i className="hi" style={{ height: `${Math.max(p.revenue ? 3 : 1, (p.revenue / maxBar) * 100)}%` }} />
                    {i % 5 === 0 || i === r.chart.length - 1 ? p.label.split('/')[0] : ' '}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ad-chart2" role="img" aria-label="Doanh thu từng tháng, so với cùng tháng năm trước">
                {r.chart.map((p) => (
                  <div key={p.key} title={`${p.label}: ${money(p.revenue)} · ${p.orders} đơn (cùng tháng năm trước: ${money(p.before)})`}>
                    <i style={{ height: `${Math.max(p.revenue ? 3 : 1, (p.revenue / maxBar) * 100)}%` }} />
                    <i className="b" style={{ height: `${Math.max(p.before ? 3 : 1, (p.before / maxBar) * 100)}%` }} />
                    <span>{p.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__h">Tỉ lệ bảo hành theo loại cây</div>
          <div className="ad-card__b">
            {r.warranty.groups.length ? (
              <div className="ad-bars">
                {(() => {
                  const max = Math.max(1, ...r.warranty.groups.map((g) => pct(g.claims, g.items)));
                  return r.warranty.groups.slice(0, 6).map((g) => (
                    <div key={`${g.category}/${g.sub}`} title={`${g.claims} yêu cầu / ${g.items} cây đã giao`}>
                      <span>{groupName(g.category, g.sub)}</span>
                      <i><em style={{ width: `${(pct(g.claims, g.items) / max) * 100}%` }} /></i>
                      <b>{fmtPct(pct(g.claims, g.items))}</b>
                    </div>
                  ));
                })()}
              </div>
            ) : <span style={{ color: 'var(--ink-muted)' }}>Chưa giao cây sống nào trong kỳ.</span>}
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
              {r.warranty.causes.length
                ? <>Nguyên nhân kỹ sư ghi nhiều nhất: {r.warranty.causes.map((c) => `${c.cause} (${c.n})`).join(', ')}.</>
                : r.warranty.claims ? 'Các yêu cầu bảo hành trong kỳ chưa được ghi nguyên nhân.' : 'Chưa có yêu cầu bảo hành trong kỳ.'}
            </span>
          </div>
        </div>
      </div>

      <div className="ad-grid3">
        <div className="ad-card">
          <div className="ad-card__h">Kênh bán, thanh toán &amp; nhận hàng</div>
          <div className="ad-card__b">
            {payTotal ? (
              <>
                <div className="ad-bars">
                  {r.pay.map((p) => (
                    <div key={p.method} title={`${p.n} đơn · ${money(p.revenue)}`}>
                      <span>{PAY_LABEL[p.method as keyof typeof PAY_LABEL]?.replace(' khi nhận hàng', '').replace(' ngân hàng (QR)', ' (QR)') ?? p.method}</span>
                      <i><em style={{ width: `${pct(p.n, payTotal)}%` }} /></i>
                      <b>{fmtPct(pct(p.n, payTotal))}</b>
                    </div>
                  ))}
                </div>
                <div className="ad-bars">
                  {r.channel.map((d) => (
                    <div key={d.channel}>
                      <span>{CHANNEL_LABEL[d.channel] ?? d.channel}</span>
                      <i><em style={{ width: `${pct(d.n, channelTotal)}%` }} /></i>
                      <b>{fmtPct(pct(d.n, channelTotal))}</b>
                    </div>
                  ))}
                </div>
                <div className="ad-bars">
                  {r.delivery.map((d) => (
                    <div key={d.delivery}>
                      <span>{DELIVERY_LABEL[d.delivery] ?? d.delivery}</span>
                      <i><em style={{ width: `${pct(d.n, shipTotal)}%` }} /></i>
                      <b>{fmtPct(pct(d.n, shipTotal))}</b>
                    </div>
                  ))}
                </div>
              </>
            ) : <span style={{ color: 'var(--ink-muted)' }}>Chưa có đơn trong kỳ.</span>}
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__h">Bán kèm với cây<span style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: '0.75rem' }}>vật tư mua cùng đơn</span></div>
          <div className="ad-card__b">
            {r.crossSell.plantOrders ? (
              <>
                <div className="ad-bars">
                  {r.crossSell.rows.length ? r.crossSell.rows.map((c) => (
                    <div key={c.category} title={`${c.n}/${r.crossSell.plantOrders} đơn có cây`}>
                      <span>{catName(c.category)}</span>
                      <i><em style={{ width: `${pct(c.n, r.crossSell.plantOrders)}%` }} /></i>
                      <b>{fmtPct(pct(c.n, r.crossSell.plantOrders))}</b>
                    </div>
                  )) : <span style={{ color: 'var(--ink-muted)' }}>Chưa đơn có cây nào mua kèm vật tư.</span>}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Tính trên {r.crossSell.plantOrders} đơn có cây sống.</span>
              </>
            ) : <span style={{ color: 'var(--ink-muted)' }}>Chưa có đơn cây sống trong kỳ.</span>}
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__h">Hỏi đáp &amp; đánh giá<Link href="/admin/danh-gia">Xem</Link></div>
          <div className="ad-card__b">
            <div className="ad-kv">
              <span>Câu hỏi mới</span><span><b>{r.care.questions}</b></span>
              <span>Trả lời trong 2 giờ</span><span><b>{r.care.questions ? fmtPct(pct(r.care.fast, r.care.questions)) : '—'}</b></span>
              <span>Chưa trả lời</span><span><b>{r.care.questions - r.care.answered}</b></span>
              <span>Đánh giá đang hiện</span><span><b>{r.care.reviews}</b></span>
              <span>Điểm trung bình</span><span><b>{r.care.reviews ? r.care.avgStars.toFixed(1).replace('.', ',') : '—'}</b></span>
              <span>Đánh giá chờ duyệt</span><span><b>{r.care.pendingReviews}</b></span>
            </div>
          </div>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card__h">Sản phẩm bán chạy<span style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: '0.75rem' }}>theo doanh thu hàng hóa</span></div>
        <table className="ad-table app-mtable">
          <thead><tr><th>Sản phẩm</th><th className="num">Đã bán</th><th className="num">Doanh thu</th></tr></thead>
          <tbody>
            {r.top.map((t) => (
              <tr key={t.slug}>
                <td><Link href={`/admin/san-pham/${t.slug}`}>{t.name}</Link></td>
                <td className="num" data-label="Đã bán">{t.qty}</td>
                <td className="num" data-label="Doanh thu"><b>{money(t.revenue)}</b></td>
              </tr>
            ))}
            {!r.top.length && <tr><td colSpan={3} style={{ color: 'var(--ink-muted)' }}>Chưa có đơn hàng trong kỳ.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
