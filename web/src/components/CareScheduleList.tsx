'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { markCareDoneAction } from '@/app/actions/garden';
import { fmtDate } from '@/lib/order-labels';
import { Icon, type IconName } from './Icon';

export type CareTask = {
  plantId: number;
  name: string;
  kind: 'water' | 'fertilize' | 'check';
  due: string;
  overdue: boolean;
};

const KIND: Record<CareTask['kind'], { label: (n: string) => string; hint: string; icon: IconName; cls: string }> = {
  water: { label: (n) => `Tưới ${n}`, hint: 'Tưới đẫm đến khi nước chảy ra đáy chậu', icon: 'drop', cls: '' },
  fertilize: { label: (n) => `Bón phân ${n}`, hint: 'Pha loãng theo hướng dẫn trên bao bì phân bón', icon: 'flask', cls: 'f' },
  check: { label: (n) => `Kiểm tra ${n}`, hint: 'Bạn đã đánh dấu cây này "Cần chú ý" ở Vườn của tôi', icon: 'bug', cls: 'r' },
};

export function CareScheduleList({ today, upcoming }: { today: CareTask[]; upcoming: CareTask[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const done = (t: CareTask) => {
    if (t.kind === 'check') return;
    start(async () => { await markCareDoneAction(t.plantId, t.kind); router.refresh(); });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="cs-list">
        <h3>Hôm nay<small>{today.length} việc</small></h3>
        {today.map((t, i) => {
          const k = KIND[t.kind];
          return (
            <div key={`${t.plantId}-${t.kind}`} className="cs-task">
              <span className={`t ${k.cls}`}><Icon name={k.icon} /></span>
              <span><b>{k.label(t.name)}</b><small>{k.hint}</small></span>
              {t.kind === 'check'
                ? <Link href="/benh-cay" className="vx-btn vx-btn--primary vx-btn--sm">Bắt bệnh</Link>
                : <button type="button" className="vx-btn vx-btn--outline vx-btn--sm app-cs-done" onClick={() => done(t)} disabled={pending}><Icon name="check" />Xong</button>}
            </div>
          );
        })}
        {!today.length && <div className="cs-task" style={{ gridTemplateColumns: '1fr' }}><span style={{ color: 'var(--ink-muted)' }}>Không có việc nào hôm nay.</span></div>}
      </div>
      {upcoming.length > 0 && (
        <div className="cs-list">
          <h3>Sắp tới</h3>
          {upcoming.map((t) => {
            const k = KIND[t.kind];
            return (
              <div key={`${t.plantId}-${t.kind}`} className="cs-task">
                <span className={`t ${k.cls}`}><Icon name={k.icon} /></span>
                <span><b>{k.label(t.name)}</b><small>{fmtDate(new Date(t.due))}</small></span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
