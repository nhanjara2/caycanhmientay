/**
 * Dữ liệu có cấu trúc schema.org (JSON-LD) — mục 5 checklist SEO. Hàm thuần, dùng chung server / client, kiểm thử được
 * không cần database (`npm run test:jsonld`); in ra trang bằng `<JsonLd data={…} />` (components/JsonLd.tsx).
 *
 * Mỗi loại trang một schema, lấy từ CHÍNH dữ liệu trang đang hiện (không viết cứng giá, tồn, đánh giá):
 *  - trang chủ: Organization + WebSite;  Hệ thống cửa hàng: GardenStore cho từng cửa hàng của shop đang hiện;
 *  - sản phẩm: Product (+ Offer kèm phí giao + chính sách đổi trả, đánh giá thật) + FAQPage khi có câu hỏi thường gặp;
 *  - danh mục / nhóm con / tất cả sản phẩm: CollectionPage + ItemList các sản phẩm đang hiện;
 *  - bài viết: BlogPosting (Góc chăm cây) / NewsArticle (Truyền thông) / VideoObject (bài video có ảnh);
 *  - bài bệnh cây: Article;  mọi trang có breadcrumb: BreadcrumbList (sinh từ chính component <Breadcrumb>).
 * Thực thể dùng chung có `@id` ổn định (`ORG_ID`, `WEBSITE_ID`, `<url>#product`…) để các schema trỏ về nhau.
 * Không làm (chưa có nội dung đúng loại): HowTo (Google đã bỏ), QAPage (trang sản phẩm không phải trang một câu hỏi),
 * Event, Recipe, SoftwareApplication. Kiểm trên trang đã dựng bằng `npm run seo:schema -- <địa chỉ web>`.
 */
import { brandOf, cheapestOption, isQuote, pricedOptions, variantPath, type Product, type ShipGroup, type Unit } from './catalog';
import { CARE_PHONE, FACEBOOK_URL, LEGAL, SALES_PHONE, SHOP_ADDRESS, SHOP_EMAIL, LINKEDIN_URL, SUPPORT_PHONE, TIKTOK_URL, YOUTUBE_URL } from './contact';
import { computeTotals } from './pricing';
import { DEFAULT_SHARE_IMAGE, SITE_NAME } from './seo';
import { SHIP_REGIONS, type ShippingConfig } from './shipping';
import { absoluteUrl, SITE_ORIGIN } from './site';
import type { PublicStore } from './stores';
import { SUPPLY_RETURN_DAYS } from './warranty-labels';

type Json = Record<string, unknown>;
const CONTEXT = 'https://schema.org';

export const ORG_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const LOGO = '/icons/icon-512.png';
/** Năm thành lập — trùng trang Giới thiệu. */
const FOUNDED = '2007';
/** Giờ trực hotline — trùng chân trang / lib/contact.ts. */
const HOTLINE_HOURS = { opens: '08:00', closes: '21:00' };
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => `https://schema.org/${d}`);

/** 0703005001 → +84703005001 */
export const intlPhone = (p: string) => p.replace(/\D/g, '').replace(/^0/, '+84');

/** Bỏ undefined / null / chuỗi rỗng / NaN / mảng rỗng / object rỗng (đệ quy) — JSON-LD không có ô trống. */
export function cleanLd<T>(v: T): T | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') return v.trim() ? v : undefined;
  if (Array.isArray(v)) {
    const out = v.map(cleanLd).filter((x) => x !== undefined);
    return (out.length ? out : undefined) as T | undefined;
  }
  if (v instanceof Date) return (Number.isNaN(v.getTime()) ? undefined : v.toISOString()) as T;
  if (typeof v === 'object') {
    const out: Json = {};
    for (const [k, x] of Object.entries(v)) {
      const c = cleanLd(x);
      if (c !== undefined) out[k] = c;
    }
    // còn mỗi @type / @context thì coi như rỗng
    return (Object.keys(out).some((k) => !k.startsWith('@')) || out['@id'] ? out : undefined) as T | undefined;
  }
  return v;
}

