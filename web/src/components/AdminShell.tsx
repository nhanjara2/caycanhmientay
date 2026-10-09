'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/auth';
import { effectiveRole, hasAccess, NAV_AREA, STAFF_ROLE_INFO } from '@/lib/permissions';
import type { PublicUser } from '@/server/auth';

// Icon riêng của menu admin, lấy từ design-system/components/AdminShell/preview.html.
const I = {
  dash: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="4" rx="1" /><rect x="13" y="10" width="7" height="10" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /></>,
  chart: <path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" />,
  wallet: <><path d="M4 7h14a2 2 0 0 1 2 2v9H6a2 2 0 0 1-2-2z" /><path d="M4 7V6a2 2 0 0 1 2-2h10" /><circle cx="16" cy="13.5" r="1.2" /></>,
  box: <><path d="M3 7 12 3l9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></>,
  pos: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  shield: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  service: <><path d="M4 11 12 4l8 7v9H4z" /><path d="M10 20v-5h4v5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14c2.5 0 4.2 1.4 5 4" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></>,
  plant: <><path d="M6 12h12l-1.5 8h-9z" /><path d="M12 12V7" /><path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" /><path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><rect x="3.5" y="4.5" width="3" height="3" rx=".5" /><rect x="3.5" y="10.5" width="3" height="3" rx=".5" /><rect x="3.5" y="16.5" width="3" height="3" rx=".5" /></>,
  stock: <><path d="M6 7h12l1 13H5z" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /></>,
  inbound: <path d="M4 9h16l-1-4H5zM5 9v11h14V9M10 20v-5h4v5" />,
  doc: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h7" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  map: <><path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  building: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" /></>,
  bug: <><rect x="8" y="7" width="8" height="12" rx="4" /><path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1 2M15 4l-1 2" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>,
  logout: <><path d="M9 4H5v16h4" /><path d="m14 8 4 4-4 4M18 12H9" /></>,
};
type Key = keyof typeof I;
const ico = (k: Key) => <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true">{I[k]}</svg>;

export const ADMIN_NAV: { group: string; items: { href: string; label: string; icon: Key }[] }[] = [
  { group: 'TỔNG QUAN', items: [
    { href: '/admin', label: 'Tổng quan', icon: 'dash' },
    { href: '/admin/bao-cao', label: 'Báo cáo', icon: 'chart' },
    { href: '/admin/chi-phi', label: 'Chi phí', icon: 'wallet' },
  ] },
  { group: 'BÁN HÀNG', items: [
    { href: '/admin/don-hang', label: 'Đơn hàng', icon: 'box' },
    { href: '/admin/pos', label: 'Bán tại quầy', icon: 'pos' },
    { href: '/admin/giao-hang', label: 'Giao hàng', icon: 'truck' },
    { href: '/admin/bao-hanh', label: 'Bảo hành cây', icon: 'shield' },
    { href: '/admin/dich-vu', label: 'Yêu cầu báo giá sỉ', icon: 'service' },
    { href: '/admin/khach-hang', label: 'Khách hàng & đối tác', icon: 'users' },
    { href: '/admin/khuyen-mai', label: 'Khuyến mãi', icon: 'tag' },
  ] },
  { group: 'HÀNG HÓA', items: [
    { href: '/admin/san-pham', label: 'Sản phẩm', icon: 'plant' },
    { href: '/admin/danh-muc', label: 'Danh mục & thông số', icon: 'list' },
    { href: '/admin/kho', label: 'Kho & tồn kho', icon: 'stock' },
    { href: '/admin/nhap-hang', label: 'Nhập hàng', icon: 'inbound' },
  ] },
  { group: 'NỘI DUNG', items: [
    { href: '/admin/noi-dung', label: 'Bài viết & video', icon: 'doc' },
    { href: '/admin/benh-cay', label: 'Bệnh cây', icon: 'bug' },
    { href: '/admin/du-an', label: 'Công trình đã cung cấp', icon: 'building' },
    { href: '/admin/danh-gia', label: 'Hỏi đáp & đánh giá', icon: 'chat' },
    { href: '/admin/mau-tin-nhan', label: 'Mẫu tin nhắn', icon: 'bell' },
  ] },
  { group: 'HỆ THỐNG', items: [
    { href: '/admin/cua-hang', label: 'Cửa hàng', icon: 'inbound' },
    { href: '/admin/cai-dat-giao-hang', label: 'Đơn sỉ & giao hàng', icon: 'map' },
    { href: '/admin/phan-quyen', label: 'Phân quyền', icon: 'gear' },
  ] },
];

