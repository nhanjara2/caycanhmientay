import type { Metadata } from 'next';
import { ShippingSettings } from '@/components/admin/ShippingSettings';
import { fmtDateTime } from '@/lib/order-labels';
import { requireAccess } from '@/server/auth';
import { getShippingConfig, shippingMeta } from '@/server/shipping';

export const metadata: Metadata = { title: 'Cài đặt giao hàng' };

/** AdminShippingSettings: phí giao, vùng giao cây sống, khung giờ + số đơn tối đa, ngày nghỉ lễ (Quản lý). */
export default async function AdminShippingSettingsPage() {
  await requireAccess('settings');
  const [config, meta] = await Promise.all([getShippingConfig(), shippingMeta()]);
  return (
    <>
      <ShippingSettings initial={config} />
      {meta && <p className="vx-help" style={{ margin: '0 var(--space-4) var(--space-4)' }}>Lần lưu gần nhất: {meta.by} · {fmtDateTime(meta.at)}</p>}
    </>
  );
}
