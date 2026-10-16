import type { Metadata } from 'next';
import { AccountSidebar } from '@/components/AccountSidebar';
import { Breadcrumb } from '@/components/Blocks';
import { WishlistGrid } from '@/components/WishlistGrid';
import { getCurrentUser } from '@/server/auth';
import { listWishlist } from '@/server/wishlist';

export const metadata: Metadata = { title: 'Yêu thích' };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập
  const products = await listWishlist(user.id);
  return (
    <div className="vx-acctpage">
      <Breadcrumb items={[{ label: 'Tài khoản', href: '/tai-khoan' }, { label: 'Sản phẩm yêu thích' }]} />
      <div className="vx-acctgrid">
        <AccountSidebar />
        <WishlistGrid products={products} />
      </div>
    </div>
  );
}
