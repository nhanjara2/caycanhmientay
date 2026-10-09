'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { setPartnerAction } from '@/app/actions/partners';
import { Select } from '@/components/Select';
import { MAX_PARTNER_DISCOUNT, PARTNER_INFO, PARTNER_STATUS_LABEL, PARTNER_TYPES, type PartnerStatus, type PartnerType } from '@/lib/partners';

type Value = { type: PartnerType | null; status: PartnerStatus | null; discount: number; company: string; taxCode: string; area: string };

/** Khung "Đối tác sỉ" ở chi tiết khách hàng: duyệt đăng ký, đặt chiết khấu riêng, sửa thông tin đơn vị, gỡ đối tác. */
export function PartnerAdmin({ userId, initial, canEdit, since }: { userId: number; initial: Value; canEdit: boolean; since: string | null }) {
  const router = useRouter();
  const [v, setV] = useState({ ...initial, discount: String(initial.discount) });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => { setV((x) => ({ ...x, [k]: val })); setMsg(null); };

  const save = (over?: Partial<typeof v>) => {
    const next = { ...v, ...over };
    start(async () => {
      const r = await setPartnerAction({
        userId, type: next.type, status: next.status ?? 'approved', discount: Number(next.discount || 0),
        company: next.company, taxCode: next.taxCode, area: next.area,
      }).catch(() => ({ ok: false as const, error: 'Không lưu được, thử lại' }));
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
      setV(next);
      setMsg({ ok: true, text: next.type ? `Đã lưu · ${PARTNER_STATUS_LABEL[next.status ?? 'approved']}` : 'Đã gỡ khỏi danh sách đối tác' });
      router.refresh();
    });
  };

  const pendingApproval = v.status === 'pending';
  return (
    <div className="ad-card">
      <div className="ad-card__h">
        Đối tác sỉ
        {v.type && v.status && <span className={`vx-badge ${v.status === 'approved' ? 'vx-badge--success' : 'vx-badge--sun'}`} style={{ marginLeft: 8 }}>{PARTNER_STATUS_LABEL[v.status]}</span>}
      </div>
      <div className="ad-card__b app-sr-form">
        {!v.type && !canEdit && <span className="hint">Khách thường (chưa đăng ký đối tác).</span>}
        {pendingApproval && <span className="hint">Khách tự đăng ký{since ? ` lúc ${since}` : ''} — gọi xác nhận rồi bấm Duyệt.</span>}
        <div className="ad-frow two">
          <div className="ad-f">
            <label htmlFor="pa-type">Loại đối tác</label>
            <Select id="pa-type" className="vx-input" value={v.type ?? ''} disabled={!canEdit}
              onChange={(e) => set('type', (e.target.value || null) as PartnerType | null)}>
              <option value="">Không phải đối tác</option>
              {PARTNER_TYPES.map((t) => <option key={t} value={t}>{PARTNER_INFO[t].label}</option>)}
            </Select>
          </div>
          <div className="ad-f">
            <label htmlFor="pa-disc">Chiết khấu riêng (% tiền hàng)</label>
            <input id="pa-disc" className="vx-input" inputMode="numeric" value={v.discount} disabled={!canEdit || !v.type}
              onChange={(e) => set('discount', e.target.value.replace(/\D/g, '').slice(0, 2))} />
            <span className="hint">0–{MAX_PARTNER_DISCOUNT}%. Chỉ áp dụng khi đã duyệt; tự trừ khi khách đăng nhập và đặt trên web.</span>
          </div>
        </div>
        <div className="ad-frow two">
          <div className="ad-f">
            <label htmlFor="pa-co">Tên đơn vị</label>
            <input id="pa-co" className="vx-input" value={v.company} maxLength={120} disabled={!canEdit} onChange={(e) => set('company', e.target.value)} />
          </div>
          <div className="ad-f">
            <label htmlFor="pa-tax">Mã số thuế</label>
            <input id="pa-tax" className="vx-input" value={v.taxCode} maxLength={14} disabled={!canEdit} onChange={(e) => set('taxCode', e.target.value.replace(/[^\d-]/g, ''))} />
          </div>
        </div>
        <div className="ad-f">
          <label htmlFor="pa-area">Khu vực hoạt động</label>
          <input id="pa-area" className="vx-input" value={v.area} maxLength={120} disabled={!canEdit} onChange={(e) => set('area', e.target.value)} />
        </div>
        {msg && <span className={msg.ok ? 'vx-help' : 'vx-err'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</span>}
        {canEdit && (
          <div className="vx-row">
            {v.type && pendingApproval && (
              <button type="button" className="vx-btn vx-btn--primary" disabled={pending} onClick={() => save({ status: 'approved' })}>Duyệt đối tác</button>
            )}
            <button type="button" className={`vx-btn ${v.type && pendingApproval ? 'vx-btn--outline' : 'vx-btn--primary'}`} disabled={pending}
              onClick={() => save({ status: v.type ? v.status ?? 'approved' : null })}>
              {pending ? 'Đang lưu…' : v.type && !v.status ? 'Lưu & duyệt' : 'Lưu'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
