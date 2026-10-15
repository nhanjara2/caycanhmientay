import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb, SectionHeader } from '@/components/Blocks';
import { BuyBox } from '@/components/BuyBox';
import { Icon } from '@/components/Icon';
import { GalleryCol, ProductGallery } from '@/components/ProductGallery';
import { ProductGrid } from '@/components/ProductCard';
import { ProductQnA } from '@/components/ProductQnA';
import { ProductReviews } from '@/components/ProductReviews';
import { categoryLabel, elementName, isQuote, type Product } from '@/lib/catalog';
import { YOUTUBE_URL } from '@/lib/contact';
import { reviewStats } from '@/lib/reviews';
import { seoNameOf } from '@/lib/seo-name';
import { absoluteUrl } from '@/lib/site';
import { boughtTogether, getProduct } from '@/server/catalog';
import { getCurrentUser } from '@/server/auth';
import { getCategories } from '@/server/categories';
import { productFaqs } from '@/server/faqs';
import { productQuestions } from '@/server/questions';
import { productReviews } from '@/server/reviews';
import { isWishlisted } from '@/server/wishlist';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: 'Không tìm thấy' };
  // tên chi tiết đã đủ dài, không nối thêm "| Cây Cảnh Miền Tây" (Google cắt phần đuôi)
  const title = seoNameOf(p);
  return {
    title: { absolute: title }, description: p.lead,
    alternates: { canonical: `/san-pham/${p.slug}` },
    openGraph: { type: 'website', title, description: p.lead, images: p.images?.length ? [p.images[0]] : undefined },
  };
}

/** Schema Product (JSON-LD) để Google hiểu tên chi tiết, ảnh, giá, còn hàng; đánh giá chỉ ghi khi có đánh giá thật. */
function productJsonLd(p: Product, rating: { avg: number; count: number }) {
  const prices = p.options.filter((o) => !isQuote(o)).map((o) => o.price);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: seoNameOf(p),
    alternateName: p.name,
    sku: p.sku,
    description: p.lead,
    image: p.images?.length ? p.images.map(absoluteUrl) : undefined,
    brand: { '@type': 'Brand', name: 'Cây Cảnh Miền Tây' },
    offers: prices.length ? {
      '@type': 'AggregateOffer', priceCurrency: 'VND', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length,
      availability: p.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    } : undefined,
    aggregateRating: rating.count > 0 ? { '@type': 'AggregateRating', ratingValue: rating.avg.toFixed(1), reviewCount: rating.count } : undefined,
  };
}

function FengShuiBlock({ f }: { f: NonNullable<Product['fengshui']> }) {
  return (
    <>
      <h3 id="phong-thuy">Ý nghĩa phong thủy</h3>
      <dl className="app-fs">
        {f.elements.length > 0 && (
          <div><dt>Hợp mệnh</dt><dd>{f.elements.map((e) => <span key={e} className={`app-fs__el app-fs__el--${e}`}>{elementName(e)}</span>)}</dd></div>
        )}
        {f.ages && <div><dt>Hợp tuổi</dt><dd>{f.ages}</dd></div>}
        {f.placement && <div><dt>Vị trí đặt</dt><dd>{f.placement}</dd></div>}
      </dl>
      {f.meaning && <p style={{ whiteSpace: 'pre-line' }}>{f.meaning}</p>}
    </>
  );
}

