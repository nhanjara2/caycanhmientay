import type { Metadata } from 'next';
import { QuoteView } from '@/views/QuoteView';

export const metadata: Metadata = { title: 'Đặt lịch khảo sát & báo giá' };

export default function Page() {
  return <QuoteView />;
}
