/**
 * Kiểm tra SEO của các thành phần dùng chung (mục 18 checklist SEO): `npm run seo:components` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:components -- https://www.caycanhmientay.com` (web thật, chạy sau mỗi lần deploy cùng các lệnh seo:* khác).
 *
 * Một component lỗi là lỗi trên hàng trăm URL, nhưng component chạy đúng ở trang chủ chưa chắc đúng ở trang danh mục / chi
 * tiết — nên công cụ lấy mẫu MỖI LOẠI TRANG trong sitemap (mặc định 3 trang / loại, `COMPONENTS_ALL=1` = mọi trang) và kiểm
 * từng component trên HTML máy chủ trả cho Googlebot:
 *  - Header: đúng một logo `.vx-logo` link về "/", có tên; link đầu trang có href thật.
 *  - Navigation: menu danh mục là link <a href> thật (không chỉ nút bấm), có trong HTML (cả menu ☰ điện thoại).
 *  - Footer: không href="#" / rỗng / javascript:, link mở tab mới có rel="noopener", link nội bộ không trùng lặp vô ích.
 *  - Breadcrumb: link tầng giữa có href (cấu trúc + schema do seo:breadcrumb kiểm kỹ).
 *  - Thẻ sản phẩm `.vx-pcard`: mọi link trong thẻ cùng một trang sản phẩm, có tên, ảnh có alt, ảnh là ảnh CỦA sản phẩm đó
 *    (tên file ảnh mang slug sản phẩm), có giá hoặc "Liên hệ báo giá"; giá trên thẻ = giá Offer trên trang sản phẩm.
 *  - Thẻ bài / bệnh / công trình: link có ảnh thì ảnh mang đúng slug của trang được link, có alt.
 *  - Banner trang chủ: ảnh có alt (hoặc chữ trên ảnh), link đúng đích (200, không chuyển hướng), ảnh không quá nặng.
 *  - Tab / accordion / nút mở rộng: tab là link thật hoặc trỏ tới khung có trong HTML; nội dung thu gọn (<details>,
 *    aria-controls) có sẵn chữ trong HTML (không đợi bấm mới tải).
 *  - Modal: không hộp thoại nào đang mở (aria-modal) trong HTML máy chủ — không che nội dung chính.
 *  - Pagination: "Trang sau" trỏ đúng trang n+1 (200, canonical tự trỏ), "Trang 1" không có ?trang=, trang hiện tại đúng.
 *  - Bộ lọc / sắp xếp: link mang tham số lọc phải rel="nofollow"; trang lọc noindex + canonical về trang gốc; số link lọc có giới hạn.
 *  - Nội dung liên quan: không link tới chính trang đang xem (trừ breadcrumb / phân trang), không lặp một đích quá nhiều lần.
 *  - Ô tìm kiếm: form GET tới /tim-kiem với ô tên "q" (chạy cả khi không có JavaScript, không sinh URL lạ); /tim-kiem noindex,
 *    bị chặn trong robots.txt; chữ lạ / rỗng không làm trang lỗi.
 *  - Ảnh: có alt, có width / height (chống nhảy bố cục); ảnh không có thì trả 404 (không trả trang HTML 200).
 *  - SEO Head: đúng một title, tối đa một canonical / meta robots.
 *  - Trang lỗi: đường dẫn không có trả 404 + noindex, vẫn có đầu / chân trang + link về trang chủ, không có canonical.
 *  - Bộ chuyển ngôn ngữ: web một ngôn ngữ → không có link hreflang / bộ chuyển ngôn ngữ (seo:locale kiểm kỹ).
 *  - Banner cookie: không phải hộp thoại chặn (aria-modal), nội dung chính Googlebot và trình duyệt thường nhận như nhau.
 * Mọi link nội bộ của các component trên được mở lại một lần: phải 200 và không chuyển hướng. Có lỗi thì thoát mã 1.
 */
import { parse } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const CONCURRENCY = 6;
const PER_TEMPLATE = process.env.COMPONENTS_ALL === '1' ? Infinity : Number(process.env.COMPONENTS_PER || 3);
/** Ảnh banner nặng hơn mức này thì cảnh báo (tải chậm trên điện thoại). */
const BANNER_MAX_BYTES = 400_000;
/** Một trang có quá nhiều link lọc khác nhau = dấu hiệu sinh tổ hợp URL vô hạn. */
const MAX_FILTER_LINKS = 40;
/** Tham số lọc / sắp xếp (không gồm phân trang `trang`, chuyên mục `chuyen-muc`, tìm `q`). */
const FILTER_QS = /[?&](sap_xep|vi-tri|kich-thuoc|mau|menh|khac|nha-vuon|the|loai|bo_phan|nguyen_nhan|cay)=/;

