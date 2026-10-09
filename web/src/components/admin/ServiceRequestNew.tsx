'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createServiceByStaffAction } from '@/app/actions/service-requests';
import { PARTNER_INFO, PARTNER_TYPES, type PartnerType } from '@/lib/partners';
import { SOURCE_LABEL, SOURCES, type ServiceSource } from '@/lib/service-labels';
import { Select } from '@/components/Select';

/** Nhân viên tạo yêu cầu báo giá sỉ khi khách gọi hotline / nhắn Zalo / đến cửa hàng. Người tạo tự thành người phụ trách. */
export function ServiceRequestNew() {
  const router = useRouter();
  const [v, setV] = useState({
    service: '' as PartnerType | '', source: 'hotline' as Exclude<ServiceSource, 'web'>, company: '', name: '', phone: '', address: '', note: '',
  });
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, val: string) => setV((x) => ({ ...x, [k]: val }));

  const submit = () => {
    setError('');
    start(async () => {
      const r = await createServiceByStaffAction({
        service: v.service || undefined, source: v.source, company: v.company || undefined, name: v.name, phone: v.phone, address: v.address, note: v.note || undefined,
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
            <label htmlFor="nr-service">Loại đối tác</label>
            <Select id="nr-service" className="vx-input" value={v.service} onChange={(e) => set('service', e.target.value)}>
              <option value="">Chọn loại đối tác…</option>
              {PARTNER_TYPES.map((s) => <option key={s} value={s}>{PARTNER_INFO[s].label}</option>)}
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
            <label htmlFor="nr-name">Người liên hệ</label>
            <input id="nr-name" className="vx-input" value={v.name} maxLength={80} onChange={(e) => set('name', e.target.value)} placeholder="Chị Thu Lan" />
          </div>
          <div className="ad-f">
            <label htmlFor="nr-phone">Số điện thoại</label>
            <input id="nr-phone" className="vx-input" inputMode="tel" value={v.phone} maxLength={15} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>
        <div className="ad-frow two">
          <div className="ad-f">
            <label htmlFor="nr-co">Tên đơn vị / cửa hàng</label>
            <input id="nr-co" className="vx-input" value={v.company} maxLength={120} onChange={(e) => set('company', e.target.value)} placeholder="Cty Cảnh quan Minh Phát" />
          </div>
          <div className="ad-f">
            <label htmlFor="nr-addr">Nơi giao hàng</label>
            <input id="nr-addr" className="vx-input" value={v.address} maxLength={200} onChange={(e) => set('address', e.target.value)} placeholder="Tỉnh / thành hoặc địa chỉ công trình" />
          </div>
        </div>
        <div className="ad-f">
          <label htmlFor="nr-note">Danh sách hàng / ghi chú</label>
          <textarea id="nr-note" className="vx-input" style={{ minHeight: 80, fontSize: '0.8125rem' }} maxLength={4000} value={v.note} onChange={(e) => set('note', e.target.value)}
            placeholder="Ví dụ: 40 cau vua cao 3m bầu 60cm, 2.000 bầu lá màu, giao Đồng Nai giữa tháng" />
        </div>
        {error && <span className="vx-err" role="alert">{error}</span>}
        <button type="submit" className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Tạo yêu cầu'}</button>
      </div>
    </form>
  );
}
