import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AdvisorBanner } from '@/components/AdvisorBanner';
import { Breadcrumb, EmptyState } from '@/components/Blocks';
import { Icon } from '@/components/Icon';
import { PesticideLookup } from '@/components/PesticideLookup';
import { ProductFilters } from '@/components/ProductFilters';
import { Pager } from '@/components/Pager';
import { ProductGrid } from '@/components/ProductCard';
import {
  canonicalSel, filterProducts, groupsFor, groupTitle, originOptions, parseSel, queryPairs, selectedCount, staticOptions, toFacet, withQuery, without,
} from '@/lib/product-filters';
import { pageSuffix } from '@/lib/posts';
import { one, pageOf, redirectIfNotCanonical, withParams, type SearchParams } from '@/lib/url-params';
import { categorySeo, introParagraphs } from '@/lib/category-seo';
import { productsIn } from '@/server/catalog';
import { getCategory } from '@/server/categories';
import { SORTS, sortProducts } from '@/lib/sort';
import { withShare } from '@/lib/seo';
import { movedOrNotFound, redirectIfMoved, withSeo } from '@/server/seo-cms';
import { JsonLd } from '@/components/JsonLd';
import { collectionLd } from '@/lib/jsonld';
import { listingRobots } from '@/lib/seo-rules';

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Số sản phẩm mỗi trang — danh mục đông hơn thì có ?trang=2, 3… (mỗi trang một URL, link <a> thật). */
const PER_PAGE = 48;

/** Sắp xếp hợp lệ khác mặc định ("Phổ biến" = không ghi tham số). */
const sortOf = (sp: SearchParams) => {
  const k = one(sp.sap_xep);
  return k && k !== 'pho-bien' && SORTS.some((s) => s.key === k) ? k : undefined;
};

/** generateMetadata và trang dùng chung một lần đọc database trong cùng request. */
const listOf = cache((cat: string, sub?: string) => productsIn(cat, sub));

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
 * Danh mục / nhóm con chưa có sản phẩm nào cũng noindex (trang trống = soft 404); có hàng lại là tự index.
 * Phân trang (mục 6 checklist): trang 2, 3… của danh sách gốc là trang chuẩn riêng (canonical tự trỏ chính nó, title
 * "· Trang n") — không gộp về trang 1 vì mỗi trang có sản phẩm khác nhau.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const r = await resolve(slug);
  if (!r) return redirectIfMoved(`/danh-muc/${slug.join('/')}`).then(() => ({ title: 'Không tìm thấy' }));
  const sp = await searchParams;
  const varied = !!sortOf(sp) || selectedCount(parseSel(sp, groupsFor(r.cat.slug), r.cat.slug)) > 0;
  const list = await listOf(r.cat.slug, r.sub?.slug);
  const empty = !list.length;
  const page = varied ? 1 : Math.min(pageOf(sp.trang), Math.max(1, Math.ceil(list.length / PER_PAGE)));
  const base = r.sub ? `/danh-muc/${r.cat.slug}/${r.sub.slug}` : `/danh-muc/${r.cat.slug}`;
  // Tiêu đề / mô tả: admin viết ở /admin/danh-muc, không có thì tự tạo từ tên + sản phẩm đang bán.
  const seo = categorySeo(r.sub ?? r.cat, list.map((p) => p.name));
  return withSeo(withShare({
    title: seo.title + pageSuffix(page),
    description: seo.description + (page > 1 ? pageSuffix(page, ' ') + '.' : ''),
    alternates: { canonical: page > 1 ? `${base}?trang=${page}` : base },
    robots: listingRobots(varied, empty),
  }, {
    // Ảnh chia sẻ = ảnh chính của sản phẩm đầu tiên có ảnh trong danh mục (đúng thứ tự trang đang hiện).
    images: [list.find((p) => p.images?.length)?.images?.[0]], alt: seo.title,
  }));
}

