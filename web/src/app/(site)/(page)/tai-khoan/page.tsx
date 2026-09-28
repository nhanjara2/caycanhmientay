import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountSidebar } from '@/components/AccountSidebar';
import { ProfileForm } from '@/components/ProfileForm';
import { accountPhone, getCurrentUser, publicUser } from '@/server/auth';

export const metadata: Metadata = { title: 'Thông tin cá nhân' };

/** AccountLayout + ProfileForm (dữ liệu thật). */
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập

  return (
    <div className="vx-acctpage">
      <div className="vx-crumb">
        <Link href="/">Trang chủ</Link>/<Link href="/tai-khoan">Tài khoản</Link>/<span>Thông tin cá nhân</span>
      </div>
      <div className="vx-acctgrid">
        <AccountSidebar />
        <ProfileForm initial={{ name: user.name ?? '', email: user.email ?? '', phone: accountPhone(user) ?? '', phoneVerified: Boolean(user.phone), initials: publicUser(user).initials }} />
      </div>
    </div>
  );
}
