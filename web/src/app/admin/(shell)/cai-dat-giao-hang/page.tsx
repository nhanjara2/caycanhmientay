import type { Metadata } from 'next';
import { AdminShippingView } from '@/views/AdminShippingView';

export const metadata: Metadata = { title: 'Cài đặt giao hàng' };

export default function Page() {
  return <AdminShippingView />;
}
