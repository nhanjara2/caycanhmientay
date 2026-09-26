'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { markNotificationsReadAction, notificationsAction } from '@/app/actions/notifications';
import { useAuth } from '@/lib/auth';
import { Icon, type IconName } from './Icon';

type Data = Awaited<ReturnType<typeof notificationsAction>>;
type Kind = Data['items'][number]['kind'];

const TABS: { key: Kind | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'order', label: 'Đơn hàng' },
  { key: 'warranty', label: 'Bảo hành' },
  { key: 'promo', label: 'Khuyến mãi' },
];
const ICON: Record<Kind, { icon: IconName; cls: string }> = {
  order: { icon: 'truck', cls: '' },
  warranty: { icon: 'shield', cls: '' },
  care: { icon: 'drop', cls: 's' },
  promo: { icon: 'tag', cls: 'p' },
};

/** "**đậm**" → <b>. */
const rich = (t: string) => t.split('**').map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>));

function ago(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60_000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  if (m < 24 * 60) return `${Math.floor(m / 60)} giờ trước`;
  if (m < 48 * 60) return 'Hôm qua';
  return new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

/** Chuông thông báo trên Header (NotificationCenter): số chưa đọc, danh sách theo tab, bấm để mở và đánh dấu đã đọc. */
export function NotificationBell() {
  const { user, ready } = useAuth();
  const [data, setData] = useState<Data>({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Kind | 'all'>('all');
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const load = useCallback(() => { notificationsAction().then(setData).catch(() => {}); }, []);

  // Tải khi đăng nhập, khi đổi trang, và mỗi 60 giây khi tab đang mở.
  useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 60_000);
    return () => clearInterval(t);
  }, [user, pathname, load]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('keydown', esc); };
  }, [open]);

  if (!ready || !user) return null;

  const readOne = (id: number) => {
    setData((d) => ({ unread: Math.max(0, d.unread - (d.items.find((i) => i.id === id && !i.read) ? 1 : 0)), items: d.items.map((i) => (i.id === id ? { ...i, read: true } : i)) }));
    void markNotificationsReadAction(id);
  };
  const readAll = () => {
    setData((d) => ({ unread: 0, items: d.items.map((i) => ({ ...i, read: true })) }));
    void markNotificationsReadAction();
  };
  const unreadOf = (k: Kind) => data.items.filter((i) => i.kind === k && !i.read).length;
  const shown = data.items.filter((i) => tab === 'all' || i.kind === tab);

  return (
    <div className="vx-user" ref={ref}>
      <button type="button" className="app-hbtn app-bell" aria-expanded={open} aria-label={`Thông báo${data.unread ? `, ${data.unread} chưa đọc` : ''}`} onClick={() => setOpen((o) => !o)}>
        <Icon name="bell" />
        {data.unread > 0 && <em>{data.unread > 99 ? '99+' : data.unread}</em>}
      </button>
      {open && (
        <div className="nc-drop app-nc" role="dialog" aria-label="Thông báo">
          <div className="nc-h">Thông báo{data.unread > 0 && <a style={{ cursor: 'pointer' }} onClick={readAll}>Đánh dấu đã đọc tất cả</a>}</div>
          <div className="nc-tabs" role="tablist">
            {TABS.map((t) => {
              const n = t.key === 'all' ? 0 : unreadOf(t.key);
              return (
                <a key={t.key} role="tab" style={{ cursor: 'pointer' }} aria-current={tab === t.key ? 'true' : undefined} onClick={() => setTab(t.key)}>
                  {t.label}{n ? ` (${n})` : ''}
                </a>
              );
            })}
          </div>
          <div className="app-nc__list">
            {shown.map((n) => {
              const body = (
                <>
                  <span className={`i ${ICON[n.kind].cls}`}><Icon name={ICON[n.kind].icon} /></span>
                  <span>{rich(n.text)}<small>{ago(n.at)}</small></span>
                  {!n.read ? <span className="dot" /> : <span />}
                </>
              );
              const cls = `nc-item ${n.read ? 'read' : 'unread'}`;
              return n.href
                ? <Link key={n.id} href={n.href} className={cls} style={{ color: 'inherit' }} onClick={() => readOne(n.id)}>{body}</Link>
                : <div key={n.id} className={cls} onClick={() => readOne(n.id)}>{body}</div>;
            })}
            {!shown.length && <p style={{ padding: 32, textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>Chưa có thông báo nào.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
