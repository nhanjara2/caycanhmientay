'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { listAddressesAction } from '@/app/actions/addresses';
import type { AddressDTO } from '@/lib/address-labels';
import { useAuth } from '@/lib/auth';
import { placeFromAddress, useDeliverTo } from '@/lib/deliver-to';
import { money } from '@/lib/format';
import { useShipping } from '@/lib/shipping-client';
import { plantZone, type StorePoint } from '@/lib/stock';
import { Icon } from './Icon';
import { MapPicker } from './MapPicker';

const km1 = (n: number) => n.toFixed(1).replace('.', ',');

/** Vùng giao cây sống của một điểm: null = chưa ghim bản đồ (hoặc chưa tải xong cửa hàng). */
function useZone(p: { lat: number | null; lng: number | null } | null, stores: StorePoint[]) {
  const { plantZoneKm } = useShipping();
  if (!p || p.lat == null || p.lng == null) return { pinned: false as const, zone: null, plantZoneKm };
  return { pinned: true as const, zone: plantZone({ lat: p.lat, lng: p.lng }, stores, plantZoneKm), plantZoneKm };
}

/** Nút "Giao đến" — `header`: viên thuốc ở đầu trang (desktop); `side`: hàng đầu bảng danh mục trên tablet / điện thoại. */
export function DeliverToButton({ variant = 'header' }: { variant?: 'header' | 'side' }) {
  const { place, loaded, openPicker } = useDeliverTo();
  const label = loaded && place ? place.label : 'Chọn địa chỉ';
  const title = loaded && place ? `Giao đến: ${place.detail} — bấm để đổi` : 'Chọn nơi nhận hàng để biết có giao được cây sống không';
  if (variant === 'side') {
    return (
      <button type="button" className="app-loc-side" onClick={openPicker} aria-haspopup="dialog" title={title}>
        <Icon name="pin" size={18} />
        <span><small>Giao đến</small><span className="app-loc__v">{label}</span></span>
        <Icon name="chevron" size={16} />
      </button>
    );
  }
  return (
    <button type="button" className="vx-loc" onClick={openPicker} aria-haspopup="dialog" title={title}>
      <Icon name="pin" size={18} />
      <span>
        <small>Giao đến</small>
        <span className="app-loc__v">{label}</span>
      </span>
    </button>
  );
}

function ZoneChip({ a, stores }: { a: Pick<AddressDTO, 'lat' | 'lng'>; stores: StorePoint[] }) {
  const { pinned, zone } = useZone(a, stores);
  if (!pinned) return <span className="vx-badge vx-badge--outline">Chưa ghim bản đồ</span>;
  if (!zone) return null;
  return zone.inZone
    ? <span className="vx-badge vx-badge--success">Giao được cây sống · {km1(zone.km)} km</span>
    : <span className="vx-badge vx-badge--danger">Ngoài vùng giao cây sống</span>;
}

