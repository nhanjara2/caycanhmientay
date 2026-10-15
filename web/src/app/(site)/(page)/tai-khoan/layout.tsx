import type { Metadata } from 'next';
import { AccountGate } from '@/components/AccountGate';

// Mọi trang tài khoản là dữ liệu riêng: noindex (trang con chỉ đặt title nên tự kế thừa; robots.txt cũng chặn /tai-khoan).
export const metadata: Metadata = { robots: { index: false } };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountGate>{children}</AccountGate>;
}
