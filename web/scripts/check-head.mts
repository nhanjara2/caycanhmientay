/**
 * Kiểm tra các thẻ trong <head> + thẻ chia sẻ mạng xã hội (mục 2.2 + 2.3 checklist SEO): `npm run seo:head` (máy dev,
 * http://localhost:3000) hoặc `npm run seo:head -- https://www.caycanhmientay.com` (web thật — chạy sau mỗi lần deploy
 * cùng seo:sitemap, seo:canonical, seo:metadata).
 *
 * Mở mọi trang trong sitemap hai lần — UA Googlebot và UA Facebook (máy đọc link chia sẻ) — rồi kiểm trong <head>:
 *  - <meta charset="utf-8"> đúng một thẻ, nằm trong 1024 byte đầu; <meta name="viewport"> đúng một thẻ; <html lang="vi">;
 *  - đúng một title / description / canonical, nhiều nhất một robots; KHÔNG thẻ meta nào bị lặp (trừ og:image, article:tag…);
 *  - Open Graph đủ og:title, og:description, og:type, og:url, og:image, og:site_name, og:locale; og:title = <title>,
 *    og:description = description, og:url = canonical; twitter:card + twitter:title + twitter:image;
 *  - bài viết (og:type article): có article:published_time, ngày sửa không trước ngày đăng;
 *  - mọi URL trong metadata là https, URL của web phải là tên miền chính (không localhost / *.vercel.app);
 *  - favicon, apple-touch-icon, manifest có khai báo và tải được; không có thẻ chỉ để quảng cáo (meta keywords);
 *  - HTML cho Googlebot và cho Facebook có cùng bộ thẻ trong <head>; không có X-Robots-Tag xung đột với meta robots;
 *  - ảnh chia sẻ: tải được không cần đăng nhập (200, image/*, ≤ 8MB), không bị robots.txt chặn, cỡ ≥ 200px (nên ≥ 600px);
 *    hai sản phẩm / hai bài / hai bệnh không dùng chung ảnh; ảnh của trang sản phẩm phải là một ảnh của chính sản phẩm đó.
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính thì URL được đổi sang máy đó để mở.
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const FACEBOOK = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const CONCURRENCY = 6;
/** Thẻ được phép lặp (mỗi ảnh / mỗi thẻ chủ đề một dòng). */
const REPEATABLE = /^(og:image(:.*)?|twitter:image(:.*)?|article:(tag|author)|og:locale:alternate)$/;
const REQUIRED_OG = ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:site_name', 'og:locale'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // giới hạn của Facebook

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attr = (tag: string, name: string) => {
  const m = new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? decode(m[1] ?? m[2] ?? '') : undefined;
};

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

// ---- robots.txt (User-agent: *), so khớp tiền tố dài nhất như Google — giống check-sitemap.mts ----
type Rule = { allow: boolean; path: string };
let rules: Rule[] = [];
const blocked = (path: string) => {
  const hit = rules.filter((r) => path.startsWith(r.path)).sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow))[0];
  return hit ? !hit.allow : false;
};

async function sitemapPages() {
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  let forAll = false;
  for (const raw of robots.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const [k, ...rest] = line.split(':');
    const v = rest.join(':').trim();
    const key = k.toLowerCase();
    if (key === 'user-agent') forAll = v === '*';
    else if (forAll && (key === 'allow' || key === 'disallow') && v) rules.push({ allow: key === 'allow', path: v });
  }
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  siteOrigin = new URL(index).origin;
  const locs = async (u: string) => [...(await (await fetch(local(u))).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const out: string[] = [];
  for (const child of await locs(index)) out.push(...await locs(child));
  return out;
}

/** Cỡ ảnh đọc từ phần đầu file PNG / JPEG / WebP / GIF (không cần thư viện). */
function imageSize(b: Uint8Array): { w: number; h: number } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b[0] === 0x89 && b[1] === 0x50) return { w: dv.getUint32(16), h: dv.getUint32(20) };
  if (b[0] === 0x47 && b[1] === 0x49) return { w: dv.getUint16(6, true), h: dv.getUint16(8, true) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { h: dv.getUint16(i + 5), w: dv.getUint16(i + 7) };
      i += 2 + dv.getUint16(i + 2);
    }
    return null;
  }
  if (String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') {
    const kind = String.fromCharCode(...b.slice(12, 16));
    if (kind === 'VP8X') return { w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    if (kind === 'VP8 ') return { w: dv.getUint16(26, true) & 0x3fff, h: dv.getUint16(28, true) & 0x3fff };
    if (kind === 'VP8L') { const n = dv.getUint32(21, true); return { w: 1 + (n & 0x3fff), h: 1 + ((n >> 14) & 0x3fff) }; }
  }
  return null;
}

