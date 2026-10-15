import { SidebarMenu } from '@/components/SidebarMenu';
import { categoryCounts } from '@/server/catalog';
import { menuCategories } from '@/server/categories';

/** Trang khách không sidebar cố định: trên tablet/mobile vẫn cần bảng Danh mục mở từ nút menu ở Header.
 *  Nội dung trang nằm trong <main> (một <main> mỗi trang — mục 3.2 checklist SEO); bảng danh mục ở ngoài. */
export default async function PageLayout({ children }: { children: React.ReactNode }) {
  const [categories, counts] = await Promise.all([menuCategories(), categoryCounts()]);
  return (
    <>
      <div className="app-drawer-only">
        <SidebarMenu categories={categories} counts={counts} />
      </div>
      <main className="app-page-main">{children}</main>
    </>
  );
}
