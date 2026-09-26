import type { Metadata } from 'next';
import { StoreLocatorView } from '@/views/StoreLocatorView';

export const metadata: Metadata = { title: 'Hệ thống cửa hàng' };

export default function Page() {
  return <StoreLocatorView />;
}