/** Chuỗi đặt vào <script type="application/ld+json">: escape để chữ trong dữ liệu (vd. "</script>") không đóng thẻ sớm. */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(cleanLd(data) ?? {})
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/** Tham chiếu tới tổ chức (đủ tên + url để đọc riêng một trang vẫn hiểu). */
export const orgRef = () => ({ '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: `${SITE_ORIGIN}/`, logo: absoluteUrl(LOGO) });

const date = (d: Date | number | null | undefined) => (d == null ? undefined : new Date(d).toISOString());

// ---------------------------------------------------------------- toàn website (trang chủ)

export function organizationLd(): Json {
  const contact = (telephone: string, contactType: string) => ({
    '@type': 'ContactPoint', telephone: intlPhone(telephone), contactType, areaServed: 'VN', availableLanguage: ['vi'],
    hoursAvailable: { '@type': 'OpeningHoursSpecification', dayOfWeek: ALL_DAYS, ...HOTLINE_HOURS },
  });
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': ORG_ID,
    name: LEGAL.name,
    url: `${SITE_ORIGIN}/`,
    logo: { '@type': 'ImageObject', url: absoluteUrl(LOGO), width: 512, height: 512 },
    image: absoluteUrl(DEFAULT_SHARE_IMAGE.url),
    email: SHOP_EMAIL,
    telephone: intlPhone(SALES_PHONE),
    foundingDate: FOUNDED,
    address: { '@type': 'PostalAddress', streetAddress: SHOP_ADDRESS, addressCountry: 'VN' },
    contactPoint: [contact(SALES_PHONE, 'sales'), contact(CARE_PHONE, 'technical support'), contact(SUPPORT_PHONE, 'customer service')],
    sameAs: [FACEBOOK_URL, YOUTUBE_URL, TIKTOK_URL, LINKEDIN_URL],
  };
}

export function websiteLd(): Json {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    alternateName: new URL(SITE_ORIGIN).hostname.replace(/^www\./, ''),
    url: `${SITE_ORIGIN}/`,
    inLanguage: 'vi',
    publisher: { '@id': ORG_ID },
  };
}

// ---------------------------------------------------------------- breadcrumb

export type Crumb = { label: string; href?: string };

export const HOME_CRUMB: Crumb = { label: 'Trang chủ', href: '/' };

/**
 * Luật chung của breadcrumb (mục 7 checklist SEO) — component <Breadcrumb> hiện đúng danh sách này và BreadcrumbList
 * dựng từ chính nó nên hai bên luôn khớp:
 *  - luôn bắt đầu bằng "Trang chủ" (/) đúng một lần — trang nào quên thì tự thêm, "Trang chủ" lặp ở giữa bị bỏ;
 *  - bỏ phần "#mục" của link (không phải một tầng riêng), bỏ mục trùng URL với một mục trước nó
 *    (vd. "Đối tác sỉ" → "Công trình" cùng trỏ /doi-tac);
 *  - mục cuối là trang đang xem: không có link; tên rỗng bị bỏ.
 */
export function normalizeCrumbs(items: Crumb[]): Crumb[] {
  const out: Crumb[] = [HOME_CRUMB];
  const seen = new Set<string>(['/']);
  for (const it of items) {
    const label = it.label.trim();
    if (!label) continue;
    const href = it.href === undefined ? undefined : it.href.split('#')[0] || '/';
    if (href !== undefined) {
      if (seen.has(href)) continue;
      seen.add(href);
    }
    out.push({ label, href });
  }
  if (out.length > 1) out[out.length - 1] = { label: out[out.length - 1].label };
  return out;
}

/** BreadcrumbList đúng như breadcrumb đang hiện (`normalizeCrumbs`). Ít hơn 2 mục thì không có schema. */
export function breadcrumbLd(items: Crumb[]): Json | null {
  const list = normalizeCrumbs(items);
  if (list.length < 2) return null;
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.label, item: x.href ? absoluteUrl(x.href) : undefined })),
  };
}

// ---------------------------------------------------------------- sản phẩm

const IN_STOCK = 'https://schema.org/InStock';
const OUT_OF_STOCK = 'https://schema.org/OutOfStock';
const SO = (x: string) => `https://schema.org/${x}`;

export type LdReview = { name: string; stars: number; content: string; createdAt: number };

