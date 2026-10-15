import type { Metadata } from 'next';
import { CampaignView } from '@/views/CampaignView';

export const metadata: Metadata = { title: 'Cây Tết đặt trước', alternates: { canonical: '/cay-tet' } };

export default function Page() {
  return <CampaignView />;
}
