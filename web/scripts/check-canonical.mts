/**
 * Kiểm tra canonical + chống trùng URL (mục 1.6 checklist SEO): `npm run seo:canonical` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:canonical -- https://www.caycanhmientay.com` (web thật, nên chạy sau mỗi lần deploy).
 *
 * Lấy mọi trang trong sitemap rồi kiểm:
 *  1. Mỗi trang đúng MỘT thẻ canonical, nằm trong <head>, URL tuyệt đối https trên tên miền chính, trỏ về chính nó
 *     (không trỏ nhầm về trang chủ); HTML trả cho trình duyệt thường và cho Googlebot cùng một canonical.
 *  2. Đích của canonical trả 200 (không qua chuyển hướng) và tự trỏ về chính nó (không chuỗi / vòng).
 *  3. Biến thể của cùng trang: thêm utm_… / fbclid / gclid → canonical vẫn là URL sạch; chữ HOA và dấu "/" cuối → chuyển hướng
 *     308 thẳng về URL chuẩn (một bước); trang danh mục đang sắp xếp / lọc → noindex + canonical về trang gốc.
 *  4. Mọi link nội bộ trên các trang đó: không trỏ vào URL bị chuyển hướng hay URL lỗi (link phải ghi đúng URL chuẩn).
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính (localhost, *.vercel.app) thì URL được đổi sang máy đó để mở.
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const CONCURRENCY = 6;
const MAX_LINKS = 3000;
const TRACKING = 'utm_source=kiem-tra&utm_medium=seo&fbclid=kt1&gclid=kt2';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
/** URL máy đang kiểm (localhost…) → URL tên miền chính, để so với canonical. */
const site = (u: string) => (u.startsWith(BASE) ? siteOrigin + u.slice(BASE.length) : u);
const same = (a: string, b: string) => new URL(a).href === new URL(b).href;
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const get = (url: string, ua = GOOGLEBOT) => fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': ua } });

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

type Page = { status: number; location: string | null; html: string; xRobots: string };
const cache = new Map<string, Promise<Page>>();
function page(url: string, ua = GOOGLEBOT) {
  const key = `${ua === GOOGLEBOT ? 'g' : 'b'} ${url}`;
  if (!cache.has(key)) {
    cache.set(key, get(url, ua).then(async (r) => ({
      status: r.status, location: r.headers.get('location'), xRobots: r.headers.get('x-robots-tag') ?? '',
      html: r.status === 200 && /html/.test(r.headers.get('content-type') ?? '') ? await r.text() : (await r.body?.cancel(), ''),
    })));
  }
  return cache.get(key)!;
}

