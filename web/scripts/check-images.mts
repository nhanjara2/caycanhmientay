/**
 * Kiểm tra ảnh + video (mục 4 checklist SEO): `npm run seo:images` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:images -- https://www.caycanhmientay.com` (web thật, chạy sau mỗi lần deploy cùng các lệnh seo:* khác).
 *
 * Mở mọi trang trong sitemap (UA Googlebot, HTML máy chủ trả về — thứ Google đọc) và kiểm từng <img>:
 *  - Lỗi: thiếu thuộc tính alt; alt là "undefined" / "null" / "[object Object]"; không có src (hay chỉ có data-src — Google
 *    không thấy ảnh lazy-load kiểu đó); src / bản trong srcset không tải được, không phải ảnh, bị robots.txt chặn hay
 *    gắn noindex; bản thu nhỏ "?w=" không ra WebP khi trình duyệt nhận WebP; srcset có mà thiếu sizes.
 *  - Cảnh báo: alt dài > 125 ký tự hoặc nhiều dấu phẩy (nhồi từ khóa); ảnh database chưa có srcset (tải ảnh gốc ~1600px
 *    cho chỗ nhỏ); ảnh gốc > 500KB; tên file ảnh database chưa gắn slug; ảnh đầu tiên trong <main> bị lazy-load (thường là ảnh LCP).
 * Video trong sitemap (<video:video>): ảnh thu nhỏ tải được, link trình phát https, trang có JSON-LD VideoObject.
 * Ảnh riêng tư: /api/uploads… trả 401 / 404 (không lộ ảnh khi chưa đăng nhập).
 * Có lỗi thì thoát mã 1.
 */
