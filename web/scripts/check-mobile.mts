/**
 * Kiểm tra Mobile SEO (mục 11 checklist SEO): `npm run seo:mobile` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:mobile -- https://www.caycanhmientay.com` (web thật, chạy sau mỗi lần deploy cùng các lệnh seo:* khác).
 *
 * Google xếp hạng theo bản ĐIỆN THOẠI (mobile-first index, Googlebot Smartphone). Web là responsive: một HTML cho mọi máy,
 * CSS quyết định bố cục — công cụ này kiểm điều đó còn đúng.
 *
 * Phần 1 — HTTP, mọi trang trong sitemap: mở bằng Googlebot Smartphone và Googlebot máy tính, lỗi khi khác nhau ở
 *   mã trạng thái / chuyển hướng, <title>, description, robots, canonical, h1, JSON-LD, tập link nội bộ, ảnh, độ dài chữ;
 *   thiếu / sai thẻ viewport (phải width=device-width, không chặn phóng to: user-scalable=no, maximum-scale < 2);
 *   X-Robots-Tag noindex; header Vary: User-Agent (cảnh báo — dấu hiệu trả HTML khác theo máy); robots.txt chặn
 *   Googlebot / Googlebot-Smartphone hoặc chặn /_next/ (CSS, JS) mà Google cần để dựng trang; CSS / JS của trang không tải được.
 *   Kiểm thêm menu điện thoại (bảng danh mục) có trong HTML với link thật tới các danh mục.
 *
 * Phần 2 — trình duyệt (Chrome thật, giả lập điện thoại 390×844 + 360×740, UA Googlebot Smartphone), mỗi loại trang một vài trang
 *   (MOBILE_ALL=1: mọi trang): tràn ngang (scrollWidth > clientWidth, kể cả phần tử bị overflow-x: clip giấu), h1 không hiện,
 *   heading / link nội bộ trong <main> hiện trên máy tính mà bị ẩn trên điện thoại (cảnh báo), lượng chữ hiện trên điện thoại
 *   ít hơn hẳn máy tính, chữ < 12px chiếm nhiều (> 40% chữ: lỗi), nút / link nhỏ hơn 24×24px (WCAG 2.5.8; web tự đặt 44px —
 *   cảnh báo), ảnh / video / iframe / bảng rộng hơn màn hình mà không nằm trong khung cuộn ngang, hộp nổi che > 50% màn hình
 *   ngay khi vào trang, rồi đo LCP + CLS khi giả lập mạng 4G chậm + CPU chậm 4 lần (số đo trong phòng thí nghiệm — chỉ cảnh báo;
 *   số thật xem Search Console → Chỉ số thiết yếu về trang web), và mở trang khi TẮT JavaScript: h1 + chữ trong <main> vẫn phải
 *   hiện (máy chậm / mạng chậm chưa chạy xong script vẫn đọc được trang).
 *   Chrome: tự tìm ở đường dẫn quen thuộc, hoặc đặt CHROME_PATH. NO_BROWSER=1 để chỉ chạy phần 1.
 *
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính (localhost, *.vercel.app) thì URL được đổi sang máy đó để mở.
 * Việc còn lại phải làm tay: Search Console → Kiểm tra URL → "Kiểm tra URL đang hoạt động" → Xem trang đã kiểm tra (ảnh chụp
 * + HTML Googlebot Smartphone dựng), và PageSpeed Insights (https://pagespeed.web.dev) cho số đo thật trên điện thoại.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const BOT_PHONE = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BOT_DESKTOP = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/130.0.0.0 Safari/537.36';
const CONCURRENCY = 6;
const PER_TYPE = 2; // số trang mỗi loại mở bằng trình duyệt
const PERF_PAGES = 6; // số trang đo LCP / CLS (chậm: mạng giả lập)

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

async function pool<T>(items: T[], fn: (x: T) => Promise<void>, n = CONCURRENCY) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
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
  return { pages: out, robots };
}

// ───────────────────────────── Phần 1: HTTP ─────────────────────────────

type Snap = {
  status: number; location: string | null; headers: Headers; html: string;
  title: string; description: string; robots: string; canonical: string; h1: string[];
  jsonld: string[]; links: Set<string>; images: Set<string>; textLen: number; viewport: string | null; streamedMeta: boolean;
};

const textOf = (s: string) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

async function snap(url: string, ua: string): Promise<Snap> {
  const r = await fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': ua, 'Accept-Language': 'vi-VN,vi;q=0.9' } });
  const html = r.status === 200 ? await r.text() : '';
  const end = html.indexOf('</head>');
  const head = end > 0 ? html.slice(0, end) : html;
  const body = end > 0 ? html.slice(end) : '';
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const meta = (n: string) => metas.filter((t) => attr(t, 'name') === n).map((t) => attr(t, 'content') ?? '').join(' | ');
  const canon = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => /\brel=["']canonical["']/i.test(t));
  const links = new Set<string>();
  for (const m of body.matchAll(/<a\b[^>]*>/gi)) {
    const h = attr(m[0], 'href');
    if (!h) continue;
    try {
      const u = new URL(h, siteOrigin || BASE);
      if (u.origin === siteOrigin || u.origin === BASE) links.add(u.pathname + u.search);
    } catch { /* href lạ: seo:html báo */ }
  }
  const images = new Set([...body.matchAll(/<img\b[^>]*>/gi)].map((m) => attr(m[0], 'src') ?? '').filter(Boolean));
  const visible = (body.split(/<body\b/i)[1] ?? body).replace(/<(script|style|svg|template|noscript)\b[\s\S]*?<\/\1>/gi, ' ');
  return {
    status: r.status, location: r.headers.get('location'), headers: r.headers, html,
    title: textOf(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] ?? ''),
    description: meta('description'), robots: meta('robots'),
    canonical: canon ? attr(canon, 'href') ?? '' : '',
    h1: [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => textOf(m[1])),
    jsonld: [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()),
    links, images, textLen: textOf(visible).length,
    viewport: metas.map((t) => (attr(t, 'name') === 'viewport' ? attr(t, 'content') : null)).find((v) => v !== null) ?? null,
    // Next "stream" metadata: <title> / canonical nằm sau </head> (máy đọc chỉ HTML coi như trang không có tiêu đề).
    // (Bỏ <title> nằm trong hình SVG — đó là tên hình, không phải tiêu đề trang.)
    streamedMeta: (!/<title[\s>]/i.test(head) && /<title[\s>]/i.test(body.replace(/<svg\b[\s\S]*?<\/svg>/gi, '')))
      || (!canon && /<link\b[^>]*rel=["']canonical["']/i.test(body)),
  };
}

