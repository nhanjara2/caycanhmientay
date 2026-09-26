import type { Metadata } from 'next';
import { PromoNewsView } from '@/views/PromoNewsView';

export const metadata: Metadata = { title: 'Tin khuyến mãi' };

export default function Page() {
  return <PromoNewsView />;
}
