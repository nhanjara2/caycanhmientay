import type { Metadata } from 'next';
import { Breadcrumb, SectionHeader } from '@/components/Blocks';
import { BuyBox } from '@/components/BuyBox';
import { Icon } from '@/components/Icon';
import { GalleryCol, ProductGallery } from '@/components/ProductGallery';
import { ProductGrid } from '@/components/ProductCard';
import { ProductQnA } from '@/components/ProductQnA';
import { ProductReviews } from '@/components/ProductReviews';
import { YouTubeLite } from '@/components/YouTubeLite';
import { PostBody } from '@/components/PostParts';
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
import { careFaqs, careNotes, careSteps } from '@/lib/plant-care';
import { productQuestions } from '@/server/questions';
import { productReviews } from '@/server/reviews';
import { isWishlisted } from '@/server/wishlist';
import { getShippingConfig } from '@/server/shipping';
import { withShare } from '@/lib/seo';
import { movedOrNotFound, redirectIfMoved, withSeo } from '@/server/seo-cms';
import { JsonLd } from '@/components/JsonLd';
import { faqLd, productLd } from '@/lib/jsonld';
import { one, type SearchParams } from '@/lib/url-params';
import { currentLang } from '@/i18n/request';

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

function FengShuiBlock({ f, en }: { f: NonNullable<Product['fengshui']>; en: boolean }) {
  const L = (vi: string, e: string) => (en ? e : vi);
  return (
    <>
      <h3 id="phong-thuy">{L('Ý nghĩa phong thủy', 'Feng shui meaning')}</h3>
      <dl className="app-fs">
        {f.elements.length > 0 && (
          <div><dt>{L('Hợp mệnh', 'Suits element')}</dt><dd>{f.elements.map((e) => <span key={e} className={`app-fs__el app-fs__el--${e}`}>{elementName(e)}</span>)}</dd></div>
        )}
        {f.ages && <div><dt>{L('Hợp tuổi', 'Suits age')}</dt><dd>{f.ages}</dd></div>}
        {f.placement && <div><dt>{L('Vị trí đặt', 'Placement')}</dt><dd>{f.placement}</dd></div>}
      </dl>
      {f.meaning && <p style={{ whiteSpace: 'pre-line' }}>{f.meaning}</p>}
    </>
  );
}

