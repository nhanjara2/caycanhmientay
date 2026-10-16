/**
 * Đo tốc độ + Core Web Vitals trong "phòng thí nghiệm" (mục 10 checklist SEO): `npm run seo:perf` (máy dev, nên chạy với
 * `next build && next start` — `next dev` chậm hơn nhiều, số đo không có nghĩa) hoặc
 * `npm run seo:perf -- https://www.caycanhmientay.com` (web thật, chạy sau mỗi lần deploy cùng các lệnh seo:* khác).
 *
 * Mỗi LOẠI trang một trang (trang chủ, tất cả sản phẩm, danh mục, sản phẩm, bệnh cây, bài viết, đối tác, cửa hàng, khuyến mãi,
 * video — lấy từ sitemap; PERF_ALL=1: mọi trang trong sitemap), mở bằng Chrome thật, không cache, hai lần:
 *  - Điện thoại: 412×915, "Slow 4G" (RTT 150ms, 1,6 Mb/s) + CPU chậm 4 lần — giống PageSpeed Insights bản di động;
 *  - Máy tính: 1366×768, mạng + CPU thật.
 * Ghi lại: TTFB, FCP, LCP (+ phần tử LCP), CLS, TBT (tổng thời gian luồng chính bị chặn — Lighthouse dùng thay INP),
 * "INP thử" (bấm nút menu / bộ lọc một lần, đo thời gian tới khung hình kế), số request, dung lượng tải (JS / CSS / ảnh / font).
 *
 * LỖI (thoát mã 1): phần tử LCP là ảnh lazy-load; CLS > 0,25; trang bị chuyển hướng trước khi tải; file chữ (HTML, JS, CSS,
 *   SVG, JSON) > 1KB không nén br / gzip; /_next/static không cache dài hạn; file tĩnh /images, /icons, /videos hoặc ảnh
 *   /api/*-images "max-age=0" / no-store; request trả 4xx / 5xx khi tải trang.
 * CẢNH BÁO (số phòng thí nghiệm dao động — chỉ để so trước / sau): LCP > 2,5 giây, CLS > 0,1, TBT > 200ms (điện thoại 600ms),
 *   INP thử > 200ms, TTFB > 800ms, ảnh LCP không có fetchpriority="high" hoặc > 250KB, ảnh LCP không có srcset (điện thoại
 *   tải ảnh cỡ máy tính), JS > 500KB (đã nén), cả trang > 2,5MB, script từ tên miền khác, font chưa tải trước (preload).
 *
 * Số đo THẬT của khách (máy + mạng thật, phân vị 75 — cái Google dùng xếp hạng) xem ở: Vercel → dự án → Speed Insights
 * (components/WebVitals.tsx gửi số liệu), Google Search Console → Chỉ số thiết yếu về trang web, và https://pagespeed.web.dev.
 * Chrome: tự tìm ở đường dẫn quen thuộc, hoặc đặt CHROME_PATH. Kiểm máy khác tên miền chính thì URL được đổi sang máy đó.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const HOST = new URL(BASE).host;
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

/** Mẫu trang lấy từ sitemap: tên + đường dẫn khớp (lấy trang đầu tiên khớp). */
const TEMPLATES: [string, RegExp][] = [
  ['Trang chủ', /^\/$/],
  ['Tất cả sản phẩm', /^\/danh-muc$/],
  ['Danh mục', /^\/danh-muc\/[^/]+$/],
  ['Nhóm con', /^\/danh-muc\/[^/]+\/[^/]+$/],
  ['Sản phẩm', /^\/san-pham\/[^/]+$/],
  ['Thư viện bệnh', /^\/benh-cay$/],
  ['Bài bệnh cây', /^\/benh-cay\/[^/]+$/],
  ['Góc chăm cây', /^\/goc-cham-cay$/],
  ['Bài viết', /^\/(goc-cham-cay|tin-tuc)\/[^/]+$/],
  ['Đối tác sỉ', /^\/doi-tac$/],
  ['Cửa hàng', /^\/he-thong-cua-hang$/],
  ['Khuyến mãi', /^\/khuyen-mai$/],
  ['Video', /^\/video$/],
  ['Chính sách', /^\/chinh-sach\/[^/]+$/],
];

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

