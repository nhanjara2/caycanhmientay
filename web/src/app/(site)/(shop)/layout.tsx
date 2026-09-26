import { SidebarMenu } from '@/components/SidebarMenu';
import { categoryCounts } from '@/server/catalog';

/** ShopLayout: trang chủ, danh mục, tìm kiếm — có SidebarMenu bên trái. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const counts = await categoryCounts();
  return (
    <div className="app-shop">
      <SidebarMenu counts={counts} />
      <main className="app-main">{children}</main>
    </div>
  );
}
