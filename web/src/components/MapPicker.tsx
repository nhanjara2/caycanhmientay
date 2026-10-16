'use client';

import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MAP_ATTRIBUTION, MAP_TILES, reverseGeocode, searchPlace } from '@/lib/geo';
import { useShipping } from '@/lib/shipping-client';
import { useModalFocus } from '@/lib/use-modal';
import { plantZone, type StorePoint } from '@/lib/stock';
import { Icon } from './Icon';

export type PickedPlace = { lat: number; lng: number; street: string; area: string };

// Nền bản đồ (MAP_TILES) và tìm địa chỉ (Photon): xem lib/geo.ts.
const HCM = { lat: 10.7769, lng: 106.7009 };

/** MapPicker: ghim cố định giữa khung, kéo bản đồ để đặt; tìm đường; vị trí của tôi; báo vùng giao cây sống. */
export function MapPicker({ initial, stores = [], onPick, onClose }: {
  initial?: { lat: number; lng: number } | null;
  /** Chỉ cần khi bật giới hạn vùng giao cây sống (để báo trong / ngoài vùng). */
  stores?: StorePoint[];
  onPick: (p: PickedPlace) => void;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const dlg = useRef<HTMLDivElement>(null);
  useModalFocus(dlg, onClose);
  const map = useRef<LeafletMap | null>(null);
  const [center, setCenter] = useState(initial ?? HCM);
  const [place, setPlace] = useState<{ street: string; area: string } | null>(null);
  const [looking, setLooking] = useState(false);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ctrl: AbortController | undefined;

    const reverse = (lat: number, lng: number) => {
      ctrl?.abort();
      ctrl = new AbortController();
      setLooking(true);
      reverseGeocode(lat, lng, ctrl.signal)
        .then((p) => alive && setPlace(p))
        .catch(() => {})
        .finally(() => alive && setLooking(false));
    };

    import('leaflet').then((L) => {
      if (!alive || !box.current) return;
      const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], initial ? 17 : 13);
      L.tileLayer(MAP_TILES, { maxZoom: 18, attribution: MAP_ATTRIBUTION }).addTo(m);
      L.control.zoom({ position: 'topright' }).addTo(m);
      m.on('moveend', () => {
        const c = m.getCenter();
        setCenter({ lat: c.lat, lng: c.lng });
        clearTimeout(timer);
        timer = setTimeout(() => reverse(c.lat, c.lng), 600); // chờ khách thả tay, tránh gọi dồn
      });
      map.current = m;
      if (initial) reverse(initial.lat, initial.lng);
    });
    return () => {
      alive = false;
      clearTimeout(timer);
      ctrl?.abort();
        map.current?.remove();
      map.current = null;
    };
    // Chỉ khởi tạo bản đồ một lần khi mở.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 3) return;
    setMsg('');
    const r = await searchPlace(q, center).catch(() => null);
    if (!r) { setMsg('Không tìm thấy, hãy thử tên đường + phường, hoặc kéo bản đồ'); return; }
    map.current?.setView([r.lat, r.lng], 17);
  };

  const locate = () => {
    if (!navigator.geolocation) { setMsg('Trình duyệt không hỗ trợ định vị'); return; }
    setMsg('');
    navigator.geolocation.getCurrentPosition(
      (p) => map.current?.setView([p.coords.latitude, p.coords.longitude], 18),
      () => setMsg('Chưa được phép lấy vị trí. Hãy bật quyền vị trí hoặc kéo bản đồ.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const { plantZoneKm, plantZoneEnabled } = useShipping();
  const zone = plantZoneEnabled ? plantZone(center, stores, plantZoneKm) : null;

  return (
    <div ref={dlg} tabIndex={-1} className="app-modal app-modal--top" role="dialog" aria-modal="true" aria-label="Chọn vị trí nhận hàng" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="vx-modal" style={{ maxWidth: 640 }}>
        <div className="vx-modal__head">
          Chọn vị trí nhận hàng
          <button type="button" aria-label="Đóng" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="vx-map app-map">
          <div ref={box} className="app-map__canvas" />
          <form className="vx-map__search" onSubmit={search}>
            <label className="vx-input" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="search" size={18} />
              <input className="app-bare" style={{ flex: 1, minWidth: 0 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên đường, tòa nhà… rồi nhấn Enter" aria-label="Tìm địa chỉ" />
            </label>
          </form>
          <div className="vx-map__pin" aria-hidden><span><i /></span></div>
          <span className="vx-map__tip">{msg || 'Kéo bản đồ để đặt ghim đúng cổng nhà'}</span>
          <button type="button" className="vx-map__me" aria-label="Vị trí của tôi" onClick={locate}><Icon name="pin" /></button>
        </div>
        <div className="vx-sel">
          <Icon name="pin" />
          <span>
            <b>{looking ? 'Đang tìm địa chỉ…' : place?.street || 'Vị trí đã ghim'}</b>
            <small>{place?.area || `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`}</small>
          </span>
        </div>
        {zone && (
          zone.inZone ? (
            <div className="vx-zone"><Icon name="check" /><span>Trong vùng giao <b>cây sống</b> · cách {zone.store.name} {zone.km.toFixed(1).replace('.', ',')} km</span></div>
          ) : (
            <div className="vx-zone app-zone--out">
              <Icon name="alert" /><span>Ngoài vùng giao cây sống ({plantZoneKm} km quanh cửa hàng) · chỉ giao được vật tư, thuốc, phân bón</span>
            </div>
          )
        )}
        <div className="vx-modal__foot">
          <button type="button" className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={looking}
            onClick={() => onPick({ lat: center.lat, lng: center.lng, street: place?.street ?? '', area: place?.area ?? '' })}>
            Chọn địa chỉ này
          </button>
        </div>
      </div>
    </div>
  );
}
