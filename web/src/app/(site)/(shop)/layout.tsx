import { SidebarMenu } from '@/components/SidebarMenu';
import { categoryCounts } from '@/server/catalog';
import { menuCategories } from '@/server/categories';

/** ShopLayout: trang chủ, danh mục, tìm kiếm — có SidebarMenu bên trái. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, counts] = await Promise.all([menuCategories(), categoryCounts()]);
  return (
    <div className="app-shop">
      <SidebarMenu categories={categories} counts={counts} />
      <main id="noi-dung" tabIndex={-1} className="app-main">{children}</main>
    </div>
  );
}