/** Mọi thẻ <link rel="canonical"> (kèm vị trí so với </head>). */
function canonicals(html: string) {
  const head = html.indexOf('</head>');
  return [...html.matchAll(/<link\b[^>]*>/gi)].flatMap((m) => {
    if (!/\brel=["']?canonical\b/i.test(m[0])) return [];
    const href = /\bhref=["']([^"']*)["']/i.exec(m[0])?.[1];
    return [{ href: href ? decode(href) : '', inHead: head > 0 && (m.index ?? 0) < head }];
  });
}
const robotsMeta = (html: string) =>
  (/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i.exec(html) ?? /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i.exec(html))?.[1] ?? '';

/** Canonical duy nhất của một trang (báo lỗi nếu thiếu / nhiều / ngoài head / sai dạng). */
function oneCanonical(html: string, loc: string, label = '') {
  const list = canonicals(html);
  if (!list.length) { err(`Thiếu canonical${label} — ${loc}`); return null; }
  if (new Set(list.map((c) => c.href)).size > 1) err(`Có ${list.length} canonical khác nhau${label} (${list.map((c) => c.href).join(' | ')}) — ${loc}`);
  else if (list.length > 1) err(`Canonical bị lặp ${list.length} lần${label} — ${loc}`);
  if (list.some((c) => !c.inHead)) err(`Canonical nằm ngoài <head>${label} — ${loc}`);
  const href = list[0].href;
  if (!href.startsWith(`${siteOrigin}/`) && href !== siteOrigin) err(`Canonical không tuyệt đối / không https / khác tên miền chính (${href})${label} — ${loc}`);
  return href;
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

/** Chuyển hướng phải là 308, một bước, tới đúng URL chuẩn. */
async function expectRedirect(from: string, to: string, what: string) {
  const r = await page(from);
  if (r.status !== 308) { err(`${what}: mã ${r.status} (cần 308 về ${to}) — ${from}`); return; }
  const dest = site(new URL(r.location ?? '', local(from)).href);
  if (!same(dest, to)) err(`${what}: chuyển hướng tới ${dest} (cần ${to}) — ${from}`);
  else if ((await page(dest)).status !== 200) err(`${what}: đích chuyển hướng không trả 200 (chuyển nhiều bước?) — ${from}`);
}

async function main() {
  console.log(`Kiểm tra canonical trên ${BASE}\n`);
  const pages = await sitemapPages();
  console.log(`${pages.length} trang trong sitemap.`);
  const targets = new Set<string>();
  const links = new Map<string, string>(); // link nội bộ → trang chứa nó (lần đầu thấy)

  // 1. Canonical của từng trang (Googlebot + trình duyệt thường)
  await pool(pages, async (loc) => {
    const r = await page(loc);
    if (r.status !== 200) { err(`Trang trong sitemap trả mã ${r.status} — ${loc}`); return; }
    const href = oneCanonical(r.html, loc);
    if (href) {
      if (!same(href, loc)) err(`Canonical trỏ sang URL khác (${href}) — ${loc}`);
      if (same(href, `${siteOrigin}/`) && !same(loc, `${siteOrigin}/`)) err(`Canonical trỏ nhầm về trang chủ — ${loc}`);
      targets.add(href);
    }
    const b = await page(loc, BROWSER);
    const hb = b.status === 200 ? oneCanonical(b.html, loc, ' (trình duyệt thường)') : (err(`Trình duyệt thường nhận mã ${b.status} — ${loc}`), null);
    if (href && hb && !same(href, hb)) err(`Googlebot và trình duyệt thường nhận canonical khác nhau (${href} / ${hb}) — ${loc}`);
    for (const m of r.html.matchAll(/<a\b[^>]*\bhref=["']([^"'#]+)/gi)) {
      const raw = decode(m[1]);
      if (!/^\/(?!\/)/.test(raw) && !raw.startsWith(siteOrigin)) continue;
      const abs = site(new URL(raw, siteOrigin).href);
      if (!links.has(abs)) links.set(abs, loc);
    }
  });

  // 2. Đích canonical: 200, tự trỏ về chính nó
  await pool([...targets], async (t) => {
    const r = await page(t);
    if (r.status !== 200) { err(`Đích canonical trả mã ${r.status}${r.location ? ` → ${r.location}` : ''} — ${t}`); return; }
    const again = canonicals(r.html)[0]?.href;
    if (again && !same(again, t)) err(`Canonical nối chuỗi / vòng: ${t} → ${again}`);
  });

  // 3. Biến thể của cùng trang
  await pool(pages, async (loc) => {
    const u = new URL(loc);
    const tracked = `${loc}${u.search ? '&' : '?'}${TRACKING}`;
    const t = await page(tracked);
    if (t.status !== 200) err(`Thêm utm / fbclid: mã ${t.status} — ${tracked}`);
    else {
      const href = oneCanonical(t.html, tracked, ' (có utm)');
      if (href && !same(href, loc)) err(`Thêm utm / fbclid làm canonical đổi thành ${href} — ${loc}`);
    }
    if (u.pathname === '/') return;
    if (/[a-z]/.test(u.pathname)) await expectRedirect(`${u.origin}${u.pathname.toUpperCase()}${u.search}`, loc, 'Chữ hoa');
    await expectRedirect(`${u.origin}${u.pathname}/${u.search}`, loc, 'Dấu "/" cuối');
  });

  // Trang danh mục đang sắp xếp / lọc: noindex + canonical về trang gốc
  const cats = pages.filter((p) => /\/danh-muc\/[^?]+$/.test(p));
  await pool(cats, async (loc) => {
    for (const q of ['sap_xep=gia-tang', 'khac=con-hang']) {
      const url = `${loc}?${q}`;
      const r = await page(url);
      if (r.status !== 200) { err(`Danh mục đang lọc: mã ${r.status} — ${url}`); continue; }
      const href = oneCanonical(r.html, url);
      if (href && !same(href, loc)) err(`Danh mục đang lọc: canonical ${href} (cần ${loc}) — ${url}`);
      if (!/noindex/i.test(robotsMeta(r.html))) err(`Danh mục đang lọc thiếu noindex — ${url}`);
    }
  });

  // 4. Link nội bộ: không trỏ vào URL bị chuyển hướng / lỗi
  const list = [...links].slice(0, MAX_LINKS);
  console.log(`Mở ${list.length} link nội bộ…`);
  await pool(list, async ([href, from]) => {
    const r = await page(href);
    if (r.status >= 300 && r.status < 400) err(`Link nội bộ trỏ vào URL bị chuyển hướng (${r.status} → ${r.location}) — ${href} (trên trang ${from})`);
    else if (r.status >= 400) err(`Link nội bộ hỏng (mã ${r.status}) — ${href} (trên trang ${from})`);
  });
}

await main().catch((e) => err(`Lỗi khi kiểm tra: ${(e as Error).message}`));
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `\n${errors.length} lỗi.` : '\nCanonical đạt: mỗi trang một canonical đúng, biến thể URL về đúng trang chuẩn, link nội bộ không qua chuyển hướng.');
process.exit(errors.length ? 1 : 0);
