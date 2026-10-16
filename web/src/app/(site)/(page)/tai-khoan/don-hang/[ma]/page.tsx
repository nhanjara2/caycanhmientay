import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Blocks';
import { OrderDetail } from '@/components/orders/OrderParts';
import { getCurrentUser } from '@/server/auth';
import { canViewOrder, getOrderByCode } from '@/server/orders';

type Props = { params: Promise<{ ma: string }> };

export const metadata: Metadata = { title: 'Chi tiết đơn hàng', robots: { index: false } };

/** OrderDetailLayout — chỉ chủ đơn xem được. */
export default async function OrderDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập
  const order = await getOrderByCode((await params).ma.slice(0, 20));
  if (!order || !canViewOrder(order, user)) notFound();

  return (
    <div className="vx-acctpage">
      <Breadcrumb items={[{ label: 'Tài khoản', href: '/tai-khoan' }, { label: 'Đơn hàng của tôi', href: '/tai-khoan/don-hang' }, { label: 'Chi tiết đơn hàng' }]} />
      <OrderDetail o={order} />
    </div>
  );
}
