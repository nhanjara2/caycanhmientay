import type { Metadata } from 'next';
import { CampaignView } from '@/views/CampaignView';

// Trang còn là giao diện mẫu (sản phẩm, giá, đếm ngược là dữ liệu giả) → noindex; làm thật thì bỏ dòng robots.
export const metadata: Metadata = { title: 'Cây Tết đặt trước', alternates: { canonical: '/cay-tet' }, robots: { index: false, follow: true } };

export default function Page() {
  return <CampaignView />;
}
