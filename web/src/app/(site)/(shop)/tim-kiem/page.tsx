import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb, EmptyState } from '@/components/Blocks';
import { ProductGrid } from '@/components/ProductCard';
import { findCategory } from '@/lib/catalog';
import { allProducts, searchProducts } from '@/server/catalog';
import { getCategories } from '@/server/categories';
import { sortProducts } from '@/lib/sort';

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Tìm “${q}”` : 'Tìm kiếm', robots: { index: false } };
}

// Từ khóa đặc biệt từ SidebarMenu/CollectionStrip.
async function run(q: string) {
  if (q === 'giảm') return (await allProducts()).filter((p) => p.options.some((o) => o.oldPrice));
  if (q === 'bán chạy') return sortProducts(await allProducts(), 'ban-chay').slice(0, 12);
  const cats = await getCategories();
  return searchProducts(q, (slug) => findCategory(cats, slug)?.name);
}

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? '').trim();
  const items = q ? await run(q) : [];

  return (
    <>
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tìm kiếm' }]} />
      <div className="pl-head">
        <h1>
          {q ? <>Kết quả cho “{q}”</> : 'Tìm kiếm'} <small>{items.length} sản phẩm</small>
        </h1>
      </div>
      {items.length ? (
        <ProductGrid products={items} />
      ) : (
        <EmptyState
          icon="search"
          title={q ? 'Không tìm thấy sản phẩm phù hợp' : 'Nhập từ khóa để tìm'}
          text="Thử từ khóa ngắn hơn, gõ không dấu cũng được, hoặc nhắn Zalo để shop tìm cây giúp bạn."
          action={<Link className="vx-btn vx-btn--primary" href="/">Về trang chủ</Link>}
        />
      )}
    </>
  );
}
