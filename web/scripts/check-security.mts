/**
 * Kiểm tra bảo mật, HTTPS và độ ổn định (mục 13 checklist SEO): `npm run seo:security` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:security -- https://www.caycanhmientay.com` (web thật — chạy sau mỗi lần deploy, và theo lịch bằng
 * GitHub Actions `.github/workflows/giam-sat-web.yml` để báo khi web sập, chứng chỉ sắp hết hạn, robots / sitemap /
 * canonical bị đổi bất thường).
 *
 * Phần 1 — HTTPS (chỉ khi kiểm tên miền https thật, không phải localhost):
 *   http:// → https:// một bước bằng 301 / 308; tên miền không-www tới đúng tên miền chính (≤ 2 bước); HSTS max-age ≥ 1 năm;
 *   chứng chỉ TLS hợp lệ, đúng tên miền, còn ≥ 30 ngày (< 14 ngày: lỗi); tên miền phân giải được (DNS).
 * Phần 2 — mọi trang trong sitemap (UA Googlebot): trả 200 (Googlebot không bị chặn / 403 / 429), header bảo mật
 *   (nosniff, chống nhúng trang, Referrer-Policy), không X-Robots-Tag noindex trên tên miền chính, không meta noindex,
 *   canonical tự trỏ chính nó; **mixed content** (ảnh / script / CSS / iframe / video / og:image nạp qua http://);
 *   **dữ liệu riêng tư lọt ra HTML** (email, SĐT không phải của shop — tính cả dữ liệu RSC trong <script>; chuỗi bí mật
 *   như chuỗi kết nối database, khóa riêng, mật khẩu băm, token phiên; JSON-LD Person có SĐT / email / địa chỉ).
 * Phần 3 — thử tấn công nhẹ: chuỗi XSS trong ô tìm kiếm / tham số URL không được in ra nguyên dạng; URL rác
 *   (`/san-pham/<chuỗi ngẫu nhiên>`, `/<chuỗi>`, mỗi loại trang trong sitemap) phải 404 — không thành trang "soft 404"
 *   cho kẻ xấu sinh hàng loạt; file nhạy cảm (`/.env`, `/.git/config`, `package.json`…) phải 404; ảnh / API riêng tư
 *   chưa đăng nhập phải 401 / 403 / 404; `/admin`, `/nhan-vien` chuyển về trang đăng nhập; trang đăng nhập admin,
 *   tìm kiếm, link xem trước `?xem-truoc=1` phải noindex.
 * Phần 4 — robots.txt / sitemap không bị đổi bất thường: không `Disallow: /`, không chặn trang công khai trong sitemap,
 *   không chặn /_next; dòng Sitemap trỏ đúng tên miền chính https; sitemap có ≥ SITEMAP_MIN trang (mặc định 10).
 *   Đặt SECURITY_BASELINE=<file.json> để so với lần chạy trước (robots.txt đổi chữ, sitemap mất > 20% trang, canonical
 *   đổi, trang biến mất) và ghi lại bản mới khi không có lỗi.
 *
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính (localhost, *.vercel.app) thì URL được đổi sang máy đó để mở.
 * Việc ngoài code không kiểm được ở đây: theo dõi uptime liên tục (UptimeRobot / Better Stack), sao lưu database
 * (`.github/workflows/sao-luu-database.yml`), Search Console → Bảo mật và thao tác thủ công.
 */

import { promises as dns } from 'node:dns';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { Socket } from 'node:net';
import tls from 'node:tls';

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const GOOGLEBOT = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const CONCURRENCY = 6;
const SITEMAP_MIN = Number(process.env.SITEMAP_MIN ?? 10);
const BASELINE = process.env.SECURITY_BASELINE;

/** Kênh liên hệ công khai của shop (lib/contact.ts) — SĐT / email khác xuất hiện trong HTML là dữ liệu lọt ra. */
const SHOP_PHONES = ['0703005001', '0927291989', '0973806842', '0707873425'];
const SHOP_EMAILS = ['nhanjara@gmail.com'];
/** Email trong mã thư viện / ví dụ — không phải dữ liệu người dùng. */
const EMAIL_IGNORE = /@(example\.(com|org)|sentry\.io|w3\.org|2x\.png|3x\.png)$|^[^@]+@\d+x\./i;

