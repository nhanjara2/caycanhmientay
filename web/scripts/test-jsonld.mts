/**
 * Kiểm thử các hàm dựng JSON-LD trong src/lib/jsonld.ts (mục 5 checklist SEO): `npm run test:jsonld`.
 * Hàm thuần, không cần database / máy chủ. Có lỗi thì thoát mã 1.
 */
import assert from 'node:assert/strict';
import {
  breadcrumbLd, cleanLd, normalizeCrumbs, collectionLd, diseaseLd, faqLd, intlPhone, jsonLdHtml, ORG_ID, organizationLd, postLd, productLd, storesLd, websiteLd,
} from '../src/lib/jsonld.ts';
import { cheapestOption, type Product } from '../src/lib/catalog.ts';
import type { PublicStore } from '../src/lib/stores.ts';

const ORIGIN = 'https://www.caycanhmientay.com';
let passed = 0;
const failed: string[] = [];
function test(name: string, fn: () => void) {
  try { fn(); passed++; } catch (e) { failed.push(`✗ ${name}\n    ${(e as Error).message.split('\n').join('\n    ')}`); }
}
/** Chạy qua jsonLdHtml rồi đọc lại — đúng thứ trình duyệt / Google nhận. */
const round = (x: unknown) => JSON.parse(jsonLdHtml(x));

const product = (over: Partial<Product> = {}) => ({
  slug: 'kim-tien', sku: 'MT-90001', name: 'Cây kim tiền', lead: 'Cây kim tiền dễ chăm.', unit: 'Chậu', specs: [] as [string, string][],
  images: ['/api/product-images/kim-tien-0123456789abcdef0123456789abcdef.jpg'],
  options: [{ idx: 0, label: 'Cao 30cm', price: 68000 }, { idx: 1, label: 'Cao 60cm', price: 150000 }, { idx: 2, label: 'Cao 1m2', price: 0 }],
  ...over,
});
const noRating = { avg: 0, count: 0 };

test('escape: chữ "</script>" và & trong dữ liệu không đóng thẻ script', () => {
  const html = jsonLdHtml({ '@type': 'Thing', name: 'a</script><b>&c', text: 'x y' });
  assert.ok(!html.includes('<') && !html.includes('>') && !html.includes('&'));
  assert.ok(!html.includes(' '));
  assert.equal(JSON.parse(html).name, 'a</script><b>&c');
});

test('cleanLd: bỏ undefined / null / chuỗi rỗng / NaN / mảng rỗng / object chỉ còn @type', () => {
  const out = cleanLd({ '@type': 'X', a: undefined, b: null, c: '  ', d: NaN, e: [], f: { '@type': 'Y' }, g: [null, 'ok'], h: 0, i: { '@id': 'z' } });
  assert.deepEqual(out, { '@type': 'X', g: ['ok'], h: 0, i: { '@id': 'z' } });
});

test('intlPhone: 0703005001 → +84703005001', () => {
  assert.equal(intlPhone('0703005001'), '+84703005001');
  assert.equal(intlPhone('0703 005 001'), '+84703005001');
});

test('Organization + WebSite: @id ổn định, URL tuyệt đối trên tên miền chính, có logo + hotline', () => {
  const o = round(organizationLd()), w = round(websiteLd());
  assert.equal(o['@id'], ORG_ID);
  assert.equal(o.url, `${ORIGIN}/`);
  assert.ok(o.logo.url.startsWith(ORIGIN));
  assert.ok(o.contactPoint.length >= 1 && o.contactPoint.every((c: { telephone: string }) => c.telephone.startsWith('+84')));
  assert.equal(w.publisher['@id'], ORG_ID);
  assert.equal(w['@type'], 'WebSite');
});

test('Breadcrumb: vị trí 1..n, link tuyệt đối, mục cuối không link chỉ có tên', () => {
  const b = round(breadcrumbLd([{ label: 'Trang chủ', href: '/' }, { label: 'Cây cảnh', href: '/danh-muc/cay-canh' }, { label: 'Kim tiền' }]));
  assert.deepEqual(b.itemListElement.map((x: { position: number }) => x.position), [1, 2, 3]);
  assert.equal(b.itemListElement[0].item, `${ORIGIN}/`);
  assert.equal(b.itemListElement[1].item, `${ORIGIN}/danh-muc/cay-canh`);
  assert.equal(b.itemListElement[2].item, undefined);
  assert.equal(b.itemListElement[2].name, 'Kim tiền');
});

