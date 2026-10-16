/**
 * Kiểm tra breadcrumb (mục 7 checklist SEO): `npm run seo:breadcrumb` (máy dev, http://localhost:3000) hoặc
 * `npm run seo:breadcrumb -- https://www.caycanhmientay.com` (web thật — chạy sau mỗi lần deploy cùng các công cụ seo:* khác).
 * Luật dựng breadcrumb nằm ở `normalizeCrumbs` (src/lib/jsonld.ts), có kiểm thử trong `npm run test:jsonld`.
 *
 * Mở mọi trang trong sitemap bằng UA Googlebot, đọc breadcrumb đang hiện (<nav class="vx-crumb">) và BreadcrumbList:
 *  - mọi trang (trừ trang chủ) có đúng MỘT breadcrumb ≥ 2 mục; trang chủ không có;
 *  - mục đầu là "Trang chủ" → /, "Trang chủ" không lặp lại ở giữa;
 *  - các tầng giữa đều là link thật; mục cuối là trang đang xem, không link, có aria-current="page";
 *  - không URL trùng, không "#mục", không tham số theo dõi, không trỏ ra ngoài tên miền chính;
 *  - mỗi tầng mở ra trả 200 (không qua chuyển hướng), không noindex, canonical trỏ về chính nó;
 *  - ĐÚNG CẤU TRÚC: breadcrumb của trang cha phải là phần đầu của breadcrumb trang con (vd. sản phẩm
 *    Trang chủ / Cây cảnh / Cây để bàn / Kim tiền ↔ trang Cây để bàn: Trang chủ / Cây cảnh / Cây để bàn);
 *    trang sản phẩm: tầng 2 là /danh-muc/<danh mục>, tầng 3 (nếu có) là nhóm con của chính danh mục đó, khớp
 *    "category" của schema Product;
 *  - BreadcrumbList có đúng một khối, cùng tên + link với breadcrumb đang hiện; không có breadcrumb thì không có schema;
 *  - KHÔNG ĐỔI THEO PHIÊN: mở lại bằng trình duyệt thường, kèm cookie + Referer từ trang khác → breadcrumb y hệt;
 *  - không luật CSS nào giấu breadcrumb (display: none / visibility: hidden) ở bất kỳ cỡ màn hình nào
 *    (máy tính và điện thoại nhận cùng HTML; chỉ CSS có thể làm breadcrumb biến mất trên một cỡ màn).
 * Cảnh báo: mục cuối không có chữ nào chung với <h1>, tên tầng khác tên trang cha tự ghi.
 * Có lỗi thì thoát mã 1. `ALL=1` để in đủ mọi trang của một lỗi lặp.
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BROWSER = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const CONCURRENCY = 6;
const TRACKING = /^(utm_|fbclid$|gclid$|zarsrc$|_ga$)/;

type Crumb = { name: string; url?: string; current?: boolean };
const errors = new Map<string, string[]>();
const warnings = new Map<string, string[]>();
const add = (m: Map<string, string[]>, msg: string, loc: string) => { const l = m.get(msg) ?? []; if (!l.includes(loc)) l.push(loc); m.set(msg, l); };
const err = (msg: string, loc: string) => add(errors, msg, loc);
const warn = (msg: string, loc: string) => add(warnings, msg, loc);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const text = (html: string) => decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const words = (s: string) => new Set(fold(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1));

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (i < items.length) await fn(items[i++]); }));
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

const NAV_RE = /<nav\b[^>]*class="vx-crumb"[^>]*>([\s\S]*?)<\/nav>/g;
const PART_RE = /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<span( aria-current="page")?>([\s\S]*?)<\/span>/g;
function crumbsOf(html: string): Crumb[][] {
  return [...html.matchAll(NAV_RE)].map((m) => [...m[1].matchAll(PART_RE)]
    .map((p): Crumb => (p[1] !== undefined
      ? { name: text(p[2]), url: decode(p[1]) }
      : { name: text(p[4] ?? ''), current: !!p[3] }))
    .filter((c) => c.name));
}
const abs = (u: string) => new URL(u, siteOrigin + '/').href;
const show = (l: Crumb[]) => l.map((c) => c.name).join(' / ');
const key = (l: Crumb[]) => JSON.stringify(l.map((c) => [c.name, c.url ? abs(c.url) : null, !!c.current]));

const canonicalOf = (html: string) => decode(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(html)?.[1] ?? /<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"/.exec(html)?.[1] ?? '');
const robotsOf = (html: string) => /<meta\b[^>]*name="robots"[^>]*content="([^"]*)"/.exec(html)?.[1] ?? '';

function ldBreadcrumbs(html: string): { name: string; url?: string }[][] {
  const out: { name: string; url?: string }[][] = [];
  for (const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data: unknown;
    try { data = JSON.parse(m[1]); } catch { continue; }
    for (const o of (Array.isArray(data) ? data : [data]) as Record<string, unknown>[]) {
      if (o?.['@type'] !== 'BreadcrumbList') continue;
      out.push(((o.itemListElement as Record<string, unknown>[]) ?? []).map((x) => ({ name: String(x.name ?? ''), url: typeof x.item === 'string' ? x.item : undefined })));
    }
  }
  return out;
}
const productCategory = (html: string) => {
  for (const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { const o = JSON.parse(m[1]); if (o?.['@type'] === 'Product' && typeof o.category === 'string') return o.category as string; } catch { /* bỏ */ }
  }
  return undefined;
};

