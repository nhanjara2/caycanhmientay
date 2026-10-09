import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderPill } from '@/components/admin/OrderPill';
import { PaymentActions } from '@/components/admin/PaymentActions';
import { StatusActions } from '@/components/admin/StatusActions';
import { Icon, Thumb } from '@/components/Icon';
import { hasAccess } from '@/lib/permissions';
import { money } from '@/lib/format';
import { fmtDateTime, PAY_LABEL, STATUS_LABEL, TIMELINE } from '@/lib/order-labels';
import { requireAccess } from '@/server/auth';
import { getOrderByCode, NEXT_STATUS } from '@/server/orders';

type Props = { params: Promise<{ ma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Đơn ${(await params).ma}` };
}

/** AdminOrderDetail: tiến trình, sản phẩm, khách, thanh toán, lịch sử (dữ liệu thật). */
export default async function AdminOrderDetailPage({ params }: Props) {
  const staff = await requireAccess('orders');
  const o = await getOrderByCode((await params).ma.slice(0, 20));
  if (!o) notFound();
  const cur = TIMELINE.findIndex((t) => t.status === o.status);
  // Nút chuyển trạng thái: Đơn hàng toàn quyền thấy hết; kho / tài xế (quyền Giao hàng) chỉ thấy bước giao.
  const fullOrders = hasAccess(staff, 'orders', 'full');
  const actions = NEXT_STATUS[o.status].filter((s) => fullOrders || ((s === 'shipping' || s === 'delivered') && hasAccess(staff, 'delivery', 'full')));

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Đơn {o.code} <OrderPill status={o.status} style={{ verticalAlign: 'middle' }} />{o.kind === 'warranty' && <span className="vx-badge vx-badge--info" style={{ marginLeft: 8, verticalAlign: 'middle' }}>Đơn bảo hành 0đ</span>}{o.channel === 'pos' && <span className="vx-badge vx-badge--outline" style={{ marginLeft: 8, verticalAlign: 'middle' }}>Bán tại cửa hàng</span>}</h1>
        <StatusActions code={o.code} next={actions} />
      </div>
      {o.status !== 'cancelled' && (
        <div className="ao-steps">
          {TIMELINE.map((t, i) => (
            <span key={t.status} className={i < cur || o.status === 'delivered' ? 'done' : i === cur ? 'now' : undefined}>
              {(i < cur || o.status === 'delivered') && <Icon name="check" />}{STATUS_LABEL[t.status]}
            </span>
          ))}
        </div>
      )}
      <div className="ad-grid2">
        <div className="ad-fcol">
          <div className="ad-card">
            <div className="ad-card__h">Sản phẩm ({o.items.length})</div>
            <table className="ad-table">
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <span className="ad-prod">
                        <span className="ad-thumb"><Thumb src={i.image} icon={i.icon} /></span>
                        <span>{i.name}<small>{i.label}{i.ship === 'plant' ? ' · Cây sống' : ''}</small></span>
                      </span>
                    </td>
                    <td className="num">x{i.qty}</td>
                    <td className="num"><b>{money(i.price * i.qty)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {o.note && (
            <div className="ad-card">
              <div className="ad-card__h">Ghi chú của khách</div>
              <div className="ad-card__b"><div className="ao-note">{o.note}</div></div>
            </div>
          )}
        </div>
        <div className="ad-fcol">
          <div className="ad-card">
            <div className="ad-card__h">Khách hàng</div>
            <div className="ad-card__b">
              <div className="ad-kv">
                <span>Khách</span><span><b>{o.customerName}</b>{o.phone ? <> · <a href={`tel:${o.phone}`} style={{ color: 'var(--primary)' }}>{o.phone}</a></> : ' · không để số điện thoại'}</span>
                <span>Nhận hàng</span><span>{o.delivery === 'ship' ? o.address : 'Nhận tại vườn'}</span>
                {o.slot && <><span>Khung giờ</span><span>{o.slot}</span></>}
                <span>Tài khoản</span><span>{o.userId ? `#${o.userId}` : 'Khách vãng lai'}</span>
              </div>
            </div>
          </div>
          <div className="ad-card">
            <div className="ad-card__h">Thanh toán</div>
            <div className="ad-card__b">
              <div className="vx-lines" style={{ fontSize: '0.8125rem' }}>
                <div><span>Tạm tính</span><b>{money(o.subtotal)}</b></div>
                {o.original > o.subtotal && <div><span>Đã giảm</span><b className="neg">-{money(o.original - o.subtotal)}</b></div>}
                <div><span>Phí giao cây</span><b>{money(o.plantShip)}</b></div>
                <div><span>Phí giao vật tư</span><b>{money(o.supplyShip)}</b></div>
                {o.voucherDiscount > 0 && <div><span>Mã giảm giá {o.voucherCode}</span><b className="neg">-{money(o.voucherDiscount)}</b></div>}
                {o.partnerDiscount > 0 && <div><span>Chiết khấu đối tác</span><b className="neg">-{money(o.partnerDiscount)}</b></div>}
                <div><span>Phương thức</span><b>{PAY_LABEL[o.paymentMethod]}</b></div>
              </div>
              <div className="vx-total" style={{ paddingTop: 8 }}>
                <b>{o.paymentMethod === 'cod' && !o.paid ? 'Thu hộ COD' : o.paid ? 'Đã thanh toán' : 'Chờ thanh toán'}</b>
                <span className="amt" style={{ fontSize: '1.125rem' }}>{money(o.total)}</span>
              </div>
              {fullOrders && o.kind === 'sale' && o.paymentMethod !== 'cod' && o.status !== 'cancelled' && (
                <PaymentActions code={o.code} paid={o.paid} isAdmin={staff.role === 'admin'} />
              )}
            </div>
          </div>
          <div className="ad-card">
            <div className="ad-card__h">Lịch sử</div>
            <div className="ad-card__b">
              <div className="ad-log">
                {[...o.events].reverse().map((e) => (
                  <div key={e.id}><span>{fmtDateTime(e.createdAt)}</span>{e.actor} · {STATUS_LABEL[e.status]}{e.note ? ` — ${e.note}` : ''}</div>
                ))}
              </div>
            </div>
          </div>
          <Link href="/admin/don-hang" className="vx-btn vx-btn--ghost">← Danh sách đơn</Link>
        </div>
      </div>
    </div>
  );
}
