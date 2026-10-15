'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { listAddressesAction } from '@/app/actions/addresses';
import type { AddressDTO } from '@/lib/address-labels';
import { useAuth } from '@/lib/auth';
import { placeFromAddress, useDeliverTo } from '@/lib/deliver-to';
import { money } from '@/lib/format';
import { plantFeeVaries } from '@/lib/pricing';
import { regionOfAddress } from '@/lib/shipping';
import { useShipping } from '@/lib/shipping-client';
import { plantZone, type StorePoint } from '@/lib/stock';
import { addrComplete, composeArea, composeFull } from '@/lib/vn-provinces';
import { AddressFields, EMPTY_ADDR, type AddrValue } from './AddressFields';
import { Icon } from './Icon';

const km1 = (n: number) => n.toFixed(1).replace('.', ',');

/** Vùng giao cây sống của một điểm — chỉ có ý nghĩa khi shop bật giới hạn vùng (mặc định tắt: giao cây sống toàn quốc). */
function useZone(p: { lat: number | null; lng: number | null } | null, stores: StorePoint[]) {
  const { plantZoneKm, plantZoneEnabled } = useShipping();
  if (!plantZoneEnabled) return { enabled: false as const, pinned: false as const, zone: null, plantZoneKm };
  if (!p || p.lat == null || p.lng == null) return { enabled: true as const, pinned: false as const, zone: null, plantZoneKm };
  return { enabled: true as const, pinned: true as const, zone: plantZone({ lat: p.lat, lng: p.lng }, stores, plantZoneKm), plantZoneKm };
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
  const { enabled, pinned, zone } = useZone(a, stores);
  if (!enabled) return null;
  if (!pinned) return <span className="vx-badge vx-badge--outline">Chưa ghim bản đồ</span>;
  if (!zone) return null;
  return zone.inZone
    ? <span className="vx-badge vx-badge--success">Giao được cây sống · {km1(zone.km)} km</span>
    : <span className="vx-badge vx-badge--danger">Ngoài vùng giao cây sống</span>;
}

