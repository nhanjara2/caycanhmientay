import type { Metadata } from 'next';
import { FlashSaleView } from '@/views/FlashSaleView';
import { withShare } from '@/lib/seo';

// Trang còn là giao diện mẫu (sản phẩm, giá, đếm ngược là dữ liệu giả) → noindex; làm thật thì bỏ dòng robots.
export const metadata: Metadata = withShare({ title: 'Flash sale giờ vàng', alternates: { canonical: '/flash-sale' }, robots: { index: false, follow: true } });

export default function Page() {
  return <FlashSaleView />;
}
