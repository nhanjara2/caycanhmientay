/**
 * Kiểm tra ngôn ngữ / khu vực (mục 8 checklist SEO): `npm run seo:locale` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:locale -- https://www.caycanhmientay.com` (web thật, chạy sau mỗi lần deploy cùng các lệnh seo:* khác).
 *
 * Web chỉ có MỘT ngôn ngữ (tiếng Việt) cho MỘT thị trường (Việt Nam) nên không có /vi/ /en/ hay hreflang.
 * Mở mọi trang trong sitemap (UA Googlebot) và kiểm:
 *  - <html lang="vi">; header Content-Language (nếu có) là tiếng Việt; og:locale = vi_VN, không og:locale:alternate;
 *  - hreflang: hiện không được có (không có bản ngôn ngữ khác). Sau này thêm bản tiếng Anh thì công cụ kiểm luôn:
 *    mã ngôn ngữ hợp lệ, tự trỏ chính nó, trang đích trả 200 và trỏ ngược lại, x-default (nếu có) trả 200;
 *  - JSON-LD: inLanguage (nếu có) là "vi…", priceCurrency = VND, giá là số, addressCountry = VN;
 *  - chữ hiện trên trang: giá kiểu Việt Nam ("68.000đ" — không "68,000đ", "$", "USD"), không giờ AM/PM, không tên tháng
 *    tiếng Anh, không chữ giao diện tiếng Anh sót lại ("Add to cart", "Loading…"); <time> có datetime đúng ISO;
 *    link tel: là số Việt Nam (0… hoặc +84…, 10–11 số);
 *  - KHÔNG chuyển hướng theo ngôn ngữ / vùng: mở lại vài trang với Accept-Language tiếng Anh / Nhật và UA trình duyệt thường
 *    → cùng mã trạng thái, cùng canonical, cùng lang như khi mở bằng tiếng Việt.
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính (localhost, *.vercel.app) thì URL được đổi sang máy đó để mở.
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const BOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const CONCURRENCY = 6;
const GEO_SAMPLES = 12;

const errors = new Map<string, string[]>();
const warnings = new Map<string, string[]>();
const add = (m: Map<string, string[]>, msg: string, loc: string) => m.set(msg, [...(m.get(msg) ?? []), loc]);
const err = (msg: string, loc: string) => add(errors, msg, loc);
const warn = (msg: string, loc: string) => add(warnings, msg, loc);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;|&#160;|&#xa0;/gi, ' ').replace(/&amp;/g, '&');
const attr = (tag: string, name: string) => {
  const m = new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? decode(m[1] ?? m[2] ?? '') : null;
};

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

type Page = { status: number; lang: string | null; canonical: string | null; html: string; headers: Headers };

async function open(url: string, ua = BOT, language = 'vi-VN,vi;q=0.9'): Promise<Page> {
  const r = await fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': ua, 'Accept-Language': language } });
  const html = r.status === 200 ? await r.text() : '';
  const lang = /<html\b[^>]*>/i.exec(html)?.[0];
  const canon = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => /\brel=["']canonical["']/i.test(t));
  return { status: r.status, lang: lang ? attr(lang, 'lang') : null, canonical: canon ? attr(canon, 'href') : null, html, headers: r.headers };
}

/** Mã hreflang hợp lệ: "vi", "vi-VN", "en", "en-US", "x-default" (ISO 639-1 [+ ISO 3166-1 alpha-2]). */
const HREFLANG = /^(x-default|[a-z]{2}(-[A-Za-z]{2})?)$/;

const visibleText = (html: string) => decode(
  (html.split(/<body\b/i)[1] ?? html)
    .replace(/<(script|style|svg|template|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' '),
).replace(/\s+/g, ' ');

const TEXT_RULES: [RegExp, string, 'err' | 'warn'][] = [
  [/\b\d{1,3}(,\d{3})+\s?(đ|₫|VNĐ|VND)/, 'Giá viết kiểu tiếng Anh (dấu phẩy ngăn hàng nghìn) — Việt Nam dùng dấu chấm: 68.000đ', 'err'],
  [/(\$|US\$|USD)\s?\d|\d\s?(USD|US\$)/, 'Giá bằng đô la trên trang tiếng Việt', 'err'],
  [/\b\d{1,2}:\d{2}\s?(AM|PM)\b/i, 'Giờ kiểu AM/PM — Việt Nam dùng 24 giờ (14:30)', 'err'],
  [/\b(January|February|March|April|June|July|August|September|October|November|December)\b|\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s\d{1,2}\b/, 'Tên tháng tiếng Anh trong chữ hiện trên trang', 'err'],
  [/\b(Add to cart|Buy now|Read more|Load more|Loading\.\.\.|Loading…|Sign in|Log in|Sign up|Search\.\.\.|Out of stock|In stock|Show more|See all|View all|Subscribe|Submit)\b/i, 'Chữ giao diện tiếng Anh chưa dịch', 'warn'],
  [/\b(19|20)\d{2}-\d{2}-\d{2}\b/, 'Ngày dạng yyyy-mm-dd trong chữ hiện trên trang — người đọc Việt Nam quen dd/mm/yyyy', 'warn'],
  [/\b\d{1,3}(\.\d{3})+\s?VND\b/, 'Giá ghi "VND" — trên web dùng "đ" cho thống nhất', 'warn'],
];

function walkLd(o: unknown, fn: (k: string, v: unknown) => void) {
  if (Array.isArray(o)) { o.forEach((x) => walkLd(x, fn)); return; }
  if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) { fn(k, v); walkLd(v, fn); }
  }
}

