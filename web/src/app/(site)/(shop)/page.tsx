import Link from 'next/link';
import { CategoryBlock } from '@/components/CategoryBlock';
import { FlashSale } from '@/components/FlashSale';
import { Icon, type IconName } from '@/components/Icon';
import { categories } from '@/lib/catalog';
import { ZALO_URL } from '@/lib/contact';
import { flashProducts, productsIn } from '@/server/catalog';

const COLLECTIONS: { label: string; icon: IconName; q: string; hot?: boolean; href?: string }[] = [
  { label: 'Giảm sốc', icon: 'tag', q: 'giảm', hot: true },
  { label: 'Cây Tết', icon: 'flower', q: 'lan', href: '/cay-tet' },
  { label: 'Mùa mưa trị nấm', icon: 'rain', q: 'trị nấm' },
  { label: 'Ban công nhỏ', icon: 'home', q: 'chậu treo' },
  { label: 'Quà khai trương', icon: 'gift', q: 'kim tiền' },
  { label: 'Cây văn phòng', icon: 'plant', q: 'để bàn' },
  { label: 'Người mới chơi cây', icon: 'sprout', q: 'lưỡi hổ' },
  { label: 'Rau sạch tại nhà', icon: 'leaf', q: 'hạt giống' },
  { label: 'Combo tiết kiệm', icon: 'box', q: 'combo' },
];

const QUICK: { label: string; icon: IconName; href: string }[] = [
  { label: 'Tư vấn chăm cây', icon: 'chat', href: ZALO_URL },
  { label: 'Bắt bệnh cho cây', icon: 'bug', href: '/benh-cay' },
  { label: 'Tra cứu thuốc BVTV', icon: 'flask', href: '/danh-muc/thuoc-bvtv' },
  { label: 'Đơn của tôi', icon: 'receipt', href: '/tai-khoan/don-hang' },
  { label: 'Tìm cửa hàng', icon: 'pin', href: '/he-thong-cua-hang' },
  { label: 'Quà tặng cây', icon: 'gift', href: '/tim-kiem?q=combo' },
];

export default async function HomePage() {
  const [flash, blocks] = await Promise.all([
    flashProducts(),
    Promise.all(categories.map(async (c) => ({ category: c, products: await productsIn(c.slug) }))),
  ]);
  return (
    <>
      <nav className="vx-strip" aria-label="Bộ sưu tập">
        {COLLECTIONS.map((c) => (
          <Link key={c.label} href={c.href ?? `/tim-kiem?q=${encodeURIComponent(c.q)}`} className={`vx-strip__item app-plain${c.hot ? ' hot' : ''}`}>
            <span className="vx-strip__img"><Icon name={c.icon} /></span>
            {c.label}
          </Link>
        ))}
      </nav>

      <Link href="/khuyen-mai" className="vx-banner app-plain">
        <b>Mùa mưa – Phòng nấm cho cây</b>
        <span>Giảm đến 30% thuốc sinh học, giá thể thoát nước</span>
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