import { parse } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BROWSER_ACCEPT = 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8';
const CONCURRENCY = 6;
const BIG_ORIGINAL = 500 * 1024;
const DB_IMAGE = /^\/api\/(product|post|disease|project|banner)-images\/([^/?]+)/;

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
const tags = (xml: string, tag: string) => [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => decode(m[1].trim()));
const short = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n)}…` : s);

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

// ---- robots.txt (User-agent: *), so khớp tiền tố dài nhất như Google ----
type Rule = { allow: boolean; path: string };
let rules: Rule[] = [];
const blocked = (path: string) => {
  const hit = rules.filter((r) => path.startsWith(r.path)).sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow))[0];
  return hit ? !hit.allow : false;
};

type Video = { page: string; thumbnail: string; player: string };

async function readSitemaps() {
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  let forAll = false;
  for (const raw of robots.split('\n')) {
    const [k, ...rest] = raw.replace(/#.*/, '').trim().split(':');
    const v = rest.join(':').trim();
    const key = k.toLowerCase();
    if (key === 'user-agent') forAll = v === '*';
    else if (forAll && (key === 'allow' || key === 'disallow') && v) rules.push({ allow: key === 'allow', path: v });
  }
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  siteOrigin = new URL(index).origin;
  const pages: string[] = [];
  const videos: Video[] = [];
  for (const child of tags(await (await fetch(local(index))).text(), 'loc')) {
    const xml = await (await fetch(local(child))).text();
    for (const [, u] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const page = tags(u, 'loc')[0];
      pages.push(page);
      for (const [, v] of u.matchAll(/<video:video>([\s\S]*?)<\/video:video>/g)) {
        const thumbnail = tags(v, 'video:thumbnail_loc')[0] ?? '';
        const player = tags(v, 'video:player_loc')[0] ?? tags(v, 'video:content_loc')[0] ?? '';
        if (!tags(v, 'video:title')[0]) err('Video trong sitemap thiếu tiêu đề', page);
        if (!tags(v, 'video:description')[0]) err('Video trong sitemap thiếu mô tả', page);
        videos.push({ page, thumbnail, player });
      }
    }
  }
  return { pages, videos };
}

// ---- DOM ----
const isEl = (n: Node): n is Element => 'tagName' in n;
const attr = (el: Element, name: string) => el.attrs.find((a) => a.name === name)?.value;
const kids = (n: Node): Node[] => ('childNodes' in n ? n.childNodes : []);
function* walk(n: Node, up: Element[] = []): Generator<[Element, Element[]]> {
  for (const c of kids(n)) {
    if (!isEl(c)) continue;
    yield [c, up];
    if (['template', 'noscript', 'svg', 'script', 'style'].includes(c.tagName)) continue;
    yield* walk(c, [...up, c]);
  }
}

/** Ảnh cần tải thử: URL → (cần là WebP?, trang ví dụ). */
const toFetch = new Map<string, { webp: boolean; page: string }>();
const queue = (url: string, page: string, webp = false) => { if (!toFetch.has(url)) toFetch.set(url, { webp, page }); };

function checkPage(loc: string, html: string) {
  const doc = parse(html);
  let firstInMain = true;
  for (const [el, up] of walk(doc)) {
    if (el.tagName === 'script' && attr(el, 'type') === 'application/ld+json') continue;
    if (el.tagName !== 'img') continue;
    // ảnh trong hộp xem lớn (<dialog>) chỉ hiện khi bấm — không tính là ảnh đầu trang
    const inDialog = up.some((u) => u.tagName === 'dialog');
    const src = attr(el, 'src');
    const alt = attr(el, 'alt');
    const srcset = attr(el, 'srcset');
    const where = short(src ?? attr(el, 'data-src') ?? '(không src)', 60);

    if (alt === undefined) err(`<img> thiếu thuộc tính alt (${where})`, loc);
    else if (/^(undefined|null|\[object Object\])$/i.test(alt.trim())) err(`alt "${alt}" (${where})`, loc);
    else {
      if (alt.length > 125) warn(`alt dài ${alt.length} ký tự (nên ≤ 125, tả ảnh chứ không liệt kê từ khóa): "${short(alt)}"`, loc);
      if ((alt.match(/,/g) ?? []).length >= 4) warn(`alt nhiều dấu phẩy, giống nhồi từ khóa: "${short(alt)}"`, loc);
    }
    if (!src) {
      err(attr(el, 'data-src') ? `Ảnh chỉ có data-src (Google không thấy) — ${where}` : '<img> không có src', loc);
      continue;
    }
    if (src.startsWith('data:') || src.startsWith('blob:')) continue;
    const url = new URL(decode(src), loc);
    const sameSite = url.origin === new URL(loc).origin;
    if (sameSite) queue(url.href, loc);

    const db = sameSite ? DB_IMAGE.exec(url.pathname) : null;
    if (db) {
      if (!url.search && !srcset && !inDialog) warn('Ảnh database không có srcset — tải ảnh gốc ~1600px cho chỗ nhỏ', loc);
      if (/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(db[2]) && db[1] !== 'banner') warn(`Tên file ảnh chưa gắn slug (/api/${db[1]}-images/<mã>) — ${short(url.pathname)}`, loc);
    }
    if (srcset) {
      // srcset theo bề rộng (… 640w) bắt buộc có sizes; theo mật độ (… 2x, như logo) thì không cần
      if (/\d+w(\s*,|\s*$)/.test(srcset) && !attr(el, 'sizes')) err('<img> có srcset theo bề rộng mà thiếu sizes (trình duyệt coi như rộng 100% màn hình)', loc);
      for (const part of srcset.split(',')) {
        const u = part.trim().split(/\s+/)[0];
        if (u) queue(new URL(decode(u), loc).href, loc, /[?&]w=\d+/.test(u));
      }
    }
    const isMain = up.some((u) => u.tagName === 'main');
    if (isMain && !inDialog && firstInMain) {
      firstInMain = false;
      if (attr(el, 'loading') === 'lazy') warn(`Ảnh đầu tiên trong <main> bị lazy-load (thường là ảnh LCP — nên tải ngay) — ${where}`, loc);
    }
  }
}

async function checkImage(url: string, info: { webp: boolean; page: string }) {
  const u = new URL(url);
  if (u.origin === siteOrigin || u.origin === BASE) {
    if (blocked(u.pathname)) err(`Ảnh bị robots.txt chặn — ${short(u.pathname)}`, info.page);
  }
  try {
    const res = await fetch(local(url), { headers: { 'User-Agent': UA, Accept: BROWSER_ACCEPT } });
    const type = res.headers.get('content-type') ?? '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.status !== 200) return err(`Ảnh mã ${res.status} — ${short(u.pathname + u.search)}`, info.page);
    if (!type.startsWith('image/')) return err(`Ảnh trả về "${type}" (không phải ảnh) — ${short(u.pathname)}`, info.page);
    if (/noindex/i.test(res.headers.get('x-robots-tag') ?? '') && !/\.vercel\.app$/.test(new URL(BASE).hostname)) err(`Ảnh công khai có X-Robots-Tag noindex — ${short(u.pathname)}`, info.page);
    if (info.webp && type !== 'image/webp') err(`Bản thu nhỏ không ra WebP (${type}) — ${short(u.pathname + u.search)}`, info.page);
    if (!u.search && buf.length > BIG_ORIGINAL) warn(`Ảnh nặng ${Math.round(buf.length / 1024)}KB — ${short(u.pathname)}`, info.page);
  } catch (e) {
    err(`Không tải được ảnh (${(e as Error).message}) — ${short(u.pathname)}`, info.page);
  }
}

async function main() {
  console.log(`Kiểm tra ảnh + video trên ${BASE}\n`);
  const { pages, videos } = await readSitemaps();
  console.log(`Sitemap có ${pages.length} trang, ${videos.length} video.`);

  const videoPages = new Set(videos.map((v) => v.page));
  await pool(pages, async (loc) => {
    try {
      const res = await fetch(local(loc), { headers: { 'User-Agent': UA } });
      if (res.status !== 200) return err(`Trang mã ${res.status}`, loc);
      const html = await res.text();
      checkPage(loc, html);
      if (videoPages.has(loc) && !/"@type":"VideoObject"/.test(html)) err('Trang có video trong sitemap nhưng thiếu JSON-LD VideoObject', loc);
    } catch (e) {
      err(`Không mở được trang (${(e as Error).message})`, loc);
    }
  });

  for (const v of videos) {
    if (!v.player.startsWith('https://')) err(`Link trình phát video không phải https — ${v.player}`, v.page);
    if (!v.thumbnail) err('Video thiếu ảnh thu nhỏ', v.page);
    else queue(v.thumbnail, v.page);
  }

  console.log(`Tải thử ${toFetch.size} ảnh (gồm các bản thu nhỏ trong srcset)…`);
  await pool([...toFetch.entries()], ([url, info]) => checkImage(url, info));

  // Ảnh riêng tư: chưa đăng nhập không được xem (mã ngẫu nhiên không tồn tại → 401 / 404, không bao giờ 200)
  for (const p of ['uploads', 'garden-photos', 'service-photos', 'expense-photos']) {
    const res = await fetch(`${BASE}/api/${p}/${'0'.repeat(32)}.jpg`, { redirect: 'manual' });
    if (res.status === 200) err(`/api/${p}/… trả 200 khi chưa đăng nhập`, `${BASE}/api/${p}/`);
  }
  // Tên file lạ / bề rộng lạ phải 404 (không tạo vô số bản cache)
  const any = [...toFetch.keys()].find((u) => DB_IMAGE.test(new URL(u).pathname) && !new URL(u).search);
  if (any) {
    const bad = await fetch(`${local(any)}?w=777`);
    if (bad.status !== 404) err(`Bề rộng thu nhỏ lạ (?w=777) trả ${bad.status}, cần 404`, any);
  }
}

await main().catch((e) => err(`Lỗi khi kiểm tra: ${(e as Error).message}`, BASE));
const print = (sign: string, map: Map<string, Set<string>>) => {
  for (const [msg, locs] of map) {
    const list = [...locs];
    console.log(`${sign} ${msg}${list.length > 1 ? ` (${list.length} trang)` : ''}\n    ${list.slice(0, 3).join('\n    ')}${list.length > 3 ? '\n    …' : ''}`);
  }
};
print('⚠', warnings);
print('✗', errors);
console.log(errors.size ? `\n${errors.size} loại lỗi.` : '\nẢnh + video đạt.');
process.exit(errors.size ? 1 : 0);
