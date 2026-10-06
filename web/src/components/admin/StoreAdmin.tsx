'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { saveStoreAction } from '@/app/actions/stores';
import type { StoreRow } from '@/server/stores-admin';

type Form = { id?: number; code: string; name: string; address: string; lat: string; lng: string; active: boolean; isDefault: boolean };
const blank: Form = { code: '', name: '', address: '', lat: '', lng: '', active: true, isDefault: false };
const toForm = (s: StoreRow): Form => ({ id: s.id, code: s.code, name: s.name, address: s.address, lat: String(s.lat), lng: String(s.lng), active: s.active, isDefault: s.isDefault });

/** Danh sách cửa hàng + hộp thêm / sửa (tên, địa chỉ, tọa độ dùng tính vùng giao cây sống, mặc định, hoạt động). */
export function StoreAdmin({ stores }: { stores: StoreRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError('');
    const lat = Number(form.lat.replace(',', '.')), lng = Number(form.lng.replace(',', '.'));
    start(async () => {
      const r = await saveStoreAction({ id: form.id, code: form.code, name: form.name, address: form.address, lat, lng, active: form.active, isDefault: form.isDefault })
        .catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setForm(null);
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
            {error && <span className="vx-err" role="alert">{error}</span>}
            <span className="acts" style={{ display: 'flex', gap: 8 }}>
              <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu cửa hàng'}</button>
              <button type="button" className="vx-btn vx-btn--ghost" onClick={() => setForm(null)}>Hủy</button>
            </span>
          </div>
        </form>
      )}
      <div className="ad-card">
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead><tr><th>Cửa hàng</th><th>Địa chỉ</th><th>Tọa độ</th><th className="num">Tồn kho</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b><small>{s.code}{s.isDefault ? ' · Mặc định' : ''}</small></td>
                  <td data-label="Địa chỉ" data-wide>{s.address}</td>
                  <td data-label="Tọa độ">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</td>
                  <td className="num" data-label="Tồn kho">{s.stock.toLocaleString('vi-VN')}</td>
                  <td data-label="Trạng thái"><span className={`ad-pill ${s.active ? 'done' : 'wait'}`}>{s.active ? 'Hoạt động' : 'Ngừng'}</span></td>
                  <td data-label="Thao tác"><button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => { setForm(toForm(s)); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Sửa</button></td>
                </tr>
              ))}
              {!stores.length && <tr><td colSpan={6} style={{ color: 'var(--ink-muted)' }}>Chưa có cửa hàng nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
