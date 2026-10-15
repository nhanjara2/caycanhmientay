/**
 * Kiểm tra HTML semantic (mục 3 checklist SEO): `npm run seo:html` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:html -- https://www.caycanhmientay.com` (web thật, chạy sau mỗi lần deploy cùng seo:sitemap, seo:canonical, seo:metadata).
 *
 * Mở mọi trang trong sitemap (UA Googlebot, HTML máy chủ trả về — đúng thứ Google đọc đầu tiên) và kiểm:
 *  3.1 Heading: đúng MỘT <h1>, có chữ, không nằm trong <header> / <footer> / <nav>; không heading rỗng; không heading lồng heading;
 *      cảnh báo khi nhảy bậc (h2 → h4) trong nội dung chính, khi <h1> không có chữ nào chung với <title>.
 *  3.2 Thẻ cấu trúc: đúng một <header> đầu trang, một <main>, một <footer> chân trang, có <nav>; <time> phải có datetime;
 *      ảnh phải có alt; DOM không sai cấu trúc khiến trình duyệt tự sửa (a trong a, nút trong link, khối trong <p>,
 *      <li> ngoài danh sách, con trực tiếp của <ul>/<ol> không phải <li>…).
 *  3.3 Link: không href="#", rỗng hay javascript:; <a> phải có href; link / nút phải có tên (chữ, alt ảnh hoặc aria-label);
 *      target="_blank" phải có rel="noopener"; link nội bộ không nofollow (trừ link sắp xếp / lọc); mọi trang trong sitemap
 *      phải có link trỏ tới từ trang khác — tính cả trang 2, 3… của danh sách (không trang mồ côi); cảnh báo chữ link chung chung ("Xem thêm"…) không có aria-label,
 *      một link lặp quá nhiều lần trong nội dung chính, link nội bộ trỏ vào trang noindex.
 * Link trỏ vào URL chuyển hướng / lỗi đã do seo:canonical kiểm. Có lỗi thì thoát mã 1.
 */
import { parse } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CONCURRENCY = 6;
const MAX_SAME_LINK = 4;
const GENERIC = /^(xem thêm|xem tất cả|xem chi tiết|chi tiết|xem|tại đây|bấm vào đây|nhấn vào đây|click|click here|here|more|read more|đọc tiếp|đọc thêm|link)$/i;

