import type { Metadata } from 'next';
import { FlashSaleView } from '@/views/FlashSaleView';

export const metadata: Metadata = { title: 'Flash sale giờ vàng', alternates: { canonical: '/flash-sale' } };

export default function Page() {
  return <FlashSaleView />;
}
