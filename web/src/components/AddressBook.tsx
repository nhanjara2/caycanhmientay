'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { deleteAddressAction, saveAddressAction } from '@/app/actions/addresses';
import { CONDITION_LABEL, KIND_LABEL, type AddressDTO, type AddressKind, type DeliveryCondition } from '@/lib/address-labels';
import { useAuth } from '@/lib/auth';
import { plantZone, type StorePoint } from '@/lib/stock';
import { EmptyState } from './Blocks';
import { Icon } from './Icon';
import { MapPicker } from './MapPicker';

const EMPTY: Omit<AddressDTO, 'id'> = { name: '', phone: '', street: '', area: '', kind: 'home', conditions: [], isDefault: false, lat: null, lng: null };

/** Địa chỉ mới: điền sẵn tên + SĐT của tài khoản (người nhận thường là chính khách). */
export function useNewAddress(): Omit<AddressDTO, 'id'> {
  const { user } = useAuth();
  return { ...EMPTY, name: user?.name && user.name !== 'Khách hàng' ? user.name : '', phone: user?.phone ?? '' };
}

/** Nhãn vùng giao theo ghim bản đồ. */
function ZoneBadge({ a, stores }: { a: Pick<AddressDTO, 'lat' | 'lng'>; stores: StorePoint[] }) {
  if (a.lat == null || a.lng == null) return <span className="vx-badge vx-badge--outline">Chưa ghim bản đồ</span>;
  const z = plantZone({ lat: a.lat, lng: a.lng }, stores);
  if (!z) return null;
  return z.inZone
    ? <span className="vx-badge vx-badge--success">Giao được cây sống · {z.km.toFixed(1).replace('.', ',')} km</span>
    : <span className="vx-badge vx-badge--danger">Ngoài vùng giao cây sống</span>;
}

