/**
 * Kiểm tra dữ liệu có cấu trúc JSON-LD (mục 5 checklist SEO): `npm run seo:schema` (máy dev, http://localhost:3000) hoặc
 * `npm run seo:schema -- https://www.caycanhmientay.com` (web thật — chạy sau mỗi lần deploy cùng các công cụ seo:* khác).
 * Hàm dựng schema có kiểm thử riêng: `npm run test:jsonld`.
 *
 * Mở mọi trang trong sitemap bằng UA Googlebot (và một lần UA trình duyệt thường), đọc mọi <script type="application/ld+json">:
 *  - JSON đọc được, có @context schema.org + @type; không ô rỗng / "undefined" / "null" / "NaN" / "[object Object]";
 *  - URL là https tuyệt đối, URL của web nằm trên tên miền chính (không localhost / *.vercel.app);
 *  - url / mainEntityOfPage của thực thể chính (Product, bài viết, CollectionPage…) = canonical của trang;
 *  - không hai thực thể chính cùng loại trên một trang (vd. 2 Product, 2 Organization) — schema mâu thuẫn;
 *  - đủ thuộc tính bắt buộc theo loại: Organization, WebSite, BreadcrumbList, Product + Offer (+ phí giao, đổi trả)
 *    (giá > 0, VND, availability), AggregateRating / Review, FAQPage, BlogPosting / NewsArticle / Article, VideoObject,
 *    CollectionPage + ItemList, GardenStore (LocalBusiness);
 *  - schema KHỚP NỘI DUNG ĐANG HIỆN: breadcrumb = breadcrumb trên trang (tên + link), giá thấp nhất có trên trang,
 *    số đánh giá có trên trang, câu hỏi FAQ có trên trang, tiêu đề bài = <h1>, sản phẩm trong ItemList có link trên trang;
 *  - loại trang có schema đúng loại (trang chủ: Organization + WebSite; sản phẩm: Product; danh mục: CollectionPage;
 *    bài viết: BlogPosting / NewsArticle / VideoObject; bệnh cây: Article; trang có breadcrumb: BreadcrumbList);
 *  - @id được trỏ tới phải có trang nào đó khai báo; ảnh trong schema tải được (200, image/*) không cần đăng nhập;
 *  - Googlebot và trình duyệt thường nhận cùng một bộ JSON-LD.
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính thì URL được đổi sang máy đó để mở. Sau khi deploy nên dán vài
 * trang (trang chủ, một sản phẩm, một bài) vào https://search.google.com/test/rich-results và https://validator.schema.org.
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const CONCURRENCY = 6;

type Obj = Record<string, unknown>;
const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string, loc: string) => errors.push(`${m} — ${loc}`);
const warn = (m: string, loc: string) => warnings.push(`${m} — ${loc}`);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
/** Chữ thấy được của một đoạn HTML (bỏ thẻ, comment React <!-- -->, gộp khoảng trắng). */
const text = (html: string) => decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const arr = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const types = (o: Obj) => arr(o['@type'] as string | string[] | undefined);
const is = (o: Obj, ...t: string[]) => types(o).some((x) => t.includes(x));
const vnd = (n: number) => n.toLocaleString('vi-VN');

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

