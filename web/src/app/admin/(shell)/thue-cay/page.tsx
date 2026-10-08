import type { Metadata } from 'next';
import { RentalSettings } from '@/components/admin/RentalSettings';
import { fmtDateTime } from '@/lib/order-labels';
import { requireAccess } from '@/server/auth';
import { getRentalConfig, rentalMeta } from '@/server/office-rental';

export const metadata: Metadata = { title: 'Gói thuê cây văn phòng' };

/** Giá thuê theo cỡ cây, thời hạn, các gói của trang /dich-vu/cho-thue-cay-van-phong (Quản lý). */
export default async function AdminRentalPage() {
  await requireAccess('settings');
  const [config, meta] = await Promise.all([getRentalConfig(), rentalMeta()]);
  return (
    <>
      <RentalSettings initial={config} />
      <p className="vx-help" style={{ margin: '0 var(--space-4) var(--space-4)' }}>
        {meta ? <>Lần lưu gần nhất: {meta.by} · {fmtDateTime(meta.at)}</> : 'Chưa lưu lần nào — trang khách đang dùng giá và gói mặc định (giá ước tính, nên rà lại).'}
      </p>
    </>
  );
}
