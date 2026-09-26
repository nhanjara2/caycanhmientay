import { AccountGate } from '@/components/AccountGate';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountGate>{children}</AccountGate>;
}
