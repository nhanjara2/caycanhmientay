'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createServiceByStaffAction } from '@/app/actions/service-requests';
import { BUDGETS, SERVICE_INFO, SERVICE_TYPES, SOURCE_LABEL, SOURCES, type ServiceSource, type ServiceType } from '@/lib/service-labels';
import { Select } from '@/components/Select';

/** Nhân viên tạo yêu cầu khi khách gọi hotline / nhắn Zalo / đến cửa hàng. Người tạo tự thành người phụ trách. */
export function ServiceRequestNew() {
  const router = useRouter();
  const [v, setV] = useState({
    service: '' as ServiceType | '', source: 'hotline' as Exclude<ServiceSource, 'web'>, name: '', phone: '', address: '', budget: '', area: '', note: '',
  });
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, val: string) => setV((x) => ({ ...x, [k]: val }));

  const submit = () => {
    setError('');
    start(async () => {
      const r = await createServiceByStaffAction({
        service: v.service || undefined, source: v.source, name: v.name, phone: v.phone, address: v.address,
        budget: v.budget || undefined, area: v.area ? Number(v.area) : undefined, note: v.note || undefined,
      }).catch(() => ({ ok: false as const, error: 'Không lưu được, kiểm tra mạng rồi thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      router.push(`/admin/dich-vu/${r.id}`);
    });
  };

  return (
    <form className="ad-card" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
      <div className="ad-card__h">Thông tin yêu cầu</div>
      <div className="ad-card__b app-sr-form">
        <div className="ad-frow two">
          <div className="ad-f">
            <label htmlFor="nr-service">Dịch vụ</label>
            <Select id="nr-service" className="vx-input" value={v.service} onChange={(e) => set('service', e.target.value)}>
              <option value="">Chọn dịch vụ…</option>
              {SERVICE_TYPES.map((s) => <option key={s} value={s}>{SERVICE_INFO[s].label}</option>)}
            </Select>
          </div>
          <div className="ad-f">
            <label htmlFor="nr-source">Khách liên hệ qua</label>
            <Select id="nr-source" className="vx-input" value={v.source} onChange={(e) => set('source', e.target.value)}>
              {SOURCES.filter((s) => s !== 'web').map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
            </Select>
          </div>
        </div>
        <div className="ad-frow two">
          <div className="ad-f">
            <label htmlFor="nr-name">Tên khách</label>
            <input id="nr-name" className="vx-input" value={v.name} maxLength={80} onChange={(e) => set('name', e.target.value)} placeholder="Chị Thu Lan / Cty Minh Phát" />
          </div>
          <div className="ad-f">
            <label htmlFor="nr-phone">Số điện thoại</label>
            <input id="nr-phone" className="vx-input" inputMode="tel" value={v.phone} maxLength={15} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>
        <div className="ad-f">
          <label htmlFor="nr-addr">Địa chỉ</label>
          <input id="nr-addr" className="vx-input" value={v.address} maxLength={200} onChange={(e) => set('address', e.target.value)} placeholder="Số nhà, đường, phường, tỉnh/thành" />
        </div>
        <div className="ad-frow two">
          <div className="ad-f">
            <label htmlFor="nr-budget">Ngân sách</label>
            <Select id="nr-budget" className="vx-input" value={v.budget} onChange={(e) => set('budget', e.target.value)}>
              <option value="">Chưa nói</option>
              {BUDGETS.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </div>
          <div className="ad-f">
            <label htmlFor="nr-area">Diện tích (m²)</label>
            <input id="nr-area" className="vx-input" inputMode="numeric" value={v.area} onChange={(e) => set('area', e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </div>
        </div>
        <div className="ad-f">
          <label htmlFor="nr-note">Nhu cầu / ghi chú</label>
          <textarea id="nr-note" className="vx-input" style={{ minHeight: 80, fontSize: '0.8125rem' }} maxLength={1000} value={v.note} onChange={(e) => set('note', e.target.value)}
            placeholder="Ví dụ: thuê 30 cây văn phòng 2 tầng, muốn khảo sát sáng thứ 7" />
        </div>
        {error && <span className="vx-err" role="alert">{error}</span>}
        <button type="submit" className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Tạo yêu cầu'}</button>
      </div>
    </form>
  );
}
