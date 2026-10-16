'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ACCOUNT_NAV } from './AccountSidebar';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

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
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      ref.current?.querySelector<HTMLButtonElement>('.app-hbtn')?.focus();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  if (!ready || !user) {
    return (
      <button type="button" className="app-hbtn" onClick={openLogin}>
        <Icon name="user" />
        <span className="app-acc-label">Đăng nhập</span>
      </button>
    );
  }

  return (
    <div className="vx-user" ref={ref}>
      <button type="button" className="app-hbtn" aria-expanded={open} aria-label={`Tài khoản của ${user.name}`} onClick={() => setOpen((o) => !o)}>
        <Avatar size="sm" initials={user.initials} url={user.avatarUrl} />
        <span className="app-hide-sm">{user.name}</span>
        <span className="app-acc-label app-acc-label--sm">Tài khoản</span>
      </button>
      {open && (
        <div className="vx-dd app-dd">
          <div className="vx-dd__head">
            <Avatar size="sm" initials={user.initials} url={user.avatarUrl} />
            <span><b>{user.name}</b><small>{user.phoneMasked}</small></span>
            <span className="vx-tier" style={{ marginLeft: 'auto' }}>{user.points.toLocaleString('vi-VN')} điểm</span>
          </div>
          {ACCOUNT_NAV.map((i) => (
            <Link key={i.href} href={i.href}>
              <Icon name={i.icon} />{i.label}{i.badge ? <em>{i.badge}</em> : null}
            </Link>
          ))}
          {user.role !== 'customer' && <Link href="/admin"><Icon name="gauge" />Trang quản trị</Link>}
          <hr />
          <button type="button" className="app-dd-out" onClick={() => { void logout(); setOpen(false); }}>
            <Icon name="close" />Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
