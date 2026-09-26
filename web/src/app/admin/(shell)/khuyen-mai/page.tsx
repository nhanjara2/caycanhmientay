import type { Metadata } from 'next';
import { AdminPromotionsView } from '@/views/AdminPromotionsView';

export const metadata: Metadata = { title: 'Khuyến mãi' };

export default function Page() {
  return <AdminPromotionsView />;
}