type Head = { html: string; head: string; tags: string[]; metas: Map<string, string[]>; links: { rel: string; href: string; hreflang?: string }[] };
async function load(url: string, ua: string): Promise<(Head & { res: Response }) | null> {
  const res = await fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': ua } });
  if (res.status !== 200) { err(`Mã ${res.status} (${ua === FACEBOOK ? 'Facebook' : 'Googlebot'}) — ${url}`); return null; }
  const html = await res.text();
  const end = html.indexOf('</head>');
  const head = end > 0 ? html.slice(0, end) : '';
  const tags = [...head.matchAll(/<(meta|link)\b[^>]*>/gi)].map((m) => m[0]);
  const metas = new Map<string, string[]>();
  for (const t of tags.filter((x) => /^<meta/i.test(x))) {
    const key = attr(t, 'name') ?? attr(t, 'property') ?? attr(t, 'http-equiv') ?? (attr(t, 'charset') !== undefined ? 'charset' : undefined);
    if (key) metas.set(key.toLowerCase(), [...(metas.get(key.toLowerCase()) ?? []), attr(t, 'content') ?? attr(t, 'charset') ?? '']);
  }
  const links = tags.filter((x) => /^<link/i.test(x)).map((t) => ({ rel: (attr(t, 'rel') ?? '').toLowerCase(), href: attr(t, 'href') ?? '', hreflang: attr(t, 'hreflang') }));
  return { res, html, head, tags, metas, links };
}

/** Bộ thẻ <head> để so giữa hai UA (bỏ thẻ link tải trước file JS / CSS — tên file giống nhau nhưng thứ tự có thể khác). */
const signature = (h: Head) => h.tags.filter((t) => !/rel="(preload|stylesheet|modulepreload|preconnect|dns-prefetch)"/i.test(t)).sort().join('\n');

const checkedAssets = new Map<string, Promise<void>>();
/** Tải một ảnh / biểu tượng một lần như máy đọc link chia sẻ (không cookie). */
function checkAsset(url: string, what: string, isShareImage: boolean) {
  if (!checkedAssets.has(url)) checkedAssets.set(url, (async () => {
    const res = await fetch(local(url), { headers: { 'User-Agent': FACEBOOK } }).catch(() => null);
    if (!res || res.status !== 200) { err(`${what} không tải được (${res?.status ?? 'lỗi mạng'}) — ${url}`); return; }
    const type = res.headers.get('content-type') ?? '';
    const buf = new Uint8Array(await res.arrayBuffer());
    if (what === 'Manifest') { if (!/json|manifest/.test(type)) err(`Manifest sai kiểu ${type} — ${url}`); return; }
    if (!type.startsWith('image/')) err(`${what} không phải ảnh (${type}) — ${url}`);
    if (!isShareImage) return;
    if (buf.length > MAX_IMAGE_BYTES) err(`Ảnh chia sẻ ${(buf.length / 1048576).toFixed(1)}MB (Facebook nhận tối đa 8MB) — ${url}`);
    else if (buf.length > 1_048_576) warn(`Ảnh chia sẻ nặng ${(buf.length / 1048576).toFixed(1)}MB (Zalo / Messenger tải chậm) — ${url}`);
    const u = new URL(url);
    if (u.origin === siteOrigin && blocked(u.pathname)) err(`Ảnh chia sẻ bị robots.txt chặn — ${url}`);
    const size = imageSize(buf);
    if (size && (size.w < 200 || size.h < 200)) err(`Ảnh chia sẻ quá nhỏ ${size.w}×${size.h} (tối thiểu 200×200) — ${url}`);
    else if (size && size.w < 600) warn(`Ảnh chia sẻ ${size.w}×${size.h} — nên rộng ≥ 600px để hiện khung lớn — ${url}`);
  })());
  return checkedAssets.get(url)!;
}

