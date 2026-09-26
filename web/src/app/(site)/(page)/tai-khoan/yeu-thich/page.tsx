import type { Metadata } from 'next';
import { WishlistView } from '@/views/WishlistView';

export const metadata: Metadata = { title: 'Sản phẩm yêu thích' };

export default function Page() {
  return <WishlistView />;
}