/** Hộp chọn nơi nhận: địa chỉ trong sổ (đã đăng nhập) hoặc ghim trên bản đồ. Mở bằng nút "Giao đến". */
export function DeliverToDialog() {
  const { place, stores, open, closePicker, setPlace } = useDeliverTo();
  const { user, openLogin } = useAuth();
  const { pinned, zone, plantZoneKm } = useZone(place, stores);
  const [list, setList] = useState<AddressDTO[] | null>(null);
  const [map, setMap] = useState(false);
  const loggedIn = Boolean(user);

  useEffect(() => {
    if (!open) { setMap(false); return; }
    if (!loggedIn) { setList(null); return; }
    setList(null);
    listAddressesAction().then(setList).catch(() => setList([]));
  }, [open, loggedIn]);

  useEffect(() => {
    if (!open || map) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePicker();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, map, closePicker]);

  if (!open) return null;

  const choose = (a: AddressDTO) => { setPlace(placeFromAddress(a)); closePicker(); };

  if (map) {
    return (
      <MapPicker
        initial={place?.lat != null && place.lng != null ? { lat: place.lat, lng: place.lng } : null}
        stores={stores}
        onClose={() => setMap(false)}
        onPick={(p) => {
          setPlace({
            label: p.area || p.street || 'Vị trí đã ghim',
            detail: [p.street, p.area].filter(Boolean).join(', ') || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
            lat: p.lat, lng: p.lng, addressId: null,
          });
          setMap(false);
          closePicker();
        }}
      />
    );
  }

  return (
    <div className="app-modal" role="dialog" aria-modal="true" aria-label="Chọn nơi nhận hàng" onClick={(e) => e.target === e.currentTarget && closePicker()}>
      <div className="vx-modal" style={{ maxWidth: 480, textAlign: 'left' }}>
        <div className="vx-modal__head">
          Giao đến
          <button type="button" aria-label="Đóng" onClick={closePicker}><Icon name="close" /></button>
        </div>
        <div className="vx-modal__body">
          {place && (
            <div className="vx-sel" style={{ borderRadius: 'var(--radius-md)' }}>
              <Icon name="pin" />
              <span>
                <b>{place.label}</b>
                <small>{place.detail}</small>
              </span>
            </div>
          )}
          {place && (
            pinned && zone ? (
              zone.inZone
                ? <div className="vx-zone" style={{ padding: 0 }}><Icon name="check" /><span>Trong vùng giao <b>cây sống</b> · cách {zone.store.name} {km1(zone.km)} km</span></div>
                : <div className="vx-zone app-zone--out" style={{ padding: 0 }}><Icon name="alert" /><span>Ngoài vùng giao cây sống ({plantZoneKm} km quanh cửa hàng) · chỉ giao được vật tư, thuốc, phân bón</span></div>
            ) : !pinned ? (
              <div className="vx-zone" style={{ padding: 0 }}><Icon name="alert" /><span>Địa chỉ này chưa ghim bản đồ nên chưa biết có giao cây sống được không. Hãy ghim trên bản đồ.</span></div>
            ) : null
          )}

          <button type="button" className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" onClick={() => setMap(true)}>
            <Icon name="pin" />{place ? 'Chọn vị trí khác trên bản đồ' : 'Chọn vị trí trên bản đồ'}
          </button>

          {loggedIn ? (
            <>
              <p className="vx-modal__sec">Địa chỉ trong sổ của bạn</p>
              {list === null ? (
                <span className="vx-help">Đang tải sổ địa chỉ…</span>
              ) : list.length ? (
                <div className="app-deliver-list">
                  {list.map((a) => (
                    <button key={a.id} type="button" className="app-deliver-item" aria-pressed={place?.addressId === a.id} onClick={() => choose(a)}>
                      <Icon name="pin" size={18} />
                      <span>
                        <b>{a.street}</b>
                        <small>{a.area}{a.isDefault ? ' · Mặc định' : ''}</small>
                        <ZoneChip a={a} stores={stores} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="vx-help">Bạn chưa có địa chỉ nào trong sổ.</span>
              )}
              <Link href="/tai-khoan/so-dia-chi" className="vx-link" onClick={closePicker} style={{ fontSize: 13 }}>Quản lý sổ địa chỉ</Link>
            </>
          ) : (
            <span className="vx-help">
              Có tài khoản? <button type="button" className="vx-link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer' }} onClick={() => { closePicker(); openLogin(); }}>Đăng nhập</button> để chọn nhanh từ sổ địa chỉ.
            </span>
          )}
          <span className="vx-help">Đây chỉ để xem trước khả năng giao hàng. Địa chỉ nhận hàng chính thức bạn chọn ở bước thanh toán.</span>
        </div>
        {place && (
          <div className="vx-modal__foot">
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--block" onClick={() => { setPlace(null); closePicker(); }}>Bỏ lựa chọn</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Dòng "Giao đến …" ở trang sản phẩm: cây sống báo trong / ngoài vùng giao, vật tư báo phí giao. */
export function DeliverToNote({ ship }: { ship: 'plant' | 'supply' }) {
  const { place, loaded, stores, openPicker } = useDeliverTo();
  const { rules } = useShipping();
  const { pinned, zone, plantZoneKm } = useZone(place, stores);
  const fee = rules[ship];
  const feeText = `Phí giao ${money(fee.fee)}, miễn phí đơn từ ${money(fee.freeFrom)}`;

  if (!loaded) return <div className="app-deliver-note" style={{ minHeight: 40 }} />;
  if (!place) {
    return (
      <div className="app-deliver-note">
        <Icon name="pin" size={18} />
        <span>
          {ship === 'plant' ? 'Cây sống chỉ giao trong vùng quanh cửa hàng. ' : 'Xem phí giao tới nơi bạn ở. '}
          <button type="button" className="vx-link" onClick={openPicker}>Chọn địa chỉ nhận hàng</button>
        </span>
      </div>
    );
  }
  const where = <>Giao đến <b>{place.label}</b></>;
  const change = <button type="button" className="vx-link" onClick={openPicker}>Đổi</button>;
  let body: ReactNode;
  let tone = '';
  if (ship === 'supply') {
    body = <>{where} · {feeText}</>;
  } else if (pinned && zone) {
    if (zone.inZone) body = <>{where} · <b>giao được cây sống</b> (cách {zone.store.name} {km1(zone.km)} km). {feeText}</>;
    else { tone = ' app-deliver-note--out'; body = <>{where} · <b>ngoài vùng giao cây sống</b> ({plantZoneKm} km quanh cửa hàng). Cây sống chưa giao được tới đây; vật tư, thuốc, phân bón vẫn giao bình thường.</>; }
  } else if (pinned) {
    body = <>{where} · đang kiểm tra vùng giao…</>;
  } else {
    body = <>{where} · địa chỉ chưa ghim bản đồ nên chưa biết có giao cây sống được không. {feeText}</>;
  }
  return (
    <div className={`app-deliver-note${tone}`}>
      <Icon name={tone ? 'alert' : 'pin'} size={18} />
      <span>{body} {change}</span>
    </div>
  );
}
