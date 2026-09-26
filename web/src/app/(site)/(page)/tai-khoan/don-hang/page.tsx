import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountSidebar } from '@/components/AccountSidebar';
import { EmptyState } from '@/components/Blocks';
import { OrderCard } from '@/components/orders/OrderParts';
import { getCurrentUser } from '@/server/auth';
import { countOrdersByTab, listOrdersForUser, ORDER_TABS, type OrderTab } from '@/server/orders';

export const metadata: Metadata = { title: 'Đơn hàng của tôi' };

type Props = { searchParams: Promise<{ 'trang-thai'?: string }> };

/** OrdersLayout: AccountSidebar + OrderTabs + danh sách OrderCard (dữ liệu thật). */
export default async function OrdersPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập
  const raw = (await searchParams)['trang-thai'];
  const tab: OrderTab = raw && raw in ORDER_TABS ? (raw as OrderTab) : 'tat-ca';
  const orders = listOrdersForUser(user, tab);
  const counts = countOrdersByTab(user);

  return (
    <div className="vx-acctpage">
      <div className="vx-crumb">
        <Link href="/">Trang chủ</Link>/<Link href="/tai-khoan">Tài khoản</Link>/<span>Đơn hàng của tôi</span>
      </div>
      <div className="vx-acctgrid">
        <AccountSidebar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="vx-otools"><h2>Đơn hàng của tôi</h2></div>
          <div>
            <nav className="vx-otabs">
              {(Object.keys(ORDER_TABS) as OrderTab[]).map((k) => (
                <Link key={k} href={k === 'tat-ca' ? '/tai-khoan/don-hang' : `/tai-khoan/don-hang?trang-thai=${k}`} aria-current={tab === k ? 'true' : undefined}>
                  {ORDER_TABS[k].label}
                  {k !== 'tat-ca' && k !== 'da-giao' && k !== 'da-huy' && counts[k] ? <em>{counts[k]}</em> : null}
                </Link>
              ))}
              <Link href="/tai-khoan/bao-hanh">Trả hàng – Bảo hành</Link>
            </nav>
          </div>
          {orders.length ? (
            orders.map((o) => <OrderCard key={o.id} o={o} />)
          ) : (
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
              <EmptyState
                icon="receipt"
                title={tab === 'tat-ca' ? 'Chưa có đơn hàng nào' : `Không có đơn ${ORDER_TABS[tab].label.toLowerCase()}`}
                text="Đơn hàng của bạn sẽ hiện ở đây để theo dõi giao hàng và bảo hành cây."
                action={<Link className="vx-btn vx-btn--primary" href="/">Mua sắm ngay</Link>}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
