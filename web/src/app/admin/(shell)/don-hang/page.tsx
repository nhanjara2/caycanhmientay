import type { Metadata } from 'next';
import Link from 'next/link';
import { OrderPill } from '@/components/admin/OrderPill';
import { Icon, Thumb } from '@/components/Icon';
import { money } from '@/lib/format';
import { fmtDateTime, PAY_LABEL, STATUS_LABEL, type Status } from '@/lib/order-labels';
import { maskPhone, requireStaff } from '@/server/auth';
import { ORDER_STATUSES } from '@/server/db/schema';
import { countOrdersByStatus, listOrders } from '@/server/orders';

export const metadata: Metadata = { title: 'Đơn hàng' };

type Props = { searchParams: Promise<{ trang_thai?: string; q?: string }> };

/** AdminOrders: tab trạng thái + tìm kiếm + DataTable (dữ liệu thật). */
export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireStaff();
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.trang_thai as Status) ? (sp.trang_thai as Status) : undefined;
  const q = sp.q?.slice(0, 60);
  const orders = await listOrders({ status, q });
  const counts = await countOrdersByStatus();
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const href = (s?: Status) => `/admin/don-hang${s ? `?trang_thai=${s}` : ''}`;

  return (
    <div className="ad-body">
      <div className="ad-title"><h1>Đơn hàng</h1></div>
      <div className="ad-card">
        <div className="ad-stabs">
          <Link href={href()} aria-current={!status ? 'true' : undefined}>Tất cả<em>{total}</em></Link>
          {ORDER_STATUSES.map((s) => (
            <Link key={s} href={href(s)} aria-current={status === s ? 'true' : undefined}>
              {STATUS_LABEL[s]}{counts[s] ? <em>{counts[s]}</em> : null}
            </Link>
          ))}
        </div>
        <form className="ad-filters" action="/admin/don-hang">
          {status && <input type="hidden" name="trang_thai" value={status} />}
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input className="app-bare" name="q" defaultValue={q} placeholder="Mã đơn, tên, SĐT khách" aria-label="Tìm đơn" />
          </label>
          <button className="vx-btn vx-btn--outline vx-btn--sm">Tìm</button>
          {q && <Link href={href(status)} className="vx-btn vx-btn--ghost vx-btn--sm">Xóa tìm kiếm</Link>}
        </form>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr>
                <th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th className="num">Tổng tiền</th><th>Giao nhận</th><th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const plant = o.items.some((i) => i.ship === 'plant');
                const first = o.items[0];
                return (
                  <tr key={o.id}>
                    <td><Link className="code" href={`/admin/don-hang/${o.code}`}>{o.code}</Link>{o.kind === 'warranty' && <span className="vx-badge vx-badge--info" style={{ marginLeft: 6 }}>Bảo hành 0đ</span>}<small>{fmtDateTime(o.createdAt)}</small></td>
                    <td data-label="Khách hàng">{o.customerName}<small>{maskPhone(o.phone)}</small></td>
                    <td data-label="Sản phẩm" data-wide>
                      <span className="ad-prod">
                        <span className="ad-thumb"><Thumb src={first.image} icon={first.icon} /></span>
                        <span>
                          {first.name}{o.items.length > 1 ? ` + ${o.items.length - 1} SP` : ''}
                          <small>
                            {plant && <span className="ad-flag"><Icon name="plant" />Có cây sống</span>}
                            {o.note && <span className="ad-flag warn"><Icon name="chat" />Có ghi chú</span>}
                          </small>
                        </span>
                      </span>
                    </td>
                    <td className="num" data-label="Tổng tiền"><b>{money(o.total)}</b><small>{PAY_LABEL[o.paymentMethod]} · {o.paid ? 'Đã trả' : 'Chưa trả'}</small></td>
                    <td data-label="Giao nhận">{o.delivery === 'ship' ? 'Giao tận nơi' : 'Nhận tại vườn'}{o.slot && <small>{o.slot}</small>}</td>
                    <td data-label="Trạng thái"><OrderPill status={o.status} /></td>
                  </tr>
                );
              })}
              {!orders.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Không có đơn nào{q ? ` khớp “${q}”` : ''}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>Hiển thị {orders.length} đơn mới nhất</span></div>
      </div>
    </div>
  );
}
