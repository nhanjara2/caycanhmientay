import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, Thumb } from '@/components/Icon';
import { PICKUP_PLACE } from '@/lib/contact';
import { money } from '@/lib/format';
import { fmtDate, fmtDateTime, PAY_LABEL, PAY_LOGO, STATUS_LABEL, TIMELINE, type Status } from '@/lib/order-labels';
import type { OrderFull } from '@/server/orders';
import { ReorderButton } from './ReorderButton';

const STATUS_CLASS: Record<Status, string> = {
  pending: 'processing', confirmed: 'processing', preparing: 'processing',
  shipping: 'shipping', delivered: 'done', cancelled: 'cancel',
};

export function StatusText({ status }: { status: Status }) {
  return <span className={`vx-status vx-status--${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

const deliveryLabel = (o: OrderFull) => (o.delivery === 'ship' ? 'Giao tận nơi' : 'Nhận tại vườn');
const reorderItems = (o: OrderFull) => o.items.map((i) => ({ slug: i.productSlug, option: i.optionIdx, qty: i.qty }));

/** Số ngày bảo hành cây còn lại (7 ngày kể từ lúc giao xong). */
export function warrantyDaysLeft(o: OrderFull) {
  if (o.status !== 'delivered' || !o.items.some((i) => i.ship === 'plant')) return 0;
  const done = o.events.findLast((e) => e.status === 'delivered')?.createdAt ?? o.updatedAt;
  return Math.max(0, 7 - Math.floor((Date.now() - done.getTime()) / 86_400_000));
}

function OrderLine({ i, children }: { i: OrderFull['items'][number]; children?: ReactNode }) {
  return (
    <div className="vx-oline">
      <span className="vx-item__img"><Thumb src={i.image} icon={i.icon} /></span>
      <p>{i.name}<small>{i.label}</small>{children}</p>
      <span className="pr">{money(i.price)}{i.oldPrice ? <s>{money(i.oldPrice)}</s> : null}</span>
      <span className="qt">x{i.qty} {i.unit}</span>
    </div>
  );
}

/** OrderCard trong danh sách Đơn hàng của tôi. */
export function OrderCard({ o }: { o: OrderFull }) {
  const href = `/tai-khoan/don-hang/${o.code}`;
  const days = warrantyDaysLeft(o);
  return (
    <article className="vx-order">
      <div className="vx-order__head">
        <b>Đơn hàng {fmtDate(o.createdAt)}</b>
        <span className="dot" /><span>{deliveryLabel(o)}</span>
        <span className="dot" /><span>#{o.code}</span>{o.kind === 'warranty' && <span className="vx-badge vx-badge--info">Bảo hành</span>}
        <StatusText status={o.status} />
      </div>
      <div className="vx-order__body">
        {o.items.slice(0, 2).map((i) => <OrderLine key={i.id} i={i} />)}
        {o.items.length > 2 && <span className="vx-more">và {o.items.length - 2} sản phẩm khác</span>}
        <div className="vx-order__sum">
          <Link href={href}>Xem chi tiết <Icon name="chevron" size={16} /></Link>
          <span>Thành tiền: <b>{money(o.total)}</b></span>
        </div>
      </div>
      <div className="vx-order__foot">
        <span className="hint">
          <Icon name={days ? 'shield' : 'clock'} />
          {days ? `Bảo hành cây còn ${days} ngày` : o.slot && o.status !== 'delivered' && o.status !== 'cancelled' ? `Giao ${o.slot}` : `Đặt lúc ${fmtDateTime(o.createdAt)}`}
        </span>
        {o.status === 'delivered' || o.status === 'cancelled'
          ? <ReorderButton items={reorderItems(o)} className="vx-btn vx-btn--primary vx-btn--sm" />
          : <Link href={href} className="vx-btn vx-btn--primary vx-btn--sm">Theo dõi đơn</Link>}
      </div>
    </article>
  );
}

/** OrderTimeline 5 bước; đơn hủy hiện dòng trạng thái riêng. */
export function OrderTimeline({ o }: { o: OrderFull }) {
  const reached = new Map(o.events.map((e) => [e.status, e.createdAt]));
  const cur = TIMELINE.findIndex((t) => t.status === o.status);
  return (
    <div className="vx-tl">
      {TIMELINE.map((t, idx) => {
        const at = reached.get(t.status);
        const state = o.status === 'cancelled' ? (at ? 'done' : '') : idx < cur || o.status === 'delivered' ? 'done' : idx === cur ? 'now' : '';
        return (
          <div key={t.status} className={`vx-tl__step ${state}`}>
            <span className="vx-tl__dot">{state === 'done' ? <Icon name="check" /> : <span>{idx + 1}</span>}</span>
            <b>{t.label}</b>
            <span>{at ? fmtDateTime(at) : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}

const STATE_TEXT: Record<Status, [string, string]> = {
  pending: ['Chờ xác nhận', 'Shop sẽ gọi xác nhận đơn trong 30 phút (8:00 – 21:00).'],
  confirmed: ['Đã xác nhận đơn', 'Nhà vườn đang chọn cây cho bạn.'],
  preparing: ['Đang chuẩn bị cây', 'Cây được đóng gói chống dập; shop sẽ gửi ảnh cây thật trước khi giao.'],
  shipping: ['Đang giao hàng', 'Tài xế sẽ gọi trước khi đến. Vui lòng để ý điện thoại.'],
  delivered: ['Giao hàng thành công', 'Cảm ơn bạn đã tin tưởng Cây Cảnh Miền Tây. Chúc cây của bạn lên xanh!'],
  cancelled: ['Đơn đã hủy', 'Nếu đã thanh toán, tiền sẽ được hoàn trong 3–5 ngày làm việc.'],
};

/** OrderDetail của khách: 2 cột, cột phải là hóa đơn. */
export function OrderDetail({ o }: { o: OrderFull }) {
  const days = warrantyDaysLeft(o);
  const last = o.events.at(-1);
  const plantShip = o.items.some((i) => i.ship === 'plant');
  const supplyShip = o.items.some((i) => i.ship === 'supply');
  return (
    <div className="vx-od">
      <div className="vx-od__main">
        <div className="vx-od__card">
          <div className="vx-od__head">
            <div className="row"><b>Đơn hàng {fmtDate(o.createdAt)}</b><StatusText status={o.status} /></div>
            <small>{deliveryLabel(o)} · #{o.code}</small>
          </div>
          <div className="vx-od__state">
            {last && (
              <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                <Icon name="clock" size={16} />Cập nhật lúc {fmtDateTime(last.createdAt)}
              </span>
            )}
            <h3>{STATE_TEXT[o.status][0]}</h3>
            <p>{STATE_TEXT[o.status][1]}</p>
            <OrderTimeline o={o} />
          </div>
          <div className="vx-od__cols">
            <div>
              <span className="lab"><Icon name="user" />Thông tin người nhận</span>
              <b>{o.customerName}</b>
              <small>{o.phone}</small>
            </div>
            <div>
              <span className="lab"><Icon name="pin" />{o.delivery === 'ship' ? 'Giao đến' : 'Nhận tại'}</span>
              <b>{o.delivery === 'ship' ? o.address : PICKUP_PLACE}</b>
              {o.slot && <small>Khung giờ: {o.slot}</small>}
            </div>
          </div>
          {days > 0 && (
            <div className="vx-warranty">
              <Icon name="shield" />
              <div><b>Bảo hành cây còn {days} ngày</b>Cây héo, úng, rụng lá bất thường? Gửi ảnh để được đổi cây miễn phí.</div>
              <Link href="/tai-khoan/bao-hanh" className="vx-btn vx-btn--outline vx-btn--sm">Yêu cầu bảo hành</Link>
            </div>
          )}
        </div>
        <b style={{ fontSize: '0.875rem' }}>Danh sách sản phẩm</b>
        <div className="vx-od__card">
          <div className="vx-order__body">
            {o.items.map((i) => (
              <OrderLine key={i.id} i={i}>
                <Link href={`/san-pham/${i.productSlug}`}>{i.ship === 'plant' ? 'Xem cách chăm sóc' : 'Xem cách dùng'} <Icon name="chevron" size={14} /></Link>
                {o.status === 'delivered' && (
                  <> · <Link href={`/san-pham/${i.productSlug}#viet-danh-gia`}><Icon name="star" size={14} /> Viết đánh giá</Link></>
                )}
              </OrderLine>
            ))}
          </div>
        </div>
        {o.note && <div className="vx-note"><Icon name="chat" /><div><b>Ghi chú:</b> {o.note}</div></div>}
      </div>
      <aside>
        <div className="vx-receipt">
          <h3>Thông tin thanh toán</h3>
          <div className="vx-lines">
            <div><span>Tổng tiền</span><b>{money(o.subtotal)}</b></div>
            {plantShip && <div><span>Phí giao cây sống</span>{o.plantShip ? <b>{money(o.plantShip)}</b> : <b className="pos">Miễn phí</b>}</div>}
            {supplyShip && <div><span>Phí giao vật tư</span>{o.supplyShip ? <b>{money(o.supplyShip)}</b> : <b className="pos">Miễn phí</b>}</div>}
            {o.shipVoucherDiscount > 0 && <div><span>Mã miễn phí giao {o.shipVoucherCode}</span><b className="neg">-{money(o.shipVoucherDiscount)}</b></div>}
            {o.voucherDiscount > 0 && <div><span>Mã giảm giá {o.voucherCode}</span><b className="neg">-{money(o.voucherDiscount)}</b></div>}
            {o.comboDiscount > 0 && <div><span>Combo 2 cây</span><b className="neg">-{money(o.comboDiscount)}</b></div>}
            {o.partnerDiscount > 0 && <div><span>Chiết khấu đối tác</span><b className="neg">-{money(o.partnerDiscount)}</b></div>}
          </div>
          <div className="vx-total"><b>Thành tiền</b><span className="amt" style={{ fontSize: '1.25rem' }}>{money(o.total)}</span></div>
          <div className="vx-paid">
            <span>Phương thức thanh toán</span>
            {o.paid ? <span className="ok"><Icon name="check" />Đã thanh toán</span> : <span>{o.paymentMethod === 'cod' ? 'Trả khi nhận hàng' : 'Chờ thanh toán'}</span>}
          </div>
          <div className="vx-paym">
            <span className="vx-pay__mark app-pay-logo">
              {PAY_LOGO[o.paymentMethod]
                ? <img src={`/images/pay/${PAY_LOGO[o.paymentMethod]}`} alt="" />
                : <Icon name={o.paymentMethod === 'cod' ? 'cash' : o.paymentMethod === 'card' ? 'card' : 'wallet'} />}
            </span>
            {PAY_LABEL[o.paymentMethod]}
          </div>
          <div className="vx-od__actions">
            <ReorderButton items={reorderItems(o)} className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" />
          </div>
        </div>
      </aside>
    </div>
  );
}
