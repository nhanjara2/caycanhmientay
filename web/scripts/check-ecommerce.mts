/**
 * Kiểm tra SEO thương mại điện tử (mục 15 checklist SEO): `npm run seo:ecommerce` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:ecommerce -- https://www.caycanhmientay.com` (web thật — chạy sau mỗi lần deploy cùng các công cụ seo:* khác).
 *
 * Mọi trang sản phẩm trong sitemap (UA Googlebot, HTML máy chủ trả — không cần JavaScript):
 *  - URL ổn định: đúng dạng /san-pham/<slug> (một đoạn, chữ thường không dấu, không chứa danh mục / mã số database) → đổi tên,
 *    đổi danh mục không đổi URL; 200, canonical tự trỏ chính nó, không noindex;
 *  - đúng MỘT schema Product (trừ sản phẩm chỉ "Liên hệ báo giá" chưa có đánh giá — khi đó trang không được hiện giá nào);
 *  - giá + tình trạng khớp giữa trang và schema: đọc các ô quy cách (giá, "Hết hàng") → giá thấp / cao / số quy cách / availability
 *    phải đúng như schema (tính trên quy cách còn hàng, hết cả thì trên mọi quy cách có giá); quy cách chọn sẵn = giá thấp nhất
 *    còn hàng = giá ở khung giá; đang chọn quy cách hết hàng thì có nhãn "Hết hàng" và KHÔNG có nút Thêm vào giỏ / Mua ngay;
 *  - giá gạch ngang > giá bán và nhãn -% đúng phép tính; chưa có đánh giá thì schema không có rating / review;
 *  - thương hiệu trên trang = brand trong schema; ảnh trong schema là URL cố định của chính sản phẩm (không token / hết hạn);
 *  - không có link tới URL biến thể (?quy-cach=, /san-pham/<slug>/…); thêm ?quy-cach=1 vẫn 200 + canonical sạch.
 * Trang danh mục / nhóm con trong sitemap: đi hết phân trang bằng <a href> → mọi sản phẩm trong sitemap phải có link thật từ ít nhất
 * một trang danh mục (không mồ côi); thẻ "Hết hàng" xếp sau thẻ còn hàng; thẻ ghi "Hết hàng" ⇔ trang sản phẩm OutOfStock.
 * Giỏ hàng, thanh toán, tài khoản, đặt hàng thành công: noindex + bị chặn trong robots.txt + không có trong sitemap.
 * Sản phẩm không tồn tại / đã gỡ: 404 (không 200, không chuyển về trang chủ).
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính thì URL được đổi sang máy đó để mở.
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CONCURRENCY = 6;
const MAX_LIST_PAGES = 80;
const IN_STOCK = 'https://schema.org/InStock';
const OUT_OF_STOCK = 'https://schema.org/OutOfStock';
const PRIVATE = ['/gio-hang', '/thanh-toan', '/tai-khoan', '/tai-khoan/don-hang', '/dat-hang-thanh-cong'];

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string, loc: string) => errors.push(`${m} — ${loc}`);
const warn = (m: string, loc: string) => warnings.push(`${m} — ${loc}`);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = (html: string) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const short = (u: string) => u.replace(siteOrigin, '') || '/';
/** "1.250.000đ" → 1250000; không phải giá → null. */
const vnd = (s: string) => (/\d/.test(s) && /đ/.test(s) ? Number(s.replace(/\D/g, '')) : null);

type Page = { status: number; location: string | null; html: string };
const cache = new Map<string, Promise<Page>>();
function page(url: string) {
  if (!cache.has(url)) {
    cache.set(url, fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': UA } }).then(async (r) => ({
      status: r.status, location: r.headers.get('location'),
      html: /html/.test(r.headers.get('content-type') ?? '') ? await r.text() : (await r.body?.cancel(), ''),
    })));
  }
  return cache.get(url)!;
}

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

