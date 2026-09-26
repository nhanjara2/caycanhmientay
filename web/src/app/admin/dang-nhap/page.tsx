import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { getCurrentUser } from '@/server/auth';

export const metadata: Metadata = { title: 'Đăng nhập quản trị', robots: { index: false } };

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user && user.role !== 'customer') redirect('/admin');
  return <AdminLogin loggedInAsCustomer={Boolean(user)} />;
}
