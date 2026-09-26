import type { Metadata } from 'next';
import { ServicesHubView } from '@/views/ServicesHubView';

export const metadata: Metadata = { title: 'Dịch vụ sân vườn' };

export default function Page() {
  return <ServicesHubView />;
}