async function sitemapPages(): Promise<string[]> {
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  siteOrigin = new URL(index).origin;
  const locs = async (u: string) => [...(await (await fetch(local(u))).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const out: string[] = [];
  for (const child of await locs(index)) out.push(...await locs(child));
  return out.map(local);
}

// ───────────────────────────── Chrome DevTools Protocol ─────────────────────────────

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
  listeners: ((m: any) => void)[] = [];
  private constructor(private proc: ChildProcess, private dir: string) {}

  static async launch(): Promise<Browser> {
    const bin = CHROMES.find((p) => existsSync(p));
    if (!bin) throw new Error('Không tìm thấy Chrome — đặt CHROME_PATH');
    const dir = mkdtempSync(join(tmpdir(), 'seo-perf-'));
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

  close() {
    try { this.ws.close(); } catch {}
    this.proc.kill();
    setTimeout(() => { try { rmSync(this.dir, { recursive: true, force: true }); } catch {} }, 500);
  }
}

/** Gắn vào trang trước mọi script: theo dõi LCP, CLS (cửa sổ phiên như Chrome), long task, thời gian tương tác. */
const PROBE = `(() => {
  const r = window.__perf = { lcp: 0, lcpEl: null, cls: 0, tbt: 0, inp: 0, fcp: 0 };
  const describe = (el) => {
    if (!el) return null;
    const img = el.tagName === 'IMG' ? el : null;
    const cls = String(el.className || '').split(' ').filter(Boolean)[0];
    return { tag: el.tagName.toLowerCase() + (cls ? '.' + cls : ''), src: img ? (img.currentSrc || img.src) : '',
      loading: img ? (img.getAttribute('loading') || '') : '', priority: img ? (img.getAttribute('fetchpriority') || '') : '',
      srcset: img ? !!(img.getAttribute('srcset') || (img.parentElement && img.parentElement.tagName === 'PICTURE' && img.parentElement.querySelector('source[srcset*=","]'))) : false,
      text: img ? '' : (el.textContent || '').trim().slice(0, 50) };
  };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { r.lcp = e.startTime; r.lcpEl = describe(e.element) || { tag: '', src: e.url || '' }; } }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
  let s = 0, first = 0, last = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; if (s && (e.startTime - last > 1000 || e.startTime - first > 5000)) s = 0; if (!s) first = e.startTime; s += e.value; last = e.startTime; r.cls = Math.max(r.cls, s); } }).observe({ type: 'layout-shift', buffered: true }); } catch {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') r.fcp = e.startTime; }).observe({ type: 'paint', buffered: true }); } catch {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!r.fcp || e.startTime >= r.fcp) r.tbt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true }); } catch {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) r.inp = Math.max(r.inp, e.duration); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch {}
})();`;

/** Nút để thử tương tác (bấm một lần): menu danh mục điện thoại, bộ lọc, nút xổ thanh danh mục máy tính. */
const TAP_TARGETS = ['.app-menubtn', '.app-fbar__all', '.app-catnav [aria-expanded]', '.vx-pnav button', 'header button'];

type Req = { url: string; type: string; status: number; headers: Record<string, string>; bytes: number; mime: string };
type Run = {
  ttfb: number; fcp: number; lcp: number; cls: number; tbt: number; inp: number | null;
  lcpEl: { tag: string; src: string; loading?: string; priority?: string; srcset?: boolean; text?: string } | null;
  reqs: Req[]; redirected: boolean; docStatus: number; preloadFonts: number; fonts: number;
};

async function measure(b: Browser, url: string, mobile: boolean): Promise<Run> {
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await b.send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m: string, p: object = {}) => b.send(m, p, sessionId);
  const reqs = new Map<string, Req>();
  let redirected = false;
  let docId = '';
  let docStatus = 0;
  const onMsg = (m: any) => {
    if (m.sessionId !== sessionId) return;
    const p = m.params;
    if (m.method === 'Network.requestWillBeSent') {
      if (p.type === 'Document' && !docId) docId = p.requestId;
      if (p.requestId === docId && p.redirectResponse) redirected = true;
      reqs.set(p.requestId, { url: p.request.url, type: p.type ?? '', status: 0, headers: {}, bytes: 0, mime: '' });
    } else if (m.method === 'Network.responseReceived') {
      const r = reqs.get(p.requestId);
      if (r) {
        r.status = p.response.status; r.mime = p.response.mimeType ?? '';
        r.headers = Object.fromEntries(Object.entries(p.response.headers ?? {}).map(([k, v]) => [k.toLowerCase(), String(v)]));
        if (p.requestId === docId) docStatus = p.response.status;
      }
    } else if (m.method === 'Network.loadingFinished') {
      const r = reqs.get(p.requestId);
      if (r) r.bytes = p.encodedDataLength ?? 0;
    }
  };
  b.listeners.push(onMsg);
  try {
    await s('Page.enable');
    await s('Network.enable');
    await s('Runtime.enable');
    await s('Network.setCacheDisabled', { cacheDisabled: true });
    await s('Network.setUserAgentOverride', { userAgent: mobile ? MOBILE_UA : DESKTOP_UA, acceptLanguage: 'vi-VN,vi' });
    await s('Emulation.setDeviceMetricsOverride', mobile
      ? { width: 412, height: 915, deviceScaleFactor: 2.625, mobile: true }
      : { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
    if (mobile) {
      await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await s('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
      await s('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    await s('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
    const loaded = new Promise<void>((ok) => {
      const f = (m: any) => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') { b.listeners = b.listeners.filter((x) => x !== f); ok(); } };
      b.listeners.push(f);
    });
    await s('Page.navigate', { url });
    await Promise.race([loaded, new Promise((r) => setTimeout(r, 60000))]);
    await new Promise((r) => setTimeout(r, mobile ? 3500 : 1500)); // chờ ảnh / script tải sau "load"
    const ev = async (expr: string) => (await s('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
    const base = await ev(`(() => { const n = performance.getEntriesByType('navigation')[0];
      return { ...window.__perf, ttfb: n ? n.responseStart : 0,
        preloadFonts: document.querySelectorAll('link[rel=preload][as=font]').length }; })()`);
    // Thử một tương tác: bấm nút đầu tiên đang hiện trong TAP_TARGETS (tọa độ thật → sự kiện thật như khách chạm).
    const box = await ev(`(() => { for (const sel of ${JSON.stringify(TAP_TARGETS)}) for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight) return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } return null; })()`);
    let inp: number | null = null;
    if (box) {
      for (const type of ['mousePressed', 'mouseReleased']) await s('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
      await new Promise((r) => setTimeout(r, 1500));
      inp = (await ev('window.__perf.inp')) || null;
      await s('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    }
    const list = [...reqs.values()];
    return { ...base, inp, reqs: list, redirected, docStatus, fonts: list.filter((r) => r.type === 'Font').length };
  } finally {
    b.listeners = b.listeners.filter((x) => x !== onMsg);
    await b.send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

// ───────────────────────────── Kiểm tra ─────────────────────────────

const kb = (n: number) => `${Math.round(n / 1024)}KB`;
const sec = (ms: number) => `${(ms / 1000).toFixed(2)}s`;
const TEXT = /^(text\/|application\/(javascript|json|xml|manifest\+json)|image\/svg)/;
const maxAge = (cc: string) => (/no-store/.test(cc) ? 0 : Number(/(?:^|,|\s)max-age=(\d+)/.exec(cc)?.[1] ?? 0));
const sameSite = (u: string) => { try { return new URL(u).host === HOST; } catch { return true; } };

function check(label: string, page: string, r: Run, mobile: boolean) {
  const tag = `${label} [${mobile ? 'điện thoại' : 'máy tính'}] ${page}`;
  if (r.redirected) err(`${tag}: trang bị chuyển hướng trước khi tải (mất thêm một vòng mạng)`);
  if (r.docStatus >= 400) err(`${tag}: trang trả ${r.docStatus}`);
  if (r.lcpEl?.loading === 'lazy') err(`${tag}: phần tử LCP là ảnh loading="lazy" (${r.lcpEl.src.slice(0, 90)}) — ảnh đầu trang phải tải ngay`);
  if (r.cls > 0.25) err(`${tag}: CLS ${r.cls.toFixed(3)} (> 0,25 — bố cục nhảy nhiều)`);
  else if (r.cls > 0.1) warn(`${tag}: CLS ${r.cls.toFixed(3)} (> 0,1)`);
  if (r.lcp > 2500) warn(`${tag}: LCP ${sec(r.lcp)} (> 2,5s) — phần tử: ${r.lcpEl ? r.lcpEl.tag + (r.lcpEl.src ? ' ' + r.lcpEl.src.slice(0, 80) : ` “${r.lcpEl.text}”`) : '?'}`);
  if (r.tbt > (mobile ? 600 : 200)) warn(`${tag}: TBT ${Math.round(r.tbt)}ms — JavaScript chặn luồng chính lâu`);
  if (r.inp && r.inp > 200) warn(`${tag}: INP thử ${Math.round(r.inp)}ms (> 200ms) khi bấm nút menu / bộ lọc`);
  if (r.ttfb > 800) warn(`${tag}: TTFB ${Math.round(r.ttfb)}ms (> 800ms) — máy chủ trả trang chậm`);
  const lcpReq = r.lcpEl?.src ? r.reqs.find((q) => q.url === r.lcpEl!.src) : undefined;
  if (r.lcpEl?.src && !/^data:/.test(r.lcpEl.src)) {
    if (r.lcpEl.tag.startsWith('img') && r.lcpEl.priority !== 'high') warn(`${tag}: ảnh LCP chưa có fetchpriority="high" (${r.lcpEl.src.slice(0, 90)})`);
    if (r.lcpEl.tag.startsWith('img') && !r.lcpEl.srcset && sameSite(r.lcpEl.src)) warn(`${tag}: ảnh LCP không có srcset — điện thoại tải ảnh cỡ máy tính (${r.lcpEl.src.slice(0, 90)})`);
    if (lcpReq && lcpReq.bytes > 250 * 1024) warn(`${tag}: ảnh LCP nặng ${kb(lcpReq.bytes)} (> 250KB)`);
  }
  const js = r.reqs.filter((q) => q.type === 'Script').reduce((a, q) => a + q.bytes, 0);
  const all = r.reqs.reduce((a, q) => a + q.bytes, 0);
  if (js > 500 * 1024) warn(`${tag}: JavaScript ${kb(js)} (đã nén, > 500KB)`);
  if (all > 2.5 * 1024 * 1024) warn(`${tag}: cả trang tải ${kb(all)} (> 2,5MB)`);
  // Next tải trước font bằng header "Link: <…woff2>; rel=preload; as=font" của trang (không phải thẻ <link> trong HTML).
  const docLink = r.reqs.find((q) => q.type === 'Document')?.headers.link ?? '';
  const preloaded = r.preloadFonts + (docLink.match(/as="?font/g) ?? []).length;
  if (r.fonts > 0 && preloaded === 0) warn(`${tag}: có ${r.fonts} file font nhưng không font nào được preload`);
  for (const q of r.reqs) {
    if (q.status >= 400) err(`${tag}: ${q.url.slice(0, 100)} trả ${q.status}`);
    if (!q.status || q.status >= 300 || !sameSite(q.url)) continue;
    const path = new URL(q.url).pathname;
    const cc = q.headers['cache-control'] ?? '';
    if (TEXT.test(q.mime) && q.bytes > 1024 && !/br|gzip|zstd|deflate/.test(q.headers['content-encoding'] ?? '')) err(`${tag}: ${path} (${q.mime}, ${kb(q.bytes)}) không nén br / gzip`);
    if (path.startsWith('/_next/static/') && !(/immutable/.test(cc) || maxAge(cc) >= 31536000)) err(`${tag}: ${path} không cache dài hạn (Cache-Control: ${cc || 'trống'})`);
    if (/^\/(images|icons|videos)\/|^\/api\/[a-z]+-images\//.test(path) && maxAge(cc) === 0) err(`${tag}: ${path} không cho trình duyệt cache (Cache-Control: ${cc || 'trống'})`);
  }
  const third = [...new Set(r.reqs.filter((q) => q.type === 'Script' && !sameSite(q.url)).map((q) => new URL(q.url).host))];
  if (third.length) warn(`${tag}: script từ tên miền khác: ${third.join(', ')}`);
}

// ───────────────────────────── Chạy ─────────────────────────────

const all = await sitemapPages();
const pages: [string, string][] = process.env.PERF_ALL
  ? all.map((u) => [TEMPLATES.find(([, re]) => re.test(new URL(u).pathname))?.[0] ?? 'Trang', u])
  : TEMPLATES.flatMap(([name, re]) => { const u = all.find((x) => re.test(new URL(x).pathname)); return u ? [[name, u] as [string, string]] : []; });
console.log(`Đo ${pages.length} trang trên ${BASE} (điện thoại: Slow 4G + CPU ×4; máy tính: mạng thật)…\n`);

const b = await Browser.launch();
const rows: string[] = [];
try {
  for (const [label, url] of pages) {
    const path = new URL(url).pathname;
    for (const mobile of [true, false]) {
      try {
        const r = await measure(b, url, mobile);
        check(label, path, r, mobile);
        const js = r.reqs.filter((q) => q.type === 'Script').reduce((a, q) => a + q.bytes, 0);
        const img = r.reqs.filter((q) => q.type === 'Image').reduce((a, q) => a + q.bytes, 0);
        const total = r.reqs.reduce((a, q) => a + q.bytes, 0);
        rows.push([
          `${label.padEnd(16)} ${mobile ? 'ĐT ' : 'MT '}`,
          `TTFB ${String(Math.round(r.ttfb)).padStart(4)}ms`, `FCP ${sec(r.fcp)}`, `LCP ${sec(r.lcp)}`,
          `CLS ${r.cls.toFixed(3)}`, `TBT ${String(Math.round(r.tbt)).padStart(4)}ms`, `INP thử ${r.inp ? Math.round(r.inp) + 'ms' : '—'}`.padEnd(13),
          `${String(r.reqs.length).padStart(3)} req`, `JS ${kb(js)}`, `ảnh ${kb(img)}`, `tổng ${kb(total)}`,
          `· LCP: ${r.lcpEl ? (r.lcpEl.src ? r.lcpEl.tag + ' ' + new URL(r.lcpEl.src, BASE).pathname.slice(0, 50) : r.lcpEl.tag + ' “' + (r.lcpEl.text ?? '').slice(0, 30) + '”') : '?'}`,
        ].join('  '));
        console.log(rows[rows.length - 1]);
      } catch (e) {
        err(`${label} ${path}: không đo được — ${(e as Error).message}`);
      }
    }
  }
} finally {
  b.close();
}

console.log(`\nMốc Google (phân vị 75 số đo thật): LCP ≤ 2,5s, INP ≤ 200ms, CLS ≤ 0,1. Số trên là phòng thí nghiệm — dao động giữa các lần chạy.`);
if (warnings.length) {
  console.log(`\nCảnh báo (${warnings.length}):`);
  for (const w of warnings) console.log('  ⚠ ' + w);
}
if (errors.length) {
  console.log(`\nLỗi (${errors.length}):`);
  for (const e of errors) console.log('  ✗ ' + e);
  process.exit(1);
}
console.log('\n✓ Không có lỗi.');
