import type { Metadata } from 'next';
import { BusinessView } from '@/views/BusinessView';

export const metadata: Metadata = { title: 'Khách doanh nghiệp' };

export default function Page() {
  return <BusinessView />;
}