async function checkPage(loc: string, seen: Map<string, Page>) {
  const p = await open(loc);
  seen.set(loc, p);
  if (p.status !== 200) { err(`Mã ${p.status}`, loc); return; }
  const { html } = p;
  const end = html.indexOf('</head>');
  const head = end > 0 ? html.slice(0, end) : html;

  // Ngôn ngữ của trang.
  if (!p.lang) err('Thiếu thuộc tính lang trên <html>', loc);
  else if (!/^vi(-VN)?$/i.test(p.lang)) err(`<html lang="${p.lang}"> — trang tiếng Việt phải là "vi"`, loc);
  const cl = p.headers.get('content-language');
  if (cl && !/^vi\b/i.test(cl)) err(`Header Content-Language: ${cl} khác ngôn ngữ trang`, loc);
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const og = (prop: string) => metas.filter((t) => attr(t, 'property') === prop).map((t) => attr(t, 'content') ?? '');
  const locale = og('og:locale');
  if (locale.length !== 1 || locale[0] !== 'vi_VN') err(`og:locale phải đúng một thẻ "vi_VN" (đang: ${locale.join(', ') || 'không có'})`, loc);
  if (metas.some((t) => /http-equiv=["']content-language["']/i.test(t) && !/content=["']vi/i.test(t))) err('<meta http-equiv="content-language"> khác tiếng Việt', loc);

  // hreflang.
  const alts = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((t) => /\brel=["']alternate["']/i.test(t) && /\bhreflang=/i.test(t))
    .map((t) => ({ code: attr(t, 'hreflang') ?? '', href: attr(t, 'href') ?? '', inHead: head.includes(t) }));
  if (alts.length && og('og:locale:alternate').length === 0) warn('Có hreflang nhưng chưa có og:locale:alternate cho bản ngôn ngữ khác', loc);
  if (!alts.length && og('og:locale:alternate').length) err('Có og:locale:alternate mà web chỉ có một ngôn ngữ', loc);
  if (alts.length) {
    const codes = new Set<string>();
    for (const a of alts) {
      if (!HREFLANG.test(a.code)) err(`hreflang "${a.code}" sai mã (dùng vi, vi-VN, en, x-default…)`, loc);
      if (codes.has(a.code.toLowerCase())) err(`hreflang "${a.code}" khai hai lần`, loc);
      codes.add(a.code.toLowerCase());
      if (!a.inHead) err('hreflang nằm ngoài <head>', loc);
      if (!/^https:\/\//.test(a.href)) err(`hreflang "${a.code}" không phải URL https tuyệt đối`, loc);
    }
    const self = alts.find((a) => a.href === p.canonical);
    if (!self) err('hreflang không tự trỏ về chính trang này (phải có một dòng trùng canonical)', loc);
    else if (!/^vi/i.test(self.code)) err(`hreflang tự trỏ ghi "${self.code}" mà trang là tiếng Việt`, loc);
    if (alts.length === 1) err('Chỉ có hreflang tự trỏ — không có bản ngôn ngữ nào khác thì bỏ hreflang', loc);
    for (const a of alts.filter((x) => x !== self)) {
      const other = seen.get(a.href) ?? await open(a.href);
      if (other.status !== 200) { err(`hreflang "${a.code}" trỏ tới trang trả mã ${other.status}: ${a.href}`, loc); continue; }
      if (other.canonical !== a.href) err(`hreflang "${a.code}" trỏ tới trang có canonical khác (${other.canonical})`, loc);
      if (a.code !== 'x-default' && !other.html.includes(`href="${p.canonical}"`)) err(`Trang hreflang "${a.code}" không trỏ ngược lại trang này`, loc);
      if (a.code !== 'x-default' && other.lang && !other.lang.toLowerCase().startsWith(a.code.slice(0, 2).toLowerCase())) err(`hreflang "${a.code}" trỏ tới trang có lang="${other.lang}"`, loc);
    }
  }

  // JSON-LD.
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try { data = JSON.parse(m[1]); } catch { continue; } // JSON hỏng: seo:schema báo.
    walkLd(data, (k, v) => {
      if (k === 'inLanguage' && !(typeof v === 'string' && /^vi(-VN)?$/i.test(v))) err(`JSON-LD inLanguage = "${String(v)}" — trang tiếng Việt`, loc);
      if (k === 'priceCurrency' && v !== 'VND') err(`JSON-LD priceCurrency = "${String(v)}" — phải là VND`, loc);
      if (['price', 'lowPrice', 'highPrice'].includes(k) && !(typeof v === 'number' || (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v)))) err(`JSON-LD ${k} = "${String(v)}" không phải số (không dấu chấm / phẩy ngăn nghìn, không "đ")`, loc);
      if (k === 'addressCountry' && !(v === 'VN' || (v && typeof v === 'object' && (v as Record<string, unknown>).name === 'VN'))) err(`JSON-LD addressCountry = "${JSON.stringify(v)}" — phải là "VN"`, loc);
      if (k === 'telephone' && typeof v === 'string' && !/^(\+84|0)[\d\s.-]{8,13}$/.test(v)) warn(`JSON-LD telephone "${v}" không phải số Việt Nam`, loc);
    });
  }

  // Chữ hiện trên trang.
  const text = visibleText(html);
  for (const [re, msg, level] of TEXT_RULES) {
    const hit = re.exec(text);
    if (hit) (level === 'err' ? err : warn)(`${msg} — "${hit[0]}"`, loc);
  }
  for (const m of html.matchAll(/<time\b[^>]*>/gi)) {
    const dt = attr(m[0], 'datetime');
    if (!dt || Number.isNaN(Date.parse(dt)) || !/^\d{4}-\d{2}(-\d{2})?/.test(dt)) err(`<time> thiếu / sai datetime ISO ("${dt ?? ''}")`, loc);
  }
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) {
    const digits = decode(m[1]).replace(/[\s.()-]/g, '');
    if (!/^(0\d{9,10}|\+84\d{9,10}|1[89]00\d{4,6})$/.test(digits)) err(`Link tel:${m[1]} không phải số Việt Nam`, loc);
  }
}

