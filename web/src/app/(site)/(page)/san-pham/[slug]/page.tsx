import type { Metadata } from 'next';
import { Breadcrumb, SectionHeader } from '@/components/Blocks';
import { BuyBox } from '@/components/BuyBox';
import { Icon } from '@/components/Icon';
import { GalleryCol, ProductGallery } from '@/components/ProductGallery';
import { ProductGrid } from '@/components/ProductCard';
import { ProductQnA } from '@/components/ProductQnA';
import { ProductReviews } from '@/components/ProductReviews';
import { YouTubeLite } from '@/components/YouTubeLite';
import { youtubeEmbed } from '@/lib/posts';
import { categoryLabel, elementName, variantPosition, VARIANT_PARAM, type Product } from '@/lib/catalog';
import { YOUTUBE_URL } from '@/lib/contact';
import { reviewStats } from '@/lib/reviews';
import { seoNameOf } from '@/lib/seo-name';
import { clipText } from '@/lib/format';
import { boughtTogether, getProduct } from '@/server/catalog';
import { getCurrentUser } from '@/server/auth';
import { getCategories } from '@/server/categories';
import { productFaqs } from '@/server/faqs';
import { productQuestions } from '@/server/questions';
import { productReviews } from '@/server/reviews';
import { isWishlisted } from '@/server/wishlist';
import { getShippingConfig } from '@/server/shipping';
import { withShare } from '@/lib/seo';
import { movedOrNotFound, redirectIfMoved, withSeo } from '@/server/seo-cms';
import { JsonLd } from '@/components/JsonLd';
import { faqLd, productLd } from '@/lib/jsonld';
import { one, type SearchParams } from '@/lib/url-params';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return redirectIfMoved(`/san-pham/${slug}`).then(() => ({ title: 'Không tìm thấy' }));
  // tên chi tiết đã đủ dài, không nối thêm "| Cây Cảnh Miền Tây" (Google cắt phần đuôi)
  const title = seoNameOf(p);
  const description = clipText(p.lead, 170);
  return withSeo(withShare(
    { title: { absolute: title }, description, alternates: { canonical: `/san-pham/${p.slug}` } },
    // Ảnh chính đứng đầu — đổi ảnh chính ở admin là ảnh chia sẻ đổi theo (tên file ảnh mới).
    { images: p.images ?? [], alt: p.name },
  ));
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
            <YouTubeLite id={p.youtubeId} title={`Video ${p.name}`} src={youtubeEmbed(p.youtubeId)} />
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
export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);
  // Sản phẩm đã xóa / ẩn: có chuyển hướng (admin SEO) thì 308 sang trang mới, không thì 404.
  if (!p) return movedOrNotFound(`/san-pham/${slug}`);
  const [together, user] = await Promise.all([boughtTogether(p), getCurrentUser()]);
  const [wishlisted, reviews, questions, faq] = await Promise.all([
    user ? isWishlisted(user.id, p.slug) : false,
    productReviews(p.slug, user?.id ?? null),
    productQuestions(p.slug, user),
    productFaqs(p),
  ]);
  // Số sao ở BuyBox tính từ đánh giá thật (products.rating/reviews là số mẫu, không dùng để hiển thị)
  const rs = reviewStats(reviews);
  const [categories, shipping] = await Promise.all([getCategories(), getShippingConfig()]);
  const label = categoryLabel(categories, p.category, p.sub);
  const extra = (p.extraSubs ?? []).flatMap((s) => {
    const sub = categories.find((c) => c.slug === p.category)?.subs.find((x) => x.slug === s && x.active);
    return sub ? [{ slug: sub.slug, name: sub.name }] : [];
  });

  // ?quy-cach=<idx> (link trong file Google Merchant Center): mở sẵn đúng quy cách đó — khung giá + schema cùng giá dòng đã gửi Google.
  const selected = variantPosition(p.options, one((await searchParams)[VARIANT_PARAM]));

  return (
    <div className="vx-pdpage app-page">
      {/* Schema Product: giá quy cách chọn sẵn, còn / hết hàng, phí giao + đổi trả, đánh giá thật đang hiện (lib/jsonld.ts) */}
      <JsonLd data={productLd(p, {
        seoName: seoNameOf(p),
        category: [label.cat, label.sub].filter(Boolean).join(' > '),
        rating: rs,
        reviews: reviews.filter((r) => !r.mine),
        shipping,
        selected,
      })} />
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
          <ProductGallery p={p} start={p.options[selected]?.image} />
          <p className="vx-gal__note">
            {p.ship === 'plant' ? 'Mỗi cây là một cá thể, dáng lá có thể khác đôi chút so với ảnh.' : 'Bao bì có thể thay đổi theo lô sản xuất.'}
          </p>
          <div className="vx-trust">
            <div><Icon name="truck" /><span><b>{p.ship === 'plant' ? 'Giao cây an toàn' : 'Giao nhanh 2h'}</b></span></div>
            <div><Icon name="shield" /><span><b>{p.ship === 'plant' ? 'Bảo hành 7 ngày' : 'Hàng chính hãng'}</b></span></div>
            <div><Icon name="chat" /><span><b>Kỹ sư tư vấn</b></span></div>
          </div>
        </GalleryCol>
        <BuyBox product={{ ...p, rating: rs.avg, reviews: rs.count }} category={{ ...label, extra }} wishlisted={wishlisted} initialOpt={selected} />
      </section>

      <Content p={p} faq={faq.length > 0} />

      {together.length > 0 && (
        <section className="vx-card">
          <SectionHeader icon="cart" title="Thường mua kèm" />
          <ProductGrid products={together} />
        </section>
      )}

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
          <JsonLd data={faqLd(faq)} />
        </section>
      )}

      <ProductReviews slug={p.slug} items={reviews} isPlant={p.ship === 'plant'} />
      <ProductQnA slug={p.slug} items={questions} pesticide={p.pesticide} />
    </div>
  );
}
