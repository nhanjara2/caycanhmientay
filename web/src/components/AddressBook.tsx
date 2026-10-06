'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { deleteAddressAction, saveAddressAction } from '@/app/actions/addresses';
import { CONDITION_LABEL, KIND_LABEL, type AddressDTO, type AddressKind, type DeliveryCondition } from '@/lib/address-labels';
import { isPhone } from '@/lib/auth';
import { addrComplete, composeArea } from '@/lib/vn-provinces';
import { useAuth } from '@/lib/auth';
import { useShipping } from '@/lib/shipping-client';
import { plantZone, type StorePoint } from '@/lib/stock';
import { EmptyState } from './Blocks';
import { Icon } from './Icon';
import { AddressFields, addrFrom, type AddrValue } from './AddressFields';

const EMPTY: Omit<AddressDTO, 'id'> = { name: '', phone: '', street: '', area: '', kind: 'home', conditions: [], isDefault: false, lat: null, lng: null };

/** Địa chỉ mới: điền sẵn tên + SĐT của tài khoản (người nhận thường là chính khách). */
export function useNewAddress(): Omit<AddressDTO, 'id'> {
  const { user } = useAuth();
  return { ...EMPTY, name: user?.name && user.name !== 'Khách hàng' ? user.name : '', phone: user?.phone ?? '' };
}

/** Nhãn vùng giao theo ghim bản đồ. */
function ZoneBadge({ a, stores }: { a: Pick<AddressDTO, 'lat' | 'lng'>; stores: StorePoint[] }) {
  const { plantZoneKm, plantZoneEnabled } = useShipping();
  if (!plantZoneEnabled) return a.lat != null ? <span className="vx-badge vx-badge--success">Đã ghim bản đồ</span> : null;
  if (a.lat == null || a.lng == null) return <span className="vx-badge vx-badge--outline">Chưa ghim bản đồ</span>;
  const z = plantZone({ lat: a.lat, lng: a.lng }, stores, plantZoneKm);
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
  /** Cửa hàng để báo vùng giao cây sống trên bản đồ (chỉ dùng khi shop bật giới hạn vùng). */
  stores?: StorePoint[];
  onClose: () => void;
  /** Lưu xong — kèm id địa chỉ vừa thêm/sửa. */
  onSaved?: (id: number) => void;
  onDeleted?: (id: number) => void;
}) {
  const router = useRouter();
  const id = 'id' in value ? value.id : undefined;
  const [v, setV] = useState(value);
  const [addr, setAddr] = useState<AddrValue>(() => addrFrom(value));
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
    const { name, phone, kind, conditions, isDefault } = v;
    // Báo lỗi bằng câu dễ hiểu ngay tại đây (server vẫn kiểm tra lại)
    if (name.trim().length < 2) return setError('Bạn nhập giúp họ tên người nhận nhé.');
    if (!isPhone(phone)) return setError('Số điện thoại chưa đúng — gồm 10 số, bắt đầu bằng số 0.');
    if (addr.street.trim().length < 3) return setError('Bạn nhập giúp số nhà và tên đường nhé.');
    if (!addrComplete(addr)) return setError('Bạn chọn giúp Tỉnh / Thành phố nhé.');
    start(async () => {
      const r = await saveAddressAction({ name, phone, street: addr.street.trim(), area: composeArea(addr), kind, conditions, isDefault, lat: addr.lat, lng: addr.lng }, id)
        .catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
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
      <form className="vx-modal" style={{ maxWidth: 560 }} onSubmit={submit} noValidate>
        <div className="vx-modal__head" style={{ fontSize: '1.25rem' }}>
          {id ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          <button type="button" aria-label="Đóng" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="vx-modal__body" style={{ gap: 18 }}>
          <div className="app-big">
            <p className="vx-modal__sec" style={{ fontSize: '1.125rem' }}>Người nhận hàng</p>
            <div className="app-big__f"><label htmlFor="ad-name">Họ và tên</label><input id="ad-name" value={v.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder="Ví dụ: Nguyễn Văn An" /></div>
            <div className="app-big__f"><label htmlFor="ad-phone">Số điện thoại</label><input id="ad-phone" inputMode="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="Ví dụ: 0912 345 678" /></div>
          </div>
          <hr className="vx-divider" style={{ margin: 0 }} />
          <div className="app-big">
            <p className="vx-modal__sec" style={{ fontSize: '1.125rem' }}>Địa chỉ nhận hàng</p>
            <AddressFields value={addr} onChange={setAddr} stores={stores} idPrefix="ad" />
          </div>
          <details className="app-big__more">
            <summary>Dặn thêm cho người giao hàng (không bắt buộc)</summary>
            <div>
              <div>
                <span className="app-big__lbl">Loại địa chỉ</span>
                <span className="app-big__chips">
                  {(Object.keys(KIND_LABEL) as AddressKind[]).map((k) => (
                    <button key={k} type="button" className="vx-chip" aria-pressed={v.kind === k} onClick={() => set('kind', k)}>{KIND_LABEL[k]}</button>
                  ))}
                </span>
              </div>
              <div>
                <span className="app-big__lbl">Điều kiện giao cây lớn</span>
                <span className="app-big__chips">
                  {(Object.keys(CONDITION_LABEL) as DeliveryCondition[]).map((c) => (
                    <button key={c} type="button" className="vx-chip" aria-pressed={v.conditions.includes(c)} onClick={() => toggle(c)}>{CONDITION_LABEL[c]}</button>
                  ))}
                </span>
                <span className="vx-help">Giúp shop chọn cách giao phù hợp với cây lớn, tránh giao lại.</span>
              </div>
            </div>
          </details>
          <label className="app-big__check">
            <input type="checkbox" checked={v.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
            Dùng làm địa chỉ mặc định
          </label>
          {error && <span className="app-big__err" role="alert">{error}</span>}
          {id && <button type="button" className="vx-danger-link" onClick={remove} disabled={pending} style={{ alignSelf: 'flex-start', fontSize: '1rem' }}>Xóa địa chỉ này</button>}
        </div>
        <div className="vx-modal__foot">
          <button className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" style={{ minHeight: 56, fontSize: '1.125rem' }} disabled={pending}>{pending ? 'Đang lưu…' : id ? 'Lưu thay đổi' : 'Lưu địa chỉ'}</button>
        </div>
      </form>
    </div>
  );
}
