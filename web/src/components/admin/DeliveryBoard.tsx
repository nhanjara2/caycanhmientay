'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { assignOrderAction, createTripAction, deleteTripAction, moveStopAction, updateTripAction } from '@/app/actions/delivery';
import { Icon } from '@/components/Icon';
import { DEFAULT_CAPACITY, loadLabel, VEHICLE_LABEL, type VehicleKey } from '@/lib/delivery-labels';
import { money } from '@/lib/format';
import { PAY_LABEL, STATUS_LABEL } from '@/lib/order-labels';
import type { StopOrder, TripView } from '@/server/delivery';
import { Select } from '@/components/Select';

type Driver = { id: number; name: string; delivery: boolean };
type Slot = { key: string; time: string };

const DRAG = 'application/x-ccmt-order';
const VEHICLES = Object.keys(VEHICLE_LABEL) as VehicleKey[];

/** Bảng xếp chuyến giao theo ngày: kéo đơn vào chuyến (hoặc chọn "Xếp vào…"), đổi thứ tự điểm dừng, tài xế + phụ xe, thanh tải. */
export function DeliveryBoard({ date, slots, trips, unassigned, drivers, canEdit }: {
  date: string; slots: Slot[]; trips: TripView[]; unassigned: StopOrder[]; drivers: Driver[]; canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [over, setOver] = useState<string | null>(null);
  const [newFor, setNewFor] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError('');
    start(async () => {
      const r = await fn().catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) setError(r.error ?? 'Có lỗi, vui lòng thử lại');
      router.refresh();
    });
  };
  const assign = (orderId: number, tripId: number | null) => run(() => assignOrderAction(orderId, tripId));

  const drop = (e: React.DragEvent, tripId: number | null) => {
    e.preventDefault();
    setOver(null);
    const id = Number(e.dataTransfer.getData(DRAG));
    if (id) assign(id, tripId);
  };
  const dnd = (tripId: number | null, key: string) => canEdit ? {
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes(DRAG)) { e.preventDefault(); setOver(key); } },
    onDragLeave: () => setOver((o) => (o === key ? null : o)),
    onDrop: (e: React.DragEvent) => drop(e, tripId),
  } : {};

  return (
    <>
      {error && <div className="vx-err" role="alert" style={{ marginBottom: 8 }}>{error}</div>}
      <div className="ad-board app-dboard" style={{ gridTemplateColumns: `repeat(${slots.length + 1}, minmax(250px, 1fr))` }} aria-busy={pending}>
        <div className="ad-col" data-over={over === 'un' || undefined} {...dnd(null, 'un')}>
          <div className="ad-col__h">Chưa xếp chuyến<small>{unassigned.length} đơn</small></div>
          {unassigned.map((o) => (
            <div key={o.id} className="ad-trip ad-unassigned" draggable={canEdit} onDragStart={(e) => { e.dataTransfer.setData(DRAG, String(o.id)); e.dataTransfer.effectAllowed = 'move'; }}>
              <span className="t"><Link className="code" href={`/admin/don-hang/${o.code}`}>{o.code}</Link><small>{o.slotKey ? slots.find((s) => s.key === o.slotKey)?.time : o.slot ?? 'Chưa hẹn giờ'}</small></span>
              <span style={{ fontSize: '0.75rem' }}>{o.customer} · {o.address || 'Chưa có địa chỉ'}</span>
              <span className="ad-tags">
                {o.kind === 'warranty' && <span className="vx-badge vx-badge--sun">Đơn bảo hành</span>}
                {o.plantQty > 0 && <span className="vx-badge vx-badge--info">{o.plantQty} cây</span>}
                {o.supplyQty > 0 && <span className="vx-badge vx-badge--info">{o.supplyQty} vật tư</span>}
                {o.status === 'pending' && <span className="vx-badge vx-badge--sun">Chờ xác nhận</span>}
                {o.paymentMethod === 'cod' && !o.paid && o.total > 0 && <span className="vx-badge vx-badge--outline">COD {money(o.total)}</span>}
              </span>
              {canEdit && (
                <Select className="vx-input app-dboard__assign" aria-label={`Xếp đơn ${o.code} vào chuyến`} value="" disabled={pending}
                  onChange={(e) => e.target.value && assign(o.id, Number(e.target.value))}>
                  <option value="">Xếp vào chuyến…</option>
                  {trips.filter((t) => !o.slotKey || t.slotKey === o.slotKey).map((t) => (
                    <option key={t.id} value={t.id}>{t.name} · {slots.find((s) => s.key === t.slotKey)?.time}</option>
                  ))}
                </Select>
              )}
            </div>
          ))}
          {!unassigned.length && <div className="app-kb-empty">Mọi đơn đã có chuyến</div>}
        </div>

        {slots.map((s) => {
          const mine = trips.filter((t) => t.slotKey === s.key);
          return (
            <div className="ad-col" key={s.key}>
              <div className="ad-col__h">Ca {s.time}<small>{mine.length} chuyến</small></div>
              {mine.map((t) => (
                <TripCard key={t.id} t={t} drivers={drivers} canEdit={canEdit} pending={pending} over={over === `t${t.id}`} dnd={dnd(t.id, `t${t.id}`)} run={run} />
              ))}
              {canEdit && (newFor === s.key
                ? <NewTrip date={date} slotKey={s.key} drivers={drivers} onDone={() => setNewFor(null)} run={run} />
                : <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => setNewFor(s.key)}>+ Thêm chuyến</button>)}
            </div>
          );
        })}
      </div>
    </>
  );
}

