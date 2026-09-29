import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ServiceNoteBox, ServiceRequestPanel } from '@/components/admin/ServiceRequestPanel';
import { money } from '@/lib/format';
import { fmtDateTime } from '@/lib/order-labels';
import { SERVICE_INFO, SOURCE_LABEL, STAGE_LABEL, STAGE_PILL, fmtSlot, serviceCode } from '@/lib/service-labels';
import { requireStaff } from '@/server/auth';
import { getServiceRequest, staffOptions } from '@/server/service-requests';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Yêu cầu dịch vụ ${serviceCode(Number((await params).id) || 0)}` };
}

/** Giờ Việt Nam cho ô datetime-local: "2026-09-29T09:00". */
const toLocalInput = (d: Date | null) => (d ? d.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 16).replace(' ', 'T') : '');

/** Chi tiết yêu cầu dịch vụ: nhu cầu + ảnh hiện trạng, lịch sử liên hệ | khách hàng, khung xử lý. */
export default async function AdminServiceRequestPage({ params }: Props) {
  await requireStaff();
  const id = Number((await params).id);
  const d = Number.isInteger(id) && id > 0 ? await getServiceRequest(id) : undefined;
  if (!d) notFound();
  const r = d.r;
  const staff = await staffOptions();

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Yêu cầu {d.code}</h1>
        <span className={`ad-pill ${STAGE_PILL[r.stage]}`}>{STAGE_LABEL[r.stage]}</span>
        <span className="acts"><Link href="/admin/dich-vu" className="vx-btn vx-btn--outline">← Bảng yêu cầu</Link></span>
      </div>
      <div className="ad-grid2">
        <div className="ad-fcol">
          <div className="ad-card">
            <div className="ad-card__h">Nhu cầu · {SERVICE_INFO[r.service].label}</div>
            <div className="ad-card__b">
              <div className="ad-kv">
                {r.space && <><span>Không gian</span><span>{r.space}</span></>}
                {r.area != null && <><span>Diện tích</span><span>{r.area} m²</span></>}
                {r.sun && <><span>Hướng / nắng</span><span>{r.sun}</span></>}
                {r.styles.length > 0 && <><span>Phong cách</span><span>{r.styles.join(', ')}</span></>}
                <span>Ngân sách</span><span>{r.budget ?? 'Chưa nói'}</span>
                <span>Khách muốn khảo sát</span><span>{r.slotDate ? fmtSlot(r.slotDate, r.slotTime ?? 'am') : 'Chưa chọn — gọi hẹn'}</span>
                {r.note && <><span>Ghi chú của khách</span><span style={{ whiteSpace: 'pre-line' }}>{r.note}</span></>}
              </div>
              {d.photos.length > 0 && (
                <div className="ad-cmp" style={{ marginTop: 12 }}>
                  {d.photos.map((f, i) => (
                    <a key={f} className="ad-cmp__col" href={`/api/service-photos/${f}`} target="_blank" rel="noreferrer">
                      <b>Ảnh hiện trạng {i + 1}</b>
                      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh riêng tư, phục vụ qua route có kiểm tra quyền */}
                      <img className="ad-cmp__img" src={`/api/service-photos/${f}`} alt={`Ảnh hiện trạng ${i + 1} của yêu cầu ${d.code}`} style={{ objectFit: 'cover', width: '100%' }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="ad-card">
            <div className="ad-card__h">Lịch sử liên hệ</div>
            <div className="ad-card__b">
              <ServiceNoteBox id={r.id} contacted={Boolean(r.contactedAt)} />
              <div className="ad-log app-sr-log">
                {d.events.map((e) => (
                  <div key={e.id}><span>{fmtDateTime(e.createdAt)}</span><span><b>{e.actor}</b> · {e.text}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="ad-fcol">
          <div className="ad-card">
            <div className="ad-card__h">
              Khách hàng
              {d.accountId && <Link href={`/admin/khach-hang/${d.accountId}`}>Xem tài khoản</Link>}
            </div>
            <div className="ad-card__b">
              <div className="ad-kv">
                <span>Họ tên</span><span><b>{r.name}</b></span>
                <span>Điện thoại</span><span><a href={`tel:${r.phone}`} style={{ color: 'var(--primary)' }}>{r.phone}</a></span>
                <span>Địa chỉ</span><span>{r.address}</span>
                <span>Nguồn</span><span>{SOURCE_LABEL[r.source]}</span>
                <span>Gửi lúc</span><span>{fmtDateTime(r.createdAt)}</span>
                <span>Gọi lại lần đầu</span><span>{r.contactedAt ? fmtDateTime(r.contactedAt) : <b style={{ color: 'var(--sale)' }}>Chưa gọi</b>}</span>
                {r.surveyAt && <><span>Lịch khảo sát</span><span>{fmtDateTime(r.surveyAt)}{d.assignee ? ` · ${d.assignee}` : ''}</span></>}
                {r.value != null && <><span>Báo giá / hợp đồng</span><span><b>{money(r.value)}</b></span></>}
                {r.stage === 'lost' && r.lostReason && <><span>Lý do thua</span><span>{r.lostReason}</span></>}
              </div>
            </div>
          </div>
          <ServiceRequestPanel
            staff={staff}
            init={{ id: r.id, stage: r.stage, assigneeId: r.assigneeId, surveyAt: toLocalInput(r.surveyAt), value: r.value, lostReason: r.lostReason ?? '' }}
          />
        </div>
      </div>
    </div>
  );
}