const errors = new Map<string, string[]>();
const warnings = new Map<string, string[]>();
const add = (m: Map<string, string[]>, msg: string, loc: string) => m.set(msg, [...(m.get(msg) ?? []), loc]);
const err = (msg: string, loc = '') => add(errors, msg, loc);
const warn = (msg: string, loc = '') => add(warnings, msg, loc);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const site = (u: string) => (u.startsWith(BASE) ? siteOrigin + u.slice(BASE.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attr = (tag: string, name: string) => {
  const m = new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? decode(m[1] ?? m[2] ?? '') : null;
};
const rand = () => `kt-${Math.random().toString(36).slice(2, 10)}`;

async function get(url: string, opts: { ua?: string; redirect?: RequestRedirect; method?: string } = {}) {
  const res = await fetch(url, {
    method: opts.method ?? 'GET', redirect: opts.redirect ?? 'manual',
    headers: { 'user-agent': opts.ua ?? GOOGLEBOT, accept: 'text/html,*/*' }, signal: AbortSignal.timeout(30_000),
  });
  const text = opts.method === 'HEAD' ? '' : await res.text();
  return { status: res.status, headers: res.headers, text, location: res.headers.get('location') };
}

async function pool<T>(items: T[], fn: (x: T) => Promise<void>, n = CONCURRENCY) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

const robotsMeta = (html: string) => [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0])
  .filter((t) => /^(robots|googlebot)$/i.test(attr(t, 'name') ?? '')).map((t) => attr(t, 'content') ?? '').join(',');
const canonicalOf = (html: string) => {
  const tag = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => (attr(t, 'rel') ?? '').toLowerCase() === 'canonical');
  return tag ? attr(tag, 'href') : null;
};
const noindex = (headers: Headers, html: string) => /noindex/i.test(headers.get('x-robots-tag') ?? '') || /noindex/i.test(robotsMeta(html));

// ───────────────────────────── robots + sitemap ─────────────────────────────

/** Luật robots.txt cho nhóm `User-agent: *` (đủ dùng cho file robots của web này). */
function robotsRules(txt: string) {
  const rules: { allow: boolean; path: string }[] = [];
  let star = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const [, k, v] = m;
    if (/^user-agent$/i.test(k)) star = v.trim() === '*';
    else if (star && /^(allow|disallow)$/i.test(k) && v) rules.push({ allow: /^allow$/i.test(k), path: v.trim() });
  }
  return rules;
}
function blocked(rules: { allow: boolean; path: string }[], path: string) {
  const hit = rules.filter((r) => path.startsWith(r.path.replace(/\*.*$/, ''))).sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow))[0];
  return !!hit && !hit.allow;
}

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
  return { robots: robots.text, index, pages };
}

function checkRobots(txt: string, index: string, pages: string[]) {
  const rules = robotsRules(txt);
  if (!/^user-agent:\s*\*/im.test(txt)) err('robots.txt không có nhóm "User-agent: *"');
  if (rules.some((r) => !r.allow && r.path === '/')) err('robots.txt có "Disallow: /" — chặn cả web khỏi Google');
  if (/^user-agent:\s*googlebot/im.test(txt)) warn('robots.txt có nhóm riêng cho Googlebot — kiểm lại có cố ý không');
  if (blocked(rules, '/_next/static/')) err('robots.txt chặn /_next/ (CSS, JS Google cần để dựng trang)');
  if (!index.startsWith('https://')) err('Dòng Sitemap trong robots.txt không phải https', index);
  for (const p of pages) if (blocked(rules, new URL(p).pathname)) err('Trang trong sitemap bị robots.txt chặn', p);
  if (pages.length < SITEMAP_MIN) err(`Sitemap chỉ có ${pages.length} trang (< ${SITEMAP_MIN}) — sitemap hỏng hoặc nội dung bị ẩn hàng loạt`);
  for (const p of pages) {
    if (!p.startsWith(`${siteOrigin}/`) || !p.startsWith('https://')) err('URL trong sitemap không thuộc tên miền chính https', p);
  }
}

// ───────────────────────────── Phần 1: HTTPS ─────────────────────────────

