import type { Metadata } from 'next';
import { AdminPurchasingView } from '@/views/AdminPurchasingView';

export const metadata: Metadata = { title: 'Nhập hàng' };

export default function Page() {
  return <AdminPurchasingView />;
}