/** Lỗi / cảnh báo gom theo nội dung: một dòng cho mỗi loại, kèm vài trang ví dụ. */
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
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const short = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n)}…` : s);
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

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

// ---------- Cây DOM ----------

const isEl = (n: Node): n is Element => 'tagName' in n;
const attr = (el: Element, name: string) => el.attrs.find((a) => a.name === name)?.value;
const kids = (n: Node): Node[] => ('childNodes' in n ? n.childNodes : []);
/** Mọi phần tử theo thứ tự tài liệu, kèm chuỗi tổ tiên; bỏ nội dung <template>, <noscript>, <svg>, <script>, <style>. */
function* walk(n: Node, up: Element[] = []): Generator<[Element, Element[]]> {
  for (const c of kids(n)) {
    if (!isEl(c)) continue;
    yield [c, up];
    if (['template', 'noscript', 'svg', 'script', 'style'].includes(c.tagName)) continue;
    yield* walk(c, [...up, c]);
  }
}
/** Chữ người đọc thấy (bỏ phần aria-hidden; ảnh tính theo alt). `crawl` = chữ Google đọc (tính cả phần aria-hidden). */
function text(n: Node, crawl = false): string {
  if (n.nodeName === '#text') return (n as DefaultTreeAdapterMap['textNode']).value;
  if (!isEl(n) || (!crawl && attr(n, 'aria-hidden') === 'true') || ['script', 'style', 'template'].includes(n.tagName)) return '';
  if (n.tagName === 'img') return ` ${attr(n, 'alt') ?? ''} `;
  if (n.tagName === 'svg') return ` ${attr(n, 'aria-label') ?? ''} `;
  return kids(n).map((c) => text(c, crawl)).join('');
}
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
/** Tên của link / nút: aria-label, aria-labelledby, chữ bên trong, title. Link ẩn khỏi trình đọc màn hình (aria-hidden, lớp phủ thẻ)
 *  vẫn cần chữ cho Google → tính chữ kể cả phần aria-hidden. */
function accName(el: Element, byId: Map<string, Element>) {
  const label = attr(el, 'aria-label');
  if (label?.trim()) return clean(label);
  const by = attr(el, 'aria-labelledby');
  if (by) return clean(by.split(/\s+/).map((id) => (byId.get(id) ? text(byId.get(id)!) : '')).join(' '));
  return clean(text(el, attr(el, 'aria-hidden') === 'true')) || clean(attr(el, 'title') ?? '');
}
/** "/san-pham/abc?x=1" → "/san-pham/…" để gom lỗi giống nhau thành một dòng. */
const pattern = (href: string) => href.replace(/^(\/[^/?#]+)\/.*$/, '$1/…');
/** Tham số lọc / sắp xếp / phân trang: trang noindex hoặc canonical về trang gốc là cố ý. */
const FILTER_QS = /[?&](sap_xep|vi-tri|kich-thuoc|mau|menh|khac|nha-vuon|the|loai|trang|v|bo_phan|nguyen_nhan|cay|q)=/;

// ---------- DOM sai cấu trúc (đọc HTML thô, trước khi trình duyệt tự sửa) ----------

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const BLOCK = new Set(['address', 'article', 'aside', 'blockquote', 'details', 'dialog', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul']);
const HEADING = /^h[1-6]$/;

function nestingProblems(html: string) {
  const out = new Set<string>();
  const src = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|textarea|title)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, '<svg></svg>');
  const stack: string[] = [];
  for (const m of src.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const tag = m[2].toLowerCase();
    if (m[1]) {
      const i = stack.lastIndexOf(tag);
      if (i >= 0) stack.length = i;
      continue;
    }
    const parent = stack[stack.length - 1];
    const has = (t: string) => stack.includes(t);
    if (tag === 'a' && has('a')) out.add('<a> lồng trong <a>');
    if (tag === 'a' && has('button')) out.add('<a> nằm trong <button>');
    if (tag === 'button' && has('a')) out.add('<button> nằm trong <a>');
    if (tag === 'button' && has('button')) out.add('<button> lồng trong <button>');
    if (tag === 'form' && has('form')) out.add('<form> lồng trong <form>');
    if (BLOCK.has(tag) && has('p')) out.add(`<${tag}> nằm trong <p> (trình duyệt tự đóng <p>)`);
    if (HEADING.test(tag) && stack.some((t) => HEADING.test(t))) out.add(`<${tag}> lồng trong một heading khác`);
    if (tag === 'li' && parent !== 'ul' && parent !== 'ol' && parent !== 'menu') out.add(`<li> không nằm trực tiếp trong <ul>/<ol> (cha là <${parent}>)`);
    if ((parent === 'ul' || parent === 'ol') && tag !== 'li' && tag !== 'script' && tag !== 'template') out.add(`<${parent}> có con trực tiếp <${tag}> (chỉ được là <li>)`);
    if (['tr', 'td', 'th', 'tbody', 'thead', 'tfoot'].includes(tag) && !has('table')) out.add(`<${tag}> nằm ngoài <table>`);
    if (!VOID.has(tag) && !/\/\s*$/.test(m[3])) stack.push(tag);
  }
  return out;
}

// ---------- Kiểm một trang ----------

/** Kiểm một trang; trả về các link nội bộ (URL tuyệt đối trên tên miền chính). */
function checkPage(loc: string, html: string) {
  for (const p of nestingProblems(html)) err(`DOM sai cấu trúc: ${p}`, loc);
  const doc = parse(html);
  const all = [...walk(doc)];
  const byId = new Map(all.flatMap(([el]) => (attr(el, 'id') ? [[attr(el, 'id')!, el] as const] : [])));
  const inside = (up: Element[], ...tags: string[]) => up.some((u) => tags.includes(u.tagName));
  const title = clean(all.find(([el]) => el.tagName === 'title')?.[0] ? text(all.find(([el]) => el.tagName === 'title')![0]) : '');

  // 3.1 Heading
  const headings = all.filter(([el]) => HEADING.test(el.tagName));
  const h1s = headings.filter(([el]) => el.tagName === 'h1');
  if (h1s.length === 0) err('Thiếu <h1>', loc);
  if (h1s.length > 1) err(`Có ${h1s.length} thẻ <h1> (${h1s.map(([el]) => `"${short(clean(text(el)), 30)}"`).join(', ')})`, loc);
  for (const [el, up] of h1s) {
    if (inside(up, 'header', 'footer', 'nav') && !inside(up, 'main', 'article')) err('<h1> nằm trong header / footer / nav của trang', loc);
    const h = clean(text(el));
    if (h && title) {
      const words = new Set(fold(title).split(/[^a-z0-9]+/).filter((w) => w.length > 2));
      if (!fold(h).split(/[^a-z0-9]+/).some((w) => words.has(w))) warn(`<h1> "${short(h, 40)}" không có chữ nào chung với <title>`, loc);
    }
  }
  for (const [el] of headings) if (!clean(text(el))) err(`<${el.tagName}> rỗng (không có chữ)`, loc);
  const mainHeads = headings.filter(([, up]) => inside(up, 'main'));
  let prev = 0;
  for (const [el] of mainHeads) {
    const lv = Number(el.tagName[1]);
    if (prev && lv > prev + 1) warn(`Heading nhảy bậc h${prev} → h${lv} trong nội dung chính ("${short(clean(text(el)), 40)}")`, loc);
    prev = lv;
  }

  // 3.2 Thẻ cấu trúc
  const top = (tag: string) => all.filter(([el, up]) => el.tagName === tag && !inside(up, 'main', 'article', 'section', 'aside', 'nav', 'dialog', 'header', 'footer'));
  const mains = all.filter(([el]) => el.tagName === 'main');
  if (mains.length !== 1) err(mains.length ? `Có ${mains.length} thẻ <main>` : 'Thiếu <main>', loc);
  if (top('header').length !== 1) err(`Cần đúng một <header> đầu trang (đang có ${top('header').length})`, loc);
  if (top('footer').length !== 1) err(`Cần đúng một <footer> chân trang (đang có ${top('footer').length})`, loc);
  if (!all.some(([el]) => el.tagName === 'nav')) err('Không có <nav>', loc);
  if (mains.length === 1) {
    const main = mains[0][0];
    const inMain = all.filter(([, up]) => up.includes(main));
    if (!inMain.some(([el]) => el.tagName === 'h1') && h1s.length === 1) err('<h1> nằm ngoài <main>', loc);
  }
  for (const [el] of all) {
    if (el.tagName === 'time' && !attr(el, 'datetime')) err('<time> thiếu datetime', loc);
    if (el.tagName === 'img' && attr(el, 'alt') === undefined) err('Ảnh <img> thiếu thuộc tính alt', loc);
    if (['div', 'span', 'li'].includes(el.tagName) && ['link', 'button'].includes(attr(el, 'role') ?? '')) warn(`<${el.tagName} role="${attr(el, 'role')}"> — nên dùng <a href> / <button> thật`, loc);
  }

  // 3.3 Link + nút
  const links = new Set<string>();
  const counts = new Map<string, number>();
  for (const [el, up] of all) {
    if (el.tagName === 'button' && !accName(el, byId)) err('<button> không có tên (không chữ, không aria-label)', loc);
    if (el.tagName !== 'a') continue;
    const raw = attr(el, 'href');
    if (raw === undefined) { err('<a> không có href (dùng <button> cho hành động)', loc); continue; }
    const href = raw.trim();
    if (href === '' || href === '#') { err(`Link href="${href}" — cần link điều hướng thật`, loc); continue; }
    if (/^javascript:/i.test(href)) { err('Link href="javascript:…"', loc); continue; }
    const name = accName(el, byId);
    if (!name) err(`Link không có chữ / alt / aria-label → ${pattern(href)}`, loc);
    else if (GENERIC.test(name) && !attr(el, 'aria-label')) warn(`Chữ link chung chung "${name}" (nên ghi rõ đích, hoặc thêm aria-label)`, loc);
    const rel = (attr(el, 'rel') ?? '').toLowerCase().split(/\s+/);
    if (attr(el, 'target') === '_blank' && !rel.includes('noopener') && !rel.includes('noreferrer')) err(`target="_blank" thiếu rel="noopener" → ${new URL(href, siteOrigin).host}`, loc);
    if (href.startsWith('#') || /^(tel|mailto|sms|zalo):/i.test(href)) continue;
    let abs: URL;
    try { abs = new URL(href, siteOrigin); } catch { err(`Link sai định dạng: ${short(href, 50)}`, loc); continue; }
    if (abs.origin !== siteOrigin && !href.startsWith(BASE)) continue;
    const key = `${siteOrigin}${abs.pathname}${abs.search}`;
    if (rel.includes('nofollow') && !FILTER_QS.test(abs.search)) err(`Link nội bộ có rel="nofollow" → ${pattern(abs.pathname)}`, loc);
    links.add(key);
    if (up.some((u) => u.tagName === 'main')) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const [k, n] of counts) if (n > MAX_SAME_LINK) warn(`Một link lặp ${n} lần trong nội dung chính → ${short(k.slice(siteOrigin.length), 50)}`, loc);
  return links;
}

// ---------- Chạy ----------

async function main() {
  console.log(`Kiểm tra HTML semantic trên ${BASE}\n`);
  const pages = await sitemapPages();
  console.log(`${pages.length} trang trong sitemap.`);
  const inbound = new Map<string, Set<string>>(); // URL → các trang có link tới nó
  const note = (from: string, links: Set<string>) => {
    for (const l of links) {
      if (l === new URL(from).href) continue;
      if (!inbound.has(l)) inbound.set(l, new Set());
      inbound.get(l)!.add(from);
    }
  };
  await pool(pages, async (loc) => {
    const r = await fetch(local(loc), { redirect: 'manual', headers: { 'User-Agent': UA } });
    if (r.status !== 200) { err(`Mã ${r.status}`, loc); return; }
    note(loc, checkPage(loc, await r.text()));
  });

  // Trang 2, 3… của danh sách (?trang=) không nằm trong sitemap nhưng Google vẫn lần theo link phân trang → tính link từ đó.
  const seen = new Set(pages.map((p) => new URL(p).href));
  for (let round = 0; round < 20; round++) {
    const next = [...inbound.keys()].filter((u) => !seen.has(u) && /[?&]trang=\d+/.test(u)).slice(0, 200);
    if (!next.length) break;
    await pool(next, async (u) => {
      seen.add(u);
      const r = await fetch(local(u), { redirect: 'manual', headers: { 'User-Agent': UA } });
      if (r.status !== 200) return;
      const links = new Set<string>();
      for (const m of (await r.text()).matchAll(/<a\b[^>]*\bhref="([^"#]+)"/gi)) {
        const href = decode(m[1]);
        if (/^\/(?!\/)/.test(href)) links.add(new URL(href, siteOrigin).href);
      }
      note(u, links);
    });
  }

  // Trang mồ côi: trong sitemap nhưng không trang nào khác link tới
  for (const p of pages) if (!inbound.has(new URL(p).href)) err('Trang mồ côi: không trang nào link tới', p);

  // Link nội bộ trỏ vào trang noindex (trừ trang cố ý chặn: giỏ, thanh toán, tài khoản, tìm kiếm; trang lọc / sắp xếp / phân trang)
  const others = [...inbound.keys()].filter((u) => !seen.has(u) && !/\/(gio-hang|thanh-toan|tai-khoan|tim-kiem|dat-hang-thanh-cong|api)(\/|\?|$)/.test(new URL(u).pathname) && !FILTER_QS.test(new URL(u).search));
  const noindexed: string[] = [];
  await pool(others, async (u) => {
    const r = await fetch(local(u), { redirect: 'manual', headers: { 'User-Agent': UA } });
    if (r.status !== 200) return; // mã lỗi / chuyển hướng: seo:canonical báo
    const m = /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i.exec(await r.text());
    if (m && /noindex/i.test(m[1])) noindexed.push(u);
  });
  for (const u of noindexed.sort()) {
    const n = inbound.get(u)!.size;
    warn(`Link nội bộ trỏ vào trang noindex${n > pages.length / 2 ? ' (link ở đầu / chân trang)' : ''}: ${new URL(u).pathname}${new URL(u).search}`, [...inbound.get(u)!][0]);
  }
}

await main().catch((e) => err(`Lỗi khi kiểm tra: ${(e as Error).message}`, BASE));
const show = (map: Map<string, Set<string>>, mark: string) => {
  for (const [msg, locs] of map) {
    const list = [...locs];
    const n = process.env.ALL ? list.length : 3;
    console.log(`${mark} ${msg} — ${list.slice(0, n).join(', ')}${list.length > n ? ` và ${list.length - n} trang khác` : ''}`);
  }
};
show(warnings, '⚠');
show(errors, '✗');
console.log(errors.size ? `\n${errors.size} loại lỗi, ${warnings.size} loại cảnh báo.` : `\nHTML semantic đạt (${warnings.size} loại cảnh báo).`);
process.exit(errors.size ? 1 : 0);
