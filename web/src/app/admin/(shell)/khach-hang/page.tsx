import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { money } from '@/lib/format';
import { customerInitials, customerTier } from '@/lib/customer-labels';
import { fmtDate } from '@/lib/order-labels';
import { PARTNER_INFO, PARTNER_STATUSES } from '@/lib/partners';
import { maskPhone, requireAccess } from '@/server/auth';
import { listCustomers } from '@/server/customers';

export const metadata: Metadata = { title: 'Khách hàng & đối tác' };

type Props = { searchParams: Promise<{ q?: string; doi_tac?: string }> };

const TABS: [string, string][] = [['', 'Tất cả'], ['pending', 'Đối tác chờ duyệt'], ['approved', 'Đối tác đã duyệt']];

/** AdminCustomers: tìm kiếm + bảng khách hàng (dữ liệu thật: đơn, chi tiêu, điểm từ database). */
export default async function AdminCustomersPage({ searchParams }: Props) {
  await requireAccess('customers');
  const sp = await searchParams;
  const q = sp.q?.slice(0, 60);
  const partner = PARTNER_STATUSES.find((x) => x === sp.doi_tac);
  const customers = await listCustomers({ q, partner });
  const tabHref = (k: string) => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (k) u.set('doi_tac', k);
    return `/admin/khach-hang${u.size ? `?${u}` : ''}`;
  };

  return (
    <div className="ad-body">
      <div className="ad-title"><h1>Khách hàng &amp; đối tác</h1></div>
      <div className="ad-card">
        <div className="ad-stabs">
          {TABS.map(([k, label]) => (
            <Link key={k} href={tabHref(k)} aria-current={(partner ?? '') === k ? 'true' : undefined}>{label}</Link>
          ))}
        </div>
        <form className="ad-filters" action="/admin/khach-hang">
          {partner && <input type="hidden" name="doi_tac" value={partner} />}
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input className="app-bare" name="q" defaultValue={q} placeholder="Tên, SĐT, email, tên đơn vị" aria-label="Tìm khách hàng" />
          </label>
          <button className="vx-btn vx-btn--outline vx-btn--sm">Tìm</button>
          {q && <Link href={partner ? `/admin/khach-hang?doi_tac=${partner}` : '/admin/khach-hang'} className="vx-btn vx-btn--ghost vx-btn--sm">Xóa tìm kiếm</Link>}
        </form>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr>
                <th>Khách hàng</th><th>Đối tác</th><th>Hạng</th><th className="num">Đơn</th><th className="num">Chi tiêu</th><th className="num">Điểm</th><th>Tham gia</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const tier = customerTier(c.spend);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/khach-hang/${c.id}`} className="ad-prod" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <span className="vx-avatar vx-avatar--sm">{customerInitials(c.name)}</span>
                        <span>{c.name ?? 'Chưa đặt tên'}<small>{c.phone ?? c.contactPhone ? maskPhone((c.phone ?? c.contactPhone)!) : c.email ?? '—'}</small></span>
                      </Link>
                    </td>
                    <td data-label="Đối tác">
                      {c.partnerType ? (
                        <span className={`vx-badge ${c.partnerStatus === 'approved' ? 'vx-badge--success' : 'vx-badge--sun'}`}>
                          {PARTNER_INFO[c.partnerType].short} · {c.partnerStatus === 'approved' ? (c.partnerDiscount ? `-${c.partnerDiscount}%` : 'Đã duyệt') : 'Chờ duyệt'}
                        </span>
                      ) : '—'}
                      {c.company && <small style={{ display: 'block', color: 'var(--ink-muted)' }}>{c.company}</small>}
                    </td>
                    <td data-label="Hạng"><span className="vx-tier" style={tier.gold ? undefined : { background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}>{tier.label}</span></td>
                    <td className="num" data-label="Đơn">{c.orderCount}</td>
                    <td className="num" data-label="Chi tiêu"><b>{money(c.spend)}</b></td>
                    <td className="num" data-label="Điểm">{c.points}</td>
                    <td data-label="Tham gia">{fmtDate(c.createdAt)}</td>
                  </tr>
                );
              })}
              {!customers.length && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Không có {partner ? 'đối tác' : 'khách'} nào{q ? ` khớp “${q}”` : ''}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>Hiển thị {customers.length} khách</span></div>
      </div>
    </div>
  );
}
