import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { formatPhone, PICKUP_PLACE, SALES_PHONE, ZALO_URL } from '@/lib/contact';
import { money } from '@/lib/format';
import { PAY_LABEL, payStatus } from '@/lib/order-labels';
import { getCurrentUser } from '@/server/auth';
import { canViewOrder, getOrderByCode, LAST_ORDER_COOKIE } from '@/server/orders';

export const metadata: Metadata = { title: 'Đặt hàng thành công', robots: { index: false } };

type Props = { searchParams: Promise<{ ma?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const code = ((await searchParams).ma ?? '').slice(0, 20);
  const [store, user] = await Promise.all([cookies(), getCurrentUser()]);
  const order = code ? await getOrderByCode(code) : undefined;
  // Chỉ người vừa đặt trên trình duyệt này hoặc chủ tài khoản mới xem được chi tiết đơn.
  const canView = order && (store.get(LAST_ORDER_COOKIE)?.value === code || (user && canViewOrder(order, user)));

  if (!order || !canView) {
    return (
      <div className="os-page">
        <div className="os-hero">
          <span className="os-check"><Icon name="receipt" /></span>
          <h1>Không xem được đơn hàng</h1>
          <p>Đăng nhập bằng tài khoản đã đặt hàng để xem đơn trong mục Đơn hàng của tôi.</p>
        </div>
        <div className="os-actions">
          <Link href="/tai-khoan/don-hang" className="vx-btn vx-btn--primary">Đơn hàng của tôi</Link>
        </div>
      </div>
    );
  }

  const hasPlant = order.items.some((i) => i.ship === 'plant');
  const deposit = order.paymentMethod === 'deposit' && !order.paid;

  return (
    <div className="os-page">
      <div className="os-hero">
        <span className="os-check"><Icon name="check" /></span>
        <h1>{deposit ? 'Chúc mừng! Đơn hàng của bạn đã được đặt thành công' : 'Đặt hàng thành công!'}</h1>
        {deposit ? (
          <p>
            Cảm ơn bạn đã chọn Cây Cảnh Miền Tây. Chúng tôi sẽ liên hệ anh/chị <b style={{ color: 'var(--ink)' }}>{order.customerName}</b>
            {order.phone && <> qua số <b style={{ color: 'var(--ink)' }}>{formatPhone(order.phone)}</b> (điện thoại hoặc Zalo)</>} trong 30 phút (8:00 – 21:00)
            để xác nhận đơn, hướng dẫn đặt cọc và {order.delivery === 'ship' ? 'giao hàng' : 'hẹn nhận cây'}.
          </p>
        ) : (
          <p>Cảm ơn bạn đã chọn Cây Cảnh Miền Tây. Shop sẽ gọi xác nhận đơn trong 30 phút (8:00 – 21:00).</p>
        )}
        <span className="os-code">Mã đơn <b>{order.code}</b></span>
      </div>
      <div className="os-grid">
        <div className="os-box">
          <h3><Icon name="truck" />{order.delivery === 'ship' ? 'Giao hàng' : 'Nhận tại vườn'}</h3>
          <span>
            {order.slot && <><b>{order.slot}</b><br /></>}
            {order.delivery === 'ship' ? order.address : `${PICKUP_PLACE}. Shop nhắn Zalo khi cây sẵn sàng.`}
          </span>
          {hasPlant && (
            <span style={{ color: 'var(--ink-muted)' }}>
              Shop sẽ gửi <b style={{ color: 'var(--ink)' }}>ảnh cây thật</b> trước khi giao để bạn xem.
            </span>
          )}
        </div>
        <div className="os-box">
          <h3><Icon name="card" />Thanh toán</h3>
          <span><b>{money(order.total)}</b> · {PAY_LABEL[order.paymentMethod]}</span>
          {order.paid
            ? <span className="vx-badge vx-badge--success" style={{ alignSelf: 'flex-start' }}>Đã thanh toán</span>
            : <span className="vx-badge vx-badge--info" style={{ alignSelf: 'flex-start' }}>{payStatus(order.paymentMethod, false)}</span>}
          <span style={{ color: 'var(--ink-muted)' }}>
            {user
              ? <>Bạn được cộng <b style={{ color: 'var(--ink)' }}>{Math.floor(order.total / 10000)} điểm</b> sau khi nhận hàng.</>
              : 'Lần sau đăng nhập trước khi đặt để theo dõi đơn và tích điểm.'}
          </span>
        </div>
        {deposit && (
          <div className="os-box" style={{ gridColumn: '1 / -1' }}>
            <h3><Icon name="phone" />Bước tiếp theo: đặt cọc</h3>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: 4, fontSize: '0.875rem', lineHeight: 1.5 }}>
              <li>Shop gọi hoặc nhắn Zalo cho bạn để xác nhận cây, giá và thời gian giao.</li>
              <li>Shop gửi thông tin chuyển khoản và mức cọc. <b>Chỉ chuyển tiền theo thông tin do shop gửi.</b></li>
              <li>Shop báo khi đã nhận cọc và bắt đầu chuẩn bị cây.</li>
            </ol>
            <span style={{ color: 'var(--ink-muted)' }}>Muốn nhanh hơn, bạn nhắn Zalo hoặc gọi shop kèm mã đơn <b style={{ color: 'var(--ink)' }}>{order.code}</b>.</span>
            <div className="os-actions" style={{ flexWrap: 'wrap' }}>
              <a className="vx-btn vx-btn--primary" href={ZALO_URL} target="_blank" rel="noreferrer">Nhắn Zalo cho shop</a>
              <a className="vx-btn vx-btn--outline" href={`tel:${SALES_PHONE}`}>Gọi {formatPhone(SALES_PHONE)}</a>
            </div>
          </div>
        )}
      </div>
      <div className="os-next">
        <Link href="/tai-khoan/lich-cham-cay"><Icon name="bell" /><b>Bật nhắc chăm cây</b>Nhận lịch tưới, bón qua Zalo</Link>
        <Link href="/chinh-sach/bao-hanh-cay"><Icon name="shield" /><b>Bảo hành 7 ngày</b>Tính từ khi nhận cây; giữ lại ảnh lúc nhận</Link>
        <Link href="/goc-cham-cay"><Icon name="leaf" /><b>Chuẩn bị chỗ đặt cây</b>Đọc: Đặt cây ở đâu để lá đẹp</Link>
      </div>
      <div className="os-actions">
        <Link href="/" className="vx-btn vx-btn--outline">Tiếp tục mua sắm</Link>
        {user && <Link href={`/tai-khoan/don-hang/${order.code}`} className="vx-btn vx-btn--primary">Theo dõi đơn hàng</Link>}
      </div>
    </div>
  );
}
