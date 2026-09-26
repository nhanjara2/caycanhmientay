import type { Metadata } from 'next';
import { AdminReviewsView } from '@/views/AdminReviewsView';

export const metadata: Metadata = { title: 'Hỏi đáp & đánh giá' };

export default function Page() {
  return <AdminReviewsView />;
}
