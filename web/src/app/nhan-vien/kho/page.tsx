import type { Metadata } from 'next';
import { requireStaff } from '@/server/auth';
import { StaffWarehouseView } from '@/views/StaffWarehouseView';

export const metadata: Metadata = { title: 'Kho' };

export default async function Page() {
  await requireStaff();
  return <StaffWarehouseView />;
}