const canonicalOf = (html: string) => {
  const tag = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => /\brel=["']?canonical\b/i.test(t));
  const href = tag && /\bhref=["']([^"']*)["']/i.exec(tag)?.[1];
  return href ? decode(href) : null;
};
const robotsMeta = (html: string) =>
  (/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i.exec(html) ?? /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i.exec(html))?.[1] ?? '';

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const typesOf = (o: Obj) => ([] as unknown[]).concat(o['@type'] ?? []).map(String);
function jsonLd(html: string): Obj[] {
  const out: Obj[] = [];
  const walk = (x: unknown) => {
    if (Array.isArray(x)) x.forEach(walk);
    else if (isObj(x)) { out.push(x); if (Array.isArray(x['@graph'])) walk(x['@graph']); }
  };
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(m[1])); } catch { /* seo:schema báo JSON hỏng */ }
  }
  return out;
}

/** Ô quy cách trên trang sản phẩm: nhãn, giá (null = "Liên hệ báo giá"), hết hàng, đang chọn. */
function optionTiles(html: string) {
  return [...html.matchAll(/<button\b([^>]*\bclass="app-vopt"[^>]*)>([\s\S]*?)<\/button>/g)].map(([, attrs, inner]) => {
    const label = text(/class="app-vopt__l"[^>]*>([\s\S]*?)<\/span>/.exec(inner)?.[1] ?? '');
    const priceText = text(/<small>([\s\S]*?)<\/small>/.exec(inner)?.[1] ?? '');
    return { label, price: vnd(priceText), out: /data-stock="out"/.test(attrs), selected: /aria-pressed="true"/.test(attrs) };
  });
}

/** Link sản phẩm + thẻ "Hết hàng" trên một trang danh sách (theo thứ tự hiện). */
function cards(html: string) {
  return html.split(/<article\b[^>]*class="vx-pcard/).slice(1).flatMap((chunk) => {
    const body = chunk.split('</article>')[0];
    const slug = /href="\/san-pham\/([^"?#/]+)"/.exec(body)?.[1];
    return slug ? [{ slug: decodeURIComponent(slug), out: /class="app-pcard__out"/.test(body) }] : [];
  });
}

