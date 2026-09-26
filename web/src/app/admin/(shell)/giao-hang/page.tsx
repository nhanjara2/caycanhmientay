import type { Metadata } from 'next';
import { AdminDeliveryView } from '@/views/AdminDeliveryView';

export const metadata: Metadata = { title: 'Giao hàng' };

export default function Page() {
  return <AdminDeliveryView />;
}
