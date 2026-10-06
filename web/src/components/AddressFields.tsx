'use client';

import { useRef, useState } from 'react';
import { locateMe, reverseGeocode } from '@/lib/geo';
import type { StorePoint } from '@/lib/stock';
import { OTHER_PROVINCE, PROVINCES, splitArea, type AddrParts } from '@/lib/vn-provinces';
import { Icon } from './Icon';
import { MapPicker } from './MapPicker';

/** Địa chỉ đang nhập: các phần chữ + vị trí ghim bản đồ (nếu khách chọn bằng định vị / bản đồ). */
export type AddrValue = AddrParts & { lat: number | null; lng: number | null };

export const EMPTY_ADDR: AddrValue = { street: '', ward: '', province: '', other: '', lat: null, lng: null };

/** Từ địa chỉ đã lưu (street + "Phường, Tỉnh/Thành") sang các ô nhập. */
export const addrFrom = (a: { street: string; area: string; lat: number | null; lng: number | null }): AddrValue =>
  ({ street: a.street, ...splitArea(a.area), lat: a.lat, lng: a.lng });

/**
 * Nhập / chọn địa chỉ cho mọi lứa tuổi: chữ to, mỗi ô một việc, có 2 nút "chọn" (vị trí hiện tại, bản đồ) và 3 ô để tự gõ
 * (số nhà + đường → phường / xã → tỉnh / thành chọn trong danh sách). Dùng ở sổ địa chỉ, thanh toán và hộp "Giao đến".
 */
export function AddressFields({ value, onChange, stores, idPrefix = 'af' }: { value: AddrValue; onChange: (v: AddrValue) => void; stores?: StorePoint[]; idPrefix?: string }) {
  const [mapOpen, setMapOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  // Các hàm async bên dưới chờ mạng rồi mới điền: luôn điền lên giá trị mới nhất, không đè lên chữ khách vừa gõ.
  const latest = useRef(value);
  latest.current = value;

  const set = <K extends keyof AddrValue>(k: K, v: AddrValue[K]) => onChange({ ...value, [k]: v });

  const fill = (place: { lat: number; lng: number; street: string; area: string } | null, at: { lat: number; lng: number }) => {
    const cur = latest.current;
    if (!place) { onChange({ ...cur, lat: at.lat, lng: at.lng }); return false; }
    const a = splitArea(place.area);
    onChange({
      ...cur, lat: at.lat, lng: at.lng,
      street: place.street || cur.street,
      ward: a.ward || cur.ward,
      province: a.province || cur.province,
      other: a.province ? a.other : cur.other,
    });
    return true;
  };

  const useMyLocation = async () => {
    setBusy(true);
    setMsg('');
    try {
      const at = await locateMe();
      const g = await reverseGeocode(at.lat, at.lng).catch(() => null);
      setMsg(fill(g ? { ...at, ...g } : null, at)
        ? 'Đã điền địa chỉ theo vị trí của bạn. Bạn kiểm tra lại số nhà và sửa nếu cần nhé.'
        : 'Đã lấy được vị trí của bạn nhưng chưa biết tên đường. Bạn gõ thêm địa chỉ ở các ô bên dưới nhé.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Chưa lấy được vị trí.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-big">
      <div className="app-big__pick">
        <button type="button" className="app-bigbtn" onClick={useMyLocation} disabled={busy}>
          <Icon name="pin" size={22} />{busy ? 'Đang lấy vị trí…' : 'Dùng vị trí hiện tại của tôi'}
        </button>
        <button type="button" className="app-bigbtn app-bigbtn--alt" onClick={() => setMapOpen(true)}>
          <Icon name="search" size={22} />Chọn trên bản đồ
        </button>
      </div>
      {msg && <p className="app-big__msg" role="status">{msg}</p>}
      {value.lat != null && <span className="vx-badge vx-badge--success" style={{ alignSelf: 'flex-start' }}>Đã ghim vị trí trên bản đồ</span>}
      <p className="app-big__or"><span>hoặc tự nhập địa chỉ</span></p>

      <div className="app-big__f">
        <label htmlFor={`${idPrefix}-street`}>1. Số nhà, tên đường</label>
        <input id={`${idPrefix}-street`} value={value.street} onChange={(e) => set('street', e.target.value)} placeholder="Ví dụ: 25 Nguyễn Huệ, hẻm 3" autoComplete="street-address" />
      </div>
      <div className="app-big__f">
        <label htmlFor={`${idPrefix}-ward`}>2. Phường / Xã</label>
        <input id={`${idPrefix}-ward`} value={value.ward} onChange={(e) => set('ward', e.target.value)} placeholder="Ví dụ: Phường Tân Phong" />
      </div>
      <div className="app-big__f">
        <label htmlFor={`${idPrefix}-prov`}>3. Tỉnh / Thành phố</label>
        <select id={`${idPrefix}-prov`} value={value.province} onChange={(e) => set('province', e.target.value)}>
          <option value="">— Bấm để chọn —</option>
          {PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          <option value={OTHER_PROVINCE}>Nơi khác (tôi tự gõ tên)</option>
        </select>
      </div>
      {value.province === OTHER_PROVINCE && (
        <div className="app-big__f">
          <label htmlFor={`${idPrefix}-other`}>Tên tỉnh / thành phố</label>
          <input id={`${idPrefix}-other`} value={value.other} onChange={(e) => set('other', e.target.value)} placeholder="Gõ tên tỉnh / thành phố" />
        </div>
      )}

      {mapOpen && (
        <MapPicker
          initial={value.lat != null && value.lng != null ? { lat: value.lat, lng: value.lng } : null}
          stores={stores}
          onClose={() => setMapOpen(false)}
          onPick={(p) => {
            setMapOpen(false);
            setMsg(fill(p.street || p.area ? p : null, p)
              ? 'Đã điền địa chỉ theo vị trí bạn chọn. Bạn kiểm tra lại số nhà và sửa nếu cần nhé.'
              : 'Đã ghim vị trí. Bạn gõ thêm địa chỉ ở các ô bên dưới nhé.');
          }}
        />
      )}
    </div>
  );
}
