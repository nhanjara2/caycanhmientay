/**
 * Kiểm API, dữ liệu động và trạng thái nội dung (mục 17 checklist SEO): `npm run seo:data` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:data -- https://www.caycanhmientay.com` (web thật — chạy sau mỗi lần deploy cùng các công cụ seo:* khác).
 * Thêm `--db` để đối chiếu với database (đọc `DATABASE_URL`, không có thì tự nạp `web/.env.local`; chỉ chạy SELECT) — database
 * phải đúng là database của web đang kiểm (web thật ↔ Supabase, máy dev ↔ database của máy dev).
 *
 * Phần 1 — mọi trang trong sitemap, mở song song theo thứ tự xáo trộn (UA Googlebot):
 *   200, không phải trang lỗi ("Đã có lỗi xảy ra") trả 200, không phải trang rỗng (chữ trong <main> quá ít) mà vẫn index;
 *   **đúng nội dung của URL đó**: canonical, og:url, `url` / `@id` của thực thể chính trong JSON-LD (#product, #article, #video)
 *   trỏ đúng URL đang mở — bắt trộn dữ liệu do cache thiếu slug / lỗi route; hai URL khác nhau không ra cùng nội dung <main>;
 *   **không có giá trị hỏng** (undefined, null, NaN, [object Object], Invalid Date) trong title / description / h1 / canonical /
 *   og:* / JSON-LD / chữ trong <main>; title, h1 không rỗng; JSON-LD: giá ≤ 0 / không phải số, điểm đánh giá ngoài 1–5,
 *   ngày hỏng / trước 2000 / ở tương lai;
 *   **không lộ dữ liệu nội bộ** trong HTML và dữ liệu RSC (`self.__next_f`): khóa của cột riêng tư như giá vườn, giá gốc, số tồn,
 *   số lô, ghi chú nội bộ, người sửa, mã Google, chiết khấu đối tác, dữ liệu ảnh dạng Buffer (`PRIVATE_KEYS`);
 *   HTML không được cache công khai lâu (Cache-Control public + max-age / s-maxage > 600 → sửa ở admin mà Google vẫn thấy cũ),
 *   không Set-Cookie cho khách chưa đăng nhập (cache dùng chung dễ trả nhầm trang của người khác).
 *   API công khai `/api/mega-menu` (bảng xổ thanh danh mục): 200, JSON đọc được, không lộ khóa riêng tư, cache ≤ 600 giây.
 * Phần 2 — mở lại tối đa SAMPLE trang mỗi loại (thứ tự ngược, song song) với cookie phiên giả, Accept-Language khác,
 *   Referer khác, `?utm_source=` → mã trạng thái, title, h1, canonical, robots và chữ trong <main> phải y hệt lần đầu
 *   (nội dung không đổi theo phiên / cookie / nơi đến; bỏ qua giờ:phút:giây của đồng hồ đếm ngược).
 * Phần 3 — URL không có thật theo từng loại trang (slug ngẫu nhiên, số kiểu ID, slug có thật + hậu tố, `?xem-truoc=1` khi
 *   chưa đăng nhập) và **slug của loại này đặt vào đường dẫn loại khác** (`/benh-cay/<slug sản phẩm>`…) → 404 (hoặc 308 về
 *   đúng trang của nó), trang 404 có noindex, không canonical, không JSON-LD nội dung, không mang h1 của trang khác.
 * Phần 4 (`--db`) — sản phẩm ẩn, bài nháp / chờ duyệt / lên lịch, bệnh cây ẩn, công trình ẩn: không trả 200, không nằm trong
 *   sitemap, không trang nào trong sitemap link tới (đường dẫn đã có chuyển hướng thì không mở — khỏi tăng lượt đếm của
 *   chuyển hướng); nội dung đang hiện: h1 khớp tên / tiêu đề trong database, trang sản phẩm có đủ giá các quy cách đang bán
 *   (bắt dữ liệu cũ sau khi sửa), sản phẩm / bài / bệnh đang hiện mà vắng sitemap thì cảnh báo.
 *
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính (localhost, *.vercel.app) thì URL được đổi sang máy đó để mở.
 * Mỗi lần chạy mở mỗi trang 1–2 lần bằng UA Googlebot (bài viết không cộng lượt xem cho máy đọc trang — `PostDetail`).
 */

