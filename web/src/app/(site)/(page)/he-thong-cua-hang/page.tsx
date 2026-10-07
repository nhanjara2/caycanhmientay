import type { Metadata } from 'next';
import { StoreLocator } from '@/components/StoreLocator';
import { listPublicStores } from '@/server/stores-public';

export const metadata: Metadata = { title: 'Hệ thống cửa hàng' };

/** Danh sách cửa hàng đọc từ bảng stores (đang hoạt động + bật "Hiện trên web" ở /admin/cua-hang). */
export default async function Page() {
  return <StoreLocator stores={await listPublicStores()} />;
}
