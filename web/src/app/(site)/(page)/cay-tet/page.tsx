import type { Metadata } from 'next';
import { CampaignView } from '@/views/CampaignView';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';

// Trang còn là giao diện mẫu (sản phẩm, giá, đếm ngược là dữ liệu giả) → noindex; làm thật thì bỏ dòng robots.
export const generateMetadata = (): Promise<Metadata> => withSeo(withShare(
  { title: 'Cây Tết đặt trước', alternates: { canonical: '/cay-tet' }, robots: { index: false, follow: true } },
  { images: ['/videos/mai-vang.jpg'], alt: 'Mai vàng ngày Tết' },
));

export default function Page() {
  return <CampaignView />;
}
