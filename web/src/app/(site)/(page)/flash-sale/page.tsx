import type { Metadata } from 'next';
import { FlashSaleView } from '@/views/FlashSaleView';

export const metadata: Metadata = { title: 'Flash sale giờ vàng' };

export default function Page() {
  return <FlashSaleView />;
}
