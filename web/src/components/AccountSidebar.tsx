'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Icon, type IconName } from './Icon';

const NAV: { href: string; label: string; icon: IconName; badge?: number }[] = [
  { href: '/tai-khoan', label: 'Thông tin cá nhân', icon: 'user' },
  { href: '/tai-khoan/don-hang', label: 'Đơn hàng của tôi', icon: 'receipt' },
  { href: '/tai-khoan/so-dia-chi', label: 'Sổ địa chỉ nhận hàng', icon: 'pin' },
  { href: '/tai-khoan/vuon-cua-toi', label: 'Vườn của tôi', icon: 'plant' },
  { href: '/tai-khoan/lich-cham-cay', label: 'Lịch chăm cây', icon: 'clock' },
  { href: '/tai-khoan/bao-hanh', label: 'Bảo hành cây', icon: 'shield' },
  { href: '/dich-vu', label: 'Lịch hẹn dịch vụ', icon: 'home' },
  { href: '/khuyen-mai', label: 'Voucher & Điểm thưởng', icon: 'tag' },
  { href: '/tai-khoan/yeu-thich', label: 'Sản phẩm yêu thích', icon: 'star' },
];

/** Cột trái các trang tài khoản: thẻ hồ sơ nền primary-deep + danh sách mục. */
export function AccountSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const current = (href: string) =>
    href === '/tai-khoan' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  // Mobile: thẻ hồ sơ + danh sách mục chỉ hiện ở trang "Tài khoản"; trang con chỉ có nút quay lại (CSS .app-acct-back / data-hub).
  const isHub = pathname === '/tai-khoan';

  return (
    <>
      {!isHub && (
        <Link href="/tai-khoan" className="app-acct-back">
          <Icon name="chevron" />
          Tài khoản
        </Link>
      )}
      <aside className="vx-acct" data-hub={isHub ? '' : undefined}>
        <div className="vx-acct__card">
          <span className="vx-avatar vx-avatar--lg">{user?.initials ?? 'KH'}</span>
          <b style={{ fontSize: 16 }}>{user?.name ?? 'Khách'}</b>
          <small>{user?.phoneMasked ?? 'Chưa đăng nhập'}</small>
          <span className="vx-tier">{user?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</span>
          <div className="vx-acct__points">
            <div><b>{(user?.points ?? 0).toLocaleString('vi-VN')}</b>Điểm thưởng</div>
            <div><b>0</b>Voucher</div>
          </div>
        </div>
        <nav className="vx-acct__nav">
          {NAV.map((n) => (
            <Link key={n.href + n.label} href={n.href} aria-current={current(n.href) ? 'true' : undefined}>
              <Icon name={n.icon} />
              {n.label}
              {n.badge ? <em>{n.badge}</em> : null}
              <Icon name="chevron" className="chev" />
            </Link>
          ))}
          <Link href="/" className="out" onClick={() => void logout()}>
            <Icon name="close" />
            Đăng xuất
          </Link>
        </nav>
      </aside>
    </>
  );
}