/** ProductListingLayout: tiêu đề + danh mục con + bộ lọc đa chọn + sắp xếp + lưới 4 cột. Bộ lọc nằm trên đường dẫn (?vi-tri=…&mau=…). */
export default async function CategoryPage({ params, searchParams }: Props) {
  const slug = (await params).slug;
  const r = await resolve(slug);
  if (!r) return movedOrNotFound(`/danh-muc/${slug.join('/')}`);
  const { cat, sub } = r;
  const sp = await searchParams;
  const groups = groupsFor(cat.slug);
  const all = await listOf(cat.slug, sub?.slug);
  const origins = originOptions(all);
  const sel = canonicalSel(parseSel(sp, groups, cat.slug), origins);
  const sortParam = sortOf(sp);
  const activeSort = sortParam ?? 'pho-bien';
  const items = sortProducts(filterProducts(all, sel), sortParam);
  const base = sub ? `/danh-muc/${cat.slug}/${sub.slug}` : `/danh-muc/${cat.slug}`;
  const filtering = selectedCount(sel) > 0;
  // Mỗi tổ hợp lọc / sắp xếp / trang chỉ một URL: giá trị sai, nhà vườn không có trong danh mục, thứ tự khác, tham số lạ,
  // ?trang=1 / 0 / abc → chuyển hẳn (308) về dạng chuẩn. Quá số trang → trang cuối (307, vì số trang đổi theo số sản phẩm).
  const pageParam = one(sp.trang);
  const asked = pageOf(sp.trang);
  redirectIfNotCanonical(base, sp, [...queryPairs(sel, sortParam), ['trang', asked > 1 ? pageParam : undefined]]);
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const pageHref = (n: number) => withParams(base, [...queryPairs(sel, sortParam), ['trang', n > 1 ? n : undefined]]);
  if (asked > pages) redirect(pageHref(pages));
  const page = asked;
  const shown = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  // Link mang bộ lọc / sắp xếp dẫn tới trang noindex → nofollow, để Google không bò hết các tổ hợp lọc.
  const varied = filtering || !!sortParam;
  const optionName = (g: (typeof groups)[number], key: string) =>
    (g === 'nha-vuon' ? origins : staticOptions(g, cat.slug)).find((o) => o.key === key)?.name ?? key;

  // Schema danh sách chỉ ở trang gốc (đang lọc / sắp xếp là trang noindex, thứ tự khác trang gốc).
  const canonicalView = !varied;

  return (
    <>
      {canonicalView && (
        <JsonLd data={collectionLd({ path: pageHref(page), name: (sub?.name ?? cat.name) + pageSuffix(page), description: categorySeo(sub ?? cat, all.map((p) => p.name)).description, products: shown })} />
      )}
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
              rel={varied ? 'nofollow' : undefined}
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
              <Link key={`${g}:${k}`} className="app-ftag" href={withQuery(base, without(sel, g, k), sortParam)} rel="nofollow" scroll={false} aria-label={`Bỏ lọc ${optionName(g, k)}`}>
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
              rel={s.key !== 'pho-bien' || filtering ? 'nofollow' : undefined}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      {cat.slug === 'thuoc-bvtv' && <PesticideLookup slug={cat.slug} />}
      {cat.slug === 'cay-canh' && <AdvisorBanner sub={sub?.slug} />}
      {items.length ? (
        <>
          <ProductGrid products={shown} level={2} />
          <Pager page={page} pages={pages} href={pageHref} nofollow={varied} />
          {canonicalView && page === 1 && <CategoryIntro paragraphs={introParagraphs((sub ?? cat).intro)} />}
        </>
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

/** Đoạn giới thiệu admin viết (/admin/danh-muc) — chỉ trang 1 chưa lọc, để các trang 2, 3… và trang lọc không lặp nội dung. */
function CategoryIntro({ paragraphs }: { paragraphs: string[] }) {
  if (!paragraphs.length) return null;
  return <section className="app-catintro">{paragraphs.map((t, i) => <p key={i}>{t}</p>)}</section>;
}