function checkViewport(v: string | null, loc: string) {
  if (v === null) { err('Thiếu thẻ <meta name="viewport"> — điện thoại sẽ hiện bản máy tính thu nhỏ', loc); return; }
  const kv = Object.fromEntries(v.split(',').map((p) => p.split('=').map((x) => x.trim().toLowerCase())).filter((p) => p.length === 2));
  if (kv['width'] !== 'device-width') err(`viewport width="${kv['width'] ?? ''}" — phải là device-width`, loc);
  if (kv['initial-scale'] && Number(kv['initial-scale']) !== 1) warn(`viewport initial-scale=${kv['initial-scale']} (nên là 1)`, loc);
  if (kv['user-scalable'] === 'no' || kv['user-scalable'] === '0') err('viewport chặn phóng to (user-scalable=no) — người lớn tuổi không phóng chữ được', loc);
  if (kv['maximum-scale'] && Number(kv['maximum-scale']) < 2) err(`viewport maximum-scale=${kv['maximum-scale']} — chặn phóng to`, loc);
}

const diff = (a: Set<string>, b: Set<string>) => [...a].filter((x) => !b.has(x));

async function checkParity(loc: string, phoneSnaps: Map<string, Snap>) {
  const [p, d] = await Promise.all([snap(loc, BOT_PHONE), snap(loc, BOT_DESKTOP)]);
  phoneSnaps.set(loc, p);
  if (p.status !== d.status || p.location !== d.location) {
    err(`Googlebot điện thoại nhận mã ${p.status}${p.location ? ` → ${p.location}` : ''}, máy tính nhận ${d.status}${d.location ? ` → ${d.location}` : ''}`, loc);
    return;
  }
  if (p.status !== 200) { err(`Mã ${p.status} với Googlebot Smartphone`, loc); return; }
  for (const [label, x] of [['điện thoại', p], ['máy tính', d]] as const) {
    if (x.streamedMeta) err(`Googlebot ${label}: <title> / canonical nằm ngoài <head> (metadata bị stream — kiểm htmlLimitedBots trong next.config.ts)`, loc);
  }
  checkViewport(p.viewport, loc);
  const xr = p.headers.get('x-robots-tag');
  if (xr && /noindex|none/i.test(xr)) err(`X-Robots-Tag: ${xr} với Googlebot Smartphone`, loc);
  if (/\bnoindex\b/i.test(p.robots)) err('Trang trong sitemap mà bản điện thoại có noindex', loc);
  if (p.headers.get('vary')?.toLowerCase().includes('user-agent')) warn('Header Vary: User-Agent — web có trả HTML khác theo máy không?', loc);

  const same: [string, string, string][] = [
    ['<title>', p.title, d.title], ['description', p.description, d.description], ['meta robots', p.robots, d.robots],
    ['canonical', p.canonical, d.canonical], ['h1', p.h1.join(' / '), d.h1.join(' / ')], ['JSON-LD', p.jsonld.join('\n'), d.jsonld.join('\n')],
  ];
  for (const [what, a, b] of same) if (a !== b) err(`${what} của bản điện thoại khác bản máy tính ("${a.slice(0, 60)}" ≠ "${b.slice(0, 60)}")`, loc);
  const lostLinks = diff(d.links, p.links);
  if (lostLinks.length) err(`Bản điện thoại thiếu ${lostLinks.length} link nội bộ có ở máy tính (vd. ${lostLinks.slice(0, 3).join(', ')})`, loc);
  const lostImgs = diff(d.images, p.images);
  if (lostImgs.length) err(`Bản điện thoại thiếu ${lostImgs.length} ảnh có ở máy tính`, loc);
  // Chữ dao động nhẹ được (giờ, số ngẫu nhiên); thiếu hẳn > 10% là nội dung rút gọn.
  if (p.textLen < d.textLen * 0.9) err(`Bản điện thoại ít chữ hơn máy tính (${p.textLen} / ${d.textLen} ký tự)`, loc);
}

