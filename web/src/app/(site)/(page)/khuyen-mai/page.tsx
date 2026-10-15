import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Breadcrumb, EmptyState, SectionHeader } from '@/components/Blocks';
import { CopyVoucherCode } from '@/components/CopyVoucherCode';
import { Icon } from '@/components/Icon';
import { PostMeta, PostThumb } from '@/components/PostParts';
import { ProductGrid } from '@/components/ProductCard';
import { FACEBOOK_URL, SALES_PHONE, ZALO_URL } from '@/lib/contact';
import { discountPct, type Product } from '@/lib/catalog';
import { money } from '@/lib/format';
import { fmtDate } from '@/lib/order-labels';
import { categoryOf, postPath, SECTIONS } from '@/lib/posts';
import { voucherValueText, WELCOME_CODE, WELCOME_DAYS } from '@/lib/voucher-labels';
import { allProducts } from '@/server/catalog';
import { publishedPosts } from '@/server/posts';
import { listActiveVouchers } from '@/server/vouchers';

export const metadata: Metadata = {
  title: 'Tin khuyến mãi',
  description: 'Mã giảm giá đang áp dụng, sản phẩm đang giảm giá và tin ưu đãi, sự kiện của Cây Cảnh Miền Tây.',
  alternates: { canonical: '/khuyen-mai' },
};

const SALE_SHOWN = 12;
const NEWS_SHOWN = 6;

/** Mức giảm lớn nhất trong các quy cách của sản phẩm (0 = không giảm). */
const bestDiscount = (p: Product) => Math.max(0, ...p.options.map(discountPct));

const STEPS: [string, string][] = [
  ['Chép mã', 'Bấm "Chép mã" ở thẻ mã giảm giá bên trên.'],
  ['Chọn sản phẩm', 'Thêm sản phẩm vào giỏ hàng như bình thường.'],
  ['Dán mã khi thanh toán', 'Dán vào ô "Nhập mã giảm giá" ở trang thanh toán, số tiền giảm hiện ngay trước khi đặt.'],
];

