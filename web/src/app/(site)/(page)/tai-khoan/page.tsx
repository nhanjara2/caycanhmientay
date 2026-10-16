import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/Blocks';
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
      <Breadcrumb items={[{ label: 'Tài khoản' }]} />
      <div className="vx-acctgrid">
        <AccountSidebar />
        <ProfileForm initial={{ name: user.name ?? '', email: user.email ?? '', phone: accountPhone(user) ?? '', phoneVerified: Boolean(user.phone), hasGoogle: Boolean(user.googleSub), initials: publicUser(user).initials, avatarUrl: publicUser(user).avatarUrl }} />
      </div>
    </div>
  );
}
