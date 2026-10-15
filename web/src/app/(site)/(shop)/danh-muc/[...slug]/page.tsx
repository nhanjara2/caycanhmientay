import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdvisorBanner } from '@/components/AdvisorBanner';
import { Breadcrumb, EmptyState } from '@/components/Blocks';
import { Icon } from '@/components/Icon';
import { PesticideLookup } from '@/components/PesticideLookup';
import { ProductFilters } from '@/components/ProductFilters';
import { ProductGrid } from '@/components/ProductCard';
import {
  filterProducts, groupsFor, groupTitle, originOptions, parseSel, selectedCount, staticOptions, toFacet, withQuery, without,
} from '@/lib/product-filters';
import { productsIn } from '@/server/catalog';
import { getCategory } from '@/server/categories';
import { SORTS, sortProducts } from '@/lib/sort';

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Danh mục / nhóm con đang ẩn khỏi menu vẫn mở được (đường dẫn cũ, breadcrumb của sản phẩm không bị lỗi). */
async function resolve(slug: string[]) {
  const [catSlug, subSlug, ...rest] = slug;
  const cat = await getCategory(catSlug);
  const sub = subSlug ? cat?.subs.find((s) => s.slug === subSlug) : undefined;
  if (!cat || rest.length || (subSlug && !sub)) return null;
  return { cat, sub };
}

/**
 * SEO: canonical luôn là trang danh mục / nhóm con gốc (không ?tham số — bỏ cả utm_…, fbclid). Đang lọc / sắp xếp thì
 * noindex nhưng vẫn follow: các tổ hợp bộ lọc không thành hàng nghìn trang trùng trên Google, sản phẩm bên trong vẫn được lần theo.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const r = await resolve((await params).slug);
  if (!r) return { title: 'Không tìm thấy' };
  const sp = await searchParams;
  const varied = typeof sp.sap_xep === 'string' || selectedCount(parseSel(sp, groupsFor(r.cat.slug))) > 0;
  return {
    title: r.sub?.name ?? r.cat.name,
    alternates: { canonical: r.sub ? `/danh-muc/${r.cat.slug}/${r.sub.slug}` : `/danh-muc/${r.cat.slug}` },
    robots: varied ? { index: false, follow: true } : undefined,
  };
}

/** ProductListingLayout: tiêu đề + danh mục con + bộ lọc đa chọn + sắp xếp + lưới 4 cột. Bộ lọc nằm trên đường dẫn (?vi-tri=…&mau=…). */
export default async function CategoryPage({ params, searchParams }: Props) {
  const r = await resolve((await params).slug);
  if (!r) notFound();
  const { cat, sub } = r;
  const sp = await searchParams;
  const sap_xep = typeof sp.sap_xep === 'string' ? sp.sap_xep : undefined;
  const groups = groupsFor(cat.slug);
  const sel = parseSel(sp, groups);
  const all = await productsIn(cat.slug, sub?.slug);
  const items = sortProducts(filterProducts(all, sel), sap_xep);
  const origins = originOptions(all);
  const base = sub ? `/danh-muc/${cat.slug}/${sub.slug}` : `/danh-muc/${cat.slug}`;
  const activeSort = SORTS.some((s) => s.key === sap_xep) ? sap_xep : 'pho-bien';
  const sortParam = activeSort === 'pho-bien' ? undefined : activeSort;
  const filtering = selectedCount(sel) > 0;
  const optionName = (g: (typeof groups)[number], key: string) =>
    (g === 'nha-vuon' ? origins : staticOptions(g, cat.slug)).find((o) => o.key === key)?.name ?? key;

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
          {cat.subs.filter((s) => s.active || s.slug === sub?.slug).map((s) => (
            <Link
              key={s.slug}
              className="pl-sub"
              href={withQuery(`/danh-muc/${cat.slug}/${s.slug}`, sel, sortParam)}
              aria-current={sub?.slug === s.slug ? 'true' : undefined}
            >
              <span><Icon name={cat.icon} /></span>
              {s.name}
            </Link>
          ))}
        </div>
        <ProductFilters base={base} category={cat.slug} groups={groups} items={all.map(toFacet)} origins={origins} selected={sel} sort={sortParam} />
        {filtering && (
          <div className="app-ftags">
            {groups.flatMap((g) => (sel[g] ?? []).map((k) => (
              <Link key={`${g}:${k}`} className="app-ftag" href={withQuery(base, without(sel, g, k), sortParam)} scroll={false} aria-label={`Bỏ lọc ${optionName(g, k)}`}>
                {g === 'khac' ? optionName(g, k) : `${groupTitle(g, cat.slug)}: ${optionName(g, k)}`}
                <Icon name="close" />
              </Link>
            )))}
            <Link className="app-ftags__clear" href={withQuery(base, {}, sortParam)} scroll={false}>Xóa tất cả</Link>
          </div>
        )}
        <div className="fb-sort">
          <span>Sắp xếp:</span>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={withQuery(base, sel, s.key === 'pho-bien' ? undefined : s.key)}
              aria-current={activeSort === s.key ? 'true' : undefined}
              scroll={false}
              rel={s.key === 'pho-bien' ? undefined : 'nofollow'}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      {cat.slug === 'thuoc-bvtv' && <PesticideLookup slug={cat.slug} />}
      {cat.slug === 'cay-canh' && <AdvisorBanner sub={sub?.slug} />}
      {items.length ? (
        <ProductGrid products={items} />
      ) : filtering ? (
        <EmptyState
          icon="leaf"
          title="Không có sản phẩm phù hợp"
          action={<Link className="vx-btn vx-btn--outline" href={withQuery(base, {}, sortParam)} scroll={false}>Xóa bộ lọc</Link>}
        />
      ) : (
        <EmptyState
          icon="leaf"
          title="Chưa có sản phẩm"
          action={<Link className="vx-btn vx-btn--outline" href={`/danh-muc/${cat.slug}`}>Xem tất cả {cat.name}</Link>}
        />
      )}
    </>
  );
}
