import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountSidebar } from '@/components/AccountSidebar';
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
      <div className="vx-crumb">
        <Link href="/">Trang chủ</Link>/<Link href="/tai-khoan">Tài khoản</Link>/<span>Sản phẩm yêu thích</span>
      </div>
      <div className="vx-acctgrid">
        <AccountSidebar />
        <WishlistGrid products={products} />
      </div>
    </div>
  );
}
