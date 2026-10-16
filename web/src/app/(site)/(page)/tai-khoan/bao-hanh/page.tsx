import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountSidebar } from '@/components/AccountSidebar';
import { Breadcrumb, EmptyState } from '@/components/Blocks';
import { Thumb } from '@/components/Icon';
import { WarrantyForm } from '@/components/WarrantyForm';
import { fmtDate } from '@/lib/order-labels';
import { money } from '@/lib/format';
import { REFUND_STATUS_LABEL, WARRANTY_RESOLUTION_LABEL } from '@/lib/warranty-labels';
import { getCurrentUser } from '@/server/auth';
import { eligibleItems, listWarrantyForUser } from '@/server/warranty';

export const metadata: Metadata = { title: 'Bảo hành cây' };

/** WarrantyRequest (form 3 bước) + danh sách yêu cầu đã gửi. */
export default async function WarrantyPage() {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập
  const items = (await eligibleItems(user)).map((i) => ({ itemId: i.itemId, name: i.name, label: i.label, icon: i.icon, image: i.image, code: i.code, daysLeft: i.daysLeft }));
  const requests = await listWarrantyForUser(user.id);

  return (
    <div className="vx-acctpage">
      <Breadcrumb items={[{ label: 'Tài khoản', href: '/tai-khoan' }, { label: 'Bảo hành cây' }]} />
      <div className="vx-acctgrid">
        <AccountSidebar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="gd-head">
            <h2>Bảo hành cây</h2>
            <span className="acts"><Link href="/chinh-sach/bao-hanh-cay" className="vx-btn vx-btn--ghost vx-btn--sm">Chính sách bảo hành</Link></span>
          </div>
          {items.length ? (
            <WarrantyForm items={items} />
          ) : (
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
              <EmptyState
                icon="shield"
                title="Chưa có cây nào trong hạn bảo hành"
                action={<Link className="vx-btn vx-btn--outline" href="/tai-khoan/don-hang">Xem đơn hàng</Link>}
              />
            </div>
          )}

          {requests.length > 0 && (
            <>
              <b style={{ fontSize: '1rem', marginTop: 8 }}>Yêu cầu đã gửi</b>
              {requests.map((r) => (
                <article key={r.w.id} className="vx-order">
                  <div className="vx-order__head">
                    <b>{r.code}</b><span className="dot" /><span>{r.w.createdBy ? 'Shop tạo từ đánh giá của bạn' : 'Gửi'} {fmtDate(r.w.createdAt)}</span><span className="dot" /><span>Đơn {r.orderCode}</span>
                    <span className={`vx-status vx-status--${r.w.status === 'pending' ? 'processing' : r.w.status === 'approved' ? 'done' : 'cancel'}`}>
                      {r.w.status === 'pending' ? 'Kỹ sư đang xem' : r.w.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  </div>
                  <div className="vx-order__body">
                    <div className="vx-oline">
                      <span className="vx-item__img"><Thumb src={r.itemImage} icon={r.itemIcon} /></span>
                      <p>{r.itemName}<small>{r.w.symptoms.join(', ')}</small></p>
                      <span className="pr" />
                      <span className="qt">{r.photos.length} ảnh</span>
                    </div>
                    {r.w.resolution && (
                      <div className="vx-note">
                        <div>
                          <b>Kết quả: {WARRANTY_RESOLUTION_LABEL[r.w.resolution]}</b>
                          {r.w.cause && <> — Nguyên nhân: {r.w.cause}</>}
                          {r.w.engineerNote && <><br />{r.w.engineerNote}</>}
                          {r.replacementCode && (
                            <><br />{r.w.resolution === 'replace' ? 'Cây mới giao theo đơn' : 'Vật tư tặng giao theo đơn'}{' '}
                              <Link href={`/tai-khoan/don-hang/${r.replacementCode}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>#{r.replacementCode}</Link> (0đ)</>
                          )}
                          {r.w.refundAmount != null && r.w.refundStatus && (
                            <><br />Hoàn tiền {money(r.w.refundAmount)}: <b>{REFUND_STATUS_LABEL[r.w.refundStatus]}</b>
                              {r.w.refundStatus === 'pending' && ' — shop sẽ chuyển trong 1–3 ngày làm việc'}</>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
