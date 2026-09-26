import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb, EmptyState } from '@/components/Blocks';
import { Icon } from '@/components/Icon';
import { ProductGrid } from '@/components/ProductCard';
import { getCategory } from '@/lib/catalog';
import { productsIn } from '@/server/catalog';
import { SORTS, sortProducts } from '@/lib/sort';

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ sap_xep?: string }>;
};

function resolve(slug: string[]) {
  const [catSlug, subSlug, ...rest] = slug;
  const cat = getCategory(catSlug);
  const sub = subSlug ? cat?.subs.find((s) => s.slug === subSlug) : undefined;
  if (!cat || rest.length || (subSlug && !sub)) return null;
  return { cat, sub };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = resolve((await params).slug);
  return { title: r ? (r.sub?.name ?? r.cat.name) : 'Không tìm thấy' };
}

/** ProductListingLayout: tiêu đề + danh mục con + sắp xếp + lưới 4 cột. */
export default async function CategoryPage({ params, searchParams }: Props) {
  const r = resolve((await params).slug);
  if (!r) notFound();
  const { cat, sub } = r;
  const { sap_xep } = await searchParams;
  const items = sortProducts(await productsIn(cat.slug, sub?.slug), sap_xep);
  const base = sub ? `/danh-muc/${cat.slug}/${sub.slug}` : `/danh-muc/${cat.slug}`;
  const activeSort = SORTS.some((s) => s.key === sap_xep) ? sap_xep : 'pho-bien';

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          sub ? { label: cat.name, href: `/danh-muc/${cat.slug}` } : { label: cat.name },
          ...(sub ? [{ label: sub.name }] : []),
        ]}
      />
      <div className="pl-head">
        <h1>
          {sub?.name ?? cat.name} <small>{items.length} sản phẩm</small>
        </h1>
        <div className="pl-subs">
          {cat.subs.map((s) => (
            <Link
              key={s.slug}
              className="pl-sub"
              href={`/danh-muc/${cat.slug}/${s.slug}`}
              aria-current={sub?.slug === s.slug ? 'true' : undefined}
            >
              <span><Icon name={cat.icon} /></span>
              {s.name}
            </Link>
          ))}
        </div>
        <div className="fb-sort">
          <span>Sắp xếp:</span>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={s.key === 'pho-bien' ? base : `${base}?sap_xep=${s.key}`}
              aria-current={activeSort === s.key ? 'true' : undefined}
              scroll={false}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      {items.length ? (
        <ProductGrid products={items} />
      ) : (
        <EmptyState
          icon="leaf"
          title="Chưa có sản phẩm"
          text="Nhóm hàng này đang được nhà vườn chuẩn bị. Bạn xem các nhóm khác nhé."
          action={<Link className="vx-btn vx-btn--outline" href={`/danh-muc/${cat.slug}`}>Xem tất cả {cat.name}</Link>}
        />
      )}
    </>
  );
}