function Content({ p, faq, en }: { p: Product; faq: boolean; en: boolean }) {
  const L = (vi: string, e: string) => (en ? e : vi);
  const isPlant = p.ship === 'plant';
  const care = isPlant ? careSteps(p) : [];
  const notes = isPlant && care.length ? careNotes(p, en ? 'en' : 'vi') : [];
  return (
    <div className="vx-content">
      <nav className="vx-toc">
        <a href="#mo-ta" aria-current="true">{L('Mô tả sản phẩm', 'Description')}</a>
        {p.youtubeId && <a href="#video">Video</a>}
        {p.fengshui && <a href="#phong-thuy">{L('Phong thủy', 'Feng shui')}</a>}
        <a href="#cach-dung">{isPlant ? L('Cách chăm sóc', 'Care') : L('Cách sử dụng', 'How to use')}</a>
        <a href="#luu-y">{L('Lưu ý', 'Notes')}</a>
        {faq && <a href="#hoi-dap">{L('Câu hỏi thường gặp', 'FAQ')}</a>}
      </nav>
      <article className="vx-article">
        <h2 id="mo-ta">{L(`${p.name} là gì?`, `What is ${p.name}?`)}</h2>
        <p>{p.lead}</p>
        {p.body && <PostBody body={p.body} products={new Map()} title={p.name} />}
        {p.youtubeId && (
          <>
            <h3 id="video">{isPlant ? L('Video thực tế tại vườn', 'Video from our nursery') : L('Video hướng dẫn', 'How-to video')}</h3>
            <YouTubeLite id={p.youtubeId} title={`Video ${p.name}`} src={youtubeEmbed(p.youtubeId)} />
            <p className="app-yt-more">
              {L('Xem thêm video chăm cây trên', 'More plant-care videos on')} <a href={YOUTUBE_URL} target="_blank" rel="noreferrer">{L('kênh YouTube Cây Cảnh Miền Tây', 'the Cây Cảnh Miền Tây YouTube channel')}</a>
            </p>
          </>
        )}
        {p.fengshui && <FengShuiBlock f={p.fengshui} en={en} />}
        <h3 id="cach-dung">{isPlant ? L('Cách chăm sóc', 'Care guide') : L('Cách sử dụng', 'How to use')}</h3>
        <ul>
          {(care.length ? care : p.specs.slice(0, 4)).map(([k, v]) => (
            <li key={k}><b>{k}:</b> {v}.</li>
          ))}
        </ul>
        <div className="vx-note" id="luu-y">
          <Icon name="alert" />
          <div>
            {p.pesticide ? (
              <><b>{L('Lưu ý an toàn:', 'Safety:')}</b> {L('Đọc kỹ hướng dẫn trên bao bì, đeo găng tay và khẩu trang khi pha, để xa tầm tay trẻ em và vật nuôi. Tuân thủ thời gian cách ly trước khi thu hoạch.', 'Read the label carefully, wear gloves and a mask when mixing, keep away from children and pets, and respect the pre-harvest interval.')}</>
            ) : notes.length ? (
              <><b>{L('Lưu ý khi cây mới về:', 'When your plant arrives:')}</b><ul>{notes.map((n) => <li key={n}>{n}</li>)}</ul></>
            ) : isPlant ? (
              <><b>{L('Lưu ý:', 'Note:')}</b> {L('Tuần đầu để cây chỗ sáng nhẹ cho quen môi trường rồi mới chuyển ra vị trí chính.', 'Keep the plant in gentle light for the first week before moving it to its final spot.')}</>
            ) : (
              <><b>{L('Lưu ý:', 'Note:')}</b> {L('Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.', 'Store in a cool, dry place away from direct sunlight.')}</>
            )}
          </div>
        </div>
        <div className="vx-expert">
          <span className="vx-avatar">KS</span>
          <div>
            <b>{L('Kỹ sư nông nghiệp Trần Minh An', 'Agricultural engineer Trần Minh An')}</b> <span className="vx-badge vx-badge--success">{L('Đã kiểm duyệt', 'Reviewed')}</span>
            <p>{L('Tốt nghiệp ĐH Nông Lâm TP.HCM, 8 năm kinh nghiệm cây kiểng lá và bảo vệ thực vật.', 'Graduate of Nong Lam University HCMC, 8 years of experience with foliage plants and plant protection.')}</p>
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
  const en = (await currentLang()) === 'en';
  const L = (vi: string, e: string) => (en ? e : vi);
  const [together, user] = await Promise.all([boughtTogether(p), getCurrentUser()]);
  const [wishlisted, reviews, questions, faq] = await Promise.all([
    user ? isWishlisted(user.id, p.slug) : false,
    productReviews(p.slug, user?.id ?? null),
    productQuestions(p.slug, user),
    productFaqs(p),
  ]);
  // Câu admin nhập trước, rồi câu tự sinh từ thông số chăm sóc (bỏ câu trùng)
  // Bản tiếng Anh: câu hỏi admin nhập (tiếng Việt, chưa có bản dịch) không hiện
  const shopFaq = en ? [] : faq;
  const asked = new Set(shopFaq.map((f) => f.question.trim().toLowerCase()));
  const faqs = [
    ...shopFaq.map((f) => ({ key: `f${f.id}`, question: f.question, answer: f.answer })),
    ...(p.ship === 'plant' ? careFaqs(p, en ? 'en' : 'vi') : []).filter((f) => !asked.has(f.question.toLowerCase())).map((f, i) => ({ key: `c${i}`, ...f })),
  ];
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
          { label: L('Trang chủ', 'Home'), href: '/' },
          { label: label.cat, href: `/danh-muc/${p.category}` },
          ...(label.sub ? [{ label: label.sub, href: `/danh-muc/${p.category}/${p.sub}` }] : []),
          { label: p.name },
        ]}
      />
      <section className="vx-pd">
        <GalleryCol>
          <ProductGallery p={p} start={p.options[selected]?.image} />
          <p className="vx-gal__note">
            {p.ship === 'plant' ? L('Mỗi cây là một cá thể, dáng lá có thể khác đôi chút so với ảnh.', 'Every plant is unique; leaf shape may differ slightly from the photo.') : L('Bao bì có thể thay đổi theo lô sản xuất.', 'Packaging may vary by batch.')}
          </p>
          <div className="vx-trust">
            <div><Icon name="truck" /><span><b>{p.ship === 'plant' ? L('Giao cây an toàn', 'Safe plant delivery') : L('Giao nhanh 2h', 'Fast delivery')}</b></span></div>
            <div><Icon name="shield" /><span><b>{p.ship === 'plant' ? L('Bảo hành 7 ngày', '7-day warranty') : L('Hàng chính hãng', 'Genuine products')}</b></span></div>
            <div><Icon name="chat" /><span><b>{L('Kỹ sư tư vấn', 'Expert advice')}</b></span></div>
          </div>
        </GalleryCol>
        <BuyBox product={{ ...p, rating: rs.avg, reviews: rs.count }} category={{ ...label, extra }} wishlisted={wishlisted} initialOpt={selected} />
      </section>

      <Content p={p} faq={faqs.length > 0} en={en} />

      {together.length > 0 && (
        <section className="vx-card">
          <SectionHeader icon="cart" title={L('Thường mua kèm', 'Frequently bought together')} />
          <ProductGrid products={together} />
        </section>
      )}

      {faqs.length > 0 && (
        <section className="vx-card" id="hoi-dap">
          <h3 className="vx-card__title">{L('Câu hỏi thường gặp', 'Frequently asked questions')}</h3>
          <div className="vx-faq">
            {faqs.map((f, i) => (
              <details key={f.key} open={i === 0}>
                <summary><span className="q">?</span>{f.question}<Icon name="chevron" /></summary>
                <p style={{ whiteSpace: 'pre-line' }}>{f.answer}</p>
              </details>
            ))}
          </div>
          <JsonLd data={faqLd(faqs)} />
        </section>
      )}

      <ProductReviews slug={p.slug} items={reviews} isPlant={p.ship === 'plant'} />
      <ProductQnA slug={p.slug} items={questions} pesticide={p.pesticide} />
    </div>
  );
}
