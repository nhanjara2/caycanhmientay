import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DeliveryBoard } from '@/components/admin/DeliveryBoard';
import { Icon } from '@/components/Icon';
import { effectiveRole, hasAccess } from '@/lib/permissions';
import { addDaysYmd, shortDate, slotTime, vnDate } from '@/lib/shipping';
import { requireAccess } from '@/server/auth';
import { deliveryBoard, deliveryKpis, listDrivers } from '@/server/delivery';
import { getShippingConfig } from '@/server/shipping';

export const metadata: Metadata = { title: 'Giao hàng' };

type Props = { searchParams: Promise<{ ngay?: string }> };

/** AdminDelivery: bảng xếp chuyến giao theo ngày — đơn chưa xếp → các chuyến theo khung giờ khách đã chọn. */
export default async function AdminDeliveryPage({ searchParams }: Props) {
  const me = await requireAccess('delivery');
  if (effectiveRole(me) === 'delivery') redirect('/nhan-vien/giao-hang');
  const sp = await searchParams;
  const today = vnDate();
  const date = sp.ngay && /^\d{4}-\d{2}-\d{2}$/.test(sp.ngay) && !Number.isNaN(Date.parse(`${sp.ngay}T00:00:00Z`)) ? sp.ngay : today;
  const [cfg, board, drivers] = await Promise.all([getShippingConfig(), deliveryBoard(date), listDrivers()]);
  const k = await deliveryKpis(date, board, cfg);
  const slots = cfg.slots.map((s) => ({ key: s.key, time: slotTime(s) }));
  const link = (d: string) => `/admin/giao-hang?ngay=${d}`;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Giao hàng · {shortDate(date)}{date === today ? ' (hôm nay)' : ''}</h1>
        <span className="acts">
          <Link className="vx-btn vx-btn--outline vx-btn--sm" href={link(addDaysYmd(date, -1))} aria-label="Ngày trước">‹</Link>
          {date !== today && <Link className="vx-btn vx-btn--outline vx-btn--sm" href={link(today)}>Hôm nay</Link>}
          <Link className="vx-btn vx-btn--outline vx-btn--sm" href={link(addDaysYmd(date, 1))} aria-label="Ngày sau">›</Link>
          <form action="/admin/giao-hang" style={{ display: 'flex', gap: 6 }}>
            <input className="vx-input" type="date" name="ngay" defaultValue={date} aria-label="Chọn ngày" style={{ padding: '6px 8px', fontSize: 13 }} />
            <button className="vx-btn vx-btn--outline vx-btn--sm">Xem</button>
          </form>
        </span>
      </div>
      <div className="ad-kpis">
        <div className="ad-kpi">
          <span><Icon name="truck" />Chuyến trong ngày</span>
          <b>{k.trips}</b>
          <small>{k.trucks} xe tải · {k.bikes} xe máy</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="plant" />Đơn giao trong ngày</span>
          <b>{k.orders}</b>
          <small>{k.plantOrders} đơn có cây sống</small>
        </div>
        <div className="ad-kpi">
          <span><Icon name="check" />Đúng khung giờ</span>
          <b>{k.onTime === null ? '—' : `${k.onTime}%`}</b>
          <small>{k.onTimeN ? `${k.onTimeN} đơn giao 7 ngày qua` : 'Chưa có đơn giao 7 ngày qua'}</small>
        </div>
        <div className={`ad-kpi${k.unassigned ? ' warn' : ''}`}>
          <span><Icon name="alert" />Chưa xếp chuyến</span>
          <b>{k.unassigned}</b>
          <small>Gồm đơn cũ chưa hẹn ngày và đơn bảo hành</small>
        </div>
      </div>
      <DeliveryBoard date={date} slots={slots} trips={board.trips} unassigned={board.unassigned} drivers={drivers} canEdit={hasAccess(me, 'delivery', 'full')} />
      <p className="vx-help" style={{ margin: 0 }}>
        Kéo đơn vào chuyến (hoặc chọn “Xếp vào chuyến…”); đơn chỉ vào được chuyến đúng ngày và khung giờ khách đã chọn. Đơn cũ chưa có ngày hẹn và đơn đổi cây của bảo hành nhận ngày + khung của chuyến khi xếp.
        “Điểm tải”: mỗi cây sống 1 điểm, mỗi món vật tư 0,25 điểm. Tài xế xem chuyến của mình trên điện thoại ở <Link href="/nhan-vien/giao-hang" style={{ color: 'var(--primary)' }}>/nhan-vien/giao-hang</Link>.
        Chưa có: tối ưu tuyến tự động và bản đồ chuyến (đơn chưa lưu tọa độ nhà khách).
      </p>
    </div>
  );
}