test('Breadcrumb: bỏ #mục, gộp mục trùng URL liền nhau, < 2 mục thì không có schema', () => {
  const b = round(breadcrumbLd([
    { label: 'Trang chủ', href: '/' }, { label: 'Đối tác sỉ', href: '/doi-tac' }, { label: 'Công trình', href: '/doi-tac#cong-trinh' }, { label: 'Vườn A' },
  ]));
  assert.deepEqual(b.itemListElement.map((x: { name: string }) => x.name), ['Trang chủ', 'Đối tác sỉ', 'Vườn A']);
  assert.deepEqual(b.itemListElement.map((x: { position: number }) => x.position), [1, 2, 3]);
  assert.equal(breadcrumbLd([{ label: 'Trang chủ', href: '/' }]), null);
  assert.equal(breadcrumbLd([{ label: 'Trang chủ', href: '/' }, { label: '  ' }]), null);
});

test('Breadcrumb: tự thêm Trang chủ, bỏ Trang chủ lặp / URL trùng không liền nhau, mục cuối không link', () => {
  const l = normalizeCrumbs([
    { label: 'Góc chăm cây', href: '/goc-cham-cay' }, { label: 'Trang chủ', href: '/' }, { label: 'Bệnh cây', href: '/benh-cay' },
    { label: 'Góc chăm cây (lại)', href: '/goc-cham-cay#x' }, { label: 'Thối rễ', href: '/benh-cay/thoi-re' },
  ]);
  assert.deepEqual(l, [
    { label: 'Trang chủ', href: '/' }, { label: 'Góc chăm cây', href: '/goc-cham-cay' }, { label: 'Bệnh cây', href: '/benh-cay' }, { label: 'Thối rễ' },
  ]);
  assert.deepEqual(normalizeCrumbs([{ label: 'Giới thiệu' }]), [{ label: 'Trang chủ', href: '/' }, { label: 'Giới thiệu' }]);
  assert.deepEqual(normalizeCrumbs([]), [{ label: 'Trang chủ', href: '/' }]);
  const b = round(breadcrumbLd([{ label: 'Giới thiệu' }]));
  assert.deepEqual(b.itemListElement.map((x: { name: string }) => x.name), ['Trang chủ', 'Giới thiệu']);
});

test('Product nhiều quy cách: AggregateOffer từ giá thấp nhất, bỏ quy cách "Liên hệ báo giá"', () => {
  const ld = round(productLd(product(), { seoName: 'Cây kim tiền để bàn', rating: noRating }));
  assert.equal(ld['@id'], `${ORIGIN}/san-pham/kim-tien#product`);
  assert.equal(ld.offers['@type'], 'AggregateOffer');
  assert.equal(ld.offers.lowPrice, 68000);
  assert.equal(ld.offers.highPrice, 150000);
  assert.equal(ld.offers.offerCount, 2);
  assert.equal(ld.offers.priceCurrency, 'VND');
  assert.equal(ld.offers.availability, 'https://schema.org/InStock');
  assert.ok(ld.image[0].startsWith(`${ORIGIN}/api/product-images/`));
  assert.equal(ld.aggregateRating, undefined, 'không có đánh giá thì không khai rating');
  assert.equal(ld.review, undefined);
  assert.equal(ld.alternateName, 'Cây kim tiền');
});

test('Product một quy cách có giá: Offer với price; hết hàng → OutOfStock', () => {
  const ld = round(productLd(product({ options: [{ idx: 0, label: 'Bộ', price: 53000000, soldOut: true }] }), { seoName: 'Cây kim tiền', rating: noRating }));
  assert.equal(ld.offers['@type'], 'Offer');
  assert.equal(ld.offers.price, 53000000);
  assert.equal(ld.offers.availability, 'https://schema.org/OutOfStock');
  assert.equal(ld.alternateName, undefined, 'tên chi tiết trùng tên ngắn thì không ghi alternateName');
});

