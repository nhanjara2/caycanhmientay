import type { Metadata } from 'next';
import { requireStaff } from '@/server/auth';
import { AdminPOSView } from '@/views/AdminPOSView';

export const metadata: Metadata = { title: 'Bán tại quầy · Admin', robots: { index: false } };

/** POS toàn màn hình, không có menu admin (dùng trên máy tính bảng tại cửa hàng). */
export default async function Page() {
  await requireStaff();
  return <AdminPOSView />;
}
