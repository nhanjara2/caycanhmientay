import type { Metadata } from 'next';
import { AdminReportsView } from '@/views/AdminReportsView';

export const metadata: Metadata = { title: 'Báo cáo' };

export default function Page() {
  return <AdminReportsView />;
}