import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { postPath } from '../src/lib/posts';
import { plainText } from '../src/lib/slug';

const args = process.argv.slice(2);
const BASE = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:3000').replace(/\/+$/, '');
const USE_DB = args.includes('--db');
const UA = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CONCURRENCY = 8;
/** Số trang mỗi loại được mở lại ở phần 2. */
const SAMPLE = Number(process.env.DATA_SAMPLE ?? 3);
/** Trang index được mà chữ trong <main> ít hơn chừng này ký tự → coi như trang rỗng (dữ liệu không tải được). */
const MIN_MAIN = 150;
/** Cache công khai tối đa cho HTML / API công khai (giây) — khớp sitemap s-maxage=600. */
const MAX_PUBLIC_CACHE = 600;

/**
 * Khóa JSON của cột chỉ dành cho admin (src/server/db/schema.ts) — xuất hiện trong HTML / dữ liệu RSC của trang khách là lộ dữ liệu.
 * Thêm cột riêng tư mới thì thêm tên vào đây. (`note`, `phone`, `email` của cửa hàng là thông tin công khai nên không có ở đây;
 * SĐT / email lạ do `seo:security` bắt.)
 */
const PRIVATE_KEYS = [
  'garden', 'cost', 'unitCost', 'lotCode', 'lotId', 'supplierId', 'receiptId',
  'notes', 'engineerNote', 'lostReason', 'staffRole', 'googleSub', 'contactPhone', 'codeHash', 'linesHash', 'digest',
  'updatedBy', 'createdBy', 'moderatedBy', 'decidedBy', 'refundedBy', 'assigneeId',
  'partnerDiscount', 'partnerStatus', 'taxCode', 'botHits', 'hits',
];
const PRIVATE_RE = new RegExp(`"(${PRIVATE_KEYS.join('|')})":`, 'g');
/** Thực thể chính của trang trong JSON-LD (lib/jsonld.ts) — `@id` phải là `<URL trang>#…`. */
const MAIN_ENTITY = /#(product|article|video)$/;
const BAD_TEXT = /\bundefined\b|\bNaN\b|\[object Object\]|Invalid Date/;
const BAD_HEAD = /\bundefined\b|\bnull\b|\bNaN\b|\[object Object\]|Invalid Date/;