function NewTrip({ date, slotKey, drivers, onDone, run }: {
  date: string; slotKey: string; drivers: Driver[]; onDone: () => void; run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [vehicle, setVehicle] = useState<VehicleKey>('bike');
  const [driverId, setDriverId] = useState('');
  const [helper, setHelper] = useState('');
  return (
    <div className="ad-trip app-dboard__form">
      <span className="t">Chuyến mới</span>
      <Select className="vx-input" aria-label="Loại xe" value={vehicle} onChange={(e) => setVehicle(e.target.value as VehicleKey)}>
        {VEHICLES.map((v) => <option key={v} value={v}>{VEHICLE_LABEL[v]} (tải {DEFAULT_CAPACITY[v]})</option>)}
      </Select>
      <Select className="vx-input" aria-label="Tài xế" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
        <option value="">Chưa chọn tài xế</option>
        {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}{d.delivery ? '' : ' (không phải tài xế)'}</option>)}
      </Select>
      <input className="vx-input" placeholder="Phụ xe (không bắt buộc)" value={helper} maxLength={60} onChange={(e) => setHelper(e.target.value)} />
      <span className="acts" style={{ display: 'flex', gap: 6 }}>
        <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" onClick={() => { run(() => createTripAction({ date, slotKey, vehicle, driverId: driverId ? Number(driverId) : null, helper })); onDone(); }}>Tạo chuyến</button>
        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={onDone}>Hủy</button>
      </span>
    </div>
  );
}

