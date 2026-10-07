'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { deleteStoreAction, saveStoreAction } from '@/app/actions/stores';
import { STORE_SERVICE_KEYS, STORE_SERVICES, type StoreService } from '@/lib/stores';
import type { StoreRow } from '@/server/stores-admin';

type Form = {
  id?: number; code: string; name: string; address: string; lat: string; lng: string; active: boolean; isDefault: boolean;
  isPublic: boolean; phone: string; contactName: string; open24h: boolean; openFrom: string; openTo: string; services: StoreService[];
};
const blank: Form = {
  code: '', name: '', address: '', lat: '', lng: '', active: true, isDefault: false,
  isPublic: true, phone: '', contactName: '', open24h: false, openFrom: '', openTo: '', services: [],
};
const toForm = (s: StoreRow): Form => ({
  id: s.id, code: s.code, name: s.name, address: s.address, lat: String(s.lat), lng: String(s.lng), active: s.active, isDefault: s.isDefault,
  isPublic: s.isPublic, phone: s.phone ?? '', contactName: s.contactName ?? '', open24h: s.open24h, openFrom: s.openFrom ?? '', openTo: s.openTo ?? '',
  services: STORE_SERVICE_KEYS.filter((k) => s.services.includes(k)),
});

/** Danh sách cửa hàng + hộp thêm / sửa (tên, địa chỉ, tọa độ, mặc định, hoạt động, và phần hiện cho khách ở trang Hệ thống cửa hàng: điện thoại, giờ mở cửa, dịch vụ). */
export function StoreAdmin({ stores }: { stores: StoreRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [pending, start] = useTransition();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError('');
    const lat = Number(form.lat.replace(',', '.')), lng = Number(form.lng.replace(',', '.'));
    start(async () => {
      const r = await saveStoreAction({
        id: form.id, code: form.code, name: form.name, address: form.address, lat, lng, active: form.active, isDefault: form.isDefault,
        isPublic: form.isPublic, phone: form.phone, contactName: form.contactName, open24h: form.open24h, openFrom: form.openFrom, openTo: form.openTo, services: form.services,
      })
        .catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setForm(null);
      router.refresh();
    });
  };

  const remove = (s: StoreRow) => {
    if (!confirm(`Xóa cửa hàng “${s.name}” (${s.code})?\nKhông thể hoàn tác.`)) return;
    setListError('');
    start(async () => {
      const r = await deleteStoreAction(s.id).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setListError(r.error); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (form?.id === s.id) setForm(null);
      router.refresh();
    });
  };

  return (
    <>
      <div className="ad-title">
        <h1>Cửa hàng</h1>
        <span className="acts"><button type="button" className="vx-btn vx-btn--primary" onClick={() => { setForm(blank); setError(''); }}>+ Thêm cửa hàng</button></span>
      </div>
      {form && (
        <form className="ad-card" onSubmit={submit}>
          <div className="ad-card__h">{form.id ? `Sửa ${form.code}` : 'Thêm cửa hàng'}</div>
          <div className="ad-card__b" style={{ gap: 12 }}>
            <div className="ad-frow">
              <div className="ad-f">
                <label htmlFor="st-code">Mã</label>
                <input id="st-code" className="vx-input" value={form.code} disabled={!!form.id} maxLength={10} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} placeholder="Q7" required />
              </div>
              <div className="ad-f" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="st-name">Tên cửa hàng</label>
                <input id="st-name" className="vx-input" value={form.name} maxLength={80} onChange={(e) => set('name', e.target.value)} placeholder="Vườn ươm Quận 7" required />
              </div>
            </div>
            <div className="ad-f">
              <label htmlFor="st-addr">Địa chỉ</label>
              <input id="st-addr" className="vx-input" value={form.address} maxLength={200} onChange={(e) => set('address', e.target.value)} required />
            </div>
            <div className="ad-frow two">
              <div className="ad-f">
                <label htmlFor="st-lat">Vĩ độ (lat)</label>
                <input id="st-lat" className="vx-input" inputMode="decimal" value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="10.7295" required />
              </div>
              <div className="ad-f">
                <label htmlFor="st-lng">Kinh độ (lng)</label>
                <input id="st-lng" className="vx-input" inputMode="decimal" value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="106.7183" required />
              </div>
            </div>
            <span className="vx-help" style={{ margin: 0 }}>
              Tọa độ chỉ dùng khi bật giới hạn vùng giao cây sống ở Cài đặt giao hàng (mặc định đang giao cây sống toàn quốc). Lấy bằng cách mở Google Maps, bấm chuột phải vào đúng vị trí cửa hàng rồi bấm vào cặp số hiện ra để chép.
              {form.lat && form.lng && !Number.isNaN(Number(form.lat.replace(',', '.'))) && <> <a href={`https://www.google.com/maps?q=${form.lat.replace(',', '.')},${form.lng.replace(',', '.')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Xem trên bản đồ</a></>}
            </span>
            <label className="vx-check"><input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} /> Cửa hàng mặc định (nhận hàng nhập, xuất đơn online trước)</label>
            <label className="vx-check"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Đang hoạt động</label>
            <div className="ad-card__h" style={{ padding: 0, border: 0, marginTop: 8 }}>Hiển thị cho khách (trang Hệ thống cửa hàng)</div>
            <label className="vx-check"><input type="checkbox" checked={form.isPublic} onChange={(e) => set('isPublic', e.target.checked)} /> Hiện cửa hàng này trên trang Hệ thống cửa hàng</label>
            <div className="ad-frow two">
              <div className="ad-f">
                <label htmlFor="st-phone">Điện thoại</label>
                <input id="st-phone" className="vx-input" inputMode="tel" value={form.phone} maxLength={14} onChange={(e) => set('phone', e.target.value)} placeholder="0703005001" />
              </div>
              <div className="ad-f">
                <label htmlFor="st-contact">Người liên hệ (không bắt buộc)</label>
                <input id="st-contact" className="vx-input" value={form.contactName} maxLength={60} onChange={(e) => set('contactName', e.target.value)} placeholder="Lê Hoài Nhân" />
              </div>
            </div>
            <label className="vx-check"><input type="checkbox" checked={form.open24h} onChange={(e) => set('open24h', e.target.checked)} /> Mở cửa 24/24</label>
            {!form.open24h && (
              <div className="ad-frow two">
                <div className="ad-f">
                  <label htmlFor="st-from">Giờ mở cửa</label>
                  <input id="st-from" type="time" className="vx-input" value={form.openFrom} onChange={(e) => set('openFrom', e.target.value)} />
                </div>
                <div className="ad-f">
                  <label htmlFor="st-to">Giờ đóng cửa</label>
                  <input id="st-to" type="time" className="vx-input" value={form.openTo} onChange={(e) => set('openTo', e.target.value)} />
                </div>
              </div>
            )}
            <div className="ad-f">
              <label>Dịch vụ tại cửa hàng</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                {STORE_SERVICE_KEYS.map((k) => (
                  <label key={k} className="vx-check">
                    <input type="checkbox" checked={form.services.includes(k)} onChange={(e) => set('services', e.target.checked ? [...form.services, k] : form.services.filter((x) => x !== k))} /> {STORE_SERVICES[k]}
                  </label>
                ))}
              </div>
            </div>
            {error && <span className="vx-err" role="alert">{error}</span>}
            <span className="acts" style={{ display: 'flex', gap: 8 }}>
              <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu cửa hàng'}</button>
              <button type="button" className="vx-btn vx-btn--ghost" onClick={() => setForm(null)}>Hủy</button>
            </span>
          </div>
        </form>
      )}
      {listError && <div className="vx-err" role="alert" style={{ marginBottom: 12 }}>{listError}</div>}
      <div className="ad-card">
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Cửa hàng</th><th>Địa chỉ</th><th>Tọa độ</th><th className="num">Tồn kho</th><th>Trạng thái</th><th>Hiện trên web</th><th /></tr></thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b><small>{s.code}{s.isDefault ? ' · Mặc định' : ''}</small></td>
                  <td data-label="Địa chỉ" data-wide>{s.address}</td>
                  <td data-label="Tọa độ">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</td>
                  <td className="num" data-label="Tồn kho">{s.stock.toLocaleString('vi-VN')}</td>
                  <td data-label="Trạng thái"><span className={`ad-pill ${s.active ? 'done' : 'wait'}`}>{s.active ? 'Hoạt động' : 'Ngừng'}</span></td>
                  <td data-label="Hiện trên web"><span className={`ad-pill ${s.isPublic ? 'done' : 'wait'}`}>{s.isPublic ? 'Hiện' : 'Ẩn'}</span></td>
                  <td data-label="Thao tác">
                    <span style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => { setForm(toForm(s)); setError(''); setListError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Sửa</button>
                      {!s.isDefault && <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" style={{ color: 'var(--danger)' }} disabled={pending} onClick={() => remove(s)}>Xóa</button>}
                    </span>
                  </td>
                </tr>
              ))}
              {!stores.length && <tr><td colSpan={7} style={{ color: 'var(--ink-muted)' }}>Chưa có cửa hàng nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