/** robots.txt: nhóm áp dụng cho Googlebot Smartphone (Googlebot → * ) không được chặn trang / CSS / JS / ảnh công khai. */
function checkRobots(robots: string) {
  const groups: { agents: string[]; rules: [string, string][] }[] = [];
  let cur: (typeof groups)[number] | null = null;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const [k, v] = [m[1].toLowerCase(), m[2].trim()];
    if (k === 'user-agent') {
      if (!cur || cur.rules.length) groups.push((cur = { agents: [], rules: [] }));
      cur.agents.push(v.toLowerCase());
    } else if ((k === 'allow' || k === 'disallow') && cur) cur.rules.push([k, v]);
  }
  const group = groups.find((g) => g.agents.includes('googlebot-smartphone')) ?? groups.find((g) => g.agents.includes('googlebot')) ?? groups.find((g) => g.agents.includes('*'));
  if (!group) return;
  if (groups.some((g) => g.agents.includes('googlebot-smartphone'))) warn('robots.txt có nhóm riêng cho Googlebot-Smartphone — Google không dùng tên này; xóa đi để khỏi nhầm', '/robots.txt');
  const blocked = (path: string) => {
    let best: [string, string] | null = null;
    for (const r of group.rules) {
      if (!r[1]) continue;
      const re = new RegExp('^' + r[1].replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
      if (re.test(path) && (!best || r[1].length > best[1].length || (r[1].length === best[1].length && r[0] === 'allow'))) best = r;
    }
    return best?.[0] === 'disallow';
  };
  for (const path of ['/', '/_next/static/chunks/main.js', '/_next/static/css/app.css', '/images/og/cay-canh-mien-tay.jpg', '/api/product-images/x.jpg', '/icons/icon-192.png']) {
    if (blocked(path)) err(`robots.txt chặn Googlebot Smartphone tải ${path} — Google cần để dựng trang điện thoại`, '/robots.txt');
  }
}

/** CSS / JS mà trang dùng phải tải được bằng UA Googlebot Smartphone (không chặn, không lỗi). */
async function checkAssets(sample: Snap[]) {
  const assets = new Set<string>();
  for (const s of sample) {
    for (const m of s.html.matchAll(/<(?:link|script)\b[^>]*>/gi)) {
      const u = attr(m[0], 'href') ?? attr(m[0], 'src');
      if (u && /\/_next\/static\/.+\.(css|js)(\?|$)/.test(u)) assets.add(new URL(u, BASE).pathname);
    }
  }
  await pool([...assets], async (path) => {
    const r = await fetch(BASE + path, { headers: { 'User-Agent': BOT_PHONE } });
    if (r.status !== 200) err(`CSS / JS trả mã ${r.status} cho Googlebot Smartphone: ${path}`, path);
    await r.body?.cancel();
  });
  return assets.size;
}

