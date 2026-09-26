import type { Metadata } from 'next';
import { AdminServiceRequestsView } from '@/views/AdminServiceRequestsView';

export const metadata: Metadata = { title: 'Yêu cầu dịch vụ' };

export default function Page() {
  return <AdminServiceRequestsView />;
}
