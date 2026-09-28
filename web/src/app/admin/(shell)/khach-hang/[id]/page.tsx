import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderPill } from '@/components/admin/OrderPill';
import { CustomerNotes } from '@/components/admin/CustomerNotes';
import { Thumb } from '@/components/Icon';
import { CONDITION_LABEL, fullAddress, KIND_LABEL } from '@/lib/address-labels';
import { customerInitials, customerTier } from '@/lib/customer-labels';
import { money } from '@/lib/format';
import { fmtDate, fmtDateTime } from '@/lib/order-labels';
import { WARRANTY_STATUS_LABEL } from '@/lib/warranty-labels';
import { maskPhone, requireStaff } from '@/server/auth';
import { getCustomerDetail } from '@/server/customers';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  const d = Number.isInteger(id) && id > 0 ? await getCustomerDetail(id) : null;
  return { title: d ? d.user.name ?? 'Khách hàng' : 'Khách hàng' };
}

/** AdminCustomers (chi tiết): hồ sơ, đơn hàng, địa chỉ, bảo hành, ghi chú nội bộ — dữ liệu thật. */
export default async function AdminCustomerDetailPage({ params }: Props) {
  await requireStaff();
  const id = Number((await params).id);
  const d = Number.isInteger(id) && id > 0 ? await getCustomerDetail(id) : null;
  if (!d) notFound();
  const { user, orders, addresses, warranty, spend, interests } = d;
  const tier = customerTier(spend);

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>{user.name ?? 'Chưa đặt tên'}</h1>
        <span className="vx-tier" style={tier.gold ? undefined : { background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}>{tier.label}</span>
        <span className="acts"><Link href="/admin/khach-hang" className="vx-btn vx-btn--outline">← Danh sách</Link></span>
      </div>
      <div className="ad-grid2">
        <div className="ad-fcol">
          <div className="ad-card">
            <div className="ad-card__h">Hồ sơ</div>
            <div className="ad-card__b">
              <div className="ad-prod">
                <span className="vx-avatar">{customerInitials(user.name)}</span>
                <span>{user.name ?? 'Chưa đặt tên'}<small>{user.phone ?? user.contactPhone ? maskPhone((user.phone ?? user.contactPhone)!) : 'Chưa có số điện thoại'}</small></span>
              </div>
              <div className="ad-mini">
                <div><b>{orders.filter((o) => o.kind === 'sale' && o.status !== 'cancelled').length}</b>Đơn</div>
                <div><b>{money(spend)}</b>Chi tiêu</div>
                <div><b>{user.points}</b>Điểm</div>
              </div>
              <div className="ad-kv">
                {(user.phone ?? user.contactPhone) && (
                  <>
                    <span>Điện thoại</span>
                    <span>
                      <a href={`tel:${user.phone ?? user.contactPhone}`} style={{ color: 'var(--primary)' }}>{user.phone ?? user.contactPhone}</a>
                      <small style={{ display: 'block', color: 'var(--ink-muted)' }}>{user.phone ? 'Đã xác thực OTP' : 'Khách tự khai, chưa xác thực'}</small>
                    </span>
                  </>
                )}
                {user.email && <><span>Email</span><span>{user.email}</span></>}
                <span>Tham gia</span><span>{fmtDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
          {interests.length > 0 && (
            <div className="ad-card">
              <div className="ad-card__h">Quan tâm</div>
              <div className="ad-card__b">
                <span className="ad-tags">{interests.map((c) => <span key={c} className="vx-badge vx-badge--info">{c}</span>)}</span>
              </div>
            </div>
          )}
          <CustomerNotes id={user.id} initial={user.notes ?? ''} />
          <div className="ad-card">
            <div className="ad-card__h">Sổ địa chỉ ({addresses.length})</div>
            <div className="ad-card__b">
              {addresses.map((a) => (
                <div key={a.id} className="ad-kv" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
                  <span>{a.name}{a.isDefault && <span className="vx-badge vx-badge--info" style={{ marginLeft: 6 }}>Mặc định</span>}</span>
                  <span>{maskPhone(a.phone)}</span>
                  <span>{KIND_LABEL[a.kind]}</span>
                  <span>{fullAddress(a)}</span>
                  {a.conditions.length > 0 && <><span>Điều kiện giao</span><span>{a.conditions.map((c) => CONDITION_LABEL[c]).join(', ')}</span></>}
                </div>
              ))}
              {!addresses.length && <p className="vx-help">Chưa lưu địa chỉ nào.</p>}
            </div>
          </div>
        </div>
        <div className="ad-fcol">
          <div className="ad-card">
            <div className="ad-card__h">Đơn hàng ({orders.length})</div>
            <div className="ad-tablewrap">
              <table className="ad-table app-mtable">
                <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th className="num">Tổng tiền</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {orders.map((o) => {
                    const first = o.items[0];
                    return (
                      <tr key={o.id}>
                        <td><Link className="code" href={`/admin/don-hang/${o.code}`}>{o.code}</Link>{o.kind === 'warranty' && <span className="vx-badge vx-badge--info" style={{ marginLeft: 6 }}>Bảo hành 0đ</span>}<small>{fmtDateTime(o.createdAt)}</small></td>
                        <td data-label="Sản phẩm" data-wide>
                          {first && (
                            <span className="ad-prod">
                              <span className="ad-thumb"><Thumb src={first.image} icon={first.icon} /></span>
                              <span>{first.name}{o.items.length > 1 ? ` + ${o.items.length - 1} SP` : ''}</span>
                            </span>
                          )}
                        </td>
                        <td className="num" data-label="Tổng tiền"><b>{money(o.total)}</b></td>
                        <td data-label="Trạng thái"><OrderPill status={o.status} /></td>
                      </tr>
                    );
                  })}
                  {!orders.length && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Chưa có đơn hàng nào.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="ad-card">
            <div className="ad-card__h">Bảo hành cây ({warranty.length})</div>
            <div className="ad-card__b">
              {warranty.map((w) => (
                <div key={w.w.id} className="ad-kv" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
                  <span><Link href={`/admin/bao-hanh/${w.w.id}`} className="code">{w.code}</Link></span>
                  <span>{w.itemName} · {WARRANTY_STATUS_LABEL[w.w.status]} · {fmtDate(w.w.createdAt)}</span>
                </div>
              ))}
              {!warranty.length && <p className="vx-help">Chưa có yêu cầu bảo hành nào.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