const errors = new Map<string, Set<string>>();
const warnings = new Map<string, Set<string>>();
const add = (map: Map<string, Set<string>>, msg: string, loc: string) => {
  if (!map.has(msg)) map.set(msg, new Set());
  map.get(msg)!.add(loc);
};
const err = (msg: string, loc: string) => add(errors, msg, loc);
const warn = (msg: string, loc: string) => add(warnings, msg, loc);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const short = (u: string) => (siteOrigin ? u.replace(siteOrigin, '') : u) || '/';
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const clip = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n)}…` : s);

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

type Page = { status: number; location: string | null; type: string; html: string; bytes: number };
const cache = new Map<string, Promise<Page>>();
function get(url: string, ua = UA): Promise<Page> {
  const key = `${ua === UA ? 'g' : 'b'} ${url}`;
  if (!cache.has(key)) {
    cache.set(key, fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': ua } }).then(async (r) => {
      const type = r.headers.get('content-type') ?? '';
      const buf = Buffer.from(await r.arrayBuffer());
      return { status: r.status, location: r.headers.get('location'), type, html: /html|xml|text/.test(type) ? buf.toString('utf8') : '', bytes: buf.length };
    }).catch(() => ({ status: 0, location: null, type: '', html: '', bytes: 0 })));
  }
  return cache.get(key)!;
}

async function sitemapPages() {
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  siteOrigin = new URL(index).origin;
  const locs = async (u: string) => [...(await (await fetch(local(u))).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const out: string[] = [];
  for (const child of await locs(index)) {
    if (/\.xml$/.test(child) && !/sitemaps\//.test(child) && child !== index) continue;
    out.push(...(await locs(child)).filter((u) => !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u)));
  }
  return { robots, pages: [...new Set(out)] };
}

/** Loại trang = đoạn đầu đường dẫn ("/san-pham/x" → san-pham, "/" → trang-chu, "/doi-tac/cong-trinh/x" → doi-tac/cong-trinh). */
function template(u: string) {
  const p = new URL(u).pathname.split('/').filter(Boolean);
  if (!p.length) return 'trang-chu';
  if (p[0] === 'doi-tac' && p[1] === 'cong-trinh') return 'doi-tac/cong-trinh';
  return p.length > 1 ? `${p[0]}/*` : p[0];
}

// ---------- Cây DOM ----------

const isEl = (n: Node): n is Element => 'tagName' in n;
const attr = (el: Element, name: string) => el.attrs.find((a) => a.name === name)?.value;
const cls = (el: Element) => ` ${attr(el, 'class') ?? ''} `;
const hasCls = (el: Element, c: string) => cls(el).includes(` ${c} `);
const kids = (n: Node): Node[] => ('childNodes' in n ? n.childNodes : []);
function* walk(n: Node, up: Element[] = []): Generator<[Element, Element[]]> {
  for (const c of kids(n)) {
    if (!isEl(c)) continue;
    yield [c, up];
    if (['template', 'noscript', 'svg', 'script', 'style'].includes(c.tagName)) continue;
    yield* walk(c, [...up, c]);
  }
}
const all = (root: Node, pred: (el: Element, up: Element[]) => boolean) => [...walk(root)].filter(([el, up]) => pred(el, up)).map(([el]) => el);
function text(n: Node): string {
  if (n.nodeName === '#text') return (n as DefaultTreeAdapterMap['textNode']).value;
  if (!isEl(n) || ['script', 'style', 'template'].includes(n.tagName)) return '';
  if (n.tagName === 'img') return ` ${attr(n, 'alt') ?? ''} `;
  if (n.tagName === 'svg') return ` ${attr(n, 'aria-label') ?? ''} `;
  return kids(n).map(text).join('');
}
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const nameOf = (el: Element) => clean(attr(el, 'aria-label') ?? '') || clean(text(el)) || clean(attr(el, 'title') ?? '');
/** href nội bộ → URL tuyệt đối trên tên miền chính (null = link ngoài / tel / mailto / #). */
function internal(href: string | undefined, from: string): string | null {
  if (!href || /^(#|tel:|mailto:|javascript:|zalo:|sms:)/i.test(href)) return null;
  try {
    const u = new URL(decode(href), from);
    if (u.origin !== siteOrigin && u.origin !== BASE) return null;
    return siteOrigin + u.pathname + u.search;
  } catch { return null; }
}
const pathOf = (u: string) => new URL(u).pathname;
/** "/api/product-images/kim-tien-<32 hex>.jpg?w=320" → { kind: 'product', slug: 'kim-tien' } */
function imageSlug(src: string | undefined) {
  const m = src && /\/api\/(product|post|disease|project)-images\/(?:([a-z0-9-]+)-)?[0-9a-f]{32}\.[a-z]+/i.exec(src);
  return m ? { kind: m[1].toLowerCase(), slug: m[2] ?? '' } : null;
}
/** Trang nội dung mà link trỏ tới → loại ảnh + slug tương ứng. */
function targetSlug(url: string) {
  const p = pathOf(url).split('/').filter(Boolean);
  if (p[0] === 'san-pham' && p[1]) return { kind: 'product', slug: p[1] };
  if ((p[0] === 'goc-cham-cay' || p[0] === 'tin-tuc') && p[1]) return { kind: 'post', slug: p[1] };
  if (p[0] === 'benh-cay' && p[1]) return { kind: 'disease', slug: p[1] };
  if (p[0] === 'doi-tac' && p[1] === 'cong-trinh' && p[2]) return { kind: 'project', slug: p[2] };
  return null;
}
const robotsMeta = (html: string) =>
  (/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i.exec(html) ?? /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i.exec(html))?.[1] ?? '';
const canonicals = (html: string) => [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((t) => /\brel=["']?canonical\b/i.test(t))
  .map((t) => decode(/\bhref=["']([^"']*)["']/i.exec(t)?.[1] ?? ''));

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const typesOf = (o: Obj) => ([] as unknown[]).concat(o['@type'] ?? []).map(String);
function jsonLd(html: string): Obj[] {
  const out: Obj[] = [];
  const visit = (x: unknown) => {
    if (Array.isArray(x)) x.forEach(visit);
    else if (isObj(x)) { out.push(x); if (Array.isArray(x['@graph'])) visit(x['@graph']); }
  };
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(m[1])); } catch { /* seo:schema báo */ }
  }
  return out;
}

// ---------- Link của component: gom lại rồi mở một lần ----------

/** URL nội bộ → component + trang đầu tiên thấy link đó (để báo lỗi chỉ đúng chỗ). */
const linkSeen = new Map<string, { component: string; at: string }>();
const seeLink = (url: string, component: string, at: string) => { if (!linkSeen.has(url)) linkSeen.set(url, { component, at }); };

/** Giá trên thẻ sản phẩm (để so với Offer của trang sản phẩm): slug → { giá, trang có thẻ }. */
const cardPrices = new Map<string, { price: number | null; at: string }>();
/** Banner đã kiểm (ảnh / link) — chỉ trang chủ có. */
const bannerImages = new Set<string>();

// ---------- Kiểm một trang ----------

function checkPage(url: string, html: string) {
  const at = short(url);
  const doc = parse(html);
  const els = [...walk(doc)];
  const inside = (up: Element[], pred: (e: Element) => boolean) => up.some(pred);

  // ---- SEO Head
  const titles = (html.match(/<title[\s>]/gi) ?? []).length - (html.match(/<svg[\s\S]*?<title[\s>][\s\S]*?<\/svg>/gi) ?? []).length;
  if (titles !== 1) err(`SEO Head: ${titles} thẻ <title> (cần đúng 1)`, at);
  if (canonicals(html).length > 1) err('SEO Head: nhiều hơn một canonical', at);
  if ((html.match(/<meta[^>]+name=["']robots["']/gi) ?? []).length > 1) err('SEO Head: nhiều hơn một meta robots', at);

  // ---- Header + logo
  const headers = all(doc, (el, up) => el.tagName === 'header' && !inside(up, (u) => ['article', 'main', 'aside'].includes(u.tagName)));
  if (headers.length !== 1) err(`Header: ${headers.length} thẻ <header> đầu trang (cần 1)`, at);
  const header = headers[0];
  if (header) {
    const logos = all(header, (el) => el.tagName === 'a' && hasCls(el, 'vx-logo'));
    if (logos.length !== 1) err(`Header: ${logos.length} logo .vx-logo (cần đúng 1)`, at);
    for (const l of logos) {
      if (attr(l, 'href') !== '/') err(`Header: logo link tới "${attr(l, 'href') ?? ''}" (cần "/")`, at);
      if (!nameOf(l)) err('Header: logo không có tên (aria-label / chữ / alt)', at);
    }
    for (const a of all(header, (el) => el.tagName === 'a')) {
      const h = attr(a, 'href');
      if (h === undefined || h === '' || h === '#' || /^javascript:/i.test(h)) err(`Header: link "${clip(nameOf(a), 30)}" không có href thật`, at);
      const u = internal(h, url);
      if (u) seeLink(u, 'Header', at);
    }
    const search = all(header, (el) => el.tagName === 'form' && attr(el, 'role') === 'search');
    if (!search.length) warn('Header: không thấy ô tìm kiếm (form role="search")', at);
    for (const f of search) checkSearchForm(f, at);
  }

  // ---- Navigation (thanh danh mục ngang, menu ☰ / menu trái)
  const navs = all(doc, (el) => el.tagName === 'nav');
  if (!navs.length) err('Navigation: không có <nav>', at);
  for (const n of navs) {
    for (const a of all(n, (el) => el.tagName === 'a')) {
      const h = attr(a, 'href');
      if (h === undefined || h === '' || h === '#' || /^javascript:/i.test(h)) err(`Navigation (${attr(n, 'aria-label') ?? attr(n, 'class') ?? 'nav'}): link không có href thật`, at);
      const u = internal(h, url);
      if (u && !FILTER_QS.test(u)) seeLink(u, `Navigation (${attr(n, 'aria-label') ?? 'nav'})`, at);
    }
    // Mục menu chỉ là nút bấm (không link) mà không mở khung con nào → Google không lần theo được.
    for (const b of all(n, (el) => el.tagName === 'button' || attr(el, 'role') === 'menuitem')) {
      if (b.tagName === 'button' && !attr(b, 'aria-controls') && !attr(b, 'aria-expanded') && !attr(b, 'aria-label') && /\S/.test(text(b)) && attr(b, 'aria-current') === undefined)
        warn(`Navigation: mục "${clip(nameOf(b), 30)}" là nút bấm không có link — nên là <a href>`, at);
    }
  }
  const catLinks = new Set(all(doc, (el, up) => el.tagName === 'a' && /^\/danh-muc\//.test(attr(el, 'href') ?? '') && inside(up, (u) => u.tagName === 'nav' || hasCls(u, 'app-side') || u === header))
    .map((a) => attr(a, 'href')!.split('?')[0]));
  if (!catLinks.size) err('Navigation: menu không có link danh mục nào trong HTML (menu chỉ hiện sau khi chạy JavaScript?)', at);

  // ---- Footer
  const footers = all(doc, (el, up) => el.tagName === 'footer' && !inside(up, (u) => ['article', 'main', 'aside', 'blockquote', 'figure'].includes(u.tagName)));
  if (footers.length !== 1) err(`Footer: ${footers.length} thẻ <footer> chân trang (cần 1)`, at);
  for (const f of footers) {
    const seen = new Map<string, number>();
    for (const a of all(f, (el) => el.tagName === 'a')) {
      const h = attr(a, 'href');
      if (h === undefined || h === '' || h === '#' || /^javascript:/i.test(h)) err(`Footer: link "${clip(nameOf(a), 30)}" không có href thật`, at);
      if (attr(a, 'target') === '_blank' && !/noopener|noreferrer/.test(attr(a, 'rel') ?? '')) err(`Footer: link mở tab mới thiếu rel="noopener" (${clip(h ?? '', 40)})`, at);
      if (!nameOf(a)) err(`Footer: link không có tên (${clip(h ?? '', 40)})`, at);
      const u = internal(h, url);
      if (u) { seeLink(u, 'Footer', at); seen.set(u, (seen.get(u) ?? 0) + 1); }
      if (u && /[?&](utm_|fbclid|gclid)/.test(u)) err(`Footer: link nội bộ mang tham số theo dõi (${short(u)})`, at);
    }
    for (const [u, n] of seen) if (n > 2) warn(`Footer: link ${short(u)} lặp ${n} lần`, at);
  }

  // ---- Breadcrumb (cấu trúc đầy đủ do seo:breadcrumb kiểm)
  for (const c of all(doc, (el) => hasCls(el, 'vx-crumb'))) {
    const links = all(c, (el) => el.tagName === 'a');
    for (const a of links) {
      const u = internal(attr(a, 'href'), url);
      if (!u) err('Breadcrumb: tầng giữa không có link nội bộ', at);
      else seeLink(u, 'Breadcrumb', at);
    }
  }

  // ---- Thẻ sản phẩm
  for (const card of all(doc, (el) => el.tagName === 'article' && hasCls(el, 'vx-pcard'))) {
    const hrefs = new Set(all(card, (el) => el.tagName === 'a').map((a) => internal(attr(a, 'href'), url)).filter((x): x is string => !!x && /\/san-pham\//.test(x)));
    if (hrefs.size !== 1) { err(`Thẻ sản phẩm: ${hrefs.size} đích link khác nhau trong một thẻ (cần 1 trang sản phẩm)`, at); continue; }
    const target = [...hrefs][0];
    const slug = pathOf(target).split('/')[2];
    seeLink(target, 'Thẻ sản phẩm', at);
    const name = all(card, (el) => hasCls(el, 'vx-pcard__name'))[0];
    if (!name || !clean(text(name))) err('Thẻ sản phẩm: thiếu tên sản phẩm (.vx-pcard__name)', at);
    else if (!/^h[2-4]$/.test(name.tagName)) warn(`Thẻ sản phẩm: tên là <${name.tagName}> (nên là heading h2 / h3)`, at);
    for (const img of all(card, (el) => el.tagName === 'img')) {
      const alt = attr(img, 'alt');
      if (alt === undefined || !alt.trim() || /undefined|null/.test(alt)) err('Thẻ sản phẩm: ảnh thiếu alt', at);
      const s = imageSlug(attr(img, 'src'));
      if (s && s.kind === 'product' && s.slug && s.slug !== slug) err(`Thẻ sản phẩm: ảnh của "${s.slug}" nằm trên thẻ của "${slug}"`, at);
      if (s && s.kind !== 'product') err(`Thẻ sản phẩm: ảnh không phải ảnh sản phẩm (${clip(attr(img, 'src') ?? '', 50)})`, at);
    }
    const amt = all(card, (el) => hasCls(el, 'app-pcard__amt'))[0];
    const quote = all(card, (el) => hasCls(el, 'app-quote'))[0];
    if (!amt && !quote) err(`Thẻ sản phẩm: không có giá hay "Liên hệ báo giá" (${slug})`, at);
    if (!cardPrices.has(slug)) cardPrices.set(slug, { price: amt ? Number(clean(text(amt)).replace(/\D/g, '')) || null : null, at });
  }

  // ---- Thẻ bài viết / bệnh cây / công trình (link chứa ảnh): ảnh đúng nội dung được link
  for (const [a, up] of els) {
    if (a.tagName !== 'a' || inside(up, (u) => u.tagName === 'article' && hasCls(u, 'vx-pcard'))) continue;
    const u = internal(attr(a, 'href'), url);
    const t = u && targetSlug(u);
    if (!t || t.kind === 'product' && pathOf(u!) === pathOf(url)) continue;
    for (const img of all(a, (el) => el.tagName === 'img')) {
      const s = imageSlug(attr(img, 'src'));
      if (s && s.slug && s.kind === t.kind && s.slug !== t.slug) err(`Thẻ nội dung: link tới ${short(u!)} nhưng ảnh là của "${s.slug}"`, at);
      if (attr(img, 'alt') === undefined) err(`Thẻ nội dung: ảnh trong link ${short(u!)} thiếu alt`, at);
    }
  }

  // ---- Banner trang chủ (băng ảnh, ô nhỏ cạnh, dải giữa trang)
  for (const slide of all(doc, (el) => /\bhm-(slide|side)\b/.test(cls(el)) && !/\bhm-slide__/.test(cls(el)))) {
    const shown = clean(text(slide));
    for (const img of all(slide, (el) => el.tagName === 'img')) {
      const alt = attr(img, 'alt');
      if (alt === undefined) err('Banner: ảnh thiếu thuộc tính alt', at);
      else if (!alt.trim() && !shown && !hasCls(img, 'hm-slide__fill')) warn('Banner: ảnh không có alt và không có chữ trên ảnh (Google không biết banner nói gì)', at);
      const src = attr(img, 'src');
      const abs = src && internal(src, url);
      if (abs && !hasCls(img, 'hm-slide__fill')) bannerImages.add(abs);
    }
    for (const a of all(slide, (el) => el.tagName === 'a')) {
      const u = internal(attr(a, 'href'), url);
      if (u) seeLink(u, 'Banner', at);
      else if (!/^https?:/.test(attr(a, 'href') ?? '')) err(`Banner: link không có đích (${attr(a, 'href') ?? ''})`, at);
    }
  }

  // ---- Tab
  const byId = new Map<string, Element>();
  for (const [el] of els) { const id = attr(el, 'id'); if (id) byId.set(id, el); }
  for (const tab of all(doc, (el) => attr(el, 'role') === 'tab')) {
    const ctl = attr(tab, 'aria-controls');
    const real = tab.tagName === 'a' && internal(attr(tab, 'href'), url);
    if (!real && !(ctl && byId.has(ctl))) err(`Tab "${clip(nameOf(tab), 30)}": không phải link thật và không trỏ tới khung nội dung có trong HTML`, at);
  }
  for (const panel of all(doc, (el) => attr(el, 'role') === 'tabpanel')) {
    if (!clean(text(panel))) warn(`Tab: khung nội dung #${attr(panel, 'id') ?? '?'} rỗng trong HTML (nội dung chỉ tải sau khi bấm?)`, at);
  }

  // ---- Accordion / khối thu gọn
  for (const d of all(doc, (el) => el.tagName === 'details')) {
    const body = kids(d).filter((k) => !(isEl(k) && k.tagName === 'summary')).map(text).join('');
    if (!clean(body)) err(`Accordion: <details> "${clip(clean(text(all(d, (e) => e.tagName === 'summary')[0] ?? d)), 30)}" không có nội dung trong HTML`, at);
  }
  for (const b of all(doc, (el) => attr(el, 'aria-expanded') === 'false' && !!attr(el, 'aria-controls'))) {
    const target = byId.get(attr(b, 'aria-controls')!);
    const menu = !!attr(b, 'aria-haspopup');
    if (!target) (menu ? warn : err)(`Accordion / menu: nút "${clip(nameOf(b), 30)}" trỏ #${attr(b, 'aria-controls')} không có trong HTML`, at);
    else if (!clean(text(target)) && !all(target, (e) => e.tagName === 'a' || e.tagName === 'img').length) (menu ? warn : err)(`Accordion: khung #${attr(b, 'aria-controls')} rỗng trong HTML (nội dung chỉ có sau khi bấm)`, at);
  }

  // ---- Modal
  for (const m of all(doc, (el) => attr(el, 'aria-modal') === 'true' || (el.tagName === 'dialog' && attr(el, 'open') !== undefined))) {
    if (attr(m, 'hidden') === undefined) err(`Modal: hộp thoại "${clip(nameOf(m), 30)}" đang mở ngay trong HTML máy chủ (che nội dung chính)`, at);
  }

  // ---- Pagination
  for (const nav of all(doc, (el) => el.tagName === 'nav' && hasCls(el, 'vx-pager'))) {
    const cur = new URL(url).searchParams.get('trang') ?? '1';
    const links = all(nav, (el) => el.tagName === 'a');
    const current = links.find((a) => attr(a, 'aria-current') === 'true');
    if (!current) err('Pagination: không đánh dấu trang hiện tại (aria-current)', at);
    else if (clean(text(current)) !== cur) err(`Pagination: đánh dấu trang ${clean(text(current))} nhưng đang ở trang ${cur}`, at);
    for (const a of links) {
      const u = internal(attr(a, 'href'), url);
      if (!u) { err('Pagination: link không có href nội bộ', at); continue; }
      const n = new URL(u).searchParams.get('trang');
      const label = attr(a, 'aria-label') ?? '';
      if (n === '1') err('Pagination: link "Trang 1" mang ?trang=1 (trang 1 phải là URL gốc)', at);
      if (/Trang sau/.test(label) && Number(n) !== Number(cur) + 1) err(`Pagination: "Trang sau" trỏ trang ${n ?? '1'} (cần ${Number(cur) + 1})`, at);
      if (/Trang trước/.test(label) && Number(n ?? 1) !== Number(cur) - 1) err(`Pagination: "Trang trước" trỏ trang ${n ?? '1'} (cần ${Number(cur) - 1})`, at);
      if (pathOf(u) !== pathOf(url)) err(`Pagination: link sang đường dẫn khác ${short(u)}`, at);
      if (!/nofollow/.test(attr(a, 'rel') ?? '')) pagerTargets.add(u);
    }
  }

  // ---- Bộ lọc / sắp xếp
  const filterLinks = new Set<string>();
  for (const a of all(doc, (el) => el.tagName === 'a')) {
    const u = internal(attr(a, 'href'), url);
    if (!u || !FILTER_QS.test(u)) continue;
    filterLinks.add(u);
    if (!/nofollow/.test(attr(a, 'rel') ?? '')) err(`Bộ lọc: link lọc / sắp xếp thiếu rel="nofollow" (${clip(short(u), 60)})`, at);
  }
  if (filterLinks.size > MAX_FILTER_LINKS) warn(`Bộ lọc: ${filterLinks.size} link lọc khác nhau trên một trang (dễ thành bẫy thu thập)`, at);
  if (filterLinks.size) filterSamples.add([...filterLinks][0]);

  // ---- Nội dung liên quan / link trong nội dung chính
  const main = all(doc, (el) => el.tagName === 'main')[0];
  if (main) {
    const count = new Map<string, number>();
    for (const [a, up] of walk(main)) {
      if (a.tagName !== 'a') continue;
      if (inside(up, (u) => hasCls(u, 'vx-crumb') || hasCls(u, 'vx-pager') || hasCls(u, 'vx-pcard') || u.tagName === 'form')) continue;
      const u = internal(attr(a, 'href'), url);
      if (!u) continue;
      if (u === url && attr(a, 'aria-current') === undefined && !(attr(a, 'href') ?? '').includes('#')) warn('Nội dung liên quan: link tới chính trang đang xem', at);
      count.set(u, (count.get(u) ?? 0) + 1);
    }
    for (const [u, n] of count) if (n > 6) warn(`Nội dung liên quan: link ${short(u)} lặp ${n} lần trong nội dung chính`, at);
  }

  // ---- Ảnh
  for (const [img, up] of els) {
    if (img.tagName !== 'img' || inside(up, (u) => u.tagName === 'noscript')) continue;
    if (attr(img, 'alt') === undefined) err(`Ảnh: thiếu alt (${clip(attr(img, 'src') ?? '', 50)})`, at);
    const content = imageSlug(attr(img, 'src'));
    if (content && (!attr(img, 'width') || !attr(img, 'height')) && !hasCls(img, 'hm-slide__fill') && !inside(up, (u) => /\bhm-/.test(cls(u))))
      warn(`Ảnh: ảnh ${content.kind} thiếu width / height (dễ nhảy bố cục)`, at);
  }

  // ---- Bộ chuyển ngôn ngữ
  if (/<a\b[^>]*\bhreflang=/i.test(html)) warn('Locale switcher: có link hreflang — web một ngôn ngữ, kiểm lại bằng seo:locale', at);

  // ---- Banner cookie
  for (const ck of all(doc, (el) => hasCls(el, 'app-ck') || hasCls(el, 'ck'))) {
    if (attr(ck, 'aria-modal') === 'true') err('Cookie banner: là hộp thoại chặn (aria-modal) — không được chặn nội dung công khai', at);
  }
  return main ? clean(text(main)).length : 0;
}

function checkSearchForm(f: Element, at: string) {
  const action = attr(f, 'action');
  const method = (attr(f, 'method') ?? 'get').toLowerCase();
  if (action !== '/tim-kiem') err(`Search box: form tìm kiếm có action="${action ?? ''}" (cần "/tim-kiem" — không có thì khi chưa chạy JavaScript sẽ gửi về chính trang đang xem, sinh URL lạ)`, at);
  if (method !== 'get') err('Search box: form tìm kiếm không dùng GET', at);
  const input = all(f, (el) => el.tagName === 'input' && attr(el, 'type') !== 'hidden' && attr(el, 'type') !== 'submit')[0];
  if (!input || attr(input, 'name') !== 'q') err('Search box: ô tìm kiếm không có name="q"', at);
}

const pagerTargets = new Set<string>();
const filterSamples = new Set<string>();

// ---------- Chạy ----------

async function main() {
  console.log(`Kiểm tra component dùng chung trên ${BASE}\n`);
  const { robots, pages } = await sitemapPages();
  const groups = new Map<string, string[]>();
  for (const u of pages) { const t = template(u); if (!groups.has(t)) groups.set(t, []); groups.get(t)!.push(u); }
  const sample = [...groups.values()].flatMap((list) => list.slice(0, PER_TEMPLATE));
  console.log(`${pages.length} trang trong sitemap, ${groups.size} loại trang → kiểm ${sample.length} trang`);

  const mainLen = new Map<string, number>();
  await pool(sample, async (u) => {
    const r = await get(u);
    if (r.status !== 200) return err(`Trang mẫu trả mã ${r.status} (seo:sitemap báo chi tiết)`, short(u));
    mainLen.set(u, checkPage(u, r.html));
  });

  // Mỗi link nội bộ của component mở lại một lần: 200, không chuyển hướng.
  const links = [...linkSeen.keys()];
  await pool(links, async (u) => {
    const r = await get(u);
    const { component, at } = linkSeen.get(u)!;
    if (r.status >= 300 && r.status < 400) err(`${component}: link ${short(u)} bị chuyển hướng ${r.status} → ${r.location ?? '?'} (sửa link về đích cuối)`, at);
    else if (r.status !== 200) err(`${component}: link ${short(u)} trả mã ${r.status}`, at);
  });
  console.log(`${links.length} link nội bộ của component đã mở lại`);

  // Giá trên thẻ sản phẩm = giá Offer của trang sản phẩm.
  await pool([...cardPrices].slice(0, 40), async ([slug, c]) => {
    const r = await get(`${siteOrigin}/san-pham/${slug}`);
    if (r.status !== 200) return;
    const product = jsonLd(r.html).find((o) => typesOf(o).includes('Product'));
    const offer = product && isObj(product.offers) ? product.offers : null;
    const price = offer ? Number(offer.price) : null;
    if (c.price === null && price) err(`Thẻ sản phẩm "${slug}": thẻ ghi "Liên hệ báo giá" nhưng trang sản phẩm có giá ${price}`, c.at);
    else if (c.price !== null && price !== null && c.price !== price) err(`Thẻ sản phẩm "${slug}": giá trên thẻ ${c.price} ≠ giá trang sản phẩm ${price}`, c.at);
  });

  // Banner: ảnh tải được, không quá nặng.
  await pool([...bannerImages], async (u) => {
    const r = await get(u, BROWSER_UA);
    if (r.status !== 200) err(`Banner: ảnh ${short(u)} trả mã ${r.status}`, '/');
    else if (!/^image\//.test(r.type)) err(`Banner: ${short(u)} không phải ảnh (${r.type})`, '/');
    else if (r.bytes > BANNER_MAX_BYTES) warn(`Banner: ảnh ${short(u)} nặng ${Math.round(r.bytes / 1024)}KB (nên < ${BANNER_MAX_BYTES / 1000}KB)`, '/');
  });

  // Pagination: trang n+1 trả 200 + canonical tự trỏ chính nó.
  await pool([...pagerTargets].slice(0, 20), async (u) => {
    const r = await get(u);
    if (r.status !== 200) return err(`Pagination: ${short(u)} trả mã ${r.status}`, short(u));
    const c = canonicals(r.html)[0];
    if (c && c !== u) err(`Pagination: ${short(u)} canonical trỏ ${short(c)} (trang phân trang phải tự trỏ chính nó)`, short(u));
  });

  // Bộ lọc: trang lọc noindex + canonical về trang gốc.
  await pool([...filterSamples].slice(0, 6), async (u) => {
    const r = await get(u);
    if (r.status !== 200) return;
    if (!/noindex/i.test(robotsMeta(r.html))) err(`Bộ lọc: trang lọc ${clip(short(u), 60)} không noindex`, short(u));
    const c = canonicals(r.html)[0];
    if (!c || FILTER_QS.test(c)) err(`Bộ lọc: trang lọc ${clip(short(u), 60)} canonical ${c ? short(c) : '(không có)'} — cần trỏ về trang gốc`, short(u));
  });

  // Ô tìm kiếm: noindex, chặn trong robots.txt, chữ lạ / rỗng không lỗi.
  if (!/^disallow:\s*\/tim-kiem/im.test(robots)) err('Search box: robots.txt chưa chặn /tim-kiem (trang kết quả tìm kiếm sinh vô hạn URL)', '/robots.txt');
  for (const q of ['cay', '<script>alert(1)</script>', '', '%%%', 'a'.repeat(300)]) {
    const r = await get(`${siteOrigin}/tim-kiem?q=${encodeURIComponent(q)}`);
    const at = `/tim-kiem?q=${clip(q, 20)}`;
    if (r.status >= 500 || r.status === 0) err(`Search box: tìm "${clip(q, 20)}" trả mã ${r.status}`, at);
    else if (r.status === 200) {
      if (!/noindex/i.test(robotsMeta(r.html))) err('Search box: trang kết quả tìm kiếm không noindex', at);
      if (q.includes('<script>') && r.html.includes(q)) err('Search box: chữ tìm kiếm được in thẳng vào HTML (không escape)', at);
    }
  }

  // Trang lỗi: 404 thật, noindex, đủ đầu / chân trang, không canonical.
  const ghost = `/khong-co-trang-nay-${Date.now().toString(36)}`;
  for (const p of [ghost, `/san-pham${ghost}`, `/goc-cham-cay${ghost}`]) {
    const r = await get(siteOrigin + p);
    if (r.status !== 404) { err(`Error component: ${p} trả mã ${r.status} (cần 404)`, p); continue; }
    if (!/noindex/i.test(robotsMeta(r.html))) err('Error component: trang 404 không noindex', p);
    if (canonicals(r.html).length) err('Error component: trang 404 có canonical', p);
    if (p === ghost) {
      if (!/<header[\s>]/.test(r.html) || !/<footer[\s>]/.test(r.html)) err('Error component: trang 404 thiếu đầu trang / chân trang', p);
      if (!/<a[^>]+href="\/"/.test(r.html)) err('Error component: trang 404 không có link về trang chủ', p);
    }
  }
  // Ảnh không có → 404 (không trả trang HTML 200 — Google sẽ tưởng ảnh là trang).
  for (const p of ['/api/product-images/khong-co-00000000000000000000000000000000.jpg', '/images/khong-co-anh-nay.jpg']) {
    const r = await get(siteOrigin + p, BROWSER_UA);
    if (r.status === 200) err(`Image component: ảnh không có ${p} trả 200 (${r.type})`, p);
  }

  // Banner cookie / UA: nội dung chính Googlebot và trình duyệt nhận như nhau (không chặn bot sau hộp đồng ý cookie).
  for (const u of sample.slice(0, 5)) {
    const b = await get(u, BROWSER_UA);
    if (b.status !== 200) continue;
    const doc = parse(b.html);
    const main = all(doc, (el) => el.tagName === 'main')[0];
    const len = main ? clean(text(main)).length : 0;
    const g = mainLen.get(u) ?? 0;
    if (g && Math.abs(len - g) / g > 0.15) err(`Cookie banner / UA: nội dung chính cho trình duyệt (${len} ký tự) khác cho Googlebot (${g})`, short(u));
  }

  // ---- Báo cáo
  const print = (title: string, map: Map<string, Set<string>>) => {
    if (!map.size) return;
    console.log(`\n${title} (${map.size}):`);
    for (const [msg, locs] of [...map].sort((a, b) => a[0].localeCompare(b[0], 'vi'))) {
      const list = [...locs];
      console.log(`  • ${msg}\n      ${list.slice(0, 4).join(', ')}${list.length > 4 ? ` … +${list.length - 4} trang` : ''}`);
    }
  };
  print('LỖI', errors);
  print('Cảnh báo', warnings);
  console.log(`\n${errors.size ? '✗' : '✓'} ${sample.length} trang mẫu (${groups.size} loại), ${links.length} link component, ${cardPrices.size} thẻ sản phẩm — ${errors.size} lỗi, ${warnings.size} cảnh báo`);
  process.exit(errors.size ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