/** Hộp chọn nơi nhận: địa chỉ trong sổ (đã đăng nhập), hoặc "Địa chỉ khác" — dùng vị trí hiện tại / chọn trên bản đồ / tự nhập. Mở bằng nút "Giao đến". */
export function DeliverToDialog() {
  const { place, stores, open, closePicker, setPlace } = useDeliverTo();
  const { user, openLogin } = useAuth();
  const { enabled, pinned, zone, plantZoneKm } = useZone(place, stores);
  const [list, setList] = useState<AddressDTO[] | null>(null);
  const [typed, setTyped] = useState<AddrValue>(EMPTY_ADDR);
  const loggedIn = Boolean(user);

  useEffect(() => {
    if (!open) return;
    setTyped(EMPTY_ADDR);
    if (!loggedIn) { setList(null); return; }
    setList(null);
    listAddressesAction().then(setList).catch(() => setList([]));
  }, [open, loggedIn]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePicker();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closePicker]);

  if (!open) return null;

  const choose = (a: AddressDTO) => { setPlace(placeFromAddress(a)); closePicker(); };
  const useTyped = () => {
    setPlace({ label: composeArea(typed), detail: composeFull(typed), lat: typed.lat, lng: typed.lng, addressId: null });
    closePicker();
  };

  return (
    <div className="app-modal" role="dialog" aria-modal="true" aria-label="Chọn nơi nhận hàng" onClick={(e) => e.target === e.currentTarget && closePicker()}>
      <div className="vx-modal" style={{ maxWidth: 520, textAlign: 'left' }}>
        <div className="vx-modal__head" style={{ fontSize: '1.25rem' }}>
          Giao hàng đến đâu?
          <button type="button" aria-label="Đóng" onClick={closePicker}><Icon name="close" /></button>
        </div>
        <div className="vx-modal__body" style={{ gap: 18 }}>
          {place && (
            <div className="vx-sel" style={{ borderRadius: 'var(--radius-md)' }}>
              <Icon name="pin" />
              <span>
                <small>Đang chọn</small>
                <b>{place.detail}</b>
              </span>
            </div>
          )}
          {place && enabled && (
            pinned && zone ? (
              zone.inZone
                ? <div className="vx-zone" style={{ padding: 0 }}><Icon name="check" /><span>Trong vùng giao <b>cây sống</b> · cách {zone.store.name} {km1(zone.km)} km</span></div>
                : <div className="vx-zone app-zone--out" style={{ padding: 0 }}><Icon name="alert" /><span>Ngoài vùng giao cây sống ({plantZoneKm} km quanh cửa hàng) · chỉ giao được vật tư, thuốc, phân bón</span></div>
            ) : !pinned ? (
              <div className="vx-zone" style={{ padding: 0 }}><Icon name="alert" /><span>Địa chỉ này chưa ghim bản đồ nên chưa biết có giao cây sống được không.</span></div>
            ) : null
          )}

          {loggedIn && (
            <div>
              <p className="vx-modal__sec" style={{ fontSize: '1.125rem', marginBottom: 10 }}>Chọn địa chỉ đã lưu</p>
              {list === null ? (
                <span className="vx-help">Đang tải sổ địa chỉ…</span>
              ) : list.length ? (
                <div className="app-deliver-list">
                  {list.map((a) => (
                    <button key={a.id} type="button" className="app-deliver-item" aria-pressed={place?.addressId === a.id} onClick={() => choose(a)}>
                      <Icon name="pin" size={22} />
                      <span>
                        <b>{a.street}</b>
                        <small>{a.area}{a.isDefault ? ' · Mặc định' : ''}</small>
                        <ZoneChip a={a} stores={stores} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="vx-help">Bạn chưa lưu địa chỉ nào. Hãy nhập địa chỉ ở bên dưới.</span>
              )}
              <Link href="/tai-khoan/so-dia-chi" className="vx-link" onClick={closePicker} style={{ fontSize: '0.9375rem', marginTop: 8 }}>Quản lý sổ địa chỉ</Link>
            </div>
          )}

          <div>
            <p className="vx-modal__sec" style={{ fontSize: '1.125rem', marginBottom: 10 }}>{loggedIn ? 'Hoặc nhập địa chỉ khác' : 'Nhập địa chỉ nhận hàng'}</p>
            <AddressFields value={typed} onChange={setTyped} stores={stores} idPrefix="dt" />
            <button type="button" className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" style={{ minHeight: 56, fontSize: '1.125rem', marginTop: 16 }} disabled={!addrComplete(typed)} onClick={useTyped}>
              Dùng địa chỉ này
            </button>
          </div>

          {!loggedIn && (
            <span className="vx-help" style={{ fontSize: '0.9375rem' }}>
              Có tài khoản? <button type="button" className="vx-link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer' }} onClick={() => { closePicker(); openLogin(); }}>Đăng nhập</button> để chọn nhanh từ sổ địa chỉ.
            </span>
          )}
          <span className="vx-help" style={{ fontSize: '0.875rem' }}>Chỉ để xem phí giao và khả năng giao hàng. Địa chỉ nhận hàng chính thức bạn chọn ở bước thanh toán.</span>
        </div>
        {place && (
          <div className="vx-modal__foot">
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--block" style={{ fontSize: '1rem' }} onClick={() => { setPlace(null); closePicker(); }}>Bỏ lựa chọn</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Dòng "Giao đến …" ở trang sản phẩm: cây sống báo trong / ngoài vùng giao, vật tư báo phí giao. `bulky` = quy cách đang chọn là cây lớn (có phụ phí giao). */
export function DeliverToNote({ ship, bulky = false }: { ship: 'plant' | 'supply'; bulky?: boolean }) {
  const { place, loaded, stores, openPicker } = useDeliverTo();
  const { rules, regionProvinces } = useShipping();
  const { enabled, pinned, zone, plantZoneKm } = useZone(place, stores);
  let feeText: string;
  if (ship === 'plant') {
    // Cây sống: phí theo tỉnh / thành nhận hàng; chưa biết thì ghi "từ" mức thấp nhất khi các vùng khác phí
    const region = place ? regionOfAddress(place.detail || place.label, regionProvinces) : null;
    const amount = region ? rules.plant.regionFee[region] : rules.plant.fee;
    feeText = `Phí giao ${!region && plantFeeVaries(rules.plant) ? 'từ ' : ''}${money(amount)}, miễn phí đơn từ ${money(rules.plant.freeFrom)}`;
    if (bulky && rules.plant.bulky > 0) feeText += `. Cây lớn tính thêm ${money(rules.plant.bulky)} / cây`;
  } else {
    feeText = `Phí giao ${money(rules.supply.fee)}, miễn phí đơn từ ${money(rules.supply.freeFrom)}`;
  }

  if (!loaded) return <div className="app-deliver-note" style={{ minHeight: 40 }} />;
  if (!place) {
    return (
      <div className="app-deliver-note">
        <Icon name="pin" size={18} />
        <span>
          {ship === 'plant' && enabled ? 'Cây sống chỉ giao trong vùng quanh cửa hàng. ' : 'Xem phí giao tới nơi bạn ở. '}
          <button type="button" className="vx-link" onClick={openPicker}>Chọn địa chỉ nhận hàng</button>
        </span>
      </div>
    );
  }
  const where = <>Giao đến <b>{place.label}</b></>;
  const change = <button type="button" className="vx-link" onClick={openPicker}>Đổi</button>;
  let body: ReactNode;
  let tone = '';
  if (ship === 'supply' || !enabled) {
    body = <>{where} · {ship === 'plant' ? <><b>giao cây sống toàn quốc</b>. </> : null}{feeText}</>;
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