/** AddressBookLayout: danh sách AddressCard + AddressModal thêm/sửa. */
export function AddressBook({ items, stores }: { items: AddressDTO[]; stores: StorePoint[] }) {
  const [editing, setEditing] = useState<AddressDTO | Omit<AddressDTO, 'id'> | null>(null);
  const blank = useNewAddress();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="vx-addr-head">
        <h2>Sổ địa chỉ nhận hàng</h2>
        <button type="button" className="vx-btn vx-btn--primary" onClick={() => setEditing(blank)}>+ Thêm địa chỉ mới</button>
      </div>
      {items.length ? (
        <div className="vx-addrs">
          {items.map((a) => (
            <div key={a.id} className="vx-addr">
              <div className="vx-addr__top">
                <b>{a.name}</b><span className="sep" /><span className="ph">{a.phone}</span>
                {a.isDefault && <span className="vx-badge vx-badge--outline">Mặc định</span>}
                <a style={{ cursor: 'pointer' }} onClick={() => setEditing(a)}>Sửa</a>
              </div>
              <div className="vx-addr__line">{a.street}, {a.area}</div>
              <div className="vx-addr__tags">
                <span className="vx-badge vx-badge--info">{KIND_LABEL[a.kind]}</span>
                {a.conditions.map((c) => <span key={c} className="vx-badge vx-badge--info">{CONDITION_LABEL[c]}</span>)}
                <ZoneBadge a={a} stores={stores} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
          <EmptyState icon="pin" title="Chưa có địa chỉ nào" text="Lưu địa chỉ để đặt hàng nhanh hơn và giúp shop chuẩn bị xe phù hợp khi giao cây lớn." />
        </div>
      )}
      {editing && <AddressModal value={editing} stores={stores} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function AddressModal({ value, stores, onClose, onSaved, onDeleted }: {
  value: AddressDTO | Omit<AddressDTO, 'id'>;
  stores: StorePoint[];
  onClose: () => void;
  /** Lưu xong — kèm id địa chỉ vừa thêm/sửa. */
  onSaved?: (id: number) => void;
  onDeleted?: (id: number) => void;
}) {
  const router = useRouter();
  const id = 'id' in value ? value.id : undefined;
  const [v, setV] = useState(value);
  const [error, setError] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((x) => ({ ...x, [k]: val }));

  useEffect(() => {
    if (mapOpen) return; // Esc lúc này đóng bản đồ trước
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, mapOpen]);

  const done = () => { onClose(); router.refresh(); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const { name, phone, street, area, kind, conditions, isDefault, lat, lng } = v;
    start(async () => {
      const r = await saveAddressAction({ name, phone, street, area, kind, conditions, isDefault, lat, lng }, id).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      done();
      onSaved?.(r.id);
    });
  };

  const remove = () => {
    if (!id || !confirm('Xóa địa chỉ này?')) return;
    start(async () => { await deleteAddressAction(id); done(); onDeleted?.(id); });
  };

  const toggle = (c: DeliveryCondition) => set('conditions', v.conditions.includes(c) ? v.conditions.filter((x) => x !== c) : [...v.conditions, c]);

  return (
    <div className="app-modal" role="dialog" aria-modal="true" aria-label={id ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ'} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="vx-modal" onSubmit={submit}>
        <div className="vx-modal__head">
          {id ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          <button type="button" aria-label="Đóng" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="vx-modal__body">
          <p className="vx-modal__sec">Thông tin người nhận</p>
          <div className="vx-fl"><label htmlFor="ad-name">Họ và tên</label><input id="ad-name" value={v.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></div>
          <div className="vx-fl"><label htmlFor="ad-phone">Số điện thoại</label><input id="ad-phone" inputMode="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" /></div>
          <hr className="vx-divider" />
          <p className="vx-modal__sec">Địa chỉ nhận hàng</p>
          <button type="button" className="vx-btn vx-btn--outline" onClick={() => setMapOpen(true)} style={{ justifyContent: 'center' }}>
            <Icon name="pin" />{v.lat != null ? 'Sửa vị trí trên bản đồ' : 'Chọn vị trí trên bản đồ'}
          </button>
          <div className="vx-addr__tags"><ZoneBadge a={v} stores={stores} /></div>
          <div className="vx-fl"><label htmlFor="ad-area">Phường, Tỉnh/Thành (địa giới hành chính mới)</label><input id="ad-area" value={v.area} onChange={(e) => set('area', e.target.value)} placeholder="Phường Tân Mỹ, TP. Hồ Chí Minh" /></div>
          <div className="vx-fl"><label htmlFor="ad-street">Số nhà, tên đường, tòa nhà</label><input id="ad-street" value={v.street} onChange={(e) => set('street', e.target.value)} autoComplete="street-address" /></div>
          <div className="vx-label-row">
            <span>Loại địa chỉ</span>
            <span className="vx-seg">
              {(Object.keys(KIND_LABEL) as AddressKind[]).map((k) => (
                <button key={k} type="button" className="vx-chip" aria-pressed={v.kind === k} onClick={() => set('kind', k)}>{KIND_LABEL[k]}</button>
              ))}
            </span>
          </div>
          <hr className="vx-divider" />
          <p className="vx-modal__sec">Điều kiện giao cây lớn</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(CONDITION_LABEL) as DeliveryCondition[]).map((c) => (
              <button key={c} type="button" className="vx-chip" aria-pressed={v.conditions.includes(c)} onClick={() => toggle(c)}>{CONDITION_LABEL[c]}</button>
            ))}
          </div>
          <span className="vx-help">Giúp shop chọn xe và số người khiêng phù hợp, tránh giao lại.</span>
          <hr className="vx-divider" />
          <div className="vx-label-row">
            <span>Đặt làm địa chỉ mặc định</span>
            <button type="button" className="vx-switch" role="switch" aria-checked={v.isDefault} aria-label="Đặt làm mặc định" onClick={() => set('isDefault', !v.isDefault)} />
          </div>
          {error && <span className="vx-err" role="alert">{error}</span>}
          {id && <><hr className="vx-divider" /><button type="button" className="vx-danger-link" onClick={remove} disabled={pending}>Xóa địa chỉ</button></>}
        </div>
        <div className="vx-modal__foot">
          <button className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={pending}>{pending ? 'Đang lưu…' : id ? 'Cập nhật' : 'Lưu địa chỉ'}</button>
        </div>
      </form>
      {mapOpen && (
        <MapPicker
          initial={v.lat != null && v.lng != null ? { lat: v.lat, lng: v.lng } : null}
          stores={stores}
          onClose={() => setMapOpen(false)}
          onPick={(p) => {
            setV((x) => ({ ...x, lat: p.lat, lng: p.lng, street: p.street || x.street, area: p.area || x.area }));
            setMapOpen(false);
          }}
        />
      )}
    </div>
  );
}
