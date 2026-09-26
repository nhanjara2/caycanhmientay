import type { Metadata } from 'next';
import { ServiceDetailView } from '@/views/ServiceDetailView';

export const metadata: Metadata = { title: 'Cho thuê cây văn phòng' };

export default function Page() {
  return <ServiceDetailView />;
}