/** Máy đi Internet qua proxy (HTTPS_PROXY) thì mở đường hầm CONNECT tới cổng 443 rồi mới bắt tay TLS. */
function tunnel(host: string) {
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
  if (!proxy) return Promise.resolve<Socket | undefined>(undefined);
  const u = new URL(proxy.includes('://') ? proxy : `http://${proxy}`);
  return new Promise<Socket>((resolve, reject) => {
    const req = http.request({ host: u.hostname, port: Number(u.port || 80), method: 'CONNECT', path: `${host}:443`, timeout: 15_000 });
    req.on('connect', (res, socket) => (res.statusCode === 200 ? resolve(socket) : reject(new Error(`proxy trả ${res.statusCode}`))));
    req.on('timeout', () => { req.destroy(); reject(new Error('proxy timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function certOf(host: string) {
  const socket = await tunnel(host);
  return new Promise<tls.PeerCertificate & { authorized: boolean; authError?: string }>((resolve, reject) => {
    const s = tls.connect({ host, port: 443, servername: host, timeout: 15_000, ...(socket ? { socket } : {}) }, () => {
      const c = s.getPeerCertificate();
      resolve(Object.assign(c, { authorized: s.authorized, authError: s.authorizationError ? String(s.authorizationError) : undefined }));
      s.end();
    });
    s.on('timeout', () => { s.destroy(); reject(new Error('timeout')); });
    s.on('error', reject);
  });
}

/** HEAD không theo chuyển hướng; http:// đi qua proxy (nếu có) bằng URL tuyệt đối — proxy công ty thường cấm CONNECT cổng 80. */
async function head(url: string) {
  if (!url.startsWith('http://')) return get(url, { method: 'HEAD' });
  const proxy = process.env.HTTP_PROXY ?? process.env.http_proxy;
  const target = new URL(url);
  const via = proxy ? new URL(proxy.includes('://') ? proxy : `http://${proxy}`) : null;
  return new Promise<{ status: number; location: string | null }>((resolve, reject) => {
    const req = http.request({
      host: via?.hostname ?? target.hostname, port: Number(via?.port || target.port || 80), method: 'HEAD',
      path: via ? url : target.pathname + target.search, headers: { host: target.host, 'user-agent': GOOGLEBOT }, timeout: 15_000,
    }, (res) => { res.resume(); resolve({ status: res.statusCode ?? 0, location: (res.headers.location as string | undefined) ?? null }); });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function checkHttps() {
  const main = new URL(siteOrigin).host;
  const bare = main.replace(/^www\./, '');
  const hosts = [...new Set([main, bare])];

  for (const h of hosts) {
    try {
      const a = await dns.resolve4(h).catch(() => [] as string[]);
      const c = await dns.resolveCname(h).catch(() => [] as string[]);
      if (!a.length && !c.length) err('Tên miền không phân giải được (DNS)', h);
    } catch (e) { err(`Lỗi DNS: ${(e as Error).message}`, h); }

    try {
      const c = await certOf(h);
      if (!c.authorized) err(`Chứng chỉ TLS không hợp lệ: ${c.authError}`, h);
      const san = (c.subjectaltname ?? '').split(/,\s*/).map((x) => x.replace(/^DNS:/, ''));
      if (!san.some((n) => n === h || (n.startsWith('*.') && h.endsWith(n.slice(1))))) err('Chứng chỉ TLS không ghi đúng tên miền', `${h} — ${san.join(', ')}`);
      const days = Math.floor((new Date(c.valid_to).getTime() - Date.now()) / 86_400_000);
      if (days < 14) err(`Chứng chỉ TLS còn ${days} ngày`, `${h} — hết hạn ${c.valid_to}`);
      else if (days < 30) warn(`Chứng chỉ TLS còn ${days} ngày (Vercel thường tự gia hạn trước 30 ngày — kiểm lại)`, h);
      else console.log(`  Chứng chỉ ${h}: còn ${days} ngày (${c.valid_to}), cấp bởi ${c.issuer?.O ?? '?'}`);
    } catch (e) { warn(`Không đo được chứng chỉ TLS (${(e as Error).message}) — máy đi qua proxy?`, h); }

    // http → https, một bước, vĩnh viễn
    try {
      const r = await head(`http://${h}/`);
      if (![301, 308].includes(r.status)) err(`http:// trả ${r.status}, không chuyển hướng vĩnh viễn sang https`, `http://${h}/`);
      else if (!r.location?.startsWith(`https://${h}/`) && !r.location?.startsWith(`${siteOrigin}/`)) err('http:// không chuyển sang https://', `http://${h}/ → ${r.location}`);
    } catch (e) { warn(`Không mở được http:// (${(e as Error).message})`, h); }
  }

  // Tên miền không-www tới tên miền chính
  if (bare !== main) {
    let url = `http://${bare}/`;
    let hops = 0;
    try {
      while (hops < 5) {
        const r = await head(url);
        if (r.status < 300 || r.status >= 400 || !r.location) break;
        url = new URL(r.location, url).href;
        hops++;
      }
      if (!url.startsWith(`${siteOrigin}/`)) err('Tên miền không-www không về tên miền chính', `http://${bare}/ → ${url}`);
      else if (hops > 2) warn(`http://${bare}/ mất ${hops} bước chuyển hướng`);
    } catch (e) { warn(`Không mở được ${bare} (${(e as Error).message})`); }
  }

  const home = await get(`${siteOrigin}/`);
  const hsts = home.headers.get('strict-transport-security') ?? '';
  const age = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0);
  if (!hsts) err('Thiếu header Strict-Transport-Security (HSTS)', siteOrigin);
  else if (age < 31_536_000) warn(`HSTS max-age = ${age} giây (< 1 năm)`, siteOrigin);
}

// ───────────────────────────── Phần 2: từng trang ─────────────────────────────

const RESOURCE_TAGS = /<(img|script|link|iframe|source|video|audio|embed|object|form|input)\b[^>]*>/gi;
const SECRET_PATTERNS: [RegExp, string][] = [
  [/postgres(?:ql)?:\/\/[^\s"'<]+@/i, 'chuỗi kết nối database'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'khóa riêng (private key)'],
  [/\b(DATABASE_URL|AUTH_SECRET|GOOGLE_CLIENT_SECRET|RESEND_API_KEY|ZALO_ZNS_ACCESS_TOKEN)\b/, 'tên biến bí mật của máy chủ'],
  [/\b(password_?hash|passwordHash|ccmt_session)\b/, 'mật khẩu băm / cookie phiên'],
  [/\bsk_(live|test)_[A-Za-z0-9]{10,}/, 'khóa API'],
  [/"(contactPhone|contact_phone|googleSub|google_sub|staffRole)":"[^"]+"/, 'trường dữ liệu tài khoản'],
];

function checkPage(url: string, r: Awaited<ReturnType<typeof get>>) {
  const html = r.text;
  const h = r.headers;
  if (!/nosniff/i.test(h.get('x-content-type-options') ?? '')) err('Thiếu X-Content-Type-Options: nosniff', url);
  const csp = h.get('content-security-policy') ?? '';
  if (!h.get('x-frame-options') && !/frame-ancestors/i.test(csp)) err('Thiếu chống nhúng trang (X-Frame-Options / CSP frame-ancestors)', url);
  if (!h.get('referrer-policy')) warn('Thiếu Referrer-Policy', url);
  if (!/upgrade-insecure-requests/i.test(csp)) warn('CSP chưa có upgrade-insecure-requests', url);
  if (/noindex/i.test(h.get('x-robots-tag') ?? '') && !new URL(BASE).host.endsWith('.vercel.app')) err('Trang trong sitemap có X-Robots-Tag noindex', url);
  if (/noindex/i.test(robotsMeta(html))) err('Trang trong sitemap có meta noindex', url);
  const canon = canonicalOf(html);
  if (!canon) err('Trang trong sitemap không có canonical', url);
  else if (new URL(canon, siteOrigin).href !== new URL(site(url)).href) err('Canonical không trỏ về chính trang', `${url} → ${canon}`);

  // Mixed content: tài nguyên nạp qua http://
  for (const m of html.matchAll(RESOURCE_TAGS)) {
    const tag = m[0];
    const name = m[1].toLowerCase();
    const urls = [attr(tag, 'src'), attr(tag, 'poster'), attr(tag, 'data'), name === 'link' ? attr(tag, 'href') : null, name === 'form' ? attr(tag, 'action') : null,
      ...(attr(tag, 'srcset') ?? '').split(',').map((s) => s.trim().split(/\s+/)[0])];
    for (const u of urls) if (u && /^http:\/\//i.test(u) && !/^http:\/\/(localhost|127\.)/.test(u)) err('Mixed content: tài nguyên nạp qua http://', `${url} — <${name}> ${u}`);
  }
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const p = attr(m[0], 'property') ?? attr(m[0], 'name') ?? '';
    const c = attr(m[0], 'content') ?? '';
    if (/^(og:image|og:url|og:video|twitter:image)/i.test(p) && /^http:\/\//i.test(c)) err(`Mixed content: ${p} là http://`, `${url} — ${c}`);
  }
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], 'href') ?? '';
    if (/^http:\/\//i.test(href) && new URL(href).host === new URL(siteOrigin).host) warn('Link nội bộ viết http://', `${url} — ${href}`);
  }

  // Dữ liệu riêng tư lọt ra (cả HTML lẫn dữ liệu RSC trong <script>)
  const raw = html.replace(/\\u0040/g, '@');
  for (const m of raw.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
    const e = m[0].toLowerCase();
    if (!SHOP_EMAILS.includes(e) && !EMAIL_IGNORE.test(e) && !/\.(png|jpe?g|webp|svg|js|css)$/.test(e)) err('Email không phải của shop xuất hiện trong HTML', `${url} — ${e}`);
  }
  for (const m of raw.matchAll(/(?<![\w.-])(?:\+84|0)(?:3|5|7|8|9)\d(?:[ .]?\d){7}(?![\w-])/g)) {
    const p = m[0].replace(/[ .]/g, '').replace(/^\+84/, '0');
    if (!SHOP_PHONES.includes(p)) warn('SĐT không phải hotline của shop xuất hiện trong HTML (kiểm có phải dữ liệu khách không)', `${url} — ${m[0]}`);
  }
  for (const [re, what] of SECRET_PATTERNS) {
    const m = re.exec(raw);
    if (m) err(`Lộ ${what} trong HTML`, `${url} — ${m[0].slice(0, 60)}`);
  }
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try { data = JSON.parse(m[1]); } catch { continue; }
    const walk = (x: unknown): void => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== 'object') return;
      const o = x as Record<string, unknown>;
      if (o['@type'] === 'Person' && (o.telephone || o.email || o.address)) err('JSON-LD Person có SĐT / email / địa chỉ (dữ liệu cá nhân)', url);
      Object.values(o).forEach(walk);
    };
    walk(data);
  }
}

// ───────────────────────────── Phần 3: thử tấn công nhẹ ─────────────────────────────

const XSS = ['<script>alert(1)</script>', '"><svg onload=alert(1)>', "'><img src=x onerror=alert(1)>"];

async function probes(pages: string[]) {
  const product = pages.find((p) => /\/san-pham\/[^/]+$/.test(new URL(p).pathname));
  const category = pages.find((p) => /\/danh-muc\/[^/]+$/.test(new URL(p).pathname));

  // XSS: chuỗi người dùng nhập không được in ra nguyên dạng
  const xssUrls = XSS.flatMap((x) => {
    const q = encodeURIComponent(x);
    return [`${BASE}/tim-kiem?q=${q}`, `${BASE}/?utm_source=${q}`, ...(product ? [`${local(product)}?ref=${q}`] : []), ...(category ? [`${local(category)}?sap_xep=${q}`] : [])];
  });
  await pool(xssUrls, async (u) => {
    try {
      const r = await get(u, { redirect: 'follow' });
      for (const x of XSS) if (r.text.includes(x)) err('Chuỗi XSS được in ra nguyên dạng (chưa escape)', `${u} — ${x}`);
    } catch (e) { warn(`Không mở được (${(e as Error).message})`, u); }
  });

  // Trang tìm kiếm noindex
  const s = await get(`${BASE}/tim-kiem?q=${encodeURIComponent('kiểm tra spam')}`, { redirect: 'follow' });
  if (s.status === 200 && !noindex(s.headers, s.text)) err('Trang tìm kiếm không noindex — kẻ xấu có thể sinh trang rác vào Google', '/tim-kiem');

  // URL rác → 404 (mỗi loại trang trong sitemap + vài đường dẫn tự đặt)
  const prefixes = new Set<string>(['/', '/san-pham/', '/danh-muc/', '/benh-cay/', '/goc-cham-cay/', '/tin-tuc/', '/doi-tac/cong-trinh/', '/chinh-sach/']);
  for (const p of pages) {
    const path = new URL(p).pathname;
    if (path.split('/').length > 2) prefixes.add(path.replace(/[^/]+$/, ''));
  }
  const junk = [...prefixes].map((p) => `${BASE}${p}${rand()}`);
  junk.push(`${BASE}/danh-muc/cay-canh/${rand()}/${rand()}`, `${BASE}/${rand()}.html`, `${BASE}/${rand()}/${rand()}`);
  await pool(junk, async (u) => {
    try {
      const r = await get(u);
      if (r.status === 200) err('URL rác trả 200 (soft 404) — phải 404', u);
      else if (r.status >= 300 && r.status < 400) warn(`URL rác chuyển hướng ${r.status} thay vì 404`, `${u} → ${r.location}`);
      else if (r.status >= 500) err(`URL rác gây lỗi máy chủ ${r.status}`, u);
    } catch (e) { warn(`Không mở được (${(e as Error).message})`, u); }
  });

  // File nhạy cảm không được lộ
  const secrets = ['/.env', '/.env.local', '/.env.production', '/.git/config', '/.git/HEAD', '/package.json', '/next.config.ts', '/drizzle.config.ts', '/.vercel/project.json', '/web/.env.local'];
  await pool(secrets, async (p) => {
    const r = await get(`${BASE}${p}`);
    if (r.status === 200 && !/<html/i.test(r.text.slice(0, 500))) err('File nhạy cảm mở được công khai', p);
    else if (r.status === 200) err('Đường dẫn file nhạy cảm trả 200 (phải 404)', p);
  });

  // Ảnh / API riêng tư khi chưa đăng nhập
  const priv = ['/api/uploads/kiem-tra.jpg', '/api/garden-photos/kiem-tra.jpg', '/api/expense-photos/kiem-tra.jpg', '/api/service-photos/kiem-tra.jpg',
    `/api/uploads/${'a'.repeat(32)}.jpg`, `/api/garden-photos/${'a'.repeat(32)}.jpg`, `/api/expense-photos/${'a'.repeat(32)}.jpg`, `/api/service-photos/${'a'.repeat(32)}.jpg`];
  await pool(priv, async (p) => {
    const r = await get(`${BASE}${p}`);
    if (![401, 403, 404].includes(r.status)) err(`API riêng tư trả ${r.status} khi chưa đăng nhập (phải 401 / 403 / 404)`, p);
  });

  // Khu quản trị
  for (const p of ['/admin', '/admin/don-hang', '/nhan-vien', '/nhan-vien/giao-hang']) {
    const r = await get(`${BASE}${p}`);
    if (r.status === 200) err('Khu quản trị mở được khi chưa đăng nhập', p);
    else if (r.status >= 300 && r.status < 400 && !/\/admin\/dang-nhap/.test(r.location ?? '')) warn('Khu quản trị chuyển hướng không về trang đăng nhập', `${p} → ${r.location}`);
  }
  const login = await get(`${BASE}/admin/dang-nhap`);
  if (login.status === 200 && !noindex(login.headers, login.text)) err('Trang đăng nhập quản trị không noindex', '/admin/dang-nhap');
  for (const p of ['/tai-khoan', '/gio-hang', '/thanh-toan']) {
    const r = await get(`${BASE}${p}`, { redirect: 'follow' });
    if (r.status === 200 && !noindex(r.headers, r.text)) err('Trang riêng tư không noindex', p);
  }

  // Link xem trước của admin
  const previewable = pages.filter((p) => /\/(goc-cham-cay|tin-tuc|doi-tac\/cong-trinh)\/[^/]+$/.test(new URL(p).pathname)).slice(0, 2);
  for (const p of previewable) {
    const r = await get(`${local(p)}?xem-truoc=1`, { redirect: 'follow' });
    if (r.status === 200 && !noindex(r.headers, r.text)) {
      const canon = canonicalOf(r.text);
      if (!canon || new URL(canon, siteOrigin).href !== new URL(p).href) err('Link xem trước ?xem-truoc=1 không noindex và canonical không về URL sạch', p);
      else warn('Link xem trước ?xem-truoc=1 chưa có X-Robots-Tag noindex (canonical vẫn về URL sạch)', p);
    }
  }
}

// ───────────────────────────── Baseline (theo dõi thay đổi bất thường) ─────────────────────────────

type Baseline = { robots: string; pages: Record<string, string> };

function compareBaseline(now: Baseline) {
  if (!BASELINE) return;
  if (!existsSync(BASELINE)) { console.log(`  Chưa có ${BASELINE} — lần này chỉ ghi mốc.`); return; }
  const old = JSON.parse(readFileSync(BASELINE, 'utf8')) as Baseline;
  if (old.robots.trim() !== now.robots.trim()) warn('robots.txt khác lần chạy trước — kiểm có cố ý không');
  const before = Object.keys(old.pages);
  const gone = before.filter((p) => !(p in now.pages));
  if (before.length && gone.length / before.length > 0.2) err(`Sitemap mất ${gone.length} / ${before.length} trang so với lần trước (> 20%)`);
  else for (const p of gone.slice(0, 20)) warn('Trang không còn trong sitemap so với lần trước', p);
  for (const [p, c] of Object.entries(now.pages)) if (old.pages[p] !== undefined && old.pages[p] !== c) err('Canonical đổi so với lần trước', `${p}: ${old.pages[p]} → ${c}`);
}

// ───────────────────────────── chạy ─────────────────────────────

const t0 = Date.now();
console.log(`Kiểm tra bảo mật / HTTPS / ổn định: ${BASE}`);
const { robots, index, pages } = await sitemap();
console.log(`  Sitemap: ${pages.length} trang (tên miền chính ${siteOrigin})`);
checkRobots(robots, index, pages);

if (BASE.startsWith('https://') && !/localhost|127\.0\.0\.1/.test(BASE)) await checkHttps();
else console.log('  Bỏ qua phần HTTPS (đang kiểm máy dev).');

const snapshot: Baseline = { robots, pages: {} };
const browserHome = await get(`${BASE}/`, { ua: BROWSER });
await pool(pages, async (p) => {
  try {
    const r = await get(local(p));
    if (r.status !== 200) {
      err(r.status === 403 || r.status === 429 ? `Googlebot bị chặn (${r.status}) — kiểm tường lửa / giới hạn tần suất` : `Trang trong sitemap trả ${r.status}`, p);
      return;
    }
    checkPage(p, r);
    snapshot.pages[p] = canonicalOf(r.text) ?? '';
  } catch (e) { err(`Không mở được trang (${(e as Error).message})`, p); }
});
const botHome = await get(`${BASE}/`);
if (browserHome.status !== botHome.status) err(`Trang chủ trả mã khác nhau cho trình duyệt (${browserHome.status}) và Googlebot (${botHome.status})`);

await probes(pages);
compareBaseline(snapshot);

const print = (title: string, m: Map<string, string[]>) => {
  if (!m.size) return;
  console.log(`\n${title}`);
  for (const [msg, locs] of m) {
    const shown = process.env.ALL ? locs : locs.slice(0, 5);
    console.log(`  • ${msg}${locs.length > 1 ? ` (${locs.length})` : ''}`);
    for (const l of shown.filter(Boolean)) console.log(`      ${l}`);
    if (shown.length < locs.length) console.log(`      … (ALL=1 để in đủ)`);
  }
};
print('CẢNH BÁO', warnings);
print('LỖI', errors);
console.log(`\n${pages.length} trang · ${errors.size} nhóm lỗi · ${warnings.size} nhóm cảnh báo · ${((Date.now() - t0) / 1000).toFixed(1)}s`);

if (BASELINE && !errors.size) writeFileSync(BASELINE, JSON.stringify(snapshot, null, 1));
process.exit(errors.size ? 1 : 0);