/**
 * AdminShell: menu trái primary-deep + thanh trên + vùng nội dung trên surface-page.
 * Dưới 1024px menu trái thành bảng trượt, mở bằng nút ☰ trên thanh trên (CSS cuối globals.css).
 */
export function AdminShell({ children, me, badges = {} }: { children: ReactNode; me: PublicUser; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  // Menu mở gắn với trang đang xem: chuyển trang (kể cả nút Quay lại) là tự đóng
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const menu = menuAt === pathname;
  const current = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));
  const close = () => setMenuAt(null);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAt(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu]);

  return (
    <div className="ad app-admin" data-menu={menu ? 'open' : undefined}>
      <div className="app-admin-scrim" onClick={close} />
      <aside id="admin-menu" className="ad-side app-admin-side" aria-label="Menu quản trị">
        <div className="app-admin-brandrow">
          <Link href="/admin" className="ad-brand" onClick={close} style={{ color: 'inherit', textDecoration: 'none', margin: 0, padding: '6px 16px 12px', background: 'none' }}>
            <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: 22, height: 22 }}><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 13 11" /></svg>
            Cây Cảnh Miền Tây<small>ADMIN</small>
          </Link>
          <button type="button" className="app-admin-close" aria-label="Đóng menu" onClick={close}><Icon name="close" /></button>
        </div>
        <div className="ad-store">
          <span><small>Đang xem</small>Tất cả cửa hàng</span>
          <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="m6 9 6 6 6-6" /></svg>
        </div>
        {ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((it) => !NAV_AREA[it.href] || hasAccess(me, NAV_AREA[it.href], 'view')) })).filter((g) => g.items.length).map((g) => (
          <div key={g.group} style={{ display: 'contents' }}>
            <div className="ad-group">{g.group}</div>
            {g.items.map((it) => (
              <Link key={it.href} href={it.href} onClick={close} aria-current={current(it.href) ? 'true' : undefined}>
                {ico(it.icon)}
                {it.label}
                {badges[it.href] ? <em>{badges[it.href]}</em> : null}
              </Link>
            ))}
          </div>
        ))}
        <Link href="/" style={{ marginTop: 'auto' }}>
          <svg className="vx-ico" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6" /></svg>
          Về website
        </Link>
      </aside>
      <div className="ad-main">
        <div className="ad-top">
          <button type="button" className="app-admin-menubtn" aria-label="Mở menu quản trị" aria-expanded={menu} aria-controls="admin-menu" onClick={() => setMenuAt(pathname)}>
            <Icon name="menu" />
          </button>
          <Link href="/admin" className="app-admin-topbrand">
            <Image src="/images/brand/logo-mark.png" alt="" width={362} height={239} />
            Quản trị
          </Link>
          <div className="vx-sfind__search app-admin-search">
            <Icon name="search" />
            <input className="app-bare" placeholder="Tìm đơn, sản phẩm, khách hàng… (Ctrl K)" aria-label="Tìm trong admin" />
          </div>
          <div className="sp">
            <span className="ad-me" title={me.name}>
              <Avatar size="sm" initials={me.initials} url={me.avatarUrl} />
              <span className="app-admin-who">{me.name}<small>{STAFF_ROLE_INFO[effectiveRole(me) ?? 'cskh'].name}</small></span>
            </span>
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm app-admin-logout" aria-label="Đăng xuất" onClick={async () => { await logout(); router.push('/admin/dang-nhap'); }}>
              {ico('logout')}<span>Đăng xuất</span>
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