async function sitemapUrls() {
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  siteOrigin = new URL(index).origin;
  const locs = async (u: string) => [...(await (await fetch(local(u))).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const out: string[] = [];
  for (const child of await locs(index)) out.push(...await locs(child));
  return { urls: out, robots };
}

/** Các tiền tố bị chặn cho mọi máy tìm kiếm (nhóm User-agent: *). */
function disallowed(robots: string) {
  const rules: { allow: boolean; path: string }[] = [];
  let star = false;
  for (const line of robots.split(/\r?\n/)) {
    const [k, ...rest] = line.split(':');
    const v = rest.join(':').trim();
    if (/^user-agent$/i.test(k.trim())) star = v === '*';
    else if (star && /^(dis)?allow$/i.test(k.trim()) && v) rules.push({ allow: /^allow$/i.test(k.trim()), path: v });
  }
  // luật dài nhất khớp thắng (như Google)
  return (path: string) => {
    const hit = rules.filter((r) => path.startsWith(r.path)).sort((a, b) => b.path.length - a.path.length)[0];
    return Boolean(hit && !hit.allow);
  };
}

type Seen = { schemaOut: boolean | null };
const products = new Map<string, Seen>();

async function checkProduct(loc: string) {
  const path = new URL(loc).pathname;
  const slug = decodeURIComponent(path.split('/')[2] ?? '');
  if (!/^\/san-pham\/[a-z0-9]+(-[a-z0-9]+)*$/.test(path)) err('URL sản phẩm không đúng dạng /san-pham/<slug> (một đoạn, chữ thường không dấu)', short(loc));
  else if (/^\d+$/.test(slug)) err('URL sản phẩm chỉ là mã số — nên là tên sản phẩm', short(loc));

  const r = await page(loc);
  if (r.status !== 200) { err(`Trang sản phẩm trong sitemap trả mã ${r.status}`, short(loc)); return; }
  const at = short(loc);
  const canon = canonicalOf(r.html);
  if (canon !== loc) err(`Canonical trỏ ${canon ?? '(không có)'} — cần tự trỏ chính nó`, at);
  if (/noindex/i.test(robotsMeta(r.html))) err('Trang sản phẩm trong sitemap bị noindex', at);

  const tiles = optionTiles(r.html);
  if (!tiles.length) { err('Không đọc được ô quy cách (class "app-vopt") — đổi giao diện thì sửa công cụ này', at); return; }
  const priced = tiles.filter((t) => t.price !== null);
  const live = priced.filter((t) => !t.out);
  const basis = live.length ? live : priced;
  const lds = jsonLd(r.html).filter((o) => typesOf(o).includes('Product'));
  if (lds.length > 1) err(`Có ${lds.length} schema Product trên một trang`, at);
  const ld = lds[0];
  products.set(slug, { schemaOut: null });

  if (!ld) {
    if (priced.length) err('Trang có giá nhưng không có schema Product', at);
    return;
  }
  if (ld.url !== loc) err(`Product.url = ${String(ld.url)} (cần ${loc})`, at);

  // Giá + tình trạng: trang ⇔ schema
  const offers = ld.offers as Obj | undefined;
  if (!priced.length) {
    if (offers) err('Trang chỉ "Liên hệ báo giá" mà schema vẫn có offers', at);
  } else if (!isObj(offers)) err('Trang có giá mà schema không có offers', at);
  else {
    if (offers.priceCurrency !== 'VND') err(`priceCurrency ${String(offers.priceCurrency)} (cần VND)`, at);
    const prices = basis.map((t) => t.price!);
    const lo = Math.min(...prices), hi = Math.max(...prices);
    const agg = typesOf(offers).includes('AggregateOffer');
    if (agg !== prices.length > 1) err(`Schema dùng ${typesOf(offers)[0]} nhưng trang có ${prices.length} quy cách tính giá`, at);
    if (agg) {
      if (offers.lowPrice !== lo) err(`lowPrice ${String(offers.lowPrice)} ≠ giá thấp nhất trên trang ${lo}`, at);
      if (offers.highPrice !== hi) err(`highPrice ${String(offers.highPrice)} ≠ giá cao nhất trên trang ${hi}`, at);
      if (offers.offerCount !== prices.length) err(`offerCount ${String(offers.offerCount)} ≠ ${prices.length} quy cách`, at);
    } else if (offers.price !== lo) err(`price ${String(offers.price)} ≠ giá trên trang ${lo}`, at);
    const want = live.length ? IN_STOCK : OUT_OF_STOCK;
    if (offers.availability !== want) err(`availability ${String(offers.availability)} — trang ${live.length ? 'còn quy cách bán được' : 'hết hàng mọi quy cách'} (cần ${want})`, at);
    products.set(slug, { schemaOut: offers.availability === OUT_OF_STOCK });
  }

  // Quy cách chọn sẵn + khung giá + nút mua
  const sel = tiles.find((t) => t.selected);
  const shown = vnd(text(/class="vx-buy__price"[^>]*>\s*<b[^>]*>([\s\S]*?)<\/b>/.exec(r.html)?.[1] ?? ''));
  if (!sel) err('Không có quy cách nào được chọn sẵn', at);
  else {
    if (priced.length && sel.price !== Math.min(...basis.map((t) => t.price!))) err(`Quy cách chọn sẵn "${sel.label}" không phải quy cách rẻ nhất ${live.length ? 'còn hàng' : 'có giá'}`, at);
    if (sel.price !== null && shown !== sel.price) err(`Khung giá hiện ${shown ?? '?'} khác giá quy cách đang chọn ${sel.price}`, at);
    const badge = /class="app-soldout"/.test(r.html);
    const buy = /Thêm vào giỏ hàng/.test(r.html);
    if (sel.out && sel.price !== null) {
      if (!badge) err('Đang chọn quy cách hết hàng mà khung giá không ghi "Hết hàng"', at);
      if (buy) err('Quy cách hết hàng mà vẫn có nút Thêm vào giỏ hàng', at);
    } else if (sel.price !== null) {
      if (badge) err('Quy cách còn hàng mà khung giá ghi "Hết hàng"', at);
      if (!buy) err('Quy cách còn hàng mà không có nút Thêm vào giỏ hàng', at);
    }
  }

  // Giá gạch ngang + nhãn -%
  const old = /class="vx-buy__old"[^>]*>\s*<s>([\s\S]*?)<\/s>([\s\S]*?)<\/div>/.exec(r.html);
  if (old && shown) {
    const was = vnd(text(old[1]));
    const pct = Number(/-(\d+)%/.exec(text(old[2]).replace(/\s+/g, ''))?.[1] ?? NaN);
    if (!was || was <= shown) err(`Giá gạch ngang ${was ?? '?'} không lớn hơn giá bán ${shown}`, at);
    else if (pct !== Math.round((1 - shown / was) * 100)) err(`Nhãn -${pct}% không khớp ${shown} / ${was}`, at);
  }

  // Đánh giá, thương hiệu, ảnh
  if (/Chưa có đánh giá/.test(r.html) && (ld.aggregateRating || ld.review)) err('Trang ghi "Chưa có đánh giá" mà schema có rating / review', at);
  const brandShown = text(/Thương hiệu:([\s\S]*?)<\/span>/.exec(r.html)?.[1] ?? '');
  const brandLd = isObj(ld.brand) ? String(ld.brand.name ?? '') : '';
  if (brandShown !== brandLd) err(`Thương hiệu trên trang "${brandShown}" ≠ brand trong schema "${brandLd}"`, at);
  for (const img of ([] as unknown[]).concat(ld.image ?? []).map(String)) {
    const u = new URL(img);
    if (u.search) err(`Ảnh trong schema có tham số (token / hết hạn?): ${img}`, at);
    if (u.pathname.startsWith('/api/product-images/') && !u.pathname.startsWith(`/api/product-images/${slug}-`)) err(`Ảnh trong schema không mang tên sản phẩm này: ${img}`, at);
  }

  // URL biến thể
  for (const m of r.html.matchAll(/href="(\/san-pham\/[^"]+)"/g)) {
    const h = decode(m[1]);
    if (h.includes('?') || h.split('/').length > 3) err(`Link tới URL biến thể / con của sản phẩm: ${h}`, at);
  }
}

async function main() {
  console.log(`Kiểm tra SEO thương mại điện tử trên ${BASE}\n`);
  const { urls, robots } = await sitemapUrls();
  const productUrls = urls.filter((u) => new URL(u).pathname.startsWith('/san-pham/'));
  const listUrls = urls.filter((u) => new URL(u).pathname.startsWith('/danh-muc'));
  console.log(`${productUrls.length} sản phẩm, ${listUrls.length} trang danh mục trong sitemap.`);
  if (!productUrls.length) warn('Sitemap chưa có sản phẩm nào', '/sitemap.xml');

  await pool(productUrls, checkProduct);

  // Thêm tham số biến thể vào một sản phẩm: vẫn 200 + canonical sạch (không tạo trang trùng)
  if (productUrls[0]) {
    const v = `${productUrls[0]}?quy-cach=1`;
    const r = await page(v);
    if (r.status === 200) { if (canonicalOf(r.html) !== productUrls[0]) err(`Thêm ?quy-cach=1 làm canonical thành ${canonicalOf(r.html)}`, short(v)); }
    else if (!(r.status === 308 || r.status === 301)) err(`Thêm ?quy-cach=1: mã ${r.status}`, short(v));
  }

  // Danh mục: đi hết phân trang, gom link sản phẩm
  const linked = new Set<string>();
  const visited = new Set<string>();
  const queue = [...listUrls];
  while (queue.length && visited.size < MAX_LIST_PAGES) {
    const batch = queue.splice(0, CONCURRENCY).filter((u) => !visited.has(u));
    batch.forEach((u) => visited.add(u));
    await Promise.all(batch.map(async (u) => {
      const r = await page(u);
      if (r.status !== 200) { err(`Trang danh mục trả mã ${r.status}`, short(u)); return; }
      const list = cards(r.html);
      list.forEach((c) => linked.add(c.slug));
      const firstOut = list.findIndex((c) => c.out);
      if (firstOut >= 0 && list.slice(firstOut).some((c) => !c.out)) err('Thẻ "Hết hàng" xếp trước thẻ còn hàng', short(u));
      for (const c of list) {
        const seen = products.get(c.slug);
        if (seen?.schemaOut != null && seen.schemaOut !== c.out) err(`Thẻ ${c.slug} ${c.out ? 'ghi' : 'không ghi'} "Hết hàng" nhưng trang sản phẩm ${seen.schemaOut ? 'OutOfStock' : 'InStock'}`, short(u));
      }
      const base = new URL(u).pathname;
      for (const m of r.html.matchAll(/href="([^"]*\?trang=\d+)"/g)) {
        const h = new URL(decode(m[1]), siteOrigin);
        if (h.pathname === base && !/[?&](sap_xep|vi-tri|kich-thuoc|mau|menh|khac|nha-vuon)=/.test(h.search) && !visited.has(h.href)) queue.push(h.href);
      }
    }));
  }
  if (queue.length) warn(`Dừng sau ${MAX_LIST_PAGES} trang danh sách`, 'danh mục');
  for (const u of productUrls) {
    const slug = decodeURIComponent(new URL(u).pathname.split('/')[2] ?? '');
    if (!linked.has(slug)) err('Sản phẩm không có link thật từ trang danh mục / nhóm con nào (mồ côi khỏi danh mục)', short(u));
  }

  // Trang riêng tư của luồng mua hàng
  const blocked = disallowed(robots);
  const inSitemap = new Set(urls.map((u) => new URL(u).pathname));
  await pool(PRIVATE, async (p) => {
    if (!blocked(p)) err('Chưa chặn trong robots.txt', p);
    if (inSitemap.has(p)) err('Trang riêng tư nằm trong sitemap', p);
    const r = await page(siteOrigin + p);
    if (r.status === 200 && !/noindex/i.test(robotsMeta(r.html))) err('Trang riêng tư thiếu noindex', p);
  });

  // Sản phẩm không tồn tại / đã gỡ: 404, không chuyển về trang chủ
  const gone = `${siteOrigin}/san-pham/khong-ton-tai-kiem-tra-${Date.now().toString(36)}`;
  const g = await page(gone);
  if (g.status === 200) err('Sản phẩm không tồn tại trả 200 (soft 404)', short(gone));
  else if (g.status >= 300 && g.status < 400 && new URL(g.location ?? '/', siteOrigin).pathname === '/') err('Sản phẩm không tồn tại bị chuyển về trang chủ', short(gone));
  else if (g.status !== 404 && g.status !== 410) err(`Sản phẩm không tồn tại trả mã ${g.status} (cần 404 / 410)`, short(gone));
}

await main().catch((e) => errors.push(`Lỗi khi kiểm tra: ${(e as Error).message}`));
for (const w of warnings) console.log(`! ${w}`);
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length
  ? `\n${errors.length} lỗi, ${warnings.length} cảnh báo.`
  : `\nĐạt (${warnings.length} cảnh báo): ${products.size} sản phẩm — giá, tình trạng, thương hiệu khớp schema; danh mục có link thật tới mọi sản phẩm; luồng mua hàng không bị index.`);
process.exit(errors.length ? 1 : 0);
