import type { Metadata } from 'next';
import { FlashSaleView } from '@/views/FlashSaleView';

// Trang còn là giao diện mẫu (sản phẩm, giá, đếm ngược là dữ liệu giả) → noindex; làm thật thì bỏ dòng robots.
export const metadata: Metadata = { title: 'Flash sale giờ vàng', alternates: { canonical: '/flash-sale' }, robots: { index: false, follow: true } };

export default function Page() {
  return <FlashSaleView />;
}
