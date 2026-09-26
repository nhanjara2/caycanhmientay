import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountSidebar } from '@/components/AccountSidebar';
import { ProfileForm } from '@/components/ProfileForm';
import { getCurrentUser, publicUser } from '@/server/auth';
import { db, schema } from '@/server/db';

export const metadata: Metadata = { title: 'Thông tin cá nhân' };

/** AccountLayout + ProfileForm (dữ liệu thật). */
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập
  const [row] = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, user.id));

  return (
    <div className="vx-acctpage">
      <div className="vx-crumb">
        <Link href="/">Trang chủ</Link>/<Link href="/tai-khoan">Tài khoản</Link>/<span>Thông tin cá nhân</span>
      </div>
      <div className="vx-acctgrid">
        <AccountSidebar />
        <ProfileForm initial={{ name: user.name ?? '', email: row?.email ?? '', phone: user.phone, initials: publicUser(user).initials }} />
      </div>
    </div>
  );
}
