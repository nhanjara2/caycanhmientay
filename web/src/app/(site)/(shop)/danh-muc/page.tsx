import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Blocks';
import { CategoryBlock } from '@/components/CategoryBlock';
import { FlashSale } from '@/components/FlashSale';
import { Icon, type IconName } from '@/components/Icon';
import { WHOLESALE_QUOTE_URL, WHOLESALE_URL } from '@/lib/partners';
import { flashProducts, productsIn } from '@/server/catalog';
import { menuCategories } from '@/server/categories';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';
import { JsonLd } from '@/components/JsonLd';
import { collectionLd } from '@/lib/jsonld';

// Lối tắt theo nhóm hàng đối tác hay lấy (09/10/2026 shop chuyển sang chỉ bán sỉ).
const COLLECTIONS: { label: string; icon: IconName; q?: string; hot?: boolean; href?: string }[] = [
  { label: 'Giảm sốc', icon: 'tag', q: 'giảm', hot: true },
  { label: 'Cây công trình', icon: 'trees', href: '/danh-muc/cay-canh/cay-cong-trinh' },
  { label: 'Cây sân vườn', icon: 'tree', href: '/danh-muc/cay-canh/cay-san-vuon' },
  { label: 'Cây văn phòng', icon: 'plant', href: '/danh-muc/cay-canh/cay-van-phong' },
  { label: 'Cây để bàn', icon: 'sprout', href: '/danh-muc/cay-canh/cay-de-ban' },
  { label: 'Cây Tết', icon: 'flower', href: '/cay-tet' },
  { label: 'Mùa mưa trị nấm', icon: 'rain', q: 'trị nấm' },
  { label: 'Phân bón', icon: 'fertilizer', href: '/danh-muc/phan-bon' },
  { label: 'Chậu cây', icon: 'pot', href: '/danh-muc/chau' },
];

const QUICK: { label: string; icon: IconName; href: string }[] = [
  { label: 'Đăng ký đối tác', icon: 'user', href: `${WHOLESALE_URL}#dang-ky` },
  { label: 'Gửi báo giá sỉ', icon: 'receipt', href: WHOLESALE_QUOTE_URL },
  { label: 'Bắt bệnh cho cây', icon: 'bug', href: '/benh-cay' },
  { label: 'Góc chăm cây', icon: 'leaf', href: '/goc-cham-cay' },
  { label: 'Đơn của tôi', icon: 'receipt', href: '/tai-khoan/don-hang' },
  { label: 'Tìm vườn ươm', icon: 'pin', href: '/he-thong-cua-hang' },
];

const DESCRIPTION = 'Tất cả sản phẩm của Cây Cảnh Miền Tây: cây để bàn, văn phòng, trong nhà, sân vườn, công trình cùng chậu, phân bón, vật tư. Giá tại vườn, giao toàn quốc.';

export const generateMetadata = (): Promise<Metadata> => withSeo(withShare({
  title: 'Tất cả sản phẩm',
  description: DESCRIPTION,
  alternates: { canonical: '/danh-muc' },
}));

/** Trang danh mục tổng (trước 09/10/2026 là trang chủ): lối tắt nhóm hàng, Flash sale, mỗi danh mục một khối sản phẩm. */
export default async function AllProductsPage() {
  const [flash, blocks] = await Promise.all([
    flashProducts(),
    menuCategories().then((list) => Promise.all(list.map(async (c) => ({ category: c, products: await productsIn(c.slug) })))),
  ]);
  const total = blocks.reduce((n, b) => n + b.products.length, 0);
  // Lối tắt tới danh mục / nhóm con chưa có hàng thì ẩn (cùng luật menuCategories).
  const shown = new Set(blocks.flatMap(({ category: c }) => [`/danh-muc/${c.slug}`, ...c.subs.map((s) => `/danh-muc/${c.slug}/${s.slug}`)]));
  const collections = COLLECTIONS.filter((c) => !c.href?.startsWith('/danh-muc/') || shown.has(c.href));
  return (
    <>
      {/* ItemList = đúng các thẻ đang hiện: 8 sản phẩm đầu của mỗi khối danh mục (CategoryBlock). */}
      <JsonLd data={collectionLd({ path: '/danh-muc', name: 'Tất cả sản phẩm', description: DESCRIPTION, products: blocks.flatMap((b) => b.products.slice(0, 8)) })} />
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tất cả sản phẩm' }]} />
      <div className="pl-head">
        <h1>Tất cả sản phẩm <small>{total} sản phẩm</small></h1>
      </div>

      <nav className="vx-strip" aria-label="Bộ sưu tập">
        {collections.map((c) => (
          <Link key={c.label} href={c.href ?? `/tim-kiem?q=${encodeURIComponent(c.q ?? '')}`} className={`vx-strip__item app-plain${c.hot ? ' hot' : ''}`}>
            <span className="vx-strip__img"><Icon name={c.icon} /></span>
            {c.label}
          </Link>
        ))}
      </nav>

      <Link href={WHOLESALE_URL} className="vx-banner app-plain">
        <b>Mua 2 cây cùng loại có giá combo · giá sỉ công trình liên hệ báo giá</b>
        <span>Đối tác dịch vụ, công trình, buôn bán đăng ký để nhận chiết khấu riêng</span>
      </Link>

      <nav className="vx-quick" aria-label="Lối tắt">
        {QUICK.map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className="vx-quick__item app-plain"
            {...(q.href.startsWith('http') && { target: '_blank', rel: 'noreferrer' })}
          >
            <span className="vx-quick__icon"><Icon name={q.icon} /></span>
            {q.label}
          </Link>
        ))}
      </nav>

      <FlashSale products={flash} />

      {blocks.map((b) => <CategoryBlock key={b.category.slug} category={b.category} products={b.products} />)}
    </>
  );
}
