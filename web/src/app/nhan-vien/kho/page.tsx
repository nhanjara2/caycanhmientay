import type { Metadata } from 'next';
import { requireAccess } from '@/server/auth';
import { StaffWarehouseView } from '@/views/StaffWarehouseView';

export const metadata: Metadata = { title: 'Kho' };

export default async function Page() {
  await requireAccess('inventory');
  return <StaffWarehouseView />;
}