/**
 * Phí giao khi mua MỘT đơn vị quy cách này, giao tận nơi — tính bằng chính `computeTotals` của giỏ hàng (đủ mức miễn phí giao
 * → 0đ, cây lớn cộng phụ phí). Phí cây sống khác nhau theo vùng thì khai mức CAO nhất cho cả nước (không bao giờ thấp hơn số
 * khách trả). Bật giới hạn bán kính giao cây sống → không khai (Google không có cách ghi "trong X km quanh cửa hàng").
 * Không khai thời gian giao: shop không hẹn số ngày cố định (Chính sách giao hàng).
 */
export function shippingFeeFor(ship: ShipGroup, u: Pick<Unit, 'price' | 'bulky'>, s: ShippingConfig): number | undefined {
  if (ship === 'plant' && s.plantZoneEnabled) return undefined;
  const region = SHIP_REGIONS.reduce((a, r) => (s.plant.regionFee[r] > s.plant.regionFee[a] ? r : a));
  const t = computeTotals([{ price: u.price, qty: 1, ship, bulky: u.bulky }], 'ship', 0, s, 0, region);
  return t.plantShip + t.supplyShip;
}

/** OfferShippingDetails theo `shippingFeeFor` (cũng dùng cho g:shipping của file Google Merchant Center). */
export function shippingDetailsLd(ship: ShipGroup, u: Pick<Unit, 'price' | 'bulky'>, s: ShippingConfig): Json | undefined {
  const fee = shippingFeeFor(ship, u, s);
  if (fee == null) return undefined;
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: fee, currency: 'VND' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'VN' },
  };
}

/**
 * Chính sách đổi trả đúng như trang /chinh-sach/doi-tra: cây sống không nhận trả (hàng tươi sống — hư, héo, bệnh xử lý bằng
 * bảo hành đổi cây / hoàn tiền, khách không gửi cây về); vật tư chưa mở bao bì đổi trả trong `SUPPLY_RETURN_DAYS` ngày, gửi về
 * hoặc mang tới vườn, lỗi của shop thì shop chịu phí, đổi ý thì khách tự gửi.
 */
export function returnPolicyLd(ship: ShipGroup): Json {
  const base = { '@type': 'MerchantReturnPolicy', applicableCountry: 'VN', merchantReturnLink: absoluteUrl('/chinh-sach/doi-tra') };
  if (ship === 'plant') return { ...base, returnPolicyCategory: SO('MerchantReturnNotPermitted') };
  return {
    ...base,
    returnPolicyCountry: 'VN',
    returnPolicyCategory: SO('MerchantReturnFiniteReturnWindow'),
    merchantReturnDays: SUPPLY_RETURN_DAYS,
    returnMethod: [SO('ReturnByMail'), SO('ReturnInStore')],
    customerRemorseReturnFees: SO('ReturnFeesCustomerResponsibility'),
    itemDefectReturnFees: SO('FreeReturn'),
  };
}

/**
 * Product: tên chi tiết, ảnh, mã, giá, đánh giá thật. `offers` là MỘT Offer theo quy cách trang chọn sẵn khi mở (rẻ nhất còn
 * hàng, hết cả thì rẻ nhất có giá — `cheapestOption`), không dùng AggregateOffer vì Google chỉ nhận Offer cho danh sách người
 * bán (khung sản phẩm có ảnh + giá); quy cách "Liên hệ báo giá" không tính. Web chỉ có MỘT URL chuẩn cho mỗi sản phẩm nên
 * không khai ProductGroup. Link `?quy-cach=<idx>` (chỉ từ file Google Merchant Center) → `selected` = quy cách đó: Offer
 * mang giá + url của quy cách đó để Google đối chiếu đúng giá trang (canonical / @id vẫn là URL sạch).
 * Còn ≥ 1 quy cách có giá còn hàng → InStock; hết cả → OutOfStock; ngừng bán thì trang 404 nên không có schema.
 * Có `shipping` (Cài đặt giao hàng) → Offer kèm phí giao + chính sách đổi trả.
 * Sản phẩm chỉ có "Liên hệ báo giá" và chưa có đánh giá → null (Google bắt Product phải có offers / review / rating).
 */