/** Menu điện thoại (bảng danh mục mở bằng ☰) phải nằm trong HTML với link thật — không dựng bằng script khi bấm. */
function checkMobileMenu(home: Snap | undefined) {
  if (!home) return;
  const aside = /<aside\b[^>]*class="[^"]*app-side[^"]*"[^>]*>([\s\S]*?)<\/aside>/i.exec(home.html)?.[1];
  if (!aside) { err('Không thấy bảng danh mục (menu điện thoại .app-side) trong HTML trang chủ', '/'); return; }
  const hrefs = [...aside.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], 'href') ?? '');
  const cats = hrefs.filter((h) => /^\/danh-muc\/[a-z0-9-]+$/.test(h));
  if (!cats.length) err('Menu điện thoại không có link <a href> tới danh mục nào', '/');
  if (hrefs.some((h) => !h || h === '#' || h.startsWith('javascript:'))) err('Menu điện thoại có link không có đích thật (href rỗng / # / javascript:)', '/');
  return { links: hrefs.length, cats: cats.length };
}

// ───────────────────────────── Phần 2: trình duyệt (Chrome DevTools Protocol) ─────────────────────────────

const CHROMES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean) as string[];

class Browser {
  private ws!: WebSocket;
  private id = 0;
  private pending = new Map<number, { ok: (v: any) => void; no: (e: Error) => void }>();
  private listeners: ((m: any) => void)[] = [];
  private constructor(private proc: ChildProcess, private dir: string) {}