// ---- trang (đích của một tầng breadcrumb, hoặc trang trong sitemap) — mở một lần ----
type Page = { status: number; location?: string; html: string };
const pages = new Map<string, Promise<Page>>();
function open(url: string): Promise<Page> {
  if (!pages.has(url)) {
    pages.set(url, (async () => {
      const res = await fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': GOOGLEBOT } });
      return { status: res.status, location: res.headers.get('location') ?? undefined, html: res.status === 200 ? await res.text() : (await res.arrayBuffer(), '') };
    })());
  }
  return pages.get(url)!;
}

/** Luật hình thức của một breadcrumb (không cần mở trang khác). */
function checkShape(loc: string, list: Crumb[]) {
  if (list.length < 2) return err('Breadcrumb ít hơn 2 mục', loc);
  const [first] = list;
  if (first.name !== 'Trang chủ' || !first.url || abs(first.url) !== `${siteOrigin}/`) err('Mục đầu breadcrumb không phải "Trang chủ" → /', loc);
  if (list.slice(1).some((c) => c.name === 'Trang chủ' || (c.url && abs(c.url) === `${siteOrigin}/`))) err('"Trang chủ" lặp lại trong breadcrumb', loc);
  const last = list[list.length - 1];
  if (last.url) err('Mục cuối breadcrumb (trang đang xem) lại là link', loc);
  else if (!last.current) err('Mục cuối breadcrumb thiếu aria-current="page"', loc);
  list.slice(0, -1).forEach((c, i) => { if (!c.url) err(`Tầng ${i + 1} của breadcrumb không có link`, loc); });
  const seen = new Set<string>();
  for (const c of list) {
    if (!c.url) continue;
    let u: URL;
    try { u = new URL(abs(c.url)); } catch { err(`Link breadcrumb không đọc được: ${c.url}`, loc); continue; }
    if (u.origin !== siteOrigin) err(`Link breadcrumb ra ngoài tên miền chính: ${c.url}`, loc);
    if (u.hash) err(`Link breadcrumb có "#mục": ${c.url}`, loc);
    if ([...u.searchParams.keys()].some((k) => TRACKING.test(k))) err(`Link breadcrumb có tham số theo dõi: ${c.url}`, loc);
    if (seen.has(u.href)) err(`Breadcrumb có hai tầng cùng URL: ${c.url}`, loc);
    seen.add(u.href);
    if (u.href === loc) err('Breadcrumb có tầng trỏ về chính trang đang xem', loc);
  }
}

/** Đích từng tầng: 200, index được, canonical về chính nó, breadcrumb của nó là phần đầu breadcrumb trang con. */
async function checkLevels(loc: string, list: Crumb[]) {
  for (let i = 1; i < list.length - 1; i++) {
    const c = list[i];
    const url = abs(c.url!);
    const p = await open(url).catch((e) => ({ status: 0, html: '', location: String(e) }) as Page);
    if (p.status !== 200) { err(`Tầng breadcrumb trả mã ${p.status}${p.location ? ` → ${p.location}` : ''}: ${c.url}`, loc); continue; }
    if (/noindex/i.test(robotsOf(p.html))) err(`Tầng breadcrumb trỏ vào trang noindex: ${c.url}`, loc);
    const can = canonicalOf(p.html);
    if (can && can !== url) err(`Tầng breadcrumb không phải URL chuẩn (canonical là ${can}): ${c.url}`, loc);
    const parent = crumbsOf(p.html)[0];
    if (!parent) { err(`Trang cha không có breadcrumb: ${c.url}`, loc); continue; }
    const prefix = parent.slice(0, -1).map((x) => abs(x.url ?? ''));
    const mine = list.slice(0, i).map((x) => abs(x.url!));
    if (prefix.length !== mine.length || prefix.some((u, k) => u !== mine[k])) {
      err(`Breadcrumb lệch cấu trúc với trang cha ${c.url}: [${show(parent)}] ≠ đầu của [${show(list)}]`, loc);
    } else if (fold(parent[parent.length - 1].name) !== fold(c.name)) {
      warn(`Tên tầng "${c.name}" khác tên trang cha tự ghi "${parent[parent.length - 1].name}"`, loc);
    }
  }
}