export function productLd(
  p: Pick<Product, 'slug' | 'sku' | 'name' | 'lead' | 'images' | 'options' | 'specs' | 'unit' | 'ship'>,
  o: { seoName: string; category?: string; rating: { avg: number; count: number }; reviews?: LdReview[]; shipping?: ShippingConfig; selected?: number },
): Json | null {
  const url = absoluteUrl(`/san-pham/${p.slug}`);
  // Giá + tình trạng khớp đúng trang (mục 15 checklist): giá = quy cách chọn sẵn = giá ở khung giá khi mở trang.
  const priced = pricedOptions(p.options);
  const pick = o.selected != null && p.options[o.selected] && !isQuote(p.options[o.selected]) ? o.selected : cheapestOption(p.options);
  const unit = priced.length ? p.options[pick] : undefined;
  const shown = (o.reviews ?? []).filter((r) => r.content.trim()).slice(0, 5);
  if (!unit && o.rating.count === 0) return null;
  const offers = unit && {
    '@type': 'Offer',
    price: unit.price,
    priceCurrency: 'VND',
    // Quy cách chọn sẵn là quy cách rẻ nhất CÒN hàng → hết hàng ở đây nghĩa là hết mọi quy cách (hoặc quy cách ?quy-cach= đang hết).
    availability: unit.soldOut ? OUT_OF_STOCK : IN_STOCK,
    itemCondition: SO('NewCondition'),
    url: absoluteUrl(variantPath(p, unit)),
    seller: { '@id': ORG_ID },
    shippingDetails: o.shipping && shippingDetailsLd(p.ship, unit, o.shipping),
    hasMerchantReturnPolicy: o.shipping && returnPolicyLd(p.ship),
  };
  return {
    '@context': CONTEXT,
    '@type': 'Product',
    '@id': `${url}#product`,
    url,
    name: o.seoName,
    alternateName: o.seoName !== p.name ? p.name : undefined,
    sku: p.sku,
    description: p.lead,
    image: (p.images ?? []).map(absoluteUrl),
    category: o.category,
    brand: { '@type': 'Brand', name: brandOf(p) ?? SITE_NAME },
    offers,
    aggregateRating: o.rating.count > 0
      ? { '@type': 'AggregateRating', ratingValue: Number(o.rating.avg.toFixed(1)), reviewCount: o.rating.count, bestRating: 5, worstRating: 1 }
      : undefined,
    review: o.rating.count > 0 ? shown.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      datePublished: date(r.createdAt),
      reviewBody: r.content,
      reviewRating: { '@type': 'Rating', ratingValue: r.stars, bestRating: 5, worstRating: 1 },
    })) : undefined,
  };
}

/** FAQPage — chỉ dùng khi câu hỏi + trả lời đang hiện nguyên văn trên trang. */
export function faqLd(items: { question: string; answer: string }[]): Json | null {
  const list = items.filter((f) => f.question.trim() && f.answer.trim());
  if (!list.length) return null;
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: list.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };
}

/** Tối đa bao nhiêu sản phẩm ghi vào ItemList của một trang danh sách. */
export const ITEM_LIST_MAX = 100;

/** Trang danh sách sản phẩm: CollectionPage + ItemList theo đúng thứ tự đang hiện. Danh sách trống → null. */
export function collectionLd(o: { path: string; name: string; description?: string; products: Pick<Product, 'slug' | 'name'>[] }): Json | null {
  if (!o.products.length) return null;
  const url = absoluteUrl(o.path);
  return {
    '@context': CONTEXT,
    '@type': 'CollectionPage',
    '@id': url,
    url,
    name: o.name,
    description: o.description,
    inLanguage: 'vi',
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: o.products.length,
      itemListElement: o.products.slice(0, ITEM_LIST_MAX).map((p, i) => ({
        '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/san-pham/${p.slug}`), name: p.name,
      })),
    },
  };
}

// ---------------------------------------------------------------- bài viết, video, bệnh cây

export type LdPost = {
  kind: 'article' | 'video';
  /** Góc chăm cây = 'blog', Truyền thông = 'news'. */
  section: 'blog' | 'news';
  title: string;
  description: string;
  /** Đường dẫn chuẩn của bài (canonical). */
  path: string;
  /** Ảnh bìa / ảnh video (đường dẫn web hoặc URL tuyệt đối); null = chưa có. */
  thumb: string | null;
  publishedAt: Date;
  updatedAt: Date;
  authorName: string | null;
  categoryName?: string;
  tags: string[];
  /** Địa chỉ trình phát nhúng (YouTube / TikTok) — chỉ bài video. */
  embedUrl?: string;
  videoSeconds?: number | null;
  /** Đoạn dẫn (câu trả lời nhanh) — khai là abstract + speakable cho máy trả lời / AI trích. */
  summary?: string;
};

