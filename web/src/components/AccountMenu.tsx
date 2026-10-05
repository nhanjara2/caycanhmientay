'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Avatar } from './Avatar';
import { Icon, type IconName } from './Icon';

const ITEMS: { href: string; label: string; icon: IconName; badge?: number }[] = [
  { href: '/tai-khoan', label: 'Thông tin cá nhân', icon: 'user' },
  { href: '/tai-khoan/don-hang', label: 'Đơn hàng của tôi', icon: 'receipt' },
  { href: '/tai-khoan/so-dia-chi', label: 'Sổ địa chỉ nhận hàng', icon: 'pin' },
  { href: '/tai-khoan/vuon-cua-toi', label: 'Vườn của tôi', icon: 'plant' },
  { href: '/tai-khoan/lich-cham-cay', label: 'Lịch chăm cây', icon: 'clock' },
  { href: '/tai-khoan/bao-hanh', label: 'Bảo hành cây', icon: 'shield' },
  { href: '/tai-khoan/yeu-thich', label: 'Sản phẩm yêu thích', icon: 'star' },
];

/** Tên người dùng trên Header; bấm mở menu tài khoản. Chưa đăng nhập thì mở AuthModal. */
export function AccountMenu() {
  const { user, ready, openLogin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!ready || !user) {
    return (
      <button type="button" className="app-hbtn" onClick={openLogin}>
        <Icon name="user" />
        <span className="app-hide-sm">Đăng nhập</span>
      </button>
    );
  }

  return (
    <div className="vx-user" ref={ref}>
      <button type="button" className="app-hbtn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar size="sm" initials={user.initials} url={user.avatarUrl} />
        <span className="app-hide-sm">{user.name}</span>
      </button>
      {open && (
        <div className="vx-dd app-dd">
          <div className="vx-dd__head">
            <Avatar size="sm" initials={user.initials} url={user.avatarUrl} />
            <span><b>{user.name}</b><small>{user.phoneMasked}</small></span>
            <span className="vx-tier" style={{ marginLeft: 'auto' }}>{user.points.toLocaleString('vi-VN')} điểm</span>
          </div>
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href}>
              <Icon name={i.icon} />{i.label}{i.badge ? <em>{i.badge}</em> : null}
            </Link>
          ))}
          {user.role !== 'customer' && <Link href="/admin"><Icon name="gauge" />Trang quản trị</Link>}
          <hr />
          <a style={{ color: 'var(--danger)', cursor: 'pointer' }} onClick={() => { void logout(); setOpen(false); }}>
            <Icon name="close" />Đăng xuất
          </a>
        </div>
      )}
    </div>
  );
}