function checkProduct(loc: string, list: Crumb[], html: string) {
  const urls = list.slice(1, -1).map((c) => new URL(abs(c.url!)).pathname);
  const cat = urls[0]?.match(/^\/danh-muc\/([^/]+)$/)?.[1];
  if (!cat) return err('Breadcrumb sản phẩm: tầng 2 không phải trang danh mục /danh-muc/<danh mục>', loc);
  if (urls.length > 2) err('Breadcrumb sản phẩm có quá 2 tầng danh mục', loc);
  if (urls[1] && !urls[1].startsWith(`/danh-muc/${cat}/`)) err(`Breadcrumb sản phẩm: nhóm con ${urls[1]} không thuộc danh mục ${cat}`, loc);
  const ldCat = productCategory(html);
  const names = list.slice(1, -1).map((c) => c.name).join(' > ');
  if (ldCat !== undefined && ldCat !== names) err(`Breadcrumb sản phẩm "${names}" khác category của schema Product "${ldCat}"`, loc);
}

async function checkPage(loc: string) {
  const p = await open(loc);
  if (p.status !== 200) return err(`Trang trong sitemap trả mã ${p.status}`, loc);
  const all = crumbsOf(p.html);
  const lds = ldBreadcrumbs(p.html);
  const home = new URL(loc).pathname === '/' && !new URL(loc).search;
  if (home) {
    if (all.length) err('Trang chủ có breadcrumb', loc);
    if (lds.length) err('Trang chủ có BreadcrumbList', loc);
    return;
  }
  if (!all.length) {
    err('Trang không có breadcrumb', loc);
    if (lds.length) err('Có BreadcrumbList nhưng trang không hiện breadcrumb', loc);
    return;
  }
  if (all.length > 1) err(`${all.length} breadcrumb trên một trang`, loc);
  const list = all[0];
  checkShape(loc, list);

  // schema = breadcrumb đang hiện
  if (lds.length !== 1) err(`${lds.length} khối BreadcrumbList (cần đúng 1)`, loc);
  else {
    const ld = lds[0];
    const same = ld.length === list.length && ld.every((x, i) => x.name === list[i].name && (x.url ?? '') === (list[i].url ? abs(list[i].url!) : ''));
    if (!same) err(`BreadcrumbList khác breadcrumb đang hiện: [${ld.map((x) => x.name).join(' / ')}] ≠ [${show(list)}]`, loc);
  }

  // mục cuối ↔ h1
  const h1 = text(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(p.html)?.[1] ?? '');
  const lastWords = words(list[list.length - 1].name);
  if (h1 && lastWords.size && ![...lastWords].some((w) => words(h1).has(w))) warn(`Mục cuối breadcrumb "${list[list.length - 1].name}" không có chữ nào chung với h1 "${h1.slice(0, 60)}"`, loc);

  if (new URL(loc).pathname.startsWith('/san-pham/')) checkProduct(loc, list, p.html);
  await checkLevels(loc, list);

  // không đổi theo phiên / trang đến từ đâu / thiết bị
  const res = await fetch(local(loc), { headers: { 'User-Agent': BROWSER, Cookie: 'ccmt-seen=1; ccmt_ref=/khuyen-mai', Referer: `${siteOrigin}/tim-kiem?q=cay` } });
  const again = crumbsOf(await res.text())[0];
  if (!again || key(again) !== key(list)) err(`Breadcrumb đổi theo phiên / trình duyệt: [${show(list)}] ≠ [${again ? show(again) : 'không có'}]`, loc);
}

/** Luật CSS giấu breadcrumb (ở mọi @media) trong các file CSS trang khách tải. */
async function checkCss(sample: string) {
  const html = (await open(sample)).html;
  const hrefs = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => decode(m[1]));
  if (!hrefs.length) return warn('Không đọc được file CSS nào để kiểm breadcrumb bị ẩn', sample);
  for (const h of hrefs) {
    const css = await (await fetch(local(abs(h)))).text();
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = m[1].trim();
      if (!/vx-crumb/.test(sel) || /\[aria-current/.test(sel)) continue;
      if (/display\s*:\s*none|visibility\s*:\s*hidden/.test(m[2])) err(`CSS giấu breadcrumb: "${sel.slice(0, 120)}" { ${m[2].trim().slice(0, 60)} }`, h);
    }
  }
}

const locs = await sitemapPages();
console.log(`Kiểm breadcrumb ${locs.length} trang trong sitemap của ${BASE}…`);
await pool(locs, (l) => checkPage(l).catch((e) => err(`Không mở được (${(e as Error).message})`, l)));
const sample = locs.find((l) => l.includes('/san-pham/')) ?? locs[0];
await checkCss(sample);

const print = (m: Map<string, string[]>, mark: string) => {
  for (const [msg, list] of m) {
    console.log(`${mark} ${msg}${list.length > 1 ? ` (${list.length} trang)` : ''}`);
    for (const l of process.env.ALL ? list : list.slice(0, 3)) console.log(`    ${l}`);
    if (!process.env.ALL && list.length > 3) console.log(`    … (ALL=1 để xem đủ)`);
  }
};
print(warnings, '⚠');
print(errors, '✗');
const nErr = [...errors.values()].reduce((a, l) => a + l.length, 0);
console.log(`\n${locs.length} trang, ${pages.size} trang đã mở · ${nErr} lỗi, ${warnings.size} loại cảnh báo`);
process.exit(nErr ? 1 : 0);
