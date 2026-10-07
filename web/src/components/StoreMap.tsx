'use client';

import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { MAP_ATTRIBUTION, MAP_TILES } from '@/lib/geo';

type Point = { id: number; name: string; lat: number; lng: number };

/** Bản đồ Leaflet của trang Hệ thống cửa hàng: ghim mọi cửa hàng, ghim đang chọn tô xanh và bản đồ dời tới đó; bấm ghim để chọn. */
export function StoreMap({ stores, selectedId, me, onSelect }: {
  stores: Point[];
  selectedId: number | null;
  /** Vị trí khách (khi đã cho phép định vị). */
  me?: { lat: number; lng: number } | null;
  onSelect: (id: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<number, Marker>());
  const meMarker = useRef<Marker | null>(null);
  const lib = useRef<typeof import('leaflet') | null>(null);
  const [ready, setReady] = useState(false);
  // Giữ bản mới nhất để các sự kiện của Leaflet (tạo một lần) luôn gọi đúng.
  const pick = useRef(onSelect);
  pick.current = onSelect;

  useEffect(() => {
    let alive = true;
    let ro: ResizeObserver | undefined;
    import('leaflet').then((L) => {
      if (!alive || !box.current) return;
      lib.current = L;
      const first = stores.find((s) => s.id === selectedId) ?? stores[0];
      const m = L.map(box.current, { zoomControl: false, scrollWheelZoom: false }).setView(first ? [first.lat, first.lng] : [10.35, 105.73], 15);
      L.tileLayer(MAP_TILES, { maxZoom: 18, attribution: MAP_ATTRIBUTION }).addTo(m);
      L.control.zoom({ position: 'topright' }).addTo(m);
      for (const s of stores) {
        const mk = L.marker([s.lat, s.lng], {
          icon: L.divIcon({ className: 'app-store-pin', html: '<span><i></i></span>', iconSize: [36, 36], iconAnchor: [18, 43] }),
          title: s.name, alt: s.name,
        }).addTo(m);
        mk.on('click', () => pick.current(s.id));
        markers.current.set(s.id, mk);
      }
      map.current = m;
      ro = new ResizeObserver(() => m.invalidateSize());
      ro.observe(box.current);
      setReady(true);
    });
    return () => {
      alive = false;
      ro?.disconnect();
      map.current?.remove();
      map.current = null;
      markers.current.clear();
      meMarker.current = null;
      setReady(false);
    };
    // Chỉ dựng bản đồ một lần; đổi chọn / vị trí xử lý ở các effect dưới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tô ghim đang chọn và dời bản đồ tới đó.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    for (const [id, mk] of markers.current) {
      mk.getElement()?.classList.toggle('is-sel', id === selectedId);
      mk.setZIndexOffset(id === selectedId ? 1000 : 0);
    }
    const s = stores.find((x) => x.id === selectedId);
    if (s) m.setView([s.lat, s.lng], Math.max(m.getZoom(), 13), { animate: true });
  }, [ready, selectedId, stores]);

  // Chấm xanh vị trí của khách.
  useEffect(() => {
    const m = map.current, L = lib.current;
    if (!ready || !m || !L) return;
    meMarker.current?.remove();
    meMarker.current = null;
    if (me) {
      meMarker.current = L.marker([me.lat, me.lng], {
        icon: L.divIcon({ className: 'app-store-me', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        title: 'Vị trí của bạn', alt: 'Vị trí của bạn', interactive: false,
      }).addTo(m);
    }
  }, [ready, me]);

  return (
    <div className="vx-map app-map">
      <div ref={box} className="app-map__canvas" role="region" aria-label="Bản đồ cửa hàng" />
    </div>
  );
}
