import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RefundConfirm, WarrantyDecision } from '@/components/admin/WarrantyDecision';
import { Art, type IconName } from '@/components/Icon';
import { money } from '@/lib/format';
import { fmtDateTime, PAY_LABEL } from '@/lib/order-labels';
import { REFUND_STATUS_LABEL, WARRANTY_RESOLUTION_LABEL, WARRANTY_STATUS_LABEL } from '@/lib/warranty-labels';
import { requireStaff } from '@/server/auth';
import { getWarranty, warrantyCode } from '@/server/warranty';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Bảo hành ${warrantyCode(Number((await params).id) || 0)}` };
}

/** AdminWarranty: ảnh khách gửi, mô tả, thông tin đơn, quyết định của kỹ sư. */
export default async function AdminWarrantyPage({ params }: Props) {
  const staff = await requireStaff();
  const id = Number((await params).id);
  const r = Number.isInteger(id) && id > 0 ? getWarranty(id) : undefined;
  if (!r) notFound();
  const w = r.w;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Yêu cầu bảo hành {r.code}</h1>
        <span className={`ad-pill ${w.status === 'pending' ? 'new' : w.status === 'approved' ? 'done' : 'cancel'}`}>{WARRANTY_STATUS_LABEL[w.status]}</span>
        <span className="acts"><Link href="/admin/bao-hanh" className="vx-btn vx-btn--outline">← Danh sách</Link></span>
      </div>
      <div className="ad-grid2">
        <div className="ad-fcol">
          <div className="ad-card">
            <div className="ad-card__h">Ảnh khách gửi ({r.photos.length})</div>
            <div className="ad-card__b">
              <div className="ad-cmp">
                {r.photos.map((f, i) => (
                  <a key={f} className="ad-cmp__col" href={`/api/uploads/${f}`} target="_blank" rel="noreferrer">
                    <b>Ảnh {i + 1}</b>
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh riêng tư, phục vụ qua route có kiểm tra quyền */}
                    <img className="ad-cmp__img" src={`/api/uploads/${f}`} alt={`Ảnh ${i + 1} của yêu cầu ${r.code}`} style={{ objectFit: 'cover', width: '100%' }} />
                  </a>
                ))}
              </div>
              <div className="ad-kv">
                <span>Triệu chứng</span><span>{w.symptoms.join(', ')}</span>
                {w.description && <><span>Khách mô tả</span><span>{w.description}</span></>}
                {w.placement && <><span>Vị trí đặt</span><span>{w.placement}</span></>}
                {w.watering && <><span>Tưới</span><span>{w.watering}</span></>}
              </div>
            </div>
          </div>
          {w.status === 'pending' ? (
            <WarrantyDecision id={w.id} itemQty={r.itemQty} itemPrice={r.itemPrice} />
          ) : (
            <div className="ad-card">
              <div className="ad-card__h">Kết quả</div>
              <div className="ad-card__b">
                <div className="ad-kv">
                  <span>Hướng xử lý</span><span><b>{w.resolution ? WARRANTY_RESOLUTION_LABEL[w.resolution] : '—'}</b></span>
                  {w.cause && <><span>Nguyên nhân</span><span>{w.cause}</span></>}
                  {w.engineerNote && <><span>Ghi chú</span><span>{w.engineerNote}</span></>}
                  <span>Người duyệt</span><span>{w.decidedBy} · {w.decidedAt ? fmtDateTime(w.decidedAt) : ''}</span>
                  {r.replacementCode && <><span>{w.resolution === 'replace' ? 'Đơn đổi cây' : 'Đơn tặng vật tư'}</span><span><Link href={`/admin/don-hang/${r.replacementCode}`} style={{ color: 'var(--primary)' }}>{r.replacementCode}</Link> · 0đ</span></>}
                  {w.refundAmount != null && w.refundStatus && (
                    <>
                      <span>Hoàn tiền</span>
                      <span>
                        <b>{money(w.refundAmount)}</b> · <span className={`ad-pill ${w.refundStatus === 'done' ? 'done' : 'new'}`}>{REFUND_STATUS_LABEL[w.refundStatus]}</span>
                        {w.refundStatus === 'done' && <small style={{ display: 'block', color: 'var(--ink-muted)' }}>Mã GD {w.refundRef} · {w.refundedBy} · {w.refundedAt ? fmtDateTime(w.refundedAt) : ''}</small>}
                      </span>
                    </>
                  )}
                </div>
                {w.refundStatus === 'pending' && w.refundAmount != null && (
                  staff.role === 'admin'
                    ? <RefundConfirm id={w.id} amount={w.refundAmount} method={PAY_LABEL[r.paymentMethod]} />
                    : <p className="vx-help" style={{ marginTop: 12 }}>Chờ quản lý chuyển tiền và xác nhận.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="ad-fcol">
          <div className="ad-card">
            <div className="ad-card__h">Đơn hàng<Link href={`/admin/don-hang/${r.orderCode}`}>{r.orderCode}</Link></div>
            <div className="ad-card__b">
              <div className="ad-prod">
                <span className="ad-thumb"><Art name={r.itemIcon as IconName} /></span>
                <span>{r.itemName}<small style={{ display: 'block', color: 'var(--ink-muted)', fontSize: 11 }}>{r.itemLabel} · {money(r.itemPrice)}</small></span>
              </div>
              <div className="ad-kv">
                <span>Khách hàng</span><span>{r.customer ?? 'Khách hàng'} · <a href={`tel:${r.customerPhone}`} style={{ color: 'var(--primary)' }}>{r.customerPhone}</a></span>
                <span>Gửi lúc</span><span>{fmtDateTime(w.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