function TripCard({ t, drivers, canEdit, pending, over, dnd, run }: {
  t: TripView; drivers: Driver[]; canEdit: boolean; pending: boolean; over: boolean;
  dnd: Record<string, unknown>; run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(t.name);
  const [vehicle, setVehicle] = useState<VehicleKey>(t.vehicle);
  const [driverId, setDriverId] = useState(t.driverId ? String(t.driverId) : '');
  const [helper, setHelper] = useState(t.helper ?? '');
  const [capacity, setCapacity] = useState(String(t.capacity));
  const pct = Math.min(100, Math.round((t.load / t.capacity) * 100));

  return (
    <div className="ad-trip" data-over={over || undefined} {...dnd}>
      <span className="t"><Icon name="truck" />{t.name}<small>{VEHICLE_LABEL[t.vehicle]}</small></span>
      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
        {t.driverName ? `Tài xế ${t.driverName}` : <b style={{ color: 'var(--danger)' }}>Chưa có tài xế</b>}{t.helper ? ` + ${t.helper}` : ''}
      </span>
      <span className="ad-load">Tải {loadLabel(t.load)} / {t.capacity} · {pct}%<i><em style={{ width: `${pct}%`, background: t.load > t.capacity ? 'var(--danger)' : undefined }} /></i></span>
      {t.warnings.map((w) => <span key={w} className="vx-badge vx-badge--sun" style={{ alignSelf: 'flex-start' }}>{w}</span>)}
      {t.stops.map((s, i) => (
        <div className="ad-stop" key={s.id} draggable={canEdit} onDragStart={(e) => { e.dataTransfer.setData(DRAG, String(s.id)); e.dataTransfer.effectAllowed = 'move'; }}>
          <b>{i + 1}</b>
          <span>
            <Link className="code" href={`/admin/don-hang/${s.code}`}>{s.code}</Link> · {s.customer}
            <small>{s.address || '—'}</small>
            <small>{s.plantQty ? `${s.plantQty} cây` : ''}{s.plantQty && s.supplyQty ? ' · ' : ''}{s.supplyQty ? `${s.supplyQty} vật tư` : ''}
              {s.paymentMethod === 'cod' && !s.paid && s.total > 0 ? ` · COD ${money(s.total)}` : s.paid ? '' : ` · ${PAY_LABEL[s.paymentMethod as keyof typeof PAY_LABEL] ?? ''}`}
              {s.status !== 'shipping' ? ` · ${STATUS_LABEL[s.status]}` : ' · Đang giao'}
            </small>
          </span>
          {canEdit && (
            <span className="app-dboard__stopacts">
              <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" aria-label={`Lên (${s.code})`} disabled={pending || i === 0} onClick={() => run(() => moveStopAction(s.id, 'up'))}>↑</button>
              <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" aria-label={`Xuống (${s.code})`} disabled={pending || i === t.stops.length - 1} onClick={() => run(() => moveStopAction(s.id, 'down'))}>↓</button>
              <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" aria-label={`Bỏ ${s.code} khỏi chuyến`} disabled={pending} onClick={() => run(() => assignOrderAction(s.id, null))}>✕</button>
            </span>
          )}
        </div>
      ))}
      {!t.stops.length && <div className="app-kb-empty">Kéo đơn vào chuyến</div>}
      {canEdit && !edit && (
        <span className="acts" style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" onClick={() => setEdit(true)}>Sửa chuyến</button>
        </span>
      )}
      {canEdit && edit && (
        <div className="app-dboard__form">
          <input className="vx-input" aria-label="Tên chuyến" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          <Select className="vx-input" aria-label="Loại xe" value={vehicle} onChange={(e) => { setVehicle(e.target.value as VehicleKey); setCapacity(String(DEFAULT_CAPACITY[e.target.value as VehicleKey])); }}>
            {VEHICLES.map((v) => <option key={v} value={v}>{VEHICLE_LABEL[v]}</option>)}
          </Select>
          <Select className="vx-input" aria-label="Tài xế" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Chưa chọn tài xế</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}{d.delivery ? '' : ' (không phải tài xế)'}</option>)}
          </Select>
          <input className="vx-input" aria-label="Phụ xe" placeholder="Phụ xe" value={helper} maxLength={60} onChange={(e) => setHelper(e.target.value)} />
          <label style={{ fontSize: '0.75rem' }}>Tải tối đa (điểm)
            <input className="vx-input" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value.replace(/\D/g, '').slice(0, 3))} />
          </label>
          <span className="acts" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending}
              onClick={() => { run(() => updateTripAction(t.id, { name, vehicle, driverId: driverId ? Number(driverId) : null, helper, capacity: Number(capacity) || t.capacity })); setEdit(false); }}>Lưu</button>
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => setEdit(false)}>Hủy</button>
            <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" style={{ color: 'var(--danger)', marginLeft: 'auto' }} disabled={pending}
              onClick={() => { if (confirm(`Xóa ${t.name}? ${t.stops.length ? 'Các đơn trong chuyến quay về "Chưa xếp chuyến".' : ''}`)) run(() => deleteTripAction(t.id)); }}>Xóa chuyến</button>
          </span>
        </div>
      )}
    </div>
  );
}