/** Mở lại bằng ngôn ngữ / trình duyệt khác: phải ra đúng như bản tiếng Việt (không tự chuyển theo ngôn ngữ / vùng). */
async function checkNoGeoRedirect(loc: string, vi: Page) {
  const variants: [string, string, string][] = [
    ['Accept-Language tiếng Anh (Googlebot)', BOT, 'en-US,en;q=0.9'],
    ['Accept-Language tiếng Nhật (trình duyệt)', CHROME, 'ja-JP,ja;q=0.9'],
    ['Không gửi Accept-Language', CHROME, ''],
  ];
  for (const [label, ua, language] of variants) {
    const p = await open(loc, ua, language);
    if (p.status !== vi.status) err(`${label}: mã ${p.status} (tiếng Việt ${vi.status}) — không được chuyển hướng theo ngôn ngữ / vùng`, loc);
    else if (p.canonical !== vi.canonical) err(`${label}: canonical khác (${p.canonical})`, loc);
    else if (p.lang !== vi.lang) err(`${label}: lang="${p.lang}" khác bản tiếng Việt`, loc);
    if (p.headers.get('vary')?.toLowerCase().includes('accept-language')) warn('Header Vary có Accept-Language — nội dung đổi theo ngôn ngữ trình duyệt?', loc);
  }
}

function print(map: Map<string, string[]>, label: string) {
  if (!map.size) return;
  console.log(`\n${label}:`);
  for (const [msg, locs] of map) {
    const list = process.env.ALL ? locs : locs.slice(0, 3);
    console.log(`  • ${msg} (${locs.length} trang)`);
    for (const l of list) console.log(`      ${l}`);
    if (list.length < locs.length) console.log(`      … và ${locs.length - list.length} trang nữa (ALL=1 để in đủ)`);
  }
}

async function main() {
  console.log(`Kiểm tra ngôn ngữ / khu vực trên ${BASE}\n`);
  const pages = await sitemapPages();
  console.log(`${pages.length} trang trong sitemap.`);
  const seen = new Map<string, Page>();
  await pool(pages, (loc) => checkPage(loc, seen));

  // Trang chủ + mỗi loại trang vài trang đầu.
  const sample = [...new Map(pages.map((u) => [new URL(u).pathname.split('/')[1] ?? '', u])).values()].slice(0, GEO_SAMPLES);
  await pool(sample, async (loc) => { const vi = seen.get(loc); if (vi?.status === 200) await checkNoGeoRedirect(loc, vi); });
  console.log(`Đã thử ${sample.length} trang với ngôn ngữ / trình duyệt khác.`);

  const hreflangPages = [...seen.values()].filter((p) => /hreflang=/i.test(p.html)).length;
  console.log(hreflangPages ? `${hreflangPages} trang có hreflang.` : 'Không trang nào có hreflang (đúng: web một ngôn ngữ).');

  print(warnings, `Cảnh báo (${[...warnings.values()].reduce((n, l) => n + l.length, 0)})`);
  print(errors, `LỖI (${[...errors.values()].reduce((n, l) => n + l.length, 0)})`);
  if (errors.size) process.exit(1);
  console.log('\nĐạt.');
}

main().catch((e) => { console.error(e); process.exit(1); });
