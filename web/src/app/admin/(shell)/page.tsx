import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, Thumb } from '@/components/Icon';
import { findCategory } from '@/lib/catalog';
import { money } from '@/lib/format';
import { requireStaff } from '@/server/auth';
import { getCategories } from '@/server/categories';
import { dashboardStats } from '@/server/stats';

export const metadata: Metadata = { title: 'Tổng quan' };

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} tr` : money(n));

function Delta({ now, before, unit = '%' }: { now: number; before: number; unit?: string }) {
  if (!before) return <span>—</span>;
  const d = unit === '%' ? Math.round(((now - before) / before) * 100) : now - before;
  return <span className={d >= 0 ? 'ad-up' : 'ad-down'}>{d >= 0 ? '▲' : '▼'} {Math.abs(d)}{unit === '%' ? '%' : ''}</span>;
}

/** AdminDashboard với số liệu thật: KPI, doanh thu 14 ngày, việc cần xử lý, nhóm hàng, tồn kho thấp. */
export default async function AdminDashboardPage() {
  await requireStaff();
  const [s, cats] = await Promise.all([dashboardStats(), getCategories()]);
  const maxDay = Math.max(1, ...s.days.map((d) => d.revenue));
  const catTotal = s.byCategory.reduce((a, c) => a + c.sum, 0) || 1;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Tổng quan</h1>
        <span className="acts"><Link href="/admin/pos" className="vx-btn vx-btn--primary"><Icon name="cart" />Tạo đơn tại quầy</Link></span>
      </div>
      <div className="ad-kpis">
        <div className="ad-kpi">
          <span><Icon name="cash" />Doanh thu hôm nay</span>
          <b>{short(s.today.revenue)}</b>
          <small><Delta now={s.today.revenue} before={s.yesterday.revenue} /> so với hôm qua</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="box" />Đơn mới hôm nay</span>
          <b>{s.today.orders}</b>
          <small><Delta now={s.today.orders} before={s.yesterday.orders} unit="đơn" /> · {s.pending} chờ xác nhận</small>
        </div>
        <div className={`ad-kpi${s.preparingPlants ? ' warn' : ''}`}>
          <span><Icon name="plant" />Đơn cây đang chuẩn bị</span>
          <b>{s.preparingPlants}</b>
          <small>Cần chụp ảnh cây trước khi giao</small>
        </div>
        <div className={`ad-kpi${s.lowStock.length ? ' warn' : ''}`}>
          <span><Icon name="alert" />Hàng sắp hết</span>
          <b>{s.lowStock.length}</b>
          <small>Quy cách còn dưới 10 sản phẩm</small>
        </div>
      </div>
      <div className="ad-grid2">
        <div className="ad-card">
          <div className="ad-card__h">Doanh thu 14 ngày<span className="ad-legend"><span>Hôm nay</span><span className="b">Các ngày trước</span></span></div>
          <div className="ad-card__b">
            <div className="ad-chart">
              {s.days.map((d, i) => (
                <div key={i} title={`${money(d.revenue)} · ${d.orders} đơn`}>
                  <i className={i === s.days.length - 1 ? 'hi' : undefined} style={{ height: `${Math.max(2, (d.revenue / maxDay) * 100)}%` }} />
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__h">Việc cần xử lý<Link href="/admin/don-hang">Xem tất cả</Link></div>
          <div className="ad-card__b" style={{ gap: 0 }}>
            <div className="ad-task"><span className={`n${s.pending ? ' hot' : ''}`}>{s.pending}</span>Đơn chờ xác nhận<Link href="/admin/don-hang?trang_thai=pending">Xử lý</Link></div>
            <div className="ad-task"><span className={`n${s.preparingPlants ? ' hot' : ''}`}>{s.preparingPlants}</span>Đơn có cây đang chuẩn bị<Link href="/admin/don-hang?trang_thai=preparing">Xử lý</Link></div>
            <div className="ad-task"><span className="n">{s.lowStock.length}</span>Quy cách dưới mức tồn tối thiểu<Link href="/admin/kho">Xem</Link></div>
          </div>
        </div>
      </div>
      <div className="ad-grid2">
        <div className="ad-card">
          <div className="ad-card__h">Doanh thu theo nhóm hàng (30 ngày)</div>
          <div className="ad-card__b">
            {s.byCategory.length ? (
              <div className="ad-bars">
                {s.byCategory.sort((a, b) => b.sum - a.sum).map((c) => (
                  <div key={c.category}>
                    <span>{findCategory(cats, c.category)?.name ?? c.category}</span>
                    <i><em style={{ width: `${(c.sum / catTotal) * 100}%` }} /></i>
                    <b>{short(c.sum)}</b>
                  </div>
                ))}
              </div>
            ) : <span style={{ color: 'var(--ink-muted)' }}>Chưa có đơn hàng trong 30 ngày.</span>}
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card__h">Tồn kho cần chú ý</div>
          <table className="ad-table">
            <tbody>
              {s.lowStock.map((r, i) => (
                <tr key={i}>
                  <td><span className="ad-prod"><span className="ad-thumb"><Thumb src={r.image} icon={r.icon} /></span><span>{r.name}<small>{r.label}</small></span></span></td>
                  <td className="num">{r.stock}</td>
                  <td>{r.pesticide ? <span className="ad-pill new">Thuốc BVTV</span> : <span className="ad-pill wait">Dưới mức</span>}</td>
                </tr>
              ))}
              {!s.lowStock.length && <tr><td style={{ color: 'var(--ink-muted)' }}>Không có quy cách nào dưới mức tồn tối thiểu.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
