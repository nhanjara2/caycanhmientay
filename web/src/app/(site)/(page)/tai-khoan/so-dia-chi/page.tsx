import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountSidebar } from '@/components/AccountSidebar';
import { AddressBook } from '@/components/AddressBook';
import { listAddresses } from '@/server/addresses';
import { getCurrentUser } from '@/server/auth';
import { listStores } from '@/server/inventory';

export const metadata: Metadata = { title: 'Sổ địa chỉ' };

export default async function AddressBookPage() {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập
  const items = (await listAddresses(user.id)).map(({ createdAt: _c, userId: _u, ...a }) => a);
  return (
    <div className="vx-acctpage">
      <div className="vx-crumb">
        <Link href="/">Trang chủ</Link>/<Link href="/tai-khoan">Tài khoản</Link>/<span>Sổ địa chỉ nhận hàng</span>
      </div>
      <div className="vx-acctgrid">
        <AccountSidebar />
        <AddressBook items={items} stores={(await listStores()).map(({ id, code, name, lat, lng }) => ({ id, code, name, lat, lng }))} />
      </div>
    </div>
  );
}
