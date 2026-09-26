import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderDetail } from '@/components/orders/OrderParts';
import { getCurrentUser } from '@/server/auth';
import { canViewOrder, getOrderByCode } from '@/server/orders';

type Props = { params: Promise<{ ma: string }> };

export const metadata: Metadata = { title: 'Chi tiết đơn hàng', robots: { index: false } };

/** OrderDetailLayout — chỉ chủ đơn xem được. */
export default async function OrderDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập
  const order = getOrderByCode((await params).ma.slice(0, 20));
  if (!order || !canViewOrder(order, user)) notFound();

  return (
    <div className="vx-acctpage">
      <div className="vx-crumb">
        <Link href="/">Trang chủ</Link>/<Link href="/tai-khoan">Tài khoản</Link>/
        <Link href="/tai-khoan/don-hang">Đơn hàng của tôi</Link>/<span>Chi tiết đơn hàng</span>
      </div>
      <OrderDetail o={order} />
    </div>
  );
}
