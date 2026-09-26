import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { money } from '@/lib/format';
import { PAY_LABEL } from '@/lib/order-labels';
import { getCurrentUser } from '@/server/auth';
import { canViewOrder, getOrderByCode, LAST_ORDER_COOKIE } from '@/server/orders';

export const metadata: Metadata = { title: 'Đặt hàng thành công', robots: { index: false } };

type Props = { searchParams: Promise<{ ma?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const code = ((await searchParams).ma ?? '').slice(0, 20);
  const [store, user] = await Promise.all([cookies(), getCurrentUser()]);
  const order = code ? getOrderByCode(code) : undefined;
  // Chỉ người vừa đặt trên trình duyệt này hoặc chủ tài khoản mới xem được chi tiết đơn.
  const canView = order && (store.get(LAST_ORDER_COOKIE)?.value === code || (user && canViewOrder(order, user)));

  if (!order || !canView) {
    return (
      <div className="os-page">
        <div className="os-hero">
          <span className="os-check"><Icon name="receipt" /></span>
          <h1>Không xem được đơn hàng</h1>
          <p>Đăng nhập bằng số điện thoại đã đặt hàng để xem đơn trong mục Đơn hàng của tôi.</p>
        </div>
        <div className="os-actions">
          <Link href="/tai-khoan/don-hang" className="vx-btn vx-btn--primary">Đơn hàng của tôi</Link>
        </div>
      </div>
    );
  }

  const hasPlant = order.items.some((i) => i.ship === 'plant');

  return (
    <div className="os-page">
      <div className="os-hero">
        <span className="os-check"><Icon name="check" /></span>
        <h1>Đặt hàng thành công!</h1>
        <p>Cảm ơn bạn đã chọn Cây Cảnh Miền Tây. Shop sẽ gọi xác nhận đơn trong 30 phút (8:00 – 21:00).</p>
        <span className="os-code">Mã đơn <b>{order.code}</b></span>
      </div>
      <div className="os-grid">
        <div className="os-box">
          <h3><Icon name="truck" />{order.delivery === 'ship' ? 'Giao hàng' : 'Nhận tại vườn'}</h3>
          <span>
            {order.slot && <><b>{order.slot}</b><br /></>}
            {order.delivery === 'ship' ? order.address : 'Vườn Cái Mơn – Chợ Lách. Shop nhắn Zalo khi cây sẵn sàng.'}
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
            : <span className="vx-badge vx-badge--info" style={{ alignSelf: 'flex-start' }}>{order.paymentMethod === 'cod' ? 'Trả khi nhận hàng' : 'Chờ thanh toán'}</span>}
          <span style={{ color: 'var(--ink-muted)' }}>
            Bạn được cộng <b style={{ color: 'var(--ink)' }}>{Math.floor(order.total / 10000)} điểm</b> sau khi nhận hàng
            {user ? '.' : ' nếu đăng nhập bằng số điện thoại đặt hàng.'}
          </span>
        </div>
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
