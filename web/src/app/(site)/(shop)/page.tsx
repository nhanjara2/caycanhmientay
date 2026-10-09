import Link from 'next/link';
import { CategoryBlock } from '@/components/CategoryBlock';
import { FlashSale } from '@/components/FlashSale';
import { Icon, type IconName } from '@/components/Icon';
import { money } from '@/lib/format';
import { WHOLESALE_QUOTE_URL, WHOLESALE_URL } from '@/lib/partners';
import { flashProducts, productsIn } from '@/server/catalog';
import { menuCategories } from '@/server/categories';
import { getShippingConfig } from '@/server/shipping';

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
  { label: 'Tra cứu thuốc BVTV', icon: 'flask', href: '/danh-muc/thuoc-bvtv' },
  { label: 'Đơn của tôi', icon: 'receipt', href: '/tai-khoan/don-hang' },
  { label: 'Tìm vườn ươm', icon: 'pin', href: '/he-thong-cua-hang' },
];

export default async function HomePage() {
  const [flash, blocks, cfg] = await Promise.all([
    flashProducts(),
    menuCategories().then((list) => Promise.all(list.map(async (c) => ({ category: c, products: await productsIn(c.slug) })))),
    getShippingConfig(),
  ]);
  return (
    <>
      <nav className="vx-strip" aria-label="Bộ sưu tập">
        {COLLECTIONS.map((c) => (
          <Link key={c.label} href={c.href ?? `/tim-kiem?q=${encodeURIComponent(c.q ?? '')}`} className={`vx-strip__item app-plain${c.hot ? ' hot' : ''}`}>
            <span className="vx-strip__img"><Icon name={c.icon} /></span>
            {c.label}
          </Link>
        ))}
      </nav>

      <Link href={WHOLESALE_URL} className="vx-banner app-plain">
        <b>Giá sỉ cho đối tác dịch vụ, công trình, buôn bán</b>
        <span>{cfg.minOrder > 0 ? `Đơn từ ${money(cfg.minOrder)} · ` : ''}Đăng ký đối tác để nhận chiết khấu riêng</span>
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
