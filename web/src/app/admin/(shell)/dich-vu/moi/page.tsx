import type { Metadata } from 'next';
import Link from 'next/link';
import { ServiceRequestNew } from '@/components/admin/ServiceRequestNew';
import { requireAccess } from '@/server/auth';

export const metadata: Metadata = { title: 'Tạo yêu cầu dịch vụ' };

export default async function NewServiceRequestPage() {
  await requireAccess('services', 'full');
  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Tạo yêu cầu dịch vụ</h1>
        <span className="acts"><Link href="/admin/dich-vu" className="vx-btn vx-btn--outline">← Bảng yêu cầu</Link></span>
      </div>
      <div style={{ maxWidth: 720 }}>
        <ServiceRequestNew />
      </div>
    </div>
  );
}
