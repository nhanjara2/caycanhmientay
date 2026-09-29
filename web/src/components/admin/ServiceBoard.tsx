'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { updateServiceRequestAction } from '@/app/actions/service-requests';
import { BOARD_STAGES, SERVICE_INFO, SERVICE_TYPES, STAGE_LABEL, type ServiceStage } from '@/lib/service-labels';
import type { BoardCard } from '@/server/service-requests';

export type ServiceFilterValue = { loai: string; ks: string; thua: boolean };

/** Lọc theo dịch vụ / người phụ trách / hiện cột Thua — ghi vào URL để tải lại vẫn giữ. */
export function ServiceFilters({ staff, value }: { staff: { id: number; name: string }[]; value: ServiceFilterValue }) {
  const router = useRouter();
  const go = (patch: Partial<ServiceFilterValue>) => {
    const v = { ...value, ...patch };
    const u = new URLSearchParams();
    if (v.loai) u.set('loai', v.loai);
    if (v.ks) u.set('ks', v.ks);
    if (v.thua) u.set('thua', '1');
    router.push(`/admin/dich-vu${u.size ? `?${u}` : ''}`);
  };
  return (
    <>
      <select className="ad-sel" aria-label="Lọc theo dịch vụ" value={value.loai} onChange={(e) => go({ loai: e.target.value })}>
        <option value="">Tất cả dịch vụ</option>
        {SERVICE_TYPES.map((s) => <option key={s} value={s}>{SERVICE_INFO[s].label}</option>)}
      </select>
      <select className="ad-sel" aria-label="Lọc theo người phụ trách" value={value.ks} onChange={(e) => go({ ks: e.target.value })}>
        <option value="">Phụ trách: Tất cả</option>
        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <label className="ad-sel app-sb-lost">
        <input type="checkbox" checked={value.thua} onChange={(e) => go({ thua: e.target.checked })} />
        Hiện cột Thua
      </label>
    </>
  );
}

/**
 * Bảng Kanban AdminServiceRequests: kéo thẻ sang cột khác để đổi giai đoạn (máy tính).
 * Trên điện thoại (không kéo thả được) bấm thẻ → đổi giai đoạn ở trang chi tiết.
 * Cột Thua chỉ để xem: đánh dấu thua phải ghi lý do ở trang chi tiết.
 */
export function ServiceBoard({ cards, showLost }: { cards: BoardCard[]; showLost: boolean }) {
  const router = useRouter();
  const [local, setLocal] = useState(cards);
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<ServiceStage | null>(null);
  const [error, setError] = useState('');
  const [, start] = useTransition();
  useEffect(() => setLocal(cards), [cards]);

  const cols: ServiceStage[] = showLost ? [...BOARD_STAGES, 'lost'] : [...BOARD_STAGES];

  const move = (id: number, stage: ServiceStage) => {
    const card = local.find((c) => c.id === id);
    if (!card || card.stage === stage || stage === 'lost') return;
    const before = local;
    setError('');
    setLocal((l) => l.map((c) => (c.id === id ? { ...c, stage, when: 'Vừa chuyển', late: false } : c)));
    start(async () => {
      const r = await updateServiceRequestAction({ id, stage }).catch(() => ({ ok: false as const, error: 'Không lưu được, kiểm tra mạng rồi thử lại' }));
      if (!r.ok) { setLocal(before); setError(r.error); return; }
      router.refresh();
    });
  };

  return (
    <>
      {error && <p className="vx-err" role="alert">{error}</p>}
      <div className="kb app-kb" style={{ '--kb-cols': cols.length } as React.CSSProperties}>
        {cols.map((stage) => {
          const list = local.filter((c) => c.stage === stage);
          const droppable = stage !== 'lost';
          return (
            <div
              key={stage}
              className="kb-col"
              data-over={over === stage && droppable ? 'true' : undefined}
              onDragOver={(e) => { if (droppable && dragId) { e.preventDefault(); setOver(stage); } }}
              onDragLeave={() => setOver((o) => (o === stage ? null : o))}
              onDrop={(e) => { e.preventDefault(); setOver(null); if (dragId) move(dragId, stage); setDragId(null); }}
            >
              <div className="kb-col__h">{STAGE_LABEL[stage]}<small>{list.length}</small></div>
              {list.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/dich-vu/${c.id}`}
                  className="kb-card app-kb-card"
                  draggable
                  data-dragging={dragId === c.id ? 'true' : undefined}
                  onDragStart={(e) => { setDragId(c.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(c.id)); }}
                  onDragEnd={() => { setDragId(null); setOver(null); }}
                >
                  <b>{c.name}</b>
                  <span>{c.need}</span>
                  {c.assignee && <span className="vx-badge vx-badge--info">KS: {c.assignee}</span>}
                  <span className="row">
                    <span className="val">{c.value}</span>
                    <span className={c.late ? 'late' : ''}>{c.when}</span>
                  </span>
                </Link>
              ))}
              {!list.length && <span className="app-kb-empty">{droppable ? 'Kéo thẻ vào đây' : 'Không có'}</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}
