import type { Metadata } from 'next';
import { requireStaff } from '@/server/auth';
import { StaffDeliveryView } from '@/views/StaffDeliveryView';

export const metadata: Metadata = { title: 'Giao hàng' };

export default async function Page() {
  await requireStaff();
  return <StaffDeliveryView />;
}