/** URL tuyệt đối https; URL thuộc web phải đúng tên miền chính. */
function checkUrl(u: string, what: string, loc: string) {
  let p: URL;
  try { p = new URL(u); } catch { err(`${what} không phải URL tuyệt đối: "${u}" — ${loc}`); return false; }
  if (p.protocol !== 'https:') err(`${what} không dùng https: ${u} — ${loc}`);
  if (/localhost|127\.0\.0\.1|\.vercel\.app$/.test(p.hostname)) err(`${what} dùng tên miền không phải web chính: ${u} — ${loc}`);
  if (p.hostname.endsWith('caycanhmientay.com') && p.origin !== siteOrigin) err(`${what} lệch tên miền chính (${siteOrigin}): ${u} — ${loc}`);
  return true;
}

async function main() {
  console.log(`Kiểm tra thẻ <head> + thẻ chia sẻ trên ${BASE}\n`);
  const pages = await sitemapPages();
  console.log(`${pages.length} trang trong sitemap.`);
  const vercelPreview = new URL(BASE).hostname.endsWith('.vercel.app');
  const shareImages = new Map<string, string[]>(); // ảnh → các trang dùng
  let defaultImage = '';
  const icons = new Set<string>();

  await pool(pages, async (loc) => {
    const [g, f] = await Promise.all([load(loc, GOOGLEBOT), load(loc, FACEBOOK)]);
    if (!g || !f) return;
    const one = (key: string) => g.metas.get(key) ?? [];

    // Khung tài liệu
    const cs = one('charset');
    if (cs.length !== 1 || !/^utf-8$/i.test(cs[0] ?? '')) err(`Cần đúng một <meta charset="utf-8"> (đang có ${cs.length}) — ${loc}`);
    else if (g.html.search(/<meta\s+charset=/i) > 1024) err(`<meta charset> nằm sau 1024 byte đầu — ${loc}`);
    const vp = one('viewport');
    if (vp.length !== 1 || !/width=device-width/.test(vp[0] ?? '')) err(`Cần đúng một <meta name="viewport" content="width=device-width…"> — ${loc}`);
    if (!/<html[^>]*\blang="vi"/i.test(g.html)) err(`<html> thiếu lang="vi" — ${loc}`);
    if (one('keywords').length) warn(`Có meta keywords (Google bỏ qua, chỉ lộ từ khóa cho đối thủ) — ${loc}`);

    // Trùng thẻ
    for (const [key, vals] of g.metas) if (vals.length > 1 && !REPEATABLE.test(key)) err(`Thẻ meta "${key}" lặp ${vals.length} lần — ${loc}`);
    const title = [...g.head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1]).trim());
    if (title.length !== 1) err(`Có ${title.length} thẻ <title> — ${loc}`);
    if (!one('description').length) err(`Thiếu meta description — ${loc}`);
    const canon = g.links.filter((l) => l.rel === 'canonical');
    if (canon.length !== 1) { err(`Có ${canon.length} canonical — ${loc}`); return; }
    const canonical = canon[0].href;
    checkUrl(canonical, 'Canonical', loc);
    if (g.links.some((l) => l.hreflang)) warn(`Có hreflang dù web chỉ một ngôn ngữ — ${loc}`);

    // Robots: thẻ meta và X-Robots-Tag không được xung đột
    const xr = g.res.headers.get('x-robots-tag');
    if (xr && !vercelPreview) err(`Trang có X-Robots-Tag "${xr}" trên tên miền chính (trùng / xung đột với meta robots) — ${loc}`);

    // Googlebot và Facebook phải thấy cùng một bộ thẻ
    if (signature(g) !== signature(f)) err(`Thẻ <head> cho Googlebot khác cho Facebook — ${loc}`);

    // Open Graph
    for (const k of REQUIRED_OG) if (!one(k).length) err(`Thiếu ${k} — ${loc}`);
    const og = (k: string) => one(k)[0] ?? '';
    if (title[0] && og('og:title') && og('og:title') !== title[0]) err(`og:title khác <title>: "${og('og:title')}" ≠ "${title[0]}" — ${loc}`);
    if (og('og:description') && og('og:description') !== (one('description')[0] ?? '')) err(`og:description khác meta description — ${loc}`);
    if (og('og:url') && og('og:url') !== canonical) err(`og:url (${og('og:url')}) khác canonical (${canonical}) — ${loc}`);
    if (og('og:url')) checkUrl(og('og:url'), 'og:url', loc);
    if (og('og:locale') && og('og:locale') !== 'vi_VN') err(`og:locale "${og('og:locale')}" (cần vi_VN) — ${loc}`);
    for (const k of ['twitter:card', 'twitter:title', 'twitter:image']) if (!one(k).length) err(`Thiếu ${k} — ${loc}`);

    // Bài viết: ngày đăng / ngày sửa
    if (og('og:type') === 'article') {
      const pub = og('article:published_time');
      const mod = og('article:modified_time');
      if (!pub || Number.isNaN(Date.parse(pub))) err(`Bài viết thiếu / sai article:published_time — ${loc}`);
      if (mod && (Number.isNaN(Date.parse(mod)) || Date.parse(mod) < Date.parse(pub))) err(`article:modified_time sai hoặc trước ngày đăng — ${loc}`);
    }

    // Ảnh chia sẻ
    const images = one('og:image');
    for (const img of images) {
      if (!checkUrl(img, 'og:image', loc)) continue;
      void checkAsset(img, 'Ảnh chia sẻ', true);
      if (/\/images\/og\//.test(img)) defaultImage = img;
    }
    if (images[0]) shareImages.set(images[0], [...(shareImages.get(images[0]) ?? []), loc]);
    for (const t of one('twitter:image')) if (!images.includes(t)) err(`twitter:image khác og:image — ${loc}`);

    // Sản phẩm: ảnh chia sẻ phải là ảnh của chính sản phẩm (ảnh trong JSON-LD Product), chưa có ảnh thì ảnh mặc định
    if (new URL(loc).pathname.startsWith('/san-pham/')) {
      const ld = [...g.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).find((x) => x?.['@type'] === 'Product');
      // Sản phẩm chỉ "Liên hệ báo giá" chưa có đánh giá thì không có schema Product (lib/jsonld.ts) → bỏ qua
      const own: string[] = ld?.image ?? [];
      if (ld && (own.length ? !own.includes(images[0]) : !/\/images\/og\//.test(images[0] ?? ''))) err(`Ảnh chia sẻ không phải ảnh của sản phẩm này: ${images[0]} — ${loc}`);
    }

    // Biểu tượng
    const need = { icon: 'Favicon', 'apple-touch-icon': 'Biểu tượng iPhone', manifest: 'Manifest' } as const;
    for (const [rel, what] of Object.entries(need)) {
      const l = g.links.find((x) => x.rel.split(/\s+/).includes(rel));
      if (!l) { err(`Thiếu <link rel="${rel}"> — ${loc}`); continue; }
      const abs = new URL(l.href, siteOrigin).toString();
      if (!icons.has(abs)) { icons.add(abs); void checkAsset(abs, what, false); }
    }
  });
  await Promise.all(checkedAssets.values());

  // Hai trang cùng loại (sản phẩm / bài / bệnh / công trình) không được dùng chung ảnh chia sẻ (trừ ảnh mặc định)
  for (const [img, locs] of shareImages) {
    if (img === defaultImage || locs.length < 2) continue;
    const kinds = new Map<string, string[]>();
    for (const l of locs) {
      const p = new URL(l).pathname.split('/').filter(Boolean);
      const kind = p.length > 1 ? p.slice(0, -1).join('/') : '';
      if (kind && kind !== 'danh-muc' && !kind.startsWith('danh-muc/')) kinds.set(kind, [...(kinds.get(kind) ?? []), l]);
    }
    for (const same of kinds.values()) if (same.length > 1) err(`${same.length} trang dùng chung ảnh chia sẻ ${img}: ${same.join(', ')}`);
  }
  if (!defaultImage) warn('Không trang nào dùng ảnh chia sẻ mặc định (/images/og/…) — không kiểm được ảnh dự phòng');
}

await main().catch((e) => err(`Lỗi khi kiểm tra: ${(e as Error).message}`));
for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `\n${errors.length} lỗi, ${warnings.length} cảnh báo.` : `\nThẻ <head> + thẻ chia sẻ đạt (${warnings.length} cảnh báo).`);
process.exit(errors.length ? 1 : 0);
