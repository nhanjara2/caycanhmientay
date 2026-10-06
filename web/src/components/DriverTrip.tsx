'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { arrivedAction, completeDeliveryAction, failDeliveryAction } from '@/app/actions/delivery';
import { Icon } from '@/components/Icon';
import { directionsUrl, VEHICLE_LABEL } from '@/lib/delivery-labels';
import { money } from '@/lib/format';
import { PAY_LABEL } from '@/lib/order-labels';
import type { StopOrder } from '@/server/delivery';

type Trip = { id: number; name: string; vehicle: 'truck' | 'bike'; helper: string | null; time: string; stops: StopOrder[] };

/** Một chuyến trên app tài xế: tiến độ, điểm dừng theo tuyến, điểm hiện tại có Gọi · Chỉ đường · Đã đến · Hoàn tất · Không giao được. */
export function DriverTrip({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [failing, setFailing] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [arrived, setArrived] = useState<Set<number>>(new Set());

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError('');
    start(async () => {
      const r = await fn().catch(() => ({ ok: false as const, error: 'Không gửi được, kiểm tra mạng rồi thử lại' }));
      if (!r.ok) setError(r.error ?? 'Có lỗi, vui lòng thử lại');
      else after?.();
      router.refresh();
    });
  };

  const done = trip.stops.filter((s) => s.status === 'delivered');
  const todo = trip.stops.filter((s) => s.status !== 'delivered');
  const cod = todo.filter((s) => s.paymentMethod === 'cod' && !s.paid).reduce((a, s) => a + s.total, 0);
  const cur = todo[0];

  return (
    <section aria-label={trip.name}>
      <div className="s-head">
        <div className="row">
          <span><b>{trip.name}</b><small>{VEHICLE_LABEL[trip.vehicle]} · {trip.time}{trip.helper ? ` · phụ xe ${trip.helper}` : ''}</small></span>
          <span className="pill">{todo.length ? 'Đang giao' : trip.stops.length ? 'Hoàn tất' : 'Chưa có điểm'}</span>
        </div>
        <div className="s-prog">
          <div><b>{done.length}/{trip.stops.length}</b>Điểm đã giao</div>
          <div><b>{cod >= 1000 ? `${Math.round(cod / 1000)}k` : cod}</b>Thu hộ COD</div>
          <div><b>{todo.length}</b>Điểm còn lại</div>
        </div>
      </div>
      <div className="app-driver__stops">
        {error && <div className="vx-err" role="alert" style={{ margin: '0 12px' }}>{error}</div>}
        {done.map((s) => (
          <div key={s.id} className="s-stop done">
            <div className="top"><b className="n"><Icon name="check" size={13} /></b><span>{s.customer} · {s.code}</span></div>
          </div>
        ))}
        {todo.map((s, i) => {
          const isCur = s === cur;
          const ready = s.status === 'shipping';
          const codDue = s.paymentMethod === 'cod' && !s.paid && s.total > 0;
          return (
            <div key={s.id} className={`s-stop${isCur ? ' cur' : ''}`}>
              <div className="top"><b className="n">{done.length + i + 1}</b><span>{s.customer} · {s.code}</span></div>
              <span className="addr">{s.address || 'Chưa có địa chỉ'}</span>
              <span className="flags">
                {s.plantQty > 0 && <span className="vx-badge vx-badge--info">{s.plantQty} cây sống</span>}
                {s.supplyQty > 0 && <span className="vx-badge vx-badge--info">{s.supplyQty} vật tư</span>}
                {!ready && <span className="vx-badge vx-badge--sun">Chờ kho giao hàng</span>}
                {!codDue && s.total > 0 && s.paid && <span className="vx-badge vx-badge--success">Đã thanh toán</span>}
                {!codDue && s.total > 0 && !s.paid && <span className="vx-badge vx-badge--sun">Chưa thanh toán · {PAY_LABEL[s.paymentMethod as keyof typeof PAY_LABEL]}</span>}
              </span>
              {isCur && (
                <>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{s.items.join(', ')}</span>
                  {s.note && <span className="vx-note" style={{ margin: 0 }}><Icon name="chat" /><div>{s.note}</div></span>}
                  {codDue && <div className="s-cod"><span>Thu hộ (COD)</span><b>{money(s.total)}</b></div>}
                  <div className="acts">
                    <a className="vx-btn vx-btn--soft" href={`tel:${s.phone}`}><Icon name="phone" size={14} />Gọi</a>
                    <a className="vx-btn vx-btn--outline" href={directionsUrl(s.address)} target="_blank" rel="noreferrer">Chỉ đường</a>
                    <button type="button" className="vx-btn vx-btn--primary" disabled={pending || !ready || arrived.has(s.id)}
                      onClick={() => run(() => arrivedAction(s.id), () => setArrived((a) => new Set(a).add(s.id)))}>
                      {arrived.has(s.id) ? 'Đã báo' : 'Đã đến'}
                    </button>
                  </div>
                  <button type="button" className="vx-btn vx-btn--primary vx-btn--block" disabled={pending || !ready}
                    onClick={() => { if (confirm(`Xác nhận đã giao đơn ${s.code}${codDue ? ` và thu ${money(s.total)}` : ''}?`)) run(() => completeDeliveryAction(s.id, s.code)); }}>
                    Hoàn tất giao hàng
                  </button>
                  {failing === s.id ? (
                    <div className="app-driver__fail">
                      <textarea className="vx-input" rows={2} placeholder="Lý do không giao được (khách không nghe máy, sai địa chỉ…)" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
                      <span style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => run(() => failDeliveryAction(s.id, reason), () => { setFailing(null); setReason(''); })}>Gửi báo cáo</button>
                        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => setFailing(null)}>Hủy</button>
                      </span>
                    </div>
                  ) : (
                    <button type="button" className="vx-btn vx-btn--ghost vx-btn--block" style={{ color: 'var(--danger)' }} disabled={!ready} onClick={() => setFailing(s.id)}>Không giao được · báo lý do</button>
                  )}
                </>
              )}
            </div>
          );
        })}
        {!trip.stops.length && <div className="app-kb-empty" style={{ margin: '0 12px' }}>Chuyến chưa có điểm giao nào.</div>}
      </div>
    </section>
  );
}
