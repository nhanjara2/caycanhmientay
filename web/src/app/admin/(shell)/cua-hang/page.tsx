import type { Metadata } from 'next';
import { StoreAdmin } from '@/components/admin/StoreAdmin';
import { requireAccess } from '@/server/auth';
import { listStoresAdmin } from '@/server/stores-admin';

export const metadata: Metadata = { title: 'Cửa hàng' };

/** Quản lý cửa hàng / kho: tên, địa chỉ, tọa độ (vùng giao cây sống), mặc định, ngừng hoạt động, xóa (chỉ khi chưa phát sinh gì). Chỉ Quản lý. */
export default async function AdminStoresPage() {
  await requireAccess('settings');
  return (
    <div className="ad-body">
      <StoreAdmin stores={await listStoresAdmin()} />
    </div>
  );
}