test('Product: quy cách rẻ nhất hết hàng → giá thấp nhất tính trên quy cách còn hàng; thương hiệu lấy từ thông số', () => {
  const p = product({
    options: [{ idx: 0, label: 'Cao 30cm', price: 68000, soldOut: true }, { idx: 1, label: 'Cao 60cm', price: 150000 }, { idx: 2, label: 'Cao 1m', price: 220000 }],
    specs: [['Hoạt chất', 'Mancozeb'], ['Nhà sản xuất', 'Bayer']],
  });
  const ld = round(productLd(p, { seoName: 'x', rating: noRating }));
  assert.equal(ld.offers.lowPrice, 150000);
  assert.equal(ld.offers.offerCount, 2);
  assert.equal(ld.offers.availability, 'https://schema.org/InStock');
  assert.equal(ld.brand.name, 'Bayer');
  assert.equal(p.options[cheapestOption(p.options)].label, 'Cao 60cm', 'trang chọn sẵn đúng quy cách có giá = lowPrice');
  const allOut = product({ options: [{ idx: 0, label: 'A', price: 90000, soldOut: true }, { idx: 1, label: 'B', price: 50000, soldOut: true }] });
  const out = round(productLd(allOut, { seoName: 'x', rating: noRating }));
  assert.equal(out.offers.availability, 'https://schema.org/OutOfStock');
  assert.equal(out.offers.lowPrice, 50000);
  assert.equal(allOut.options[cheapestOption(allOut.options)].label, 'B');
  assert.equal(round(productLd(product(), { seoName: 'x', rating: noRating })).brand.name, 'Cây Cảnh Miền Tây');
});

test('Product chỉ "Liên hệ báo giá" và chưa có đánh giá → không có schema; có đánh giá thật → chỉ rating', () => {
  const quote = product({ options: [{ idx: 0, label: 'Cao 2m', price: 0 }] });
  assert.equal(productLd(quote, { seoName: 'x', rating: noRating }), null);
  const ld = round(productLd(quote, {
    seoName: 'x', rating: { avg: 4.666, count: 3 },
    reviews: [{ name: 'Lan', stars: 5, content: 'Cây đẹp', createdAt: Date.UTC(2026, 9, 1) }, { name: 'Hùng', stars: 4, content: '  ', createdAt: 0 }],
  }));
  assert.equal(ld.offers, undefined);
  assert.equal(ld.aggregateRating.ratingValue, 4.7);
  assert.equal(ld.aggregateRating.reviewCount, 3);
  assert.equal(ld.review.length, 1, 'bỏ đánh giá không có chữ');
  assert.equal(ld.review[0].datePublished, '2026-10-01T00:00:00.000Z');
});

test('FAQPage: bỏ câu trống, không câu nào → null', () => {
  assert.equal(faqLd([]), null);
  const ld = round(faqLd([{ question: 'Tưới mấy lần?', answer: '2 lần / tuần' }, { question: ' ', answer: 'x' }]));
  assert.equal(ld.mainEntity.length, 1);
  assert.equal(ld.mainEntity[0].acceptedAnswer.text, '2 lần / tuần');
});

test('CollectionPage: ItemList đúng thứ tự, URL sản phẩm tuyệt đối; danh sách trống → null', () => {
  assert.equal(collectionLd({ path: '/danh-muc/cay-canh', name: 'Cây cảnh', products: [] }), null);
  const ld = round(collectionLd({ path: '/danh-muc/cay-canh', name: 'Cây cảnh', products: [{ slug: 'b', name: 'B' }, { slug: 'a', name: 'A' }] }));
  assert.equal(ld.url, `${ORIGIN}/danh-muc/cay-canh`);
  assert.equal(ld.mainEntity.numberOfItems, 2);
  assert.deepEqual(ld.mainEntity.itemListElement.map((x: { url: string }) => x.url), [`${ORIGIN}/san-pham/b`, `${ORIGIN}/san-pham/a`]);
});

const post = {
  kind: 'article' as const, section: 'blog' as const, title: 'Tưới cây trong nhà', description: 'Cách tưới.', path: '/goc-cham-cay/tuoi-cay',
  thumb: '/api/post-images/tuoi-cay-0123456789abcdef0123456789abcdef.jpg',
  publishedAt: new Date('2026-10-01T03:00:00Z'), updatedAt: new Date('2026-10-05T03:00:00Z'), authorName: null, categoryName: 'Hướng dẫn', tags: ['tưới'],
};

test('BlogPosting: ngày đăng / sửa ISO, tác giả là shop khi không ghi tên, ảnh tuyệt đối', () => {
  const ld = round(postLd(post));
  assert.equal(ld['@type'], 'BlogPosting');
  assert.equal(ld.datePublished, '2026-10-01T03:00:00.000Z');
  assert.equal(ld.dateModified, '2026-10-05T03:00:00.000Z');
  assert.equal(ld.author['@id'], ORG_ID);
  assert.equal(ld.mainEntityOfPage, `${ORIGIN}/goc-cham-cay/tuoi-cay`);
  assert.ok(ld.image[0].startsWith(ORIGIN));
});

