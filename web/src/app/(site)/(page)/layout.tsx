import { SidebarMenu } from '@/components/SidebarMenu';
import { categoryCounts } from '@/server/catalog';

/** Trang khách không sidebar cố định: trên tablet/mobile vẫn cần bảng Danh mục mở từ nút menu ở Header. */
export default async function PageLayout({ children }: { children: React.ReactNode }) {
  const counts = await categoryCounts();
  return (
    <>
      <div className="app-drawer-only">
        <SidebarMenu counts={counts} />
      </div>
      {children}
    </>
  );
}