const errors = new Map<string, string[]>();
const warnings = new Map<string, string[]>();
const add = (m: Map<string, string[]>, msg: string, loc: string) => m.set(msg, [...(m.get(msg) ?? []), loc]);
const err = (msg: string, loc = '') => add(errors, msg, loc);
const warn = (msg: string, loc = '') => add(warnings, msg, loc);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');
const attr = (tag: string, name: string) => {
  const m = new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? decode(m[1] ?? m[2] ?? '') : null;
};
const rand = () => `kt-${Math.random().toString(36).slice(2, 10)}`;
const text = (html: string) => decode(html.replace(/<(script|style|template|svg)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const hash = (s: string) => createHash('sha1').update(s).digest('hex');
const pathOf = (u: string) => { try { return new URL(u, siteOrigin || BASE).pathname; } catch { return u; } };
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

type Res = { status: number; headers: Headers; text: string; location: string | null };
async function get(url: string, headers: Record<string, string> = {}): Promise<Res> {
  const res = await fetch(url, {
    redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,*/*', ...headers }, signal: AbortSignal.timeout(30_000),
  });
  return { status: res.status, headers: res.headers, text: await res.text(), location: res.headers.get('location') };
}

async function pool<T>(items: T[], fn: (x: T) => Promise<void>, n = CONCURRENCY) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const x = items[i++];
      try { await fn(x); } catch (e) { err(`Không mở được (${(e as Error).message})`, String(x)); }
    }
  }));
}

// ───────────────────────────── đọc trang ─────────────────────────────

const metas = (html: string) => [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
const metaOf = (html: string, key: string) => {
  const t = metas(html).find((x) => (attr(x, 'name') ?? attr(x, 'property')) === key);
  return t ? attr(t, 'content') : null;
};
const robotsOf = (html: string) => metas(html).filter((t) => /^(robots|googlebot)$/i.test(attr(t, 'name') ?? '')).map((t) => attr(t, 'content') ?? '').join(',');
const canonicalOf = (html: string) => {
  const tag = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => (attr(t, 'rel') ?? '').toLowerCase() === 'canonical');
  return tag ? attr(tag, 'href') : null;
};
const titleOf = (html: string) => {
  const head = html.slice(0, html.search(/<\/head>/i) + 1 || undefined);
  const m = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head.replace(/<svg\b[\s\S]*?<\/svg>/gi, ''));
  return m ? decode(m[1]).trim() : null;
};
const h1Of = (html: string) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
const mainOf = (html: string) => {
  const a = html.search(/<main\b/i), b = html.lastIndexOf('</main>');
  return a >= 0 && b > a ? text(html.slice(a, b)) : '';
};
/** Chữ trong <main> bỏ phần đổi theo giờ (đồng hồ đếm ngược, "3 phút trước") để so hai lần mở. */
const stableMain = (s: string) => s.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '#').replace(/\d+\s*(giây|phút|giờ|ngày|tuần|tháng)\s*trước/g, '#');
const jsonLd = (html: string, loc: string) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
  try { const v = JSON.parse(m[1]); return Array.isArray(v) ? v : [v]; } catch { err('JSON-LD hỏng (không đọc được)', loc); return []; }
});
/** Mọi object trong JSON-LD (đi cả @graph và object lồng). */
function walk(v: unknown, fn: (o: Record<string, unknown>) => void) {
  if (Array.isArray(v)) v.forEach((x) => walk(x, fn));
  else if (v && typeof v === 'object') { fn(v as Record<string, unknown>); Object.values(v).forEach((x) => walk(x, fn)); }
}
/** Dữ liệu RSC Next nhét vào HTML: self.__next_f.push([1,"…"]) — chuỗi JSON đã escape. */
const flight = (html: string) => [...html.matchAll(/self\.__next_f\.push\(\[\d+,("(?:[^"\\]|\\.)*")\]\)/g)].map((m) => {
  try { return JSON.parse(m[1]) as string; } catch { return ''; }
}).join('');
const types = (o: Record<string, unknown>) => [o['@type']].flat().map(String);

type Page = { url: string; status: number; html: string; title: string | null; h1: string[]; canonical: string | null; robots: string; main: string; noindex: boolean };
const read = (url: string, r: Res): Page => ({
  url, status: r.status, html: r.text, title: titleOf(r.text), h1: h1Of(r.text), canonical: canonicalOf(r.text), robots: robotsOf(r.text),
  main: mainOf(r.text), noindex: /noindex/i.test(robotsOf(r.text)) || /noindex/i.test(r.headers.get('x-robots-tag') ?? ''),
});

function checkPrivate(body: string, loc: string) {
  const keys = new Set([...body.matchAll(PRIVATE_RE)].map((m) => m[1]));
  for (const k of keys) err(`Lộ dữ liệu nội bộ: khóa "${k}" có trong HTML / dữ liệu RSC của trang khách`, loc);
  // "stock": true/false là cờ còn hàng của bộ lọc (được phép); số tồn thật thì không
  if (/"stock":\d/.test(body)) err('Lộ số tồn kho ("stock": <số>) trong dữ liệu trang khách', loc);
  if (/"type":"Buffer"/.test(body)) err('Lộ dữ liệu nhị phân (Buffer — ảnh / file trong database) trong dữ liệu trang', loc);
}

function checkCache(h: Headers, loc: string, html = true) {
  const cc = (h.get('cache-control') ?? '').toLowerCase();
  if (/\bpublic\b/.test(cc)) {
    const age = Math.max(...[...cc.matchAll(/(?:s-maxage|max-age)=(\d+)/g)].map((m) => Number(m[1])), 0);
    if (age > MAX_PUBLIC_CACHE) err(`${html ? 'HTML' : 'API công khai'} được cache công khai ${age} giây (> ${MAX_PUBLIC_CACHE}) — sửa ở admin mà khách / Google vẫn thấy bản cũ`, loc);
    if (h.get('set-cookie')) err('Trang cache công khai mà có Set-Cookie — CDN có thể trả cookie / trang của người này cho người khác', loc);
  } else if (html && h.get('set-cookie')) warn('Trang công khai đặt cookie cho khách chưa đăng nhập', loc);
}

function checkPage(p: Page, r: Res) {
  const loc = p.url;
  checkCache(r.headers, loc);
  checkPrivate(r.text, loc);
  checkPrivate(flight(r.text), loc);
  if (/Đã có lỗi xảy ra/.test(p.h1.join(' '))) { err('Trang lỗi ("Đã có lỗi xảy ra") mà trả 200 — Google index trang lỗi', loc); return; }

  // Giá trị hỏng trong phần Google đọc
  const head: [string, string | null][] = [
    ['title', p.title], ['meta description', metaOf(p.html, 'description')], ['canonical', p.canonical],
    ['og:title', metaOf(p.html, 'og:title')], ['og:description', metaOf(p.html, 'og:description')],
    ['og:url', metaOf(p.html, 'og:url')], ['og:image', metaOf(p.html, 'og:image')],
  ];
  for (const [k, v] of head) if (v && BAD_HEAD.test(v)) err(`${k} chứa giá trị hỏng (undefined / null / NaN…)`, `${loc} → ${v.slice(0, 120)}`);
  if (!p.title?.trim()) err('title rỗng', loc);
  if (!p.h1.length || p.h1.every((h) => !h)) err('h1 rỗng / không có', loc);
  for (const h of p.h1) if (BAD_TEXT.test(h) || /\bnull\b/.test(h)) err('h1 chứa giá trị hỏng', `${loc} → ${h.slice(0, 120)}`);
  const bad = BAD_TEXT.exec(p.main);
  if (bad) err(`Chữ trong <main> có "${bad[0]}" (dữ liệu thiếu bị in ra)`, `${loc} → …${p.main.slice(Math.max(0, bad.index - 50), bad.index + 50)}…`);
  if (!p.noindex && p.main.length < MIN_MAIN) err(`Trang index được mà <main> chỉ có ${p.main.length} ký tự — dữ liệu không tải được / trang rỗng`, loc);

  // Đúng nội dung của URL này
  const self = p.url;
  const ogUrl = metaOf(p.html, 'og:url');
  if (ogUrl && ogUrl !== (p.canonical ?? self) && !p.noindex) err('og:url khác canonical — dữ liệu trang lẫn với trang khác?', `${loc} → ${ogUrl}`);
  const ld = jsonLd(p.html, loc);
  walk(ld, (o) => {
    const id = typeof o['@id'] === 'string' ? o['@id'] : '';
    if (MAIN_ENTITY.test(id)) {
      if (id.replace(MAIN_ENTITY, '') !== self) err('JSON-LD: @id thực thể chính không phải URL trang đang mở — dữ liệu của trang khác?', `${loc} → ${id}`);
      if (typeof o.url === 'string' && o.url !== self) err('JSON-LD: url thực thể chính khác URL trang đang mở', `${loc} → ${o.url}`);
    }
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && BAD_HEAD.test(v) && k !== 'text') err(`JSON-LD: "${k}" chứa giá trị hỏng`, `${loc} → ${v.slice(0, 100)}`);
      if (v === null) err(`JSON-LD: "${k}" là null`, loc);
    }
    const t = types(o);
    if (t.some((x) => x === 'Offer' || x === 'AggregateOffer')) {
      for (const k of ['price', 'lowPrice', 'highPrice']) {
        if (!(k in o)) continue;
        const n = Number(o[k]);
        if (!Number.isFinite(n) || n <= 0) err(`JSON-LD: ${t[0]}.${k} không phải giá hợp lệ (${String(o[k])})`, loc);
      }
    }
    if (t.includes('AggregateRating')) {
      const v = Number(o.ratingValue), c = Number(o.reviewCount ?? o.ratingCount);
      if (!(v >= 1 && v <= 5)) err(`JSON-LD: ratingValue ngoài 1–5 (${String(o.ratingValue)})`, loc);
      if (!(c > 0)) err(`JSON-LD: AggregateRating mà số đánh giá = ${String(o.reviewCount ?? o.ratingCount)}`, loc);
    }
    for (const k of ['datePublished', 'dateModified', 'uploadDate']) {
      if (typeof o[k] !== 'string') continue;
      const d = Date.parse(o[k] as string);
      if (!Number.isFinite(d) || d < Date.UTC(2000, 0, 1)) err(`JSON-LD: ${k} hỏng (${String(o[k])})`, loc);
      else if (d > Date.now() + 86_400_000) err(`JSON-LD: ${k} ở tương lai (${String(o[k])}) — bài lên lịch bị lộ trước giờ?`, loc);
    }
  });
}

// ───────────────────────────── sitemap ─────────────────────────────

async function sitemap() {
  const robots = await get(`${BASE}/robots.txt`);
  if (robots.status !== 200) throw new Error(`robots.txt trả ${robots.status}`);
  const index = /^sitemap:\s*(\S+)/im.exec(robots.text)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  siteOrigin = new URL(index).origin;
  const locs = async (u: string) => {
    const r = await get(local(u));
    if (r.status !== 200) { err(`Sitemap trả ${r.status}`, u); return []; }
    return [...r.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  };
  const pages: string[] = [];
  for (const child of await locs(index)) pages.push(...await locs(child));
  return [...new Set(pages)];
}

/** Loại trang theo đường dẫn — để lấy mẫu và thử URL lạ. `prefix` = phần trước slug cuối. */
function kindOf(path: string): { kind: string; prefix?: string } {
  const m = /^\/(san-pham|benh-cay|goc-cham-cay|tin-tuc|chinh-sach)\/[^/]+$/.exec(path);
  if (m) return { kind: m[1], prefix: `/${m[1]}/` };
  if (/^\/doi-tac\/cong-trinh\/[^/]+$/.test(path)) return { kind: 'cong-trinh', prefix: '/doi-tac/cong-trinh/' };
  const c = /^\/danh-muc\/([^/]+)\/[^/]+$/.exec(path);
  if (c) return { kind: 'nhom-con', prefix: `/danh-muc/${c[1]}/` };
  if (/^\/danh-muc\/[^/]+$/.test(path)) return { kind: 'danh-muc', prefix: '/danh-muc/' };
  return { kind: path === '/' ? 'trang-chu' : 'trang-khac' };
}
const lastSeg = (path: string) => path.slice(path.lastIndexOf('/') + 1);

// ───────────────────────────── Phần 1 ─────────────────────────────

const t0 = Date.now();
console.log(`Kiểm API / dữ liệu động / trạng thái nội dung: ${BASE}${USE_DB ? ' (+ database)' : ''}`);
const urls = await sitemap();
console.log(`  Sitemap: ${urls.length} trang`);
const pages = new Map<string, Page>();
await pool(shuffle(urls), async (u) => {
  const r = await get(local(u));
  if (r.status !== 200) { err(`Trang trong sitemap trả ${r.status}`, u); return; }
  const p = read(u, r);
  pages.set(u, p);
  checkPage(p, r);
}, CONCURRENCY * 2);

// Hai URL khác nhau ra cùng một nội dung → lỗi route / cache (trang này hiện dữ liệu trang kia)
const byMain = new Map<string, string[]>();
for (const p of pages.values()) if (p.main.length >= MIN_MAIN) {
  const k = hash(stableMain(p.main));
  byMain.set(k, [...(byMain.get(k) ?? []), p.url]);
}
for (const list of byMain.values()) if (list.length > 1) err('Nhiều URL ra cùng một nội dung <main> — lỗi route / cache?', list.join('  =  '));

// API công khai
{
  const r = await get(`${BASE}/api/mega-menu`, { accept: 'application/json' });
  if (r.status !== 200) err(`/api/mega-menu trả ${r.status}`);
  else {
    try { JSON.parse(r.text); } catch { err('/api/mega-menu không trả JSON đọc được'); }
    checkPrivate(r.text, '/api/mega-menu');
    checkCache(r.headers, '/api/mega-menu', false);
  }
}
console.log(`  Phần 1: ${pages.size} trang đã đọc`);

// ───────────────────────────── Phần 2 ─────────────────────────────

const byKind = new Map<string, Page[]>();
for (const p of pages.values()) {
  const k = kindOf(pathOf(p.url)).kind;
  byKind.set(k, [...(byKind.get(k) ?? []), p]);
}
const VARIANTS: { name: string; url: (u: string) => string; headers: Record<string, string> }[] = [
  { name: 'cookie phiên giả', url: (u) => u, headers: { cookie: `ccmt_session=${rand()}; ccmt-deliver-to-v1=x` } },
  { name: 'Accept-Language tiếng Anh + Referer Facebook', url: (u) => u, headers: { 'accept-language': 'en-US,en;q=0.9', referer: 'https://www.facebook.com/' } },
  { name: '?utm_source', url: (u) => `${u}${u.includes('?') ? '&' : '?'}utm_source=kiem-tra&utm_medium=seo`, headers: {} },
];
const sample = [...byKind.values()].flatMap((list) => list.slice(0, SAMPLE)).reverse();
await pool(sample.flatMap((p) => VARIANTS.map((v) => ({ p, v }))), async ({ p, v }) => {
  const r = await get(local(v.url(p.url)), v.headers);
  const loc = `${p.url} [${v.name}]`;
  if (r.status !== p.status) { err(`Mã trạng thái đổi theo ${v.name} (${p.status} → ${r.status})`, loc); return; }
  const q = read(p.url, r);
  const diff: string[] = (['title', 'canonical', 'robots'] as const).filter((k) => q[k] !== p[k]);
  if (q.h1.join('|') !== p.h1.join('|')) diff.push('h1');
  if (diff.length) err(`Nội dung đổi theo ${v.name}: ${diff.join(', ')}`, loc);
  else if (stableMain(q.main) !== stableMain(p.main)) {
    const a = stableMain(p.main), b = stableMain(q.main);
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    err(`Chữ trong <main> đổi theo ${v.name}`, `${loc} → "…${a.slice(Math.max(0, i - 30), i + 50)}…" ≠ "…${b.slice(Math.max(0, i - 30), i + 50)}…"`);
  }
});
console.log(`  Phần 2: ${sample.length} trang × ${VARIANTS.length} biến thể`);

// ───────────────────────────── Phần 3 ─────────────────────────────

const realH1 = new Set([...pages.values()].flatMap((p) => p.h1).filter((h) => h.length > 3));
const sitemapPaths = new Set(urls.map(pathOf));
const prefixes = new Map<string, string>(); // prefix → một slug có thật
for (const u of urls) {
  const { prefix } = kindOf(pathOf(u));
  if (prefix && !prefixes.has(prefix)) prefixes.set(prefix, lastSeg(pathOf(u)));
}
type Probe = { path: string; why: string };
const probes: Probe[] = [];
for (const [prefix, slug] of prefixes) {
  probes.push(
    { path: `${prefix}${rand()}`, why: 'slug ngẫu nhiên' },
    { path: `${prefix}${Math.floor(100000 + Math.random() * 900000)}`, why: 'số kiểu ID' },
    { path: `${prefix}${slug}-${rand().slice(3, 7)}`, why: 'slug có thật + hậu tố' },
    { path: `${prefix}${rand()}?xem-truoc=1`, why: 'xem trước khi chưa đăng nhập' },
  );
  // Slug của loại khác đặt vào loại này (route không được lấy nhầm dữ liệu loại kia)
  for (const [other, s] of prefixes) {
    if (other !== prefix && !sitemapPaths.has(`${prefix}${s}`)) probes.push({ path: `${prefix}${s}`, why: `slug của ${other}` });
  }
}
await pool(probes, async ({ path, why }) => {
  let r = await get(`${BASE}${path}`);
  let at = path;
  if (r.status === 308 || r.status === 301) {
    const to = new URL(r.location ?? '', `${BASE}${path}`);
    if (sitemapPaths.has(to.pathname)) return; // đúng trang thật của slug đó (vd. bài đổi chuyên mục)
    at = to.pathname + to.search;
    r = await get(`${BASE}${at}`);
  }
  const loc = `${path} (${why})`;
  if (r.status === 200) { err('URL không có thật trả 200 (soft 404 / route lấy nhầm dữ liệu)', loc); return; }
  if (r.status !== 404) { err(`URL không có thật trả ${r.status} (phải 404)`, loc); return; }
  const p = read(at, r);
  if (!p.noindex) err('Trang 404 thiếu noindex', loc);
  if (p.canonical) err('Trang 404 có canonical', `${loc} → ${p.canonical}`);
  const ldTypes = new Set<string>();
  walk(jsonLd(r.text, loc), (o) => types(o).forEach((t) => ldTypes.add(t)));
  const leaked = [...ldTypes].filter((t) => /Product|Article|BlogPosting|NewsArticle|VideoObject|CollectionPage|BreadcrumbList/.test(t));
  if (leaked.length) err(`Trang 404 có JSON-LD nội dung (${leaked.join(', ')})`, loc);
  const h = p.h1.find((x) => realH1.has(x));
  if (h) err('Trang 404 mang h1 của một trang có thật — lấy nhầm dữ liệu', `${loc} → ${h}`);
  checkPrivate(r.text, loc);
});
console.log(`  Phần 3: ${probes.length} URL không có thật`);

// ───────────────────────────── Phần 4 (--db) ─────────────────────────────

if (USE_DB) {
  if (!process.env.DATABASE_URL && existsSync('.env.local')) process.loadEnvFile('.env.local');
  const url = process.env.DATABASE_URL;
  if (!url) { err('--db nhưng không có DATABASE_URL'); }
  else {
    const { default: pg } = await import('pg');
    const db = new pg.Pool({ connectionString: url, max: 2, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
    const q = async <T,>(sql: string) => (await db.query(sql)).rows as T[];
    const all = await Promise.all([
      q<{ slug: string; name: string; seo_name: string | null; active: boolean }>('select slug, name, seo_name, active from products'),
      q<{ product_slug: string; price: number }>('select product_slug, price from product_options where deleted = false and price > 0'),
      q<{ slug: string; category: string; title: string; status: string; live: boolean }>(
        "select slug, category, title, status, (status = 'published' and published_at <= now()) as live from posts"),
      q<{ slug: string; name: string; active: boolean }>('select slug, name, active from diseases'),
      q<{ slug: string; title: string; published: boolean }>('select slug, title, published from projects'),
      q<{ from_path: string }>('select from_path from redirects'),
      q<{ path: string; noindex: boolean; canonical: string | null }>('select path, noindex, canonical from seo_overrides'),
    ]).catch((e: Error) => { err(`--db: không đọc được database (${e.message || (e as { code?: string }).code})`); return null; });
    await db.end().catch(() => {});
    if (all) {
    const [products, options, posts, diseases, projects, redirects, overrides] = all;
    const moved = new Set(redirects.map((r) => r.from_path));
    const excluded = new Set(overrides.filter((o) => o.noindex || o.canonical).map((o) => o.path));
    const pageAt = new Map([...pages.values()].map((p) => [pathOf(p.url), p]));
    // Link nội bộ trên mọi trang đã đọc → đường dẫn → trang có link
    const linkedFrom = new Map<string, string>();
    for (const p of pages.values()) {
      for (const m of p.html.matchAll(/<a\b[^>]*\shref="([^"#?]+)/gi)) {
        const href = decode(m[1]);
        const path = href.startsWith('/') ? href : href.startsWith(siteOrigin) ? href.slice(siteOrigin.length) : '';
        if (path && !linkedFrom.has(path)) linkedFrom.set(path, p.url);
      }
    }
    const norm = (s: string) => plainText(s).replace(/\s+/g, ' ').trim();
    /** `hiddenAs` = tên trạng thái khi chưa công khai (sản phẩm ẩn, bài nháp…). */
    type Item = { path: string; live: boolean; label: string; hiddenAs: string; name: string; seoName?: string | null };
    const POST_STATE: Record<string, string> = { draft: 'Bài nháp', review: 'Bài chờ duyệt', published: 'Bài lên lịch' };
    const items: Item[] = [
      ...products.map((p) => ({ path: `/san-pham/${p.slug}`, live: p.active, label: 'Sản phẩm', hiddenAs: 'Sản phẩm đang ẩn', name: p.name, seoName: p.seo_name })),
      ...posts.map((p) => ({ path: postPath(p), live: p.live, label: 'Bài viết', hiddenAs: POST_STATE[p.status] ?? 'Bài chưa đăng', name: p.title })),
      ...diseases.map((d) => ({ path: `/benh-cay/${d.slug}`, live: d.active, label: 'Bệnh cây', hiddenAs: 'Bệnh cây đang ẩn', name: d.name })),
      ...projects.map((p) => ({ path: `/doi-tac/cong-trinh/${p.slug}`, live: p.published, label: 'Công trình', hiddenAs: 'Công trình đang ẩn', name: p.title })),
    ];
    const hidden = items.filter((i) => !i.live);
    for (const i of hidden) {
      if (sitemapPaths.has(i.path)) err(`${i.hiddenAs} vẫn nằm trong sitemap`, i.path);
      const from = linkedFrom.get(i.path);
      if (from && !moved.has(i.path)) err(`${i.hiddenAs} vẫn có link từ trang công khai (link hỏng)`, `${i.path} ← ${from}`);
    }
    await pool(hidden.filter((i) => !moved.has(i.path)), async (i) => {
      const r = await get(`${BASE}${i.path}`);
      if (r.status === 200) err(`${i.hiddenAs} vẫn mở được (200) — khách / Google thấy nội dung chưa công khai`, i.path);
    });
    const prices = new Map<string, number[]>();
    for (const o of options) prices.set(o.product_slug, [...(prices.get(o.product_slug) ?? []), o.price]);
    const vnd = new Intl.NumberFormat('vi-VN');
    for (const i of items.filter((x) => x.live)) {
      if (!sitemapPaths.has(i.path) && !excluded.has(i.path) && i.label !== 'Công trình') warn(`${i.label} đang hiện mà không có trong sitemap (đúng nếu trang noindex theo luật)`, i.path);
      const p = pageAt.get(i.path);
      if (!p) continue;
      const h1 = norm(p.h1.join(' '));
      const ok = (i.seoName && h1 === norm(i.seoName)) || h1.includes(norm(i.name));
      if (!ok) err(`${i.label}: h1 không khớp tên trong database — dữ liệu cũ / lấy nhầm?`, `${i.path} → h1 "${p.h1[0] ?? ''}" ≠ "${i.name}"`);
      if (i.label === 'Sản phẩm') {
        const missing = (prices.get(i.path.slice('/san-pham/'.length)) ?? []).filter((n) => !p.html.includes(vnd.format(n)));
        if (missing.length) err('Trang sản phẩm thiếu giá đang có trong database — giá cũ / cache chưa làm mới?', `${i.path} → ${missing.map((n) => `${vnd.format(n)}đ`).join(', ')}`);
      }
    }
    console.log(`  Phần 4: ${items.length} nội dung trong database (${hidden.length} chưa công khai)`);
  }
  }
}

// ───────────────────────────── kết quả ─────────────────────────────

const print = (title: string, m: Map<string, string[]>) => {
  if (!m.size) return;
  console.log(`\n${title}`);
  for (const [msg, locs] of m) {
    const shown = process.env.ALL ? locs : locs.slice(0, 5);
    console.log(`  • ${msg}${locs.length > 1 ? ` (${locs.length})` : ''}`);
    for (const l of shown.filter(Boolean)) console.log(`      ${l}`);
    if (shown.length < locs.length) console.log('      … (ALL=1 để in đủ)');
  }
};
print('CẢNH BÁO', warnings);
print('LỖI', errors);
console.log(`\n${pages.size} trang · ${errors.size} nhóm lỗi · ${warnings.size} nhóm cảnh báo · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
process.exit(errors.size ? 1 : 0);