  static async launch(): Promise<Browser | null> {
    const bin = CHROMES.find((p) => existsSync(p));
    if (!bin) return null;
    const dir = mkdtempSync(join(tmpdir(), 'seo-mobile-'));
    const proc = spawn(bin, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    const wsUrl = await new Promise<string>((ok, no) => {
      let buf = '';
      const t = setTimeout(() => no(new Error('Chrome không mở được cổng gỡ lỗi')), 20000);
      proc.stderr!.on('data', (c) => {
        buf += c;
        const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
        if (m) { clearTimeout(t); ok(m[1]); }
      });
      proc.on('exit', () => no(new Error('Chrome thoát sớm')));
    });
    const b = new Browser(proc, dir);
    b.ws = new WebSocket(wsUrl);
    await new Promise((ok, no) => { b.ws.onopen = ok; b.ws.onerror = () => no(new Error('Không nối được Chrome')); });
    b.ws.onmessage = (e) => {
      const m = JSON.parse(String(e.data));
      if (m.id && b.pending.has(m.id)) {
        const p = b.pending.get(m.id)!;
        b.pending.delete(m.id);
        if (m.error) p.no(new Error(m.error.message)); else p.ok(m.result);
      } else b.listeners.forEach((f) => f(m));
    };
    return b;
  }

  send(method: string, params: object = {}, sessionId?: string): Promise<any> {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((ok, no) => this.pending.set(id, { ok, no }));
  }

  /** Một tab mới, giả lập điện thoại (hoặc máy tính) + UA Googlebot. */
  async tab(opts: { width: number; height: number; mobile: boolean; js?: boolean; slow?: boolean }) {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m: string, p: object = {}) => this.send(m, p, sessionId);
    await s('Page.enable');
    await s('Network.enable');
    await s('Network.setUserAgentOverride', { userAgent: opts.mobile ? BOT_PHONE : BOT_DESKTOP, acceptLanguage: 'vi-VN,vi' });
    await s('Emulation.setDeviceMetricsOverride', { width: opts.width, height: opts.height, deviceScaleFactor: opts.mobile ? 3 : 1, mobile: opts.mobile, screenWidth: opts.width, screenHeight: opts.height });
    if (opts.mobile) await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    if (opts.js === false) await s('Emulation.setScriptExecutionDisabled', { value: true });
    if (opts.slow) {
      // "Slow 4G" của Lighthouse: RTT 150ms, tải xuống 1,6 Mb/s; CPU chậm 4 lần (điện thoại tầm trung).
      await s('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
      await s('Emulation.setCPUThrottlingRate', { rate: 4 });
      await s('Page.addScriptToEvaluateOnNewDocument', { source: PERF_PROBE });
    }
    const errorsSeen: string[] = [];
    const onMsg = (m: any) => {
      if (m.sessionId !== sessionId) return;
      if (m.method === 'Runtime.exceptionThrown') errorsSeen.push(m.params.exceptionDetails?.exception?.description?.split('\n')[0] ?? 'lỗi script');
    };
    this.listeners.push(onMsg);
    await s('Runtime.enable');
    const loaded = () => new Promise<void>((ok) => {
      const f = (m: any) => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') { this.listeners = this.listeners.filter((x) => x !== f); ok(); } };
      this.listeners.push(f);
    });
    return {
      errors: errorsSeen,
      async goto(url: string, timeout = 45000) {
        const done = loaded();
        await s('Page.navigate', { url });
        await Promise.race([done, new Promise((r) => setTimeout(r, timeout))]);
      },
      async eval<T>(expr: string): Promise<T> {
        const r = await s('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'lỗi khi đo trang');
        return r.result.value as T;
      },
      close: () => this.send('Target.closeTarget', { targetId }),
    };
  }

  async close() {
    try { await this.send('Browser.close'); } catch { /* đã đóng */ }
    this.proc.kill();
    try { rmSync(this.dir, { recursive: true, force: true }); } catch { /* Chrome còn giữ file */ }
  }
}

/** Ghi LCP + CLS từ lúc trang bắt đầu tải (chạy trước mọi script của trang). */
const PERF_PROBE = `(() => {
  window.__seo = { lcp: 0, cls: 0, lcpEl: '' };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__seo.lcp = e.startTime; window.__seo.lcpEl = e.element ? (e.element.tagName + (e.element.className ? '.' + String(e.element.className).split(' ')[0] : '')) : (e.url || ''); } }).observe({ type: 'largest-contentful-paint', buffered: true });
    let s = 0, first = 0, last = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; if (s && (e.startTime - last > 1000 || e.startTime - first > 5000)) { window.__seo.cls = Math.max(window.__seo.cls, s); s = 0; } if (!s) first = e.startTime; s += e.value; last = e.startTime; window.__seo.cls = Math.max(window.__seo.cls, s); } }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
})()`;

/** Đo bố cục ở một cỡ màn — chạy trong trang. */
const LAYOUT_PROBE = `(() => {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  // Nằm trong khối thu gọn (menu bài viết, chân trang, <details>) = khách bấm là thấy, không tính là bị giấu.
  const folded = (el) => !!el.closest('details:not([open]), [data-open]:not([data-open="true"]):not([data-open=""]), .vx-pnav, .vx-fcol');
  const shown = (el) => { if (!el.isConnected) return false; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0' || e.hidden) return false; if (s.clipPath === 'inset(50%)' || (s.position === 'absolute' && s.clip === 'rect(0px, 0px, 0px, 0px)')) return false; } return true; };
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const main = document.querySelector('main');
  const out = { vw, scrollW: document.documentElement.scrollWidth, wide: [], h1Shown: false, headings: [], links: [], text: 0, small: 0, total: 0, smallEx: [], tiny: [], media: [], cover: [] };
  // Tràn ngang: phần tử nhô ra ngoài mép phải màn hình mà không nằm trong khung cuộn ngang / khung cắt.
  const clipped = (el) => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && e.getBoundingClientRect().right <= vw + 1) return true; } return false; };
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.position === 'fixed' || !shown(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) { out.wide.push(name(el) + ' (' + Math.round(r.left) + '→' + Math.round(r.right) + 'px)'); if (out.wide.length > 5) break; }
  }
  // Ảnh / video / iframe / bảng rộng hơn khung chứa (bị cắt mất phần nội dung).
  for (const el of document.querySelectorAll('main img, main video, main iframe, main table')) {
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1 && !clipped(el)) out.media.push(name(el) + ' rộng ' + Math.round(r.width) + 'px');
    if (el.tagName === 'TABLE' && r.right > vw + 1) { let ok = false; for (let e = el.parentElement; e; e = e.parentElement) { if (/(auto|scroll)/.test(getComputedStyle(e).overflowX)) { ok = true; break; } } if (!ok) out.media.push('bảng ' + name(el) + ' tràn màn hình, không có khung cuộn ngang'); }
  }
  const h1 = document.querySelectorAll('h1');
  out.h1Shown = [...h1].some(shown) || [...h1].some((e) => e.classList.contains('app-sr'));
  if (main) {
    for (const h of main.querySelectorAll('h1,h2,h3')) out.headings.push({ t: h.textContent.trim().slice(0, 60), shown: shown(h) || folded(h) });
    for (const a of main.querySelectorAll('a[href^="/"]')) out.links.push({ h: a.getAttribute('href'), shown: shown(a) || folded(a) });
    // Chữ hiện + cỡ chữ (tính theo số ký tự của từng đoạn chữ).
    const w = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      const t = n.textContent.replace(/\\s+/g, '');
      if (!t || !n.parentElement || !shown(n.parentElement)) continue;
      const fs = parseFloat(getComputedStyle(n.parentElement).fontSize);
      out.total += t.length;
      if (fs < 12) { out.small += t.length; if (out.smallEx.length < 3 && t.length > 3) out.smallEx.push(name(n.parentElement) + ' ' + fs + 'px "' + t.slice(0, 20) + '"'); }
    }
    out.text = out.total;
  }
  // Vùng bấm: link / nút đang hiện nhỏ hơn 24×24px (trừ link nằm trong câu chữ).
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]')) {
    if (!shown(el) || el.closest('.leaflet-control-attribution')) continue;
    // Ô nhập nằm trong khung viền riêng: vùng chạm là cả khung.
    const box = /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.parentElement && el.parentElement.querySelectorAll('input:not([type=hidden]),select,textarea').length === 1 ? el.parentElement : el;
    const r = box.getBoundingClientRect();
    if (r.width >= 24 && r.height >= 24) continue;
    // Link nằm trong câu chữ (WCAG miễn): link dạng inline mà khối cha còn chữ khác ngoài link.
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && (el.parentElement?.textContent.trim().length ?? 0) > el.textContent.trim().length + 3) continue;
    out.tiny.push(name(el) + ' ' + Math.round(r.width) + '×' + Math.round(r.height) + (el.textContent.trim() ? ' "' + el.textContent.trim().slice(0, 18) + '"' : ''));
  }
  // Hộp nổi che màn hình ngay khi vào trang (fixed / sticky, trừ đầu trang và thanh dưới đáy mỏng).
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.position !== 'fixed' || !shown(el)) continue;
    const r = el.getBoundingClientRect();
    const area = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    if (area / (vw * vh) > 0.3) out.cover.push({ el: name(el), pct: Math.round((area / (vw * vh)) * 100), dialog: el.getAttribute('role') === 'dialog' || el.tagName === 'DIALOG' });
  }
  return out;
})()`;

type Layout = {
  vw: number; scrollW: number; wide: string[]; h1Shown: boolean; headings: { t: string; shown: boolean }[];
  links: { h: string; shown: boolean }[]; text: number; small: number; total: number; smallEx: string[];
  tiny: string[]; media: string[]; cover: { el: string; pct: number; dialog: boolean }[];
};

const settle = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

async function browserChecks(b: Browser, pages: string[], perfPages: string[]) {
  // Bố cục ở hai cỡ điện thoại + so với máy tính.
  await pool(pages, async (loc) => {
    const url = local(loc);
    const desk = await b.tab({ width: 1366, height: 900, mobile: false });
    const phone = await b.tab({ width: 390, height: 844, mobile: true });
    const small = await b.tab({ width: 360, height: 740, mobile: true });
    try {
      await Promise.all([desk.goto(url), phone.goto(url), small.goto(url)]);
      await settle();
      const [d, p, s] = await Promise.all([desk.eval<Layout>(LAYOUT_PROBE), phone.eval<Layout>(LAYOUT_PROBE), small.eval<Layout>(LAYOUT_PROBE)]);
      for (const [l, w] of [[p, 390], [s, 360]] as const) {
        if (l.scrollW > l.vw + 1) err(`Tràn ngang ở ${w}px: trang rộng ${l.scrollW}px`, loc);
        if (l.wide.length) err(`Phần tử nhô ra ngoài màn hình ${w}px: ${l.wide.slice(0, 3).join('; ')}`, loc);
        if (l.media.length) err(`Ảnh / video / bảng rộng hơn màn hình ${w}px: ${l.media.slice(0, 3).join('; ')}`, loc);
      }
      if (!p.h1Shown) err('h1 không hiện trên điện thoại 390px', loc);
      const deskShown = new Set(d.headings.filter((h) => h.shown).map((h) => h.t));
      const hidden = p.headings.filter((h) => !h.shown && deskShown.has(h.t));
      if (hidden.length) warn(`Heading hiện trên máy tính mà ẩn trên điện thoại: ${hidden.slice(0, 3).map((h) => `"${h.t}"`).join(', ')}`, loc);
      const deskLinks = new Set(d.links.filter((x) => x.shown).map((x) => x.h));
      const phoneLinks = new Set(p.links.filter((x) => x.shown).map((x) => x.h));
      const lost = [...deskLinks].filter((h) => !phoneLinks.has(h));
      if (lost.length) warn(`${lost.length} link nội bộ trong <main> hiện trên máy tính mà ẩn trên điện thoại (vd. ${lost.slice(0, 3).join(', ')})`, loc);
      if (d.text > 400 && p.text < d.text * 0.8) warn(`Chữ hiện trên điện thoại chỉ bằng ${Math.round((p.text / d.text) * 100)}% máy tính (CSS giấu bớt nội dung)`, loc);
      if (p.total && p.small / p.total > 0.4) err(`${Math.round((p.small / p.total) * 100)}% chữ trên điện thoại nhỏ hơn 12px (vd. ${p.smallEx.join('; ')})`, loc);
      else if (p.total && p.small / p.total > 0.1) warn(`${Math.round((p.small / p.total) * 100)}% chữ trên điện thoại nhỏ hơn 12px (vd. ${p.smallEx.join('; ')})`, loc);
      if (p.tiny.length) warn(`${p.tiny.length} nút / link nhỏ hơn 24×24px trên điện thoại (vd. ${p.tiny.slice(0, 3).join('; ')})`, loc);
      for (const c of p.cover) {
        if (c.pct > 50) err(`Hộp nổi ${c.el} che ${c.pct}% màn hình điện thoại ngay khi vào trang`, loc);
        else warn(`Hộp nổi ${c.el} che ${c.pct}% màn hình điện thoại ngay khi vào trang${c.dialog ? '' : ' (nên ≤ 30%)'}`, loc);
      }
      if (phone.errors.length) err(`Lỗi script trên điện thoại: ${phone.errors[0]}`, loc);
    } catch (e) {
      err(`Không đo được bằng trình duyệt: ${(e as Error).message}`, loc);
    } finally {
      await Promise.all([desk.close(), phone.close(), small.close()]);
    }
  }, 3);

  // Tắt JavaScript: nội dung chính vẫn phải đọc được (trang dựng ở máy chủ).
  await pool(pages, async (loc) => {
    const t = await b.tab({ width: 390, height: 844, mobile: true, js: false });
    try {
      await t.goto(local(loc));
      const r = await t.eval<{ h1: boolean; text: number }>(`(() => { const shown = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }; const m = document.querySelector('main'); return { h1: [...document.querySelectorAll('h1')].some((h) => shown(h) || h.classList.contains('app-sr')), text: m ? m.innerText.replace(/\\s+/g, '').length : 0 }; })()`);
      if (!r.h1) err('Tắt JavaScript (mạng chậm, script chưa tải xong): h1 không hiện', loc);
      if (r.text < 100) err(`Tắt JavaScript: <main> gần như trống (${r.text} ký tự) — nội dung phụ thuộc script`, loc);
    } catch (e) {
      err(`Không mở được khi tắt JavaScript: ${(e as Error).message}`, loc);
    } finally { await t.close(); }
  }, 3);

  // LCP + CLS trên điện thoại mạng 4G chậm (lần lượt, để số đo không ảnh hưởng nhau).
  const perf: string[] = [];
  for (const loc of perfPages) {
    const t = await b.tab({ width: 390, height: 844, mobile: true, slow: true });
    try {
      await t.goto(local(loc), 90000);
      await settle(3000);
      // Cuộn xuống rồi lên để bắt cả lệch bố cục khi ảnh lười tải hiện ra.
      await t.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 800)); })()`);
      const m = await t.eval<{ lcp: number; cls: number; lcpEl: string; loading: boolean }>(`({ ...window.__seo, loading: /Đang tải/.test(document.querySelector('main')?.innerText ?? '') })`);
      perf.push(`  ${(m.lcp / 1000).toFixed(1).padStart(5)}s LCP · CLS ${m.cls.toFixed(3)} · ${new URL(loc).pathname} (LCP: ${m.lcpEl || '?'})`);
      if (m.lcp > 4000) warn(`LCP ${(m.lcp / 1000).toFixed(1)}s trên điện thoại mạng 4G chậm (tốt ≤ 2,5s, kém > 4s) — phần tử: ${m.lcpEl}`, loc);
      if (m.cls > 0.25) err(`CLS ${m.cls.toFixed(3)} trên điện thoại (kém > 0,25) — bố cục nhảy khi tải`, loc);
      else if (m.cls > 0.1) warn(`CLS ${m.cls.toFixed(3)} trên điện thoại (tốt ≤ 0,1)`, loc);
      if (m.loading) warn('Sau khi tải xong (mạng chậm) <main> vẫn còn chữ "Đang tải" — khối tải dữ liệu bị kẹt?', loc);
    } catch (e) {
      warn(`Không đo được LCP / CLS: ${(e as Error).message}`, loc);
    } finally { await t.close(); }
  }
  return perf;
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

/** Mỗi loại trang (đoạn đầu đường dẫn) vài trang + trang chủ. */
function sampleByType(pages: string[], n: number) {
  const byType = new Map<string, string[]>();
  for (const u of pages) {
    const path = new URL(u).pathname;
    const parts = path.split('/');
    const key = path === '/' ? '/' : `/${parts[1]}${parts.length > 2 ? '/*' : ''}`;
    byType.set(key, [...(byType.get(key) ?? []), u]);
  }
  return [...byType.values()].flatMap((l) => l.slice(0, n));
}

async function main() {
  console.log(`Kiểm tra Mobile SEO trên ${BASE}\n`);
  const { pages, robots } = await sitemapPages();
  console.log(`${pages.length} trang trong sitemap.`);

  checkRobots(robots);
  const phoneSnaps = new Map<string, Snap>();
  await pool(pages, (loc) => checkParity(loc, phoneSnaps));
  console.log(`Phần 1: đã so ${pages.length} trang giữa Googlebot Smartphone và Googlebot máy tính.`);
  const sample = sampleByType(pages, 1).map((u) => phoneSnaps.get(u)).filter((s): s is Snap => !!s && s.status === 200);
  console.log(`  ${await checkAssets(sample)} file CSS / JS tải được bằng UA Googlebot Smartphone.`);
  const home = pages.find((u) => new URL(u).pathname === '/');
  const menu = checkMobileMenu(home ? phoneSnaps.get(home) : undefined);
  if (menu) console.log(`  Menu điện thoại: ${menu.links} link trong HTML, ${menu.cats} link danh mục.`);

  if (process.env.NO_BROWSER) console.log('\nBỏ qua phần trình duyệt (NO_BROWSER=1).');
  else {
    const b = await Browser.launch().catch((e) => { warn(`Không mở được Chrome: ${(e as Error).message}`, '-'); return null; });
    if (!b) {
      if (!warnings.size) warn('Không tìm thấy Chrome — đặt CHROME_PATH để chạy phần trình duyệt', '-');
    } else {
      const list = process.env.MOBILE_ALL ? pages : sampleByType(pages, PER_TYPE);
      const perfList = sampleByType(pages, 1).slice(0, PERF_PAGES);
      console.log(`Phần 2: mở ${list.length} trang bằng Chrome (390 + 360px, so với 1366px), tắt JavaScript; đo LCP / CLS ${perfList.length} trang (4G chậm, CPU ×4)…`);
      try {
        const perf = await browserChecks(b, list, perfList);
        console.log('\nSố đo điện thoại (phòng thí nghiệm, máy này — chỉ để so sánh giữa các lần chạy):');
        perf.forEach((l) => console.log(l));
      } finally { await b.close(); }
    }
  }

  print(warnings, `Cảnh báo (${[...warnings.values()].reduce((n, l) => n + l.length, 0)})`);
  print(errors, `LỖI (${[...errors.values()].reduce((n, l) => n + l.length, 0)})`);
  if (errors.size) process.exit(1);
  console.log('\nĐạt.');
}

main().catch((e) => { console.error(e); process.exit(1); });