/**
 * Bài video có ảnh → VideoObject (Google bắt buộc name + thumbnailUrl + uploadDate); bài viết (và video TikTok chưa có
 * ảnh bìa) → BlogPosting / NewsArticle. Tác giả gõ tay ở admin → Person, không có → chính shop.
 */
export function postLd(p: LdPost): Json {
  const url = absoluteUrl(p.path);
  const image = p.thumb ? absoluteUrl(p.thumb) : undefined;
  const modified = p.updatedAt > p.publishedAt ? p.updatedAt : p.publishedAt;
  if (p.kind === 'video' && p.embedUrl && image) {
    return {
      '@context': CONTEXT,
      '@type': 'VideoObject',
      '@id': `${url}#video`,
      url,
      name: p.title,
      description: p.description || p.title,
      thumbnailUrl: [image],
      uploadDate: date(p.publishedAt),
      embedUrl: p.embedUrl,
      duration: p.videoSeconds ? `PT${p.videoSeconds}S` : undefined,
      inLanguage: 'vi',
      publisher: orgRef(),
    };
  }
  return {
    '@context': CONTEXT,
    '@type': p.section === 'news' ? 'NewsArticle' : 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: p.title,
    description: p.description,
    image: image ? [image] : undefined,
    datePublished: date(p.publishedAt),
    dateModified: date(modified),
    // Tác giả gõ đúng tên shop thì là tổ chức, không phải một người.
    author: p.authorName && p.authorName.trim() !== SITE_NAME ? { '@type': 'Person', name: p.authorName } : orgRef(),
    publisher: orgRef(),
    articleSection: p.categoryName,
    keywords: p.tags.length ? p.tags.join(', ') : undefined,
    abstract: p.summary || undefined,
    // Phần đọc to / trích làm câu trả lời: tiêu đề + đoạn tóm tắt đầu bài.
    speakable: p.summary ? { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.ar-lead'] } : undefined,
    inLanguage: 'vi',
  };
}

/** Bài thư viện bệnh cây: Article (tên bệnh, tóm tắt, ảnh triệu chứng). Bảng chưa ghi ngày đăng nên không khai ngày. */
export function diseaseLd(d: { slug: string; name: string; aliases: string[]; summary: string; images: string[] }): Json {
  const url = absoluteUrl(`/benh-cay/${d.slug}`);
  return {
    '@context': CONTEXT,
    '@type': 'Article',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: d.name,
    description: d.summary,
    image: d.images.map(absoluteUrl),
    about: { '@type': 'Thing', name: d.name, alternateName: d.aliases },
    author: orgRef(),
    publisher: orgRef(),
    inLanguage: 'vi',
  };
}

// ---------------------------------------------------------------- cửa hàng

/** Giờ mở cửa: 24/24 → 00:00–23:59 hằng ngày; qua nửa đêm (18:00 – 02:00) ghi nguyên — Google hiểu giờ đóng < giờ mở là sang ngày sau. */
function openingHours(s: Pick<PublicStore, 'open24h' | 'openFrom' | 'openTo'>) {
  if (s.open24h) return { '@type': 'OpeningHoursSpecification', dayOfWeek: ALL_DAYS, opens: '00:00', closes: '23:59' };
  if (s.openFrom && s.openTo) return { '@type': 'OpeningHoursSpecification', dayOfWeek: ALL_DAYS, opens: s.openFrom, closes: s.openTo };
  return undefined;
}

/** Mỗi cửa hàng của shop đang hiện ở /he-thong-cua-hang → GardenStore (LocalBusiness). Đối tác cung cấp là cơ sở khác — không khai. */
export function storesLd(stores: PublicStore[]): Json[] {
  const page = absoluteUrl('/he-thong-cua-hang');
  return stores.filter((s) => s.kind === 'store').map((s) => ({
    '@context': CONTEXT,
    '@type': 'GardenStore',
    '@id': `${page}#${s.code.toLowerCase()}`,
    name: s.name,
    url: page,
    address: { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'VN' },
    geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lng },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`,
    telephone: s.phone ? intlPhone(s.phone) : undefined,
    openingHoursSpecification: openingHours(s),
    parentOrganization: { '@id': ORG_ID },
  }));
}