function Content({ p, faq }: { p: Product; faq: boolean }) {
  const isPlant = p.ship === 'plant';
  return (
    <div className="vx-content">
      <nav className="vx-toc">
        <a href="#mo-ta" aria-current="true">Mô tả sản phẩm</a>
        {p.youtubeId && <a href="#video">Video</a>}
        {p.fengshui && <a href="#phong-thuy">Phong thủy</a>}
        <a href="#cach-dung">{isPlant ? 'Cách chăm sóc' : 'Cách sử dụng'}</a>
        <a href="#luu-y">Lưu ý</a>
        {faq && <a href="#hoi-dap">Câu hỏi thường gặp</a>}
      </nav>
      <article className="vx-article">
        <h2 id="mo-ta">{p.name} là gì?</h2>
        <p>{p.lead}</p>
        {p.youtubeId && (
          <>
            <h3 id="video">Video {isPlant ? 'thực tế tại vườn' : 'hướng dẫn'}</h3>
            <div className="app-yt">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${p.youtubeId}?rel=0`}
                title={`Video ${p.name}`}
                loading="lazy"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <p className="app-yt-more">
              Xem thêm video chăm cây trên <a href={YOUTUBE_URL} target="_blank" rel="noreferrer">kênh YouTube Cây Cảnh Miền Tây</a>
            </p>
          </>
        )}
        {p.fengshui && <FengShuiBlock f={p.fengshui} />}
        <h3 id="cach-dung">{isPlant ? 'Cách chăm sóc' : 'Cách sử dụng'}</h3>
        <ul>
          {p.specs.slice(0, 4).map(([k, v]) => (
            <li key={k}><b>{k}:</b> {v}.</li>
          ))}
        </ul>
        <div className="vx-note" id="luu-y">
          <Icon name="alert" />
          <div>
            {p.pesticide ? (
              <><b>Lưu ý an toàn:</b> Đọc kỹ hướng dẫn trên bao bì, đeo găng tay và khẩu trang khi pha, để xa tầm tay trẻ em và vật nuôi. Tuân thủ thời gian cách ly trước khi thu hoạch.</>
            ) : isPlant ? (
              <><b>Lưu ý:</b> Tuần đầu để cây chỗ sáng nhẹ cho quen môi trường rồi mới chuyển ra vị trí chính.</>
            ) : (
              <><b>Lưu ý:</b> Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.</>
            )}
          </div>
        </div>
        <div className="vx-expert">
          <span className="vx-avatar">KS</span>
          <div>
            <b>Kỹ sư nông nghiệp Trần Minh An</b> <span className="vx-badge vx-badge--success">Đã kiểm duyệt</span>
            <p>Tốt nghiệp ĐH Nông Lâm TP.HCM, 8 năm kinh nghiệm cây kiểng lá và bảo vệ thực vật.</p>
          </div>
        </div>
      </article>
    </div>
  );
}

/** ProductDetailLayout: breadcrumb → ProductGallery + BuyBox → ProductContent → Thường mua kèm → FAQ. */
export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const [together, user] = await Promise.all([boughtTogether(p), getCurrentUser()]);
  const [wishlisted, reviews, questions, faq] = await Promise.all([
    user ? isWishlisted(user.id, p.slug) : false,
    productReviews(p.slug, user?.id ?? null),
    productQuestions(p.slug, user),
    productFaqs(p),
  ]);
  // Số sao ở BuyBox tính từ đánh giá thật (products.rating/reviews là số mẫu, không dùng để hiển thị)
  const rs = reviewStats(reviews);
  const categories = await getCategories();
  const label = categoryLabel(categories, p.category, p.sub);
  const extra = (p.extraSubs ?? []).flatMap((s) => {
    const sub = categories.find((c) => c.slug === p.category)?.subs.find((x) => x.slug === s && x.active);
    return sub ? [{ slug: sub.slug, name: sub.name }] : [];
  });

  return (
    <div className="vx-pdpage app-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p, rs)).replace(/</g, '\\u003c') }} />
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: label.cat, href: `/danh-muc/${p.category}` },
          ...(label.sub ? [{ label: label.sub, href: `/danh-muc/${p.category}/${p.sub}` }] : []),
          { label: p.name },
        ]}
      />
      <section className="vx-pd">
        <GalleryCol>
          <ProductGallery p={p} />
          <p className="vx-gal__note">
            {p.ship === 'plant' ? 'Mỗi cây là một cá thể, dáng lá có thể khác đôi chút so với ảnh.' : 'Bao bì có thể thay đổi theo lô sản xuất.'}
          </p>
          <div className="vx-trust">
            <div><Icon name="truck" /><span><b>{p.ship === 'plant' ? 'Giao cây an toàn' : 'Giao nhanh 2h'}</b></span></div>
            <div><Icon name="shield" /><span><b>{p.ship === 'plant' ? 'Bảo hành 7 ngày' : 'Hàng chính hãng'}</b></span></div>
            <div><Icon name="chat" /><span><b>Kỹ sư tư vấn</b></span></div>
          </div>
        </GalleryCol>
        <BuyBox product={{ ...p, rating: rs.avg, reviews: rs.count }} category={{ ...label, extra }} wishlisted={wishlisted} />
      </section>

      <Content p={p} faq={faq.length > 0} />

      <section className="vx-card">
        <SectionHeader icon="cart" title="Thường mua kèm" />
        <ProductGrid products={together} />
      </section>

      {faq.length > 0 && (
        <section className="vx-card" id="hoi-dap">
          <h3 className="vx-card__title">Câu hỏi thường gặp</h3>
          <div className="vx-faq">
            {faq.map((f, i) => (
              <details key={f.id} open={i === 0}>
                <summary><span className="q">?</span>{f.question}<Icon name="chevron" /></summary>
                <p style={{ whiteSpace: 'pre-line' }}>{f.answer}</p>
              </details>
            ))}
          </div>
          {/* Schema FAQPage để Google hiện câu hỏi thường gặp trên kết quả tìm kiếm (thiết kế FAQ) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
              }).replace(/</g, '\\u003c'),
            }}
          />
        </section>
      )}

      <ProductReviews slug={p.slug} items={reviews} isPlant={p.ship === 'plant'} />
      <ProductQnA slug={p.slug} items={questions} pesticide={p.pesticide} />
    </div>
  );
}
