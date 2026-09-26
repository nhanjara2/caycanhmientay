import type { Metadata } from 'next';
import { AdminRolesView } from '@/views/AdminRolesView';

export const metadata: Metadata = { title: 'Phân quyền' };

export default function Page() {
  return <AdminRolesView />;
}
