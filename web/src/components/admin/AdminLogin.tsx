'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OtpLoginBox } from '@/components/AuthModal';
import { useAuth } from '@/lib/auth';

export function AdminLogin({ loggedInAsCustomer }: { loggedInAsCustomer: boolean }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  return (
    <div className="app-modal" style={{ position: 'static', minHeight: '100vh', background: 'var(--primary-deep)' }}>
      {loggedInAsCustomer ? (
        <div className="au-box">
          <div className="au-head">
            <h2>Tài khoản chưa có quyền quản trị</h2>
            <p>{user?.phoneMasked} đang đăng nhập là khách hàng. Nhờ quản lý cấp quyền, hoặc đăng nhập bằng tài khoản khác.</p>
          </div>
          <div className="au-body">
            <button type="button" className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" onClick={async () => { await logout(); router.refresh(); }}>
              Đăng nhập tài khoản khác
            </button>
            <Link href="/" className="vx-btn vx-btn--ghost vx-btn--block">Về website</Link>
          </div>
        </div>
      ) : (
        <OtpLoginBox
          title="Quản trị Cây Cảnh Miền Tây"
          subtitle="Đăng nhập bằng tài khoản nhân viên"
          googleNext="/admin"
          perks={false}
          onDone={() => { router.push('/admin'); router.refresh(); }}
        />
      )}
    </div>
  );
}