async function sitemapPages() {
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  siteOrigin = new URL(index).origin;
  const locs = async (u: string) => [...(await (await fetch(local(u))).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const out: string[] = [];
  for (const child of await locs(index)) out.push(...await locs(child));
  return out;
}

const SCRIPT_RE = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
function blocks(html: string, loc: string): Obj[] | null {
  const out: Obj[] = [];
  for (const m of html.matchAll(SCRIPT_RE)) {
    let data: unknown;
    try { data = JSON.parse(m[1]); } catch (e) { err(`JSON-LD không đọc được (${(e as Error).message})`, loc); return null; }
    for (const x of arr(data as Obj | Obj[])) {
      if (!isObj(x)) { err('JSON-LD không phải object', loc); continue; }
      if (Array.isArray(x['@graph'])) for (const g of x['@graph']) out.push({ '@context': x['@context'], ...(g as Obj) });
      else out.push(x);
    }
  }
  return out;
}

// ---- ô rỗng, chữ lạ, URL ----
const URL_KEYS = new Set(['url', 'item', '@id', 'mainEntityOfPage', 'image', 'logo', 'thumbnailUrl', 'embedUrl', 'contentUrl', 'hasMap', 'sameAs', 'availability', 'itemCondition']);
const SITE_KEYS = new Set(['url', 'item', '@id', 'mainEntityOfPage']);
function walk(v: unknown, path: string, loc: string, key = '') {
  if (v === null || v === '' || (typeof v === 'string' && !v.trim())) return err(`Ô rỗng ${path}`, loc);
  if (typeof v === 'number' && !Number.isFinite(v)) return err(`Số không hợp lệ ${path}`, loc);
  if (Array.isArray(v)) {
    if (!v.length) return err(`Mảng rỗng ${path}`, loc);
    return v.forEach((x, i) => walk(x, `${path}[${i}]`, loc, key));
  }
  if (isObj(v)) {
    if (!Object.keys(v).length) return err(`Object rỗng ${path}`, loc);
    for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`, loc, k);
    return;
  }
  if (typeof v !== 'string') return;
  if (/^(undefined|null|NaN|\[object Object\])$/.test(v) || /\bundefined\b|\[object Object\]/.test(v)) err(`Giá trị lỗi "${v.slice(0, 40)}" ở ${path}`, loc);
  if (/<\/?[a-z][^>]*>/i.test(v)) warn(`Còn thẻ HTML trong ${path}`, loc);
  if (URL_KEYS.has(key)) {
    let u: URL;
    try { u = new URL(v); } catch { return err(`${path} không phải URL tuyệt đối: ${v}`, loc); }
    if (u.protocol !== 'https:') err(`${path} không phải https: ${v}`, loc);
    if (/localhost|127\.0\.0\.1|\.vercel\.app$/.test(u.hostname)) err(`${path} trỏ máy dev / *.vercel.app: ${v}`, loc);
    if (SITE_KEYS.has(key) && u.hostname.endsWith(new URL(siteOrigin).hostname.replace(/^www\./, '')) && u.origin !== siteOrigin) err(`${path} không phải tên miền chính: ${v}`, loc);
  }
}
const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2}))?$/;
const isoDate = (v: unknown) => typeof v === 'string' && ISO.test(v) && !Number.isNaN(Date.parse(v));

// ---- tài nguyên (ảnh, link breadcrumb) — mở một lần ----
const assets = new Map<string, Promise<void>>();
function checkAsset(url: string, what: 'image' | 'page', loc: string) {
  if (assets.has(url)) return;
  assets.set(url, (async () => {
    try {
      const res = await fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': GOOGLEBOT } });
      const type = res.headers.get('content-type') ?? '';
      await res.arrayBuffer();
      if (res.status !== 200) err(`${what === 'image' ? 'Ảnh' : 'Link'} trong schema trả mã ${res.status}: ${url}`, loc);
      else if (what === 'image' && !type.startsWith('image/')) err(`Ảnh trong schema không phải ảnh (${type}): ${url}`, loc);
    } catch (e) { err(`Không mở được ${url} (${(e as Error).message})`, loc); }
  })());
}

// ---- breadcrumb đang hiện trên trang ----
function visibleCrumbs(html: string): { name: string; url?: string }[][] {
  return [...html.matchAll(/<nav\b[^>]*class="vx-crumb"[^>]*>([\s\S]*?)<\/nav>/g)].map((m) => {
    const parts = [...m[1].matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<span(?: aria-current="page")?>([\s\S]*?)<\/span>/g)];
    return parts.map((p) => (p[1] !== undefined ? { name: text(p[2]), url: new URL(decode(p[1]), siteOrigin).href } : { name: text(p[3] ?? '') }))
      .filter((x) => x.name);
  });
}
/** Cùng luật với breadcrumbLd: bỏ #mục, bỏ mục trùng URL liền trước. */
function normCrumbs(list: { name: string; url?: string }[]) {
  const out: { name: string; url?: string }[] = [];
  for (const x of list) {
    const url = x.url?.split('#')[0];
    if (url && out.length && out[out.length - 1].url === url) continue;
    out.push({ name: x.name, url });
  }
  return out;
}

const definedIds = new Map<string, string>();
const referencedIds = new Map<string, string>();
const counts = new Map<string, number>();

function checkPage(loc: string, html: string, list: Obj[]) {
  const path = new URL(loc).pathname;
  const canonical = decode(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(html)?.[1] ?? /<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"/.exec(html)?.[1] ?? '');
  const h1 = text(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? '');
  const body = text(html.replace(SCRIPT_RE, ''));
  const rawNoLd = html.replace(SCRIPT_RE, '');
  const main = new Map<string, number>();

  for (const o of list) {
    const t = types(o);
    const name = t.join(',') || '(không @type)';
    counts.set(name, (counts.get(name) ?? 0) + 1);
    if (!/^https?:\/\/schema\.org\/?$/.test(String(o['@context'] ?? ''))) err(`${name}: thiếu / sai @context`, loc);
    if (!t.length) { err('JSON-LD thiếu @type', loc); continue; }
    walk(o, name, loc);
    if (typeof o['@id'] === 'string') {
      if (definedIds.has(o['@id']) && definedIds.get(o['@id']) !== name) err(`@id ${o['@id']} khai báo hai loại khác nhau (${definedIds.get(o['@id'])} / ${name})`, loc);
      definedIds.set(o['@id'], name);
    }
    // tham chiếu { "@id": … } lồng bên trong
    const refs = (v: unknown): void => {
      if (Array.isArray(v)) return v.forEach(refs);
      if (!isObj(v)) return;
      if (typeof v['@id'] === 'string' && v !== o) referencedIds.set(v['@id'], loc);
      Object.values(v).forEach(refs);
    };
    Object.values(o).forEach(refs);
    for (const k of ['Organization', 'WebSite', 'Product', 'BreadcrumbList', 'CollectionPage', 'FAQPage', 'BlogPosting', 'NewsArticle', 'Article', 'VideoObject']) {
      if (is(o, k)) main.set(k, (main.get(k) ?? 0) + 1);
    }
    const sameUrl = (u: unknown, what: string) => {
      if (canonical && typeof u === 'string' && u !== canonical) err(`${name}: ${what} (${u}) khác canonical (${canonical})`, loc);
    };
    const images = (v: unknown) => arr(v as string | string[]).forEach((x) => typeof x === 'string' ? checkAsset(x, 'image', loc) : isObj(x) && typeof x.url === 'string' && checkAsset(x.url, 'image', loc));

    if (is(o, 'Organization')) {
      for (const k of ['name', 'url', 'logo']) if (!o[k]) err(`Organization thiếu ${k}`, loc);
      images(isObj(o.logo) ? o.logo.url : o.logo);
    }
    if (is(o, 'WebSite')) for (const k of ['name', 'url']) if (!o[k]) err(`WebSite thiếu ${k}`, loc);

    if (is(o, 'BreadcrumbList')) {
      const items = arr(o.itemListElement as Obj[]);
      if (items.length < 2) err('BreadcrumbList ít hơn 2 mục', loc);
      items.forEach((it, i) => {
        if (it.position !== i + 1) err(`BreadcrumbList: mục ${i + 1} có position ${String(it.position)}`, loc);
        if (!it.name) err(`BreadcrumbList: mục ${i + 1} thiếu name`, loc);
        if (i < items.length - 1 && !it.item) err(`BreadcrumbList: mục ${i + 1} (không phải mục cuối) thiếu item`, loc);
        if (typeof it.item === 'string') checkAsset(it.item, 'page', loc);
      });
      const shown = visibleCrumbs(html).map(normCrumbs);
      const ld = items.map((it) => ({ name: String(it.name ?? ''), url: typeof it.item === 'string' ? it.item : undefined }));
      const same = shown.some((s) => s.length === ld.length && s.every((x, i) => x.name === ld[i].name && x.url === ld[i].url));
      if (!same) err(`BreadcrumbList khác breadcrumb đang hiện: [${ld.map((x) => x.name).join(' / ')}] ≠ [${shown.map((s) => s.map((x) => x.name).join(' / ')).join(' | ') || 'không có breadcrumb'}]`, loc);
    }

    if (is(o, 'Product')) {
      sameUrl(o.url, 'url');
      if (!o.name) err('Product thiếu name', loc);
      if (!o.offers && !o.aggregateRating && !o.review) err('Product phải có offers, aggregateRating hoặc review', loc);
      if (!o.image) warn('Product chưa có ảnh', loc);
      images(o.image);
      for (const of of arr(o.offers as Obj | Obj[])) {
        if (of.priceCurrency !== 'VND') err(`Offer: priceCurrency "${String(of.priceCurrency)}" (cần VND)`, loc);
        if (!/^https:\/\/schema\.org\/(InStock|OutOfStock|PreOrder|BackOrder|LimitedAvailability|SoldOut|Discontinued)$/.test(String(of.availability))) err(`Offer: availability sai "${String(of.availability)}"`, loc);
        const low = is(of, 'AggregateOffer') ? of.lowPrice : of.price;
        if (typeof low !== 'number' || low <= 0) { err(`${types(of)[0]}: giá phải là số > 0 (${String(low)})`, loc); continue; }
        if (is(of, 'AggregateOffer') && !(typeof of.highPrice === 'number' && of.highPrice >= low)) err('AggregateOffer: highPrice < lowPrice', loc);
        if (is(of, 'AggregateOffer')) warn('AggregateOffer chỉ dùng được cho kết quả thường — danh sách người bán của Google cần Offer', loc);
        const sd = of.shippingDetails as Obj | undefined;
        if (sd) {
          const rate = isObj(sd.shippingRate) ? sd.shippingRate : undefined;
          if (!rate || typeof rate.value !== 'number' || rate.value < 0 || rate.currency !== 'VND') err('shippingDetails: shippingRate cần value ≥ 0 và currency VND', loc);
          if (!isObj(sd.shippingDestination) || !sd.shippingDestination.addressCountry) err('shippingDetails: thiếu shippingDestination.addressCountry', loc);
        }
        const rp = of.hasMerchantReturnPolicy as Obj | undefined;
        if (rp) {
          if (!rp.applicableCountry) err('MerchantReturnPolicy: thiếu applicableCountry', loc);
          if (!/^https:\/\/schema\.org\/MerchantReturn(FiniteReturnWindow|NotPermitted|UnlimitedWindow)$/.test(String(rp.returnPolicyCategory))) err(`MerchantReturnPolicy: returnPolicyCategory sai "${String(rp.returnPolicyCategory)}"`, loc);
          if (String(rp.returnPolicyCategory).endsWith('FiniteReturnWindow') && !(Number(rp.merchantReturnDays) > 0)) err('MerchantReturnPolicy: thời hạn đổi trả có hạn mà thiếu merchantReturnDays', loc);
        }
        // Giá thấp nhất = giá trang chọn sẵn khi mở → phải có trên trang
        if (!rawNoLd.includes(vnd(low))) err(`Giá trong schema (${vnd(low)}đ) không có trên trang`, loc);
      }
      const r = o.aggregateRating as Obj | undefined;
      if (r) {
        const v = Number(r.ratingValue), n = Number(r.reviewCount ?? r.ratingCount);
        if (!(v >= 1 && v <= 5)) err(`AggregateRating: ratingValue ${String(r.ratingValue)} ngoài 1–5`, loc);
        if (!(Number.isInteger(n) && n > 0)) err(`AggregateRating: reviewCount ${String(r.reviewCount)} không hợp lệ`, loc);
        else if (!new RegExp(`(^|\\D)${n}\\s*(đánh giá|nhận xét)`, 'i').test(body)) err(`Số đánh giá trong schema (${n}) không có trên trang`, loc);
        if (arr(o.review as Obj[]).length > n) err('Số Review nhiều hơn reviewCount', loc);
      } else if (o.review) err('Có review mà thiếu aggregateRating', loc);
      for (const rv of arr(o.review as Obj[])) {
        if (!isObj(rv.author) || !rv.author.name) err('Review thiếu author.name', loc);
        if (!isObj(rv.reviewRating) || !(Number(rv.reviewRating.ratingValue) >= 1)) err('Review thiếu reviewRating', loc);
        if (rv.datePublished && !isoDate(rv.datePublished)) err(`Review: datePublished sai "${String(rv.datePublished)}"`, loc);
        // reviewBody là chữ trơn khách gõ (có thể chứa "<", "&") → chỉ gộp khoảng trắng, không bỏ thẻ
        if (typeof rv.reviewBody === 'string' && !body.includes(rv.reviewBody.replace(/\s+/g, ' ').trim().slice(0, 40))) err('Nội dung Review không có trên trang', loc);
      }
    }

    if (is(o, 'FAQPage')) {
      const qs = arr(o.mainEntity as Obj[]);
      if (!qs.length) err('FAQPage không có câu hỏi', loc);
      for (const q of qs) {
        if (!q.name || !isObj(q.acceptedAnswer) || !q.acceptedAnswer.text) { err('FAQPage: câu hỏi thiếu name / acceptedAnswer.text', loc); continue; }
        if (!body.includes(text(String(q.name)))) err(`Câu hỏi FAQ không có trên trang: "${String(q.name).slice(0, 50)}"`, loc);
      }
    }

    if (is(o, 'BlogPosting', 'NewsArticle', 'Article')) {
      sameUrl(o.mainEntityOfPage, 'mainEntityOfPage');
      if (!o.headline) err(`${name} thiếu headline`, loc);
      else if (h1 && text(String(o.headline)) !== h1) err(`${name}: headline "${String(o.headline)}" khác <h1> "${h1}"`, loc);
      if (!o.author) err(`${name} thiếu author`, loc);
      if (!o.publisher) warn(`${name} thiếu publisher`, loc);
      if (o.datePublished !== undefined && !isoDate(o.datePublished)) err(`${name}: datePublished sai`, loc);
      if (o.dateModified !== undefined && (!isoDate(o.dateModified) || (o.datePublished && Date.parse(String(o.dateModified)) < Date.parse(String(o.datePublished))))) err(`${name}: dateModified sai hoặc trước ngày đăng`, loc);
      if (!is(o, 'Article') && !o.datePublished) err(`${name} thiếu datePublished`, loc);
      if (!o.image) warn(`${name} chưa có ảnh`, loc);
      images(o.image);
    }

    if (is(o, 'VideoObject')) {
      sameUrl(o.url, 'url');
      for (const k of ['name', 'thumbnailUrl', 'uploadDate']) if (!o[k]) err(`VideoObject thiếu ${k}`, loc);
      if (o.uploadDate && !(isoDate(o.uploadDate) && /T/.test(String(o.uploadDate)))) err('VideoObject: uploadDate phải có giờ + múi giờ', loc);
      if (!o.embedUrl && !o.contentUrl) err('VideoObject thiếu embedUrl / contentUrl', loc);
      if (o.duration && !/^PT(\d+H)?(\d+M)?(\d+S)?$/.test(String(o.duration))) err(`VideoObject: duration sai "${String(o.duration)}"`, loc);
      if (h1 && text(String(o.name)) !== h1) err(`VideoObject: name khác <h1>`, loc);
      images(o.thumbnailUrl);
    }

    if (is(o, 'CollectionPage')) {
      sameUrl(o.url, 'url');
      const list = isObj(o.mainEntity) ? arr(o.mainEntity.itemListElement as Obj[]) : [];
      if (!list.length) err('CollectionPage: ItemList trống', loc);
      list.forEach((it, i) => {
        if (it.position !== i + 1) err(`ItemList: mục ${i + 1} có position ${String(it.position)}`, loc);
        const p = typeof it.url === 'string' ? new URL(it.url).pathname : '';
        if (!p || !rawNoLd.includes(`href="${p}"`)) err(`ItemList: sản phẩm ${String(it.url)} không có link trên trang`, loc);
      });
    }

    if (is(o, 'LocalBusiness', 'Store', 'GardenStore')) {
      if (!o.name || !isObj(o.address)) err(`${name} thiếu name / address`, loc);
      const g = o.geo as Obj | undefined;
      if (g && !(Math.abs(Number(g.latitude)) <= 90 && Math.abs(Number(g.longitude)) <= 180)) err(`${name}: tọa độ sai`, loc);
      if (o.telephone && !/^\+84\d{8,10}$/.test(String(o.telephone))) err(`${name}: telephone "${String(o.telephone)}" (cần dạng +84…)`, loc);
      for (const h of arr(o.openingHoursSpecification as Obj[])) {
        if (!/^\d{2}:\d{2}$/.test(String(h.opens)) || !/^\d{2}:\d{2}$/.test(String(h.closes))) err(`${name}: giờ mở cửa sai`, loc);
      }
      if (!body.includes(text(String(o.name)))) err(`${name}: tên "${String(o.name)}" không có trên trang`, loc);
      if (!o.image) warn(`${name} chưa có ảnh cửa hàng (Google khuyên có)`, loc);
    }
  }

  // Không hai thực thể chính cùng loại (schema mâu thuẫn); BreadcrumbList được phép nhiều
  for (const [k, n] of main) if (n > 1 && k !== 'BreadcrumbList') err(`${n} khối ${k} trên cùng một trang`, loc);

  // Loại trang ↔ loại schema
  const has = (...k: string[]) => list.some((o) => is(o, ...k));
  const expect = (ok: boolean, what: string) => { if (!ok) err(`Thiếu schema ${what}`, loc); };
  if (path === '/') { expect(has('Organization'), 'Organization'); expect(has('WebSite'), 'WebSite'); }
  if (path.startsWith('/san-pham/') && !has('Product')) warn('Trang sản phẩm không có schema Product (chỉ "Liên hệ báo giá" và chưa có đánh giá?)', loc);
  if (/^\/danh-muc(\/|$)/.test(path)) expect(has('CollectionPage'), 'CollectionPage');
  if (/^\/(goc-cham-cay|tin-tuc)\/[^/]+$/.test(path)) expect(has('BlogPosting', 'NewsArticle', 'VideoObject'), 'BlogPosting / NewsArticle / VideoObject');
  if (/^\/benh-cay\/[^/]+$/.test(path)) expect(has('Article'), 'Article');
  if (path === '/he-thong-cua-hang' && !has('GardenStore', 'LocalBusiness', 'Store')) warn('Trang Hệ thống cửa hàng không có schema cửa hàng (chưa cửa hàng nào bật "Hiện trên web"?)', loc);
  if (/<nav\b[^>]*class="vx-crumb"/.test(html)) expect(has('BreadcrumbList'), 'BreadcrumbList (trang có breadcrumb)');
  if (!list.length) warn('Trang không có JSON-LD nào', loc);
}

async function main() {
  const pages = await sitemapPages();
  console.log(`Kiểm ${pages.length} trang trong sitemap của ${BASE}…`);
  await pool(pages, async (loc) => {
    const get = async (ua: string) => {
      const res = await fetch(local(loc), { redirect: 'manual', headers: { 'User-Agent': ua } });
      return { status: res.status, html: await res.text() };
    };
    const [bot, human] = await Promise.all([get(GOOGLEBOT), get(BROWSER)]);
    if (bot.status !== 200) return err(`Mã ${bot.status}`, loc);
    const list = blocks(bot.html, loc);
    if (!list) return;
    checkPage(loc, bot.html, list);
    const sig = (h: string) => [...h.matchAll(SCRIPT_RE)].map((m) => m[1]).sort().join('\n');
    if (human.status === 200 && sig(human.html) !== sig(bot.html)) err('JSON-LD cho Googlebot khác cho trình duyệt thường', loc);
  });
  await Promise.all(assets.values());
  for (const [id, loc] of referencedIds) if (!definedIds.has(id)) err(`@id ${id} được trỏ tới nhưng không trang nào khai báo`, loc);
  console.log(`Schema: ${[...counts].map(([k, n]) => `${k} ×${n}`).join(', ') || 'không có'}`);
}

await main().catch((e) => errors.push(`Lỗi khi kiểm tra: ${(e as Error).message}`));
for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `\n${errors.length} lỗi, ${warnings.length} cảnh báo.` : `\nDữ liệu có cấu trúc đạt (${warnings.length} cảnh báo).`);
process.exit(errors.length ? 1 : 0);
