import type { Metadata } from 'next';
import { AdminCustomersView } from '@/views/AdminCustomersView';

export const metadata: Metadata = { title: 'Khách hàng' };

export default function Page() {
  return <AdminCustomersView />;
}
