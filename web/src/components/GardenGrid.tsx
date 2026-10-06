'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { markCareDoneAction, updateGardenPlantAction, uploadGardenPhotoAction } from '@/app/actions/garden';
import { compressImage } from '@/lib/compress-image';
import { fmtDate } from '@/lib/order-labels';
import { GARDEN_STATUS_LABEL, plantAgeDays, plantAgeText, type GardenStatus } from '@/lib/garden-labels';
import { Icon, Thumb, type IconName } from './Icon';

export type GardenCardData = {
  id: number; name: string; icon: string; image: string | null; nickname: string | null; location: string | null;
  status: GardenStatus; plantedAt: string; photo: string | null; warrantyDaysLeft: number;
  water: { due: string; overdue: boolean; daysLeft: number };
  fertilize: { due: string; overdue: boolean; daysLeft: number };
};

function primaryTask(p: GardenCardData) {
  const w = { kind: 'water' as const, label: 'Tưới nước', icon: 'drop' as IconName, ...p.water };
  const f = { kind: 'fertilize' as const, label: 'Bón phân', icon: 'flask' as IconName, ...p.fertilize };
  return new Date(w.due).getTime() <= new Date(f.due).getTime() ? w : f;
}

export function GardenGrid({ plants }: { plants: GardenCardData[] }) {
  return (
    <div className="gd-grid">
      {plants.map((p) => <GardenCard key={p.id} p={p} />)}
      {!plants.length && (
        <div className="gd-add" style={{ gridColumn: '1 / -1' }}>
          <b>Vườn của bạn chưa có cây nào</b>
          Mua cây sống ở shop và nhận hàng xong, cây sẽ tự vào đây để nhắc lịch chăm.
        </div>
      )}
    </div>
  );
}

function GardenCard({ p }: { p: GardenCardData }) {
  const [status, setStatus] = useState(p.status);
  const [location, setLocation] = useState(p.location ?? '');
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const task = primaryTask(p);
  const age = plantAgeDays(new Date(p.plantedAt));

  const saveEdit = (patch: Partial<{ status: GardenStatus; location: string }>) => {
    const next = { status, location, ...patch };
    setStatus(next.status);
    setLocation(next.location);
    start(async () => { await updateGardenPlantAction({ id: p.id, status: next.status, location: next.location || undefined }); });
  };

  const done = () => start(async () => { await markCareDoneAction(p.id, task.kind); });

  const pickPhoto = () => fileRef.current?.click();
  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    start(async () => {
      const small = await compressImage(f, 1200);
      const fd = new FormData();
      fd.append('id', String(p.id));
      fd.append('photo', small);
      await uploadGardenPhotoAction(fd);
    });
  };

  return (
    <div className="gd-card">
      <div className={`gd-card__img${status === 'attention' ? ' sick' : ''}`}>
        {p.photo ? <img src={`/api/garden-photos/${p.photo}`} alt={p.nickname ?? p.name} /> : <Thumb src={p.image} icon={p.icon} alt={p.name} />}
        <button
          type="button"
          className={`hl h ${status === 'attention' ? 'watch' : 'ok'}`}
          style={{ border: 0, cursor: 'pointer' }}
          onClick={() => saveEdit({ status: status === 'attention' ? 'healthy' : 'attention' })}
          disabled={pending}
        >
          {GARDEN_STATUS_LABEL[status]}
        </button>
        <span className="age">{plantAgeText(age)}</span>
      </div>
      <div className="gd-card__b">
        <b>{p.nickname || p.name}</b>
        <input
          className="app-bare"
          style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', padding: 0 }}
          value={location}
          placeholder="Thêm vị trí đặt cây…"
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => saveEdit({})}
        />
        <div className={`gd-next${task.overdue ? ' due' : ''}`}>
          <Icon name={task.icon} />
          {task.overdue ? 'Hôm nay: ' : `${fmtDate(new Date(task.due))}: `}{task.label}
          {task.overdue && (
            <a role="button" tabIndex={0} onClick={done} onKeyDown={(e) => e.key === 'Enter' && done()} style={{ cursor: pending ? 'default' : 'pointer' }}>
              Xong
            </a>
          )}
        </div>
        {p.warrantyDaysLeft > 0 && <small>Bảo hành còn {p.warrantyDaysLeft} ngày</small>}
      </div>
      <div className="gd-card__f">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
        <button type="button" className="vx-btn vx-btn--outline" onClick={pickPhoto} disabled={pending}>
          <Icon name="camera" size={13} />
          Cập nhật ảnh
        </button>
        <Link href="/tai-khoan/lich-cham-cay" className="vx-btn vx-btn--soft">Lịch chăm</Link>
      </div>
    </div>
  );
}
