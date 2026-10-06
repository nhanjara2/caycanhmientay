import type { Metadata } from 'next';
import Link from 'next/link';
import { DriverTrip } from '@/components/DriverTrip';
import { effectiveRole } from '@/lib/permissions';
import { slotTime, vnDate } from '@/lib/shipping';
import { requireAccess } from '@/server/auth';
import { driverTrips } from '@/server/delivery';
import { getShippingConfig } from '@/server/shipping';

export const metadata: Metadata = { title: 'Giao hàng' };

/** StaffDeliveryApp: các chuyến hôm nay của tài xế đang đăng nhập (web mobile). */
export default async function Page() {
  const me = await requireAccess('delivery');
  const [trips, cfg] = await Promise.all([driverTrips(me.id, vnDate()), getShippingConfig()]);
  const slotOf = (key: string) => { const s = cfg.slots.find((x) => x.key === key); return s ? slotTime(s) : ''; };
  const canPlan = effectiveRole(me) !== 'delivery';

  return (
    <div className="app-driver">
      {trips.map((t) => (
        <DriverTrip key={t.id} trip={{ id: t.id, name: t.name, vehicle: t.vehicle, helper: t.helper, time: `${vnDate().split('-').reverse().slice(0, 2).join('/')} · ${slotOf(t.slotKey)}`, stops: t.stops }} />
      ))}
      {!trips.length && (
        <div className="app-driver__empty">
          <b>Hôm nay bạn chưa có chuyến nào.</b>
          <span>Quản lý hoặc kho sẽ xếp chuyến cho bạn ở trang Giao hàng.</span>
          {canPlan && <Link href="/admin/giao-hang" className="vx-btn vx-btn--outline">Mở bảng xếp chuyến</Link>}
        </div>
      )}
    </div>
  );
}