test('Bài: ngày sửa trước ngày đăng (lên lịch) → dateModified = ngày đăng; Truyền thông → NewsArticle; có tác giả → Person', () => {
  const ld = round(postLd({ ...post, section: 'news', authorName: 'Thu Hà', updatedAt: new Date('2026-09-01T00:00:00Z') }));
  assert.equal(ld['@type'], 'NewsArticle');
  assert.equal(ld.dateModified, ld.datePublished);
  assert.deepEqual(ld.author, { '@type': 'Person', name: 'Thu Hà' });
});

test('Video có ảnh → VideoObject; video chưa có ảnh (TikTok) → bài viết (VideoObject bắt buộc thumbnailUrl)', () => {
  const v = round(postLd({ ...post, kind: 'video', thumb: 'https://i.ytimg.com/vi/abc/hqdefault.jpg', embedUrl: 'https://www.youtube.com/embed/abc', videoSeconds: 42 }));
  assert.equal(v['@type'], 'VideoObject');
  assert.deepEqual(v.thumbnailUrl, ['https://i.ytimg.com/vi/abc/hqdefault.jpg']);
  assert.equal(v.uploadDate, '2026-10-01T03:00:00.000Z');
  assert.equal(v.duration, 'PT42S');
  const t = round(postLd({ ...post, kind: 'video', thumb: null, embedUrl: 'https://www.tiktok.com/player/v1/1' }));
  assert.equal(t['@type'], 'BlogPosting');
  assert.equal(t.image, undefined);
});

test('Bệnh cây: Article có ảnh triệu chứng, không ảnh thì bỏ trường image', () => {
  const d = { slug: 'thoi-re', name: 'Thối rễ', aliases: ['úng rễ'], summary: 'Rễ thối do nấm.' };
  const ld = round(diseaseLd({ ...d, images: ['/api/disease-images/thoi-re-0123456789abcdef0123456789abcdef.jpg'] }));
  assert.equal(ld['@type'], 'Article');
  assert.equal(ld.headline, 'Thối rễ');
  assert.equal(ld.image.length, 1);
  assert.equal(round(diseaseLd({ ...d, images: [] })).image, undefined);
});

const store = (over: Partial<PublicStore> = {}): PublicStore => ({
  id: 1, code: 'SD', name: 'Vườn ươm', address: 'Làng hoa Sa Đéc, Đồng Tháp', lat: 10.349176, lng: 105.731775, phone: '0703005001',
  contactName: null, open24h: true, openFrom: null, openTo: null, services: ['nursery'], kind: 'store', note: null, ...over,
});

test('Cửa hàng: GardenStore có địa chỉ, tọa độ, giờ mở cửa; đối tác cung cấp không khai; chưa khai giờ thì bỏ giờ', () => {
  const list = storesLd([store(), store({ id: 2, code: 'PL', kind: 'partner' }), store({ id: 3, code: 'Q7', open24h: false, openFrom: '07:00', openTo: '21:00', phone: null })]).map(round);
  assert.equal(list.length, 2);
  assert.equal(list[0]['@type'], 'GardenStore');
  assert.equal(list[0]['@id'], `${ORIGIN}/he-thong-cua-hang#sd`);
  assert.equal(list[0].telephone, '+84703005001');
  assert.equal(list[0].openingHoursSpecification.opens, '00:00');
  assert.equal(list[0].geo.latitude, 10.349176);
  assert.equal(list[1].openingHoursSpecification.opens, '07:00');
  assert.equal(list[1].telephone, undefined);
  const none = round(storesLd([store({ open24h: false })])[0]);
  assert.equal(none.openingHoursSpecification, undefined);
});

test('Mọi schema: có @context schema.org, không còn giá trị rỗng sau khi in', () => {
  const all = [organizationLd(), websiteLd(), productLd(product(), { seoName: 'x', rating: noRating }), postLd(post), ...storesLd([store()])];
  const empty = (v: unknown, path: string): string[] =>
    v === '' || v === null ? [path]
      : Array.isArray(v) ? (v.length ? v.flatMap((x, i) => empty(x, `${path}[${i}]`)) : [path])
      : typeof v === 'object' && v ? Object.entries(v).flatMap(([k, x]) => empty(x, `${path}.${k}`)) : [];
  for (const x of all) {
    const ld = round(x);
    assert.equal(ld['@context'], 'https://schema.org');
    assert.deepEqual(empty(ld, ld['@type']), []);
  }
});

for (const f of failed) console.log(f);
console.log(`\n${passed} đạt, ${failed.length} lỗi`);
process.exit(failed.length ? 1 : 0);
