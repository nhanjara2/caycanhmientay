import type { Metadata } from 'next';
import { StoreLocator } from '@/components/StoreLocator';
import { listPublicStores } from '@/server/stores-public';
import { withShare } from '@/lib/seo';

export const metadata: Metadata = withShare({
  title: 'Hệ thống cửa hàng',
  description: 'Địa chỉ, giờ mở cửa và chỉ đường tới vườn ươm Cây Cảnh Miền Tây ở Làng hoa Sa Đéc, Đồng Tháp cùng nhà vườn đối tác. Xem cây tận nơi, khám lá bệnh miễn phí.',
  alternates: { canonical: '/he-thong-cua-hang' },
});

/** Danh sách cửa hàng đọc từ bảng stores (đang hoạt động + bật "Hiện trên web" ở /admin/cua-hang). */
export default async function Page() {
  return <StoreLocator stores={await listPublicStores()} />;
}
