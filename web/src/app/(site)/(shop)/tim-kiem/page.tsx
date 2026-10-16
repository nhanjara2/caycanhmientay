import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb, EmptyState } from '@/components/Blocks';
import { ProductGrid } from '@/components/ProductCard';
import { findCategory } from '@/lib/catalog';
import { allProducts, searchProducts } from '@/server/catalog';
import { getCategories } from '@/server/categories';
import { sortProducts } from '@/lib/sort';
import { one, redirectIfNotCanonical, type SearchParams } from '@/lib/url-params';

type Props = { searchParams: Promise<SearchParams> };

/** Từ khóa tối đa 100 ký tự / 10 từ — chuỗi dài bất thường không làm phình URL, tiêu đề và thời gian tìm. */
const SEARCH_MAX = 100;
const SEARCH_MAX_WORDS = 10;

/** Từ khóa sạch: bỏ ký tự điều khiển / ký tự vô hình, gộp khoảng trắng, cắt độ dài. */
function cleanQuery(raw: string | undefined) {
  return (raw ?? '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, ' ')
    .replace(/\s+/g, ' ').trim().split(' ').slice(0, SEARCH_MAX_WORDS).join(' ').slice(0, SEARCH_MAX).trim();
}

/**
 * Tìm kiếm trong shop (mục 6.4 checklist SEO): mọi trang kết quả noindex (robots.txt cũng chặn /tim-kiem — không index hàng
 * loạt truy vấn tùy ý, không thành bẫy bò); từ khóa được làm sạch và URL chuyển về dạng chuẩn (308) nên chuỗi lạ không
 * làm hỏng URL / HTML (React tự escape chữ). Không có kết quả → khung "Không tìm thấy" (vẫn noindex).
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = cleanQuery(one((await searchParams).q));
  return { title: q ? `Tìm “${q}”` : 'Tìm kiếm', robots: { index: false, follow: true } };
}

// Từ khóa đặc biệt từ SidebarMenu/CollectionStrip.
async function run(q: string, nhom?: string) {
  if (q === 'giảm') return (await allProducts()).filter((p) => p.options.some((o) => o.oldPrice));
  if (q === 'bán chạy') return sortProducts(await allProducts(), 'ban-chay').slice(0, 12);
  const cats = await getCategories();
  const found = await searchProducts(q, (slug) => findCategory(cats, slug)?.name);
  // ?nhom=<danh mục>: tra cứu trong một danh mục (vd. ô "Tra cứu thuốc" ở trang Thuốc BVTV)
  return nhom ? found.filter((p) => p.category === nhom) : found;
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = cleanQuery(one(sp.q));
  const nhom = findCategory(await getCategories(), one(sp.nhom) ?? '');
  redirectIfNotCanonical('/tim-kiem', sp, [['q', q], ['nhom', q ? nhom?.slug : undefined]]);
  const items = q ? await run(q, nhom?.slug) : [];

  return (
    <>
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tìm kiếm' }]} />
      <div className="pl-head">
        <h1>
          {q ? <>Kết quả cho “{q}”{nhom && <> trong {nhom.name}</>}</> : 'Tìm kiếm'} <small>{items.length} sản phẩm</small>
        </h1>
      </div>
      {items.length ? (
        <ProductGrid products={items} level={2} />
      ) : (
        <EmptyState
          icon="search"
          title={q ? 'Không tìm thấy sản phẩm phù hợp' : 'Nhập từ khóa để tìm'}
          action={<Link className="vx-btn vx-btn--primary" href="/">Về trang chủ</Link>}
        />
      )}
    </>
  );
}
