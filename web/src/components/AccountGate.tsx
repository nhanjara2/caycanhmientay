'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { EmptyState } from './Blocks';

/** Khu tài khoản: chưa đăng nhập thì mời đăng nhập bằng SĐT + OTP. */
export function AccountGate({ children }: { children: ReactNode }) {
  const { user, ready, openLogin } = useAuth();
  if (!ready) return <div className="vx-acctpage" style={{ minHeight: 480 }} />;
  if (!user) {
    return (
      <div className="vx-acctpage" style={{ alignItems: 'center', padding: '48px 16px' }}>
        <EmptyState
          icon="user"
          title="Đăng nhập để xem tài khoản"
          text="Theo dõi đơn hàng, bảo hành cây, lịch chăm cây và điểm thưởng của bạn."
          action={<button type="button" className="vx-btn vx-btn--primary" onClick={openLogin}>Đăng nhập bằng số điện thoại</button>}
        />
      </div>
    );
  }
  return <>{children}</>;
}
