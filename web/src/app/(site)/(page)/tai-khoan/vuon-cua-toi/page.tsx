import type { Metadata } from 'next';
import { AccountSidebar } from '@/components/AccountSidebar';
import { Breadcrumb } from '@/components/Blocks';
import { GardenGrid, type GardenCardData } from '@/components/GardenGrid';
import { plantAgeDays } from '@/lib/garden-labels';
import { getCurrentUser } from '@/server/auth';
import { listGarden } from '@/server/garden';
import { WARRANTY_DAYS } from '@/server/warranty';

export const metadata: Metadata = { title: 'Vườn của tôi' };

export default async function MyGardenPage() {
  const user = await getCurrentUser();
  if (!user) return null; // AccountGate (layout) mời đăng nhập
  const garden = await listGarden(user);

  const cards: GardenCardData[] = garden.map((p) => ({
    id: p.id, name: p.name, icon: p.icon, image: p.image, nickname: p.nickname, location: p.location, status: p.status,
    plantedAt: p.plantedAt.toISOString(), photo: p.photo,
    warrantyDaysLeft: Math.max(0, WARRANTY_DAYS - plantAgeDays(p.plantedAt)),
    water: { due: p.water.due.toISOString(), overdue: p.water.overdue, daysLeft: p.water.daysLeft },
    fertilize: { due: p.fertilize.due.toISOString(), overdue: p.fertilize.overdue, daysLeft: p.fertilize.daysLeft },
  }));
  const dueToday = cards.filter((c) => c.water.overdue || c.fertilize.overdue).length;
  const underWarranty = cards.filter((c) => c.warrantyDaysLeft > 0).length;

  return (
    <div className="vx-acctpage">
      <Breadcrumb items={[{ label: 'Tài khoản', href: '/tai-khoan' }, { label: 'Vườn của tôi' }]} />
      <div className="vx-acctgrid">
        <AccountSidebar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="gd-head"><h2>Vườn của tôi</h2></div>
          <div className="gd-sum" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div><b>{cards.length}</b>Cây đang chăm</div>
            <div className="warn"><b>{dueToday}</b>Việc cần làm hôm nay</div>
            <div><b>{underWarranty}</b>Cây đang bảo hành</div>
          </div>
          <GardenGrid plants={cards} />
        </div>
      </div>
    </div>
  );
}