/** Tin khuyến mãi: mã giảm giá thật (admin Khuyến mãi), sản phẩm đang giảm giá, bài tin khuyến mãi / sự kiện (admin Bài viết). */
export default async function PromotionsPage() {
  await connection(); // mã còn hiệu lực và giá giảm đổi theo thời gian thật — không cho build sinh trang tĩnh
  const [vouchers, products, posts] = await Promise.all([listActiveVouchers(), allProducts(), publishedPosts()]);

  const onSale = products
    .filter((p) => bestDiscount(p) > 0)
    .sort((a, b) => bestDiscount(b) - bestDiscount(a) || a.name.localeCompare(b.name, 'vi'));
  const news = posts.filter((p) => categoryOf(p.category)?.promo);

  return (
    <div className="pm-page">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tin khuyến mãi' }]} />
      <header className="pm-head">
        <h1>Tin khuyến mãi</h1>
        <nav className="pm-jump" aria-label="Chuyển nhanh">
          <a href="#ma-giam-gia" className="vx-chip">Mã giảm giá{vouchers.length > 0 && ` (${vouchers.length})`}</a>
          <a href="#dang-giam-gia" className="vx-chip">Đang giảm giá{onSale.length > 0 && ` (${onSale.length})`}</a>
          <a href="#tin-su-kien" className="vx-chip">Tin &amp; sự kiện</a>
        </nav>
      </header>

      <section id="ma-giam-gia" className="pm-sec">
        <SectionHeader icon="tag" title="Mã giảm giá đang áp dụng" />
        {vouchers.length > 0 ? (
          <div className="pm-vouchers">
            {vouchers.map((v) => (
              <div key={v.id} className="pm-voucher" data-kind={v.kind === 'ship' ? 'ship' : undefined}>
                <span className="pm-voucher__stub" aria-hidden="true">
                  <Icon name={v.code === WELCOME_CODE ? 'gift' : v.kind === 'ship' ? 'truck' : 'tag'} />
                  <b>{v.kind === 'ship' ? 'Freeship' : v.code === WELCOME_CODE ? 'Quà mới' : 'Giảm giá'}</b>
                </span>
                <span className="pm-voucher__body">
                  <span className="pm-voucher__txt">
                    <b>{v.label}</b>
                    <span>
                      {voucherValueText(v, money)} · {v.minOrder > 0 ? `Đơn từ ${money(v.minOrder)}` : 'Không điều kiện đơn tối thiểu'}
                    </span>
                    {v.code === WELCOME_CODE && (
                      <span>
                        Dành cho tài khoản mới: đăng nhập để dùng, trong {WELCOME_DAYS} ngày kể từ lần đăng nhập đầu tiên, mỗi tài khoản / số điện thoại {v.perCustomerLimit} lần.
                      </span>
                    )}
                    <span>
                      Mã: <b className="pm-code">{v.code}</b>
                      {v.endsAt && <span className="exp"> · Hết hạn {fmtDate(v.endsAt)}</span>}
                    </span>
                  </span>
                  <CopyVoucherCode code={v.code} text />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="tag" title="Hiện chưa có mã giảm giá nào" />
        )}
        <ol className="pm-steps" aria-label="Cách dùng mã giảm giá">
          {STEPS.map(([t, d], i) => (
            <li key={t}><span className="n">{i + 1}</span><span><b>{t}</b>{d}</span></li>
          ))}
        </ol>
        <ul className="pm-rules">
          <li>Mỗi đơn hàng dùng được <b>một mã giảm giá và một mã miễn phí giao</b>. Mã giảm giá tính trên tiền hàng sau khi đã trừ giá giảm của sản phẩm, chưa gồm phí giao.</li>
          <li>Mỗi mã có điều kiện riêng (đơn tối thiểu, hạn dùng, số lượt) — xem ngay trên thẻ mã. Mã hết lượt hoặc hết hạn thì trang thanh toán sẽ báo rõ.</li>
          <li>Đơn mua xong còn được tích điểm: xem <Link href="/chinh-sach/tich-diem">Thể lệ tích điểm</Link>.</li>
        </ul>
      </section>

      <section id="dang-giam-gia" className="pm-sec">
        <SectionHeader icon="bolt" title="Sản phẩm đang giảm giá" />
        {onSale.length > 0 ? (
          <>
            <ProductGrid products={onSale.slice(0, SALE_SHOWN)} />
            {onSale.length > SALE_SHOWN && (
              <p className="pm-more">Đang hiện {SALE_SHOWN} sản phẩm giảm nhiều nhất trong tổng số {onSale.length}. Các sản phẩm giảm giá còn lại xem trong từng danh mục ở menu bên trái.</p>
            )}
          </>
        ) : (
          <EmptyState icon="bolt" title="Chưa có sản phẩm nào đang giảm giá" />
        )}
      </section>

      <section id="tin-su-kien" className="pm-sec">
        <SectionHeader icon="gift" title="Tin khuyến mãi & sự kiện" href={news.length > NEWS_SHOWN ? `${SECTIONS.blog.path}?chuyen-muc=khuyen-mai` : undefined} />
        {news.length > 0 ? (
          <div className="vx-promo-row pm-news">
            {news.slice(0, NEWS_SHOWN).map((p) => (
              <Link key={p.id} href={postPath(p)} className="vx-promo-card">
                <PostThumb p={p} />
                <PostMeta p={p} />
                <b>{p.title}</b>
              </Link>
            ))}
          </div>
        ) : (
          <div className="pm-follow">
            <b>Chưa có tin khuyến mãi hay sự kiện mới</b>
            <span>Khi shop có chương trình ưu đãi, workshop hoặc phiên chợ cây, tin sẽ đăng ở đây. Bạn có thể nhận tin sớm qua Zalo và Facebook.</span>
            <span className="acts">
              <a className="vx-btn vx-btn--primary" href={ZALO_URL} target="_blank" rel="noreferrer">Nhắn Zalo shop</a>
              <a className="vx-btn vx-btn--outline" href={FACEBOOK_URL} target="_blank" rel="noreferrer">Theo dõi Facebook</a>
            </span>
          </div>
        )}
      </section>

      <div className="pm-contact">
        <Icon name="phone" size={28} />
        <span>
          <b>Cần tư vấn chọn ưu đãi phù hợp?</b>
          <span>Gọi tư vấn mua hàng 8:00 – 21:00 để được hướng dẫn dùng mã và chọn cây, vật tư.</span>
        </span>
        <a className="vx-btn" href={`tel:${SALES_PHONE}`}>{SALES_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a>
      </div>
    </div>
  );
}
