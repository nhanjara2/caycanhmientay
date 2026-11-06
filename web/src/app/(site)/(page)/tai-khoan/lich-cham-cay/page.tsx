import type { Metadata } from 'next';
import Link from '@/components/LocaleLink';
import { AccountSidebar } from '@/components/AccountSidebar';
import { Breadcrumb } from '@/components/Blocks';
import { CareScheduleList, type CareTask } from '@/components/CareScheduleList';
import { getCurrentUser } from '@/server/auth';
import { listGarden } from '@/server/garden';

export const metadata: Metadata = { title: 'Lịch chăm cây' };

const UPCOMING_WITHIN_DAYS = 7;

export default async function CareSchedulePage() {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập
  const garden = await listGarden(user);

  const today: CareTask[] = [];
  const upcoming: CareTask[] = [];
  for (const p of garden) {
    const name = p.nickname || p.name;
    if (p.status === 'attention') today.push({ plantId: p.id, name, kind: 'check', due: new Date().toISOString(), overdue: true });
    for (const kind of ['water', 'fertilize'] as const) {
      const t = p[kind];
      if (t.overdue) today.push({ plantId: p.id, name, kind, due: t.due.toISOString(), overdue: true });
      else if (t.daysLeft <= UPCOMING_WITHIN_DAYS) upcoming.push({ plantId: p.id, name, kind, due: t.due.toISOString(), overdue: false });
    }
  }
  upcoming.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

  return (
    <div className="vx-acctpage">
      <Breadcrumb items={[{ label: 'Tài khoản', href: '/tai-khoan' }, { label: 'Lịch chăm cây' }]} />
      <div className="vx-acctgrid">
        <AccountSidebar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="gd-head"><h2>Lịch chăm cây</h2></div>
          {garden.length > 0 ? (
            <CareScheduleList today={today} upcoming={upcoming} />
          ) : (
            <p className="vx-help">Vườn của bạn chưa có cây nào. Xem <Link href="/tai-khoan/vuon-cua-toi">Vườn của tôi</Link>.</p>
          )}
        </div>
      </div>
    </div>
  );
}
