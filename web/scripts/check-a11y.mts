/**
 * Kiểm tra Accessibility (mục 12 checklist SEO): `npm run seo:a11y` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:a11y -- https://www.caycanhmientay.com` (web thật, chạy sau mỗi lần deploy cùng các lệnh seo:* khác).
 *
 * Accessibility không phải yếu tố xếp hạng trực tiếp, nhưng trang người khiếm thị / người dùng bàn phím đọc được thì
 * Google cũng đọc được: tên link / nút có nghĩa, heading đúng bậc, ô nhập có nhãn, nội dung không nằm trong CSS.
 *
 * Mở bằng Chrome thật (DevTools Protocol, không cần cài thêm thư viện; tự tìm Chrome hoặc đặt CHROME_PATH) các trang trong
 * sitemap (mặc định 2 trang mỗi loại, A11Y_ALL=1: mọi trang) + giỏ hàng, thanh toán, tìm kiếm, tài khoản, ở 1366px và 390px:
 *
 * 1. Đọc trang: link / nút / ô nhập không có tên đọc được (chữ, alt, aria-label, nhãn <label>), ô nhập chỉ có placeholder,
 *    aria-label không chứa chữ đang hiện (WCAG 2.5.3), chữ link chung chung ("Xem thêm", "Chi tiết"…), ảnh thiếu alt,
 *    heading rỗng / nhảy bậc, thiếu link "Bỏ qua, tới nội dung chính", phần tử trông bấm được (con trỏ tay) mà không phải
 *    link / nút, tabindex > 0, role không hợp lệ, aria-controls / aria-labelledby / aria-describedby trỏ tới id không có,
 *    id trùng, vùng aria-hidden chứa thứ bấm được, tab (role=tab) thiếu aria-selected, hộp thoại đang mở thiếu tên,
 *    chữ nằm trong CSS ::before / ::after, chữ bị chặn bôi đen (user-select: none), ô nhập lỗi (aria-invalid) không chỉ ra
 *    câu báo lỗi, độ tương phản chữ / nền < 4,5:1 (chữ lớn < 3:1), link trong câu chỉ khác chữ thường bằng màu (WCAG 1.4.1).
 * 2. Bàn phím (1366px + 390px): bấm Tab qua cả trang — điểm dừng phải nhìn thấy (không nằm trong menu đã đóng / ngoài màn
 *    hình), có viền focus (so kiểu dáng lúc focus và lúc không), không bị đầu trang dính / thanh dưới che, không kẹt.
 * 3. Component dùng chung (trang chủ, sản phẩm, danh mục, thanh toán): mọi nút có aria-expanded / aria-haspopup — bấm Enter
 *    phải mở (aria-expanded = true, vùng aria-controls hiện ra); mở hộp thoại thì focus vào trong, Tab không lọt ra ngoài,
 *    Esc đóng và focus quay về nút; ô chọn (combobox) có danh sách role=listbox + option; nút ☰ trên điện thoại mở / đóng menu.
 *
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính (localhost, *.vercel.app) thì URL được đổi sang máy đó để mở.
 * Máy đi Internet qua proxy: Chrome tự dùng HTTPS_PROXY khi kiểm web thật (CHROME_PROXY= để tắt / đổi).
 * Việc còn lại phải làm tay: thử bằng trình đọc màn hình thật (TalkBack trên Android, VoiceOver trên iPhone), phóng chữ 200%.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const PER_TYPE = 2;
const EXTRA = ['/gio-hang', '/thanh-toan', '/tim-kiem?q=cay', '/tai-khoan'];
const COMPONENT_PAGES = ['/', 'product', 'category', '/thanh-toan'];
const TAB_LIMIT = 90;

const errors = new Map<string, string[]>();
const warnings = new Map<string, string[]>();
const add = (m: Map<string, string[]>, msg: string, loc: string) => {
  const l = m.get(msg) ?? [];
  if (!l.includes(loc)) l.push(loc);
  m.set(msg, l);
};
const err = (msg: string, loc: string) => add(errors, msg, loc);
const warn = (msg: string, loc: string) => add(warnings, msg, loc);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u.startsWith('/') ? BASE + u : u);
const pathOf = (u: string) => { const x = new URL(u, BASE); return x.pathname + x.search; };
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

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

// ───────────────────────────── Chrome (DevTools Protocol) ─────────────────────────────

const CHROMES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean) as string[];

type Tab = Awaited<ReturnType<Browser['tab']>>;

class Browser {
  private ws!: WebSocket;
  private id = 0;
  private pending = new Map<number, { ok: (v: any) => void; no: (e: Error) => void }>();
  private listeners: ((m: any) => void)[] = [];
  private constructor(private proc: ChildProcess, private dir: string) {}

  static async launch(): Promise<Browser | null> {
    const bin = CHROMES.find((p) => existsSync(p));
    if (!bin) return null;
    const dir = mkdtempSync(join(tmpdir(), 'seo-a11y-'));
    const isLocal = /^https?:\/\/(localhost|127\.|\[::1\])/.test(BASE);
    const proxy = process.env.CHROME_PROXY ?? (isLocal ? '' : process.env.HTTPS_PROXY ?? process.env.https_proxy ?? '');
    const args = ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--force-prefers-reduced-motion'];
    if (proxy) args.push(`--proxy-server=${proxy}`);
    const proc = spawn(bin, [...args, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
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

  async tab(opts: { width: number; height: number; mobile: boolean }) {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const s = (m: string, p: object = {}) => this.send(m, p, sessionId);
    await s('Page.enable');
    await s('Emulation.setDeviceMetricsOverride', { width: opts.width, height: opts.height, deviceScaleFactor: opts.mobile ? 2 : 1, mobile: opts.mobile });
    if (opts.mobile) await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    // Nhiều tab chạy song song: tab nền không có focus thật → :focus / :focus-visible không khớp. Giả lập tab nào cũng đang được focus.
    await s('Emulation.setFocusEmulationEnabled', { enabled: true });
    // Tắt hiệu ứng chuyển động để so kiểu dáng focus ngay, không chờ transition.
    await s('Page.addScriptToEvaluateOnNewDocument', { source: `document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}html{scroll-behavior:auto!important}'; document.head.appendChild(st); });` });
    const loaded = () => new Promise<void>((ok) => {
      const f = (m: any) => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') { this.listeners = this.listeners.filter((x) => x !== f); ok(); } };
      this.listeners.push(f);
    });
    const key = async (k: 'Tab' | 'Enter' | 'Escape' | 'ArrowDown', shift = false) => {
      const code = { Tab: 9, Enter: 13, Escape: 27, ArrowDown: 40 }[k];
      const base = { key: k, code: k, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers: shift ? 8 : 0 };
      await s('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base, ...(k === 'Enter' ? { text: '\r' } : {}) });
      if (k === 'Enter') await s('Input.dispatchKeyEvent', { type: 'char', ...base, text: '\r' });
      await s('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    };
    return {
      async goto(url: string, timeout = 45000) {
        const done = loaded();
        await s('Page.navigate', { url });
        await Promise.race([done, new Promise((r) => setTimeout(r, timeout))]);
        await new Promise((r) => setTimeout(r, 900));
      },
      async eval<T>(expr: string): Promise<T> {
        const r = await s('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description?.split('\n')[0] ?? 'lỗi khi đo trang');
        return r.result.value as T;
      },
      key,
      close: () => this.send('Target.closeTarget', { targetId }),
    };
  }

  async close() {
    try { await this.send('Browser.close'); } catch { /* đã đóng */ }
    this.proc.kill();
    try { rmSync(this.dir, { recursive: true, force: true }); } catch { /* Chrome còn giữ file */ }
  }
}

// ───────────────────────────── Hàm dùng chung trong trang ─────────────────────────────

/** Nạp một lần vào trang: window.__a11y = { name, shown, label, … }. */
const HELPERS = `(() => {
  if (window.__a11y) return;
  const shown = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse' || Number(s.opacity) === 0 || e.hidden) return false;
      if (s.clipPath === 'inset(50%)' || (s.position === 'absolute' && s.clip === 'rect(0px, 0px, 0px, 0px)')) return false;
    }
    return true;
  };
  const srOnly = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.clipPath === 'inset(50%)' || s.clip === 'rect(0px, 0px, 0px, 0px)') return true; } return false; };
  // Bị giấu khỏi cây trợ năng (aria-hidden, display:none…) — chữ sr-only vẫn tính.
  const hiddenAT = (el) => { for (let e = el; e; e = e.parentElement) { if (e.inert) return true; if (e.getAttribute && e.getAttribute('aria-hidden') === 'true') return true; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || e.hidden) return true; } return false; };
  const textOf = (el) => {
    let out = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) out += n.textContent;
      else if (n.nodeType === 1) {
        if (n.getAttribute('aria-hidden') === 'true') continue;
        const s = getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden') continue;
        if (n.tagName === 'IMG') out += ' ' + (n.getAttribute('alt') || '') + ' ';
        else if (n.tagName === 'svg' || n.tagName === 'SVG') { const t = n.querySelector('title'); out += t ? ' ' + t.textContent + ' ' : ''; const al = n.getAttribute('aria-label'); if (al) out += ' ' + al + ' '; }
        else if (/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName)) continue;
        else out += ' ' + (n.getAttribute('aria-label') || textOf(n)) + ' ';
      }
    }
    return out.replace(/\\s+/g, ' ').trim();
  };
  const byIds = (v) => (v || '').split(/\\s+/).filter(Boolean).map((id) => document.getElementById(id)).filter(Boolean);
  const labelOf = (el) => {
    const lb = el.getAttribute('aria-labelledby');
    if (lb) { const t = byIds(lb).map((e) => textOf(e) || e.textContent).join(' ').trim(); if (t) return t; }
    const al = (el.getAttribute('aria-label') || '').trim();
    if (al) return al;
    if (/^(INPUT|SELECT|TEXTAREA|METER|PROGRESS|OUTPUT)$/.test(el.tagName) || el.getAttribute('role') === 'combobox') {
      if (el.labels && el.labels.length) { const t = [...el.labels].map(textOf).join(' ').trim(); if (t) return t; }
      if (el.id) { const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l && textOf(l)) return textOf(l); }
      const wrap = el.closest('label'); if (wrap && textOf(wrap)) return textOf(wrap);
      if (el.tagName === 'INPUT' && /^(submit|button|reset)$/.test(el.type)) return el.value;
      if (el.tagName === 'INPUT' && el.type === 'image') return el.alt || '';
      if (el.getAttribute('role') === 'combobox' && el.tagName === 'BUTTON') return textOf(el);
      return (el.getAttribute('title') || '').trim();
    }
    const t = textOf(el);
    return t || (el.getAttribute('title') || '').trim();
  };
  const name = (el) => { const tag = el.tagName.toLowerCase(); const c = typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 2).join('.') : ''; return tag + (el.id ? '#' + el.id : '') + (c ? '.' + c : ''); };
  const rgb = (s) => { const m = /rgba?\\(([\\d.]+),?\\s*([\\d.]+),?\\s*([\\d.]+)(?:,?\\s*\\/?\\s*([\\d.]+%?))?\\)/.exec(s || ''); if (!m) return null; let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]); return [+m[1], +m[2], +m[3], a]; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const blend = (top, bottom) => { const a = top[3]; return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1]; };
  /** Nền thật phía sau chữ: cộng dồn nền các khối cha; gặp ảnh / gradient thì trả null (không đo được). */
  const bgOf = (el) => {
    const layers = [];
    const r0 = el.getBoundingClientRect();
    const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      // Chữ đặt tuyệt đối ra ngoài khối cha (vd. dải nằm dưới ô tìm kiếm): nền khối cha không nằm sau chữ.
      if (e !== el && e !== document.body && e !== document.documentElement) { const r = e.getBoundingClientRect(); if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) continue; }
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = rgb(s.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    let base = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  };
  window.__a11y = { shown, srOnly, hiddenAT, textOf, labelOf, name, rgb, ratio, blend, bgOf, byIds };
})()`;

// ───────────────────────────── 1. Đọc trang ─────────────────────────────

const PROBE = `(() => {
  const { shown, srOnly, hiddenAT, textOf, labelOf, name, rgb, ratio, blend, bgOf, byIds } = window.__a11y;
  const out = { errors: [], warns: [] };
  const E = (m, el) => out.errors.push([m, el ? name(el) : '']);
  const W = (m, el) => out.warns.push([m, el ? name(el) : '']);
  const main = document.querySelector('main');
  const vis = (el) => shown(el) || srOnly(el);

  // Link bỏ qua tới nội dung chính: phải là điểm Tab đầu tiên, trỏ tới phần tử có thật trong / là <main>.
  const firstFocusable = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')].find((e) => e.tabIndex >= 0 && !e.disabled && !hiddenAT(e));
  const skip = firstFocusable && firstFocusable.tagName === 'A' && /^#./.test(firstFocusable.getAttribute('href') || '') ? firstFocusable : null;
  if (!skip) E('Thiếu link "Bỏ qua, tới nội dung chính" ở đầu trang (điểm Tab đầu tiên)');
  else { const t = document.getElementById(decodeURIComponent(skip.getAttribute('href').slice(1))); if (!t || !(t === main || main?.contains(t) || t.contains(main))) E('Link bỏ qua trỏ tới id không có / không phải nội dung chính', skip); }

  // Tên link / nút / ô nhập.
  const GENERIC = /^(xem thêm|xem tất cả|chi tiết|tại đây|bấm vào đây|click|click here|đọc tiếp|xem|thêm|link|more|tìm hiểu thêm)$/i;
  const controls = document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=tab], [role=checkbox], [role=radio], [role=switch], [role=menuitem], [role=option], [role=combobox], summary');
  for (const el of controls) {
    if (hiddenAT(el) && !el.closest('[aria-hidden="true"]')) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    if (!vis(el) && !(el.tagName === 'A' && srOnly(el))) continue;
    const nm = labelOf(el).replace(/\\s+/g, ' ').trim();
    const isField = /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
    if (!nm) {
      if (isField && el.getAttribute('placeholder')) E('Ô nhập chỉ có chữ gợi ý (placeholder), không có nhãn <label> / aria-label', el);
      else if (isField) E('Ô nhập không có nhãn', el);
      else E((el.tagName === 'A' ? 'Link' : 'Nút') + ' không có tên đọc được (chỉ biểu tượng, không aria-label)', el);
      continue;
    }
    if (GENERIC.test(nm) && el.tagName === 'A' && !el.getAttribute('aria-describedby')) W('Chữ link / nút chung chung "' + nm + '" — người dùng trình đọc màn hình không biết dẫn đi đâu', el);
    // Nhãn đọc ra phải chứa chữ đang hiện (WCAG 2.5.3 — người dùng giọng nói gọi theo chữ thấy được).
    const al = el.getAttribute('aria-label');
    if (al && !isField) {
      const seen = textOf(el).replace(/\\s+/g, ' ').trim();
      const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9 ]/g, ' ').replace(/\\s+/g, ' ').trim();
      if (seen && seen.length > 2 && !/^\\d+$/.test(seen) && !norm(al).includes(norm(seen)) && !norm(seen).includes(norm(al))) W('aria-label "' + al.slice(0, 40) + '" không chứa chữ đang hiện "' + seen.slice(0, 30) + '"', el);
    }
  }

  // Ảnh.
  for (const img of document.querySelectorAll('img')) { if (!img.hasAttribute('alt') && vis(img) && !hiddenAT(img)) E('Ảnh thiếu thuộc tính alt', img); }
  for (const svg of document.querySelectorAll('svg[role=img]')) { if (!svg.getAttribute('aria-label') && !svg.querySelector('title') && !svg.getAttribute('aria-labelledby')) E('Hình SVG role=img không có tên', svg); }

  // Heading.
  let last = 0;
  for (const h of (main || document).querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')) {
    if (!vis(h) || hiddenAT(h)) continue;
    const lv = h.getAttribute('role') === 'heading' ? Number(h.getAttribute('aria-level') || 2) : Number(h.tagName[1]);
    if (!textOf(h)) E('Heading rỗng', h);
    if (last && lv > last + 1) W('Heading nhảy bậc h' + last + ' → h' + lv + ' ("' + textOf(h).slice(0, 40) + '")', h);
    last = lv;
  }

  // Phần tử trông bấm được (con trỏ tay) mà không phải link / nút / ô nhập — chuột bấm được, bàn phím thì không.
  const NATIVE = 'a[href],button,input,select,textarea,label,summary,option,[role],[tabindex],video,audio,iframe';
  let fake = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (fake > 6) break;
    if (el.matches(NATIVE) || el.closest('a[href],button,label,summary,[role=button],[role=link],[role=option],[role=tab],[role=radio],[role=checkbox],[role=switch],[role=menuitem],.leaflet-container')) continue;
    if (el.tagName === 'svg' || el.closest('svg')) continue;
    if (getComputedStyle(el).cursor !== 'pointer' || !shown(el)) continue;
    if (el.parentElement && getComputedStyle(el.parentElement).cursor === 'pointer' && !el.parentElement.matches(NATIVE)) continue;
    fake++; W('Trông bấm được (con trỏ tay) nhưng không phải link / nút — bàn phím không tới được', el);
  }
  for (const el of document.querySelectorAll('[tabindex]')) { if (el.tabIndex > 0) E('tabindex > 0 làm đảo thứ tự Tab', el); }
  for (const el of document.querySelectorAll('[role=button],[role=link],[role=tab],[role=checkbox],[role=radio],[role=switch],[role=option]')) {
    if (el.matches('a[href],button,input,select,textarea,summary')) continue;
    const opt = el.getAttribute('role') === 'option' || el.getAttribute('role') === 'radio' || el.getAttribute('role') === 'tab';
    if (el.tabIndex < 0 && !opt && vis(el) && !el.getAttribute('aria-disabled')) E('role="' + el.getAttribute('role') + '" nhưng không có tabindex — bàn phím không tới được', el);
  }
  for (const a of document.querySelectorAll('a:not([href])')) { if (vis(a) && (getComputedStyle(a).cursor === 'pointer' || a.onclick)) E('Thẻ <a> không có href (không Tab tới được, không phải link thật)', a); }

  // ARIA.
  const ROLES = new Set('alert alertdialog application article banner button cell checkbox columnheader combobox complementary contentinfo definition dialog directory document feed figure form grid gridcell group heading img link list listbox listitem log main marquee math menu menubar menuitem menuitemcheckbox menuitemradio meter navigation none note option presentation progressbar radio radiogroup region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status switch tab table tablist tabpanel term textbox timer toolbar tooltip tree treegrid treeitem generic'.split(' '));
  for (const el of document.querySelectorAll('[role]')) { for (const r of el.getAttribute('role').split(/\\s+/)) if (r && !ROLES.has(r)) E('role không hợp lệ "' + r + '"', el); }
  const ids = new Map();
  for (const el of document.querySelectorAll('[id]')) ids.set(el.id, (ids.get(el.id) || 0) + 1);
  const referenced = new Set();
  for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-owns', 'aria-activedescendant']) {
    for (const el of document.querySelectorAll('[' + attr + ']')) {
      for (const id of el.getAttribute(attr).split(/\\s+/).filter(Boolean)) {
        referenced.add(id);
        if (!document.getElementById(id)) E(attr + ' trỏ tới id "' + id + '" không có trên trang', el);
      }
    }
  }
  for (const l of document.querySelectorAll('label[for]')) { const id = l.getAttribute('for'); referenced.add(id); if (!document.getElementById(id)) E('<label for="' + id + '"> trỏ tới ô không có', l); }
  for (const [id, n] of ids) if (n > 1) (referenced.has(id) ? E : W)('id "' + id + '" bị trùng ' + n + ' lần' + (referenced.has(id) ? ' (đang được nhãn / aria trỏ tới)' : ''), document.getElementById(id));
  for (const h of document.querySelectorAll('[aria-hidden="true"]')) {
    if (h.closest('[inert]')) continue; // inert: không Tab tới được, đúng cách giấu
    const f = [...h.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].find((e) => e.tabIndex >= 0 && !e.disabled && shown(e));
    if (f || (h.matches('a[href],button,input,select,textarea') && h.tabIndex >= 0 && shown(h))) E('Vùng aria-hidden="true" chứa thứ Tab tới được (trình đọc màn hình đọc thành chỗ trống)', f || h);
  }
  for (const tl of document.querySelectorAll('[role=tablist]')) {
    const tabs = tl.querySelectorAll('[role=tab]');
    if (!tabs.length) E('role=tablist không có role=tab bên trong', tl);
    if (tabs.length && ![...tabs].some((t) => t.getAttribute('aria-selected') === 'true')) E('Nhóm tab không có tab nào aria-selected="true"', tl);
  }
  for (const t of document.querySelectorAll('[role=tab]')) { if (!t.closest('[role=tablist]')) E('role=tab nằm ngoài role=tablist', t); }
  for (const d of document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]')) {
    if (!shown(d)) continue;
    if (!labelOf(d) && !d.getAttribute('aria-label') && !d.getAttribute('aria-labelledby')) E('Hộp thoại đang mở không có tên (aria-label / aria-labelledby)', d);
  }
  for (const el of document.querySelectorAll('[aria-expanded]')) { const v = el.getAttribute('aria-expanded'); if (v !== 'true' && v !== 'false') E('aria-expanded="' + v + '" không hợp lệ', el); }
  for (const el of document.querySelectorAll('[aria-invalid="true"]')) {
    const d = byIds(el.getAttribute('aria-describedby')).map((x) => x.textContent.trim()).join(' ');
    if (!d && !el.getAttribute('aria-errormessage')) E('Ô nhập đang lỗi (aria-invalid) không chỉ ra câu báo lỗi (aria-describedby)', el);
  }
  // Câu báo lỗi đang hiện mà ô nhập cạnh nó không đánh dấu lỗi.
  for (const e of document.querySelectorAll('.vx-err, .app-big__err')) {
    if (!shown(e)) continue;
    const field = e.closest('.vx-field, .app-big__f, label')?.querySelector('input, textarea, [role=combobox]');
    const announced = e.closest('[role=alert],[aria-live],[role=status]');
    if (field && field.getAttribute('aria-invalid') !== 'true') W('Câu báo lỗi "' + e.textContent.trim().slice(0, 40) + '" không gắn với ô nhập (aria-invalid + aria-describedby)', field);
    else if (!field && !announced) W('Câu báo lỗi "' + e.textContent.trim().slice(0, 40) + '" không được đọc lên (thiếu role="alert")', e);
  }

  // Chữ nằm trong CSS ::before / ::after (trình đọc màn hình, Google có thể không đọc).
  let pseudo = 0;
  for (const el of (main || document.body).querySelectorAll('*')) {
    if (pseudo > 4) break;
    for (const p of ['::before', '::after']) {
      const c = getComputedStyle(el, p).content;
      if (!c || c === 'none' || c === 'normal' || !c.startsWith('"')) continue;
      const t = c.slice(1, -1).replace(/\\\\[0-9a-f]{1,6}\\s?/gi, '').trim();
      if (/[\\p{L}\\p{N}]{2,}/u.test(t) && !/^(\\d+|[•·›»→✓✔×\\-–—:,.()*]+)$/.test(t) && shown(el)) { pseudo++; W('Chữ "' + t.slice(0, 30) + '" nằm trong CSS ' + p + ' (không phải nội dung thật)', el); }
    }
  }
  // Chữ nội dung không bôi đen / chép được.
  for (const el of (main || document.body).querySelectorAll('p, li, h1, h2, h3, td, dd, blockquote')) {
    if (getComputedStyle(el).userSelect === 'none' && shown(el) && textOf(el).length > 20) { W('Chữ nội dung bị chặn bôi đen / chép (user-select: none)', el); break; }
  }

  // Độ tương phản chữ / nền (WCAG 1.4.3) + link trong câu chỉ khác màu (1.4.1).
  const seenC = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const t = n.textContent.replace(/\\s+/g, '');
    const el = n.parentElement;
    if (!t || !el || /^(SCRIPT|STYLE|NOSCRIPT|OPTION|TITLE)$/.test(el.tagName) || !shown(el) || srOnly(el)) continue;
    if (el.closest('[disabled],[aria-disabled="true"],.leaflet-container') || hiddenAT(el)) continue;
    { const rr = el.getBoundingClientRect(); const cx = rr.left + rr.width / 2; if (cx < 0 || cx > innerWidth) continue; } // nằm khuất trong khung cuộn ngang
    const s = getComputedStyle(el);
    if (s.textShadow && s.textShadow !== 'none') continue; // chữ đè lên ảnh có bóng chữ: không đo được
    const fg = rgb(s.color); const bg = bgOf(el);
    if (!fg || !bg) continue;
    const r = ratio(blend(fg, bg), bg);
    const size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    if (r < need) {
      const key = name(el) + s.color + s.backgroundColor;
      if (seenC.has(key)) continue;
      seenC.add(key);
      (r < need - 1 ? E : W)('Chữ "' + t.slice(0, 24) + '" tương phản ' + r.toFixed(2) + ':1 (cần ' + need + ':1) — ' + s.color + ' trên nền ' + 'rgb(' + bg.slice(0, 3).map(Math.round).join(', ') + ')', el);
    }
  }
  for (const a of (main || document.body).querySelectorAll('p a[href], li a[href], td a[href]')) {
    if (!shown(a) || getComputedStyle(a).display !== 'inline') continue;
    const p = a.parentElement; const own = textOf(p).length - textOf(a).length;
    if (own < 15) continue; // không nằm giữa câu
    const sa = getComputedStyle(a), sp = getComputedStyle(p);
    if (sa.textDecorationLine.includes('underline') || Number(sa.fontWeight) - Number(sp.fontWeight) >= 300 || (sa.borderBottomStyle !== 'none' && parseFloat(sa.borderBottomWidth) > 0)) continue;
    const ca = rgb(sa.color), cp = rgb(sp.color);
    if (ca && cp && ratio(ca, cp) < 3) { E('Link trong câu chỉ khác chữ thường bằng màu (không gạch chân, tương phản với chữ quanh ' + ratio(ca, cp).toFixed(1) + ':1 < 3:1)', a); break; }
  }
  return out;
})()`;

/** Đóng hộp cookie (chọn "Chỉ cần thiết") — đã đọc ở bước 1; để lại thì nó che đáy màn hình khi thử bàn phím. */
const DISMISS_COOKIE = `(() => { const b = [...document.querySelectorAll('.app-ck button')].find((x) => /Chỉ cần thiết/.test(x.textContent)); if (b) b.click(); return !!b; })()`;

// ───────────────────────────── 2. Bàn phím ─────────────────────────────

/** Ảnh chụp kiểu dáng của phần tử đang focus + 3 khối cha (bắt cả :focus-within) + vài phần tử con (viền vẽ trên ảnh bên trong). */
const SNAP = `(el) => { const out = []; const list = []; for (let e = el, i = 0; e && i < 4; e = e.parentElement, i++) list.push(e); list.push(...[...el.querySelectorAll('*')].slice(0, 6)); for (const e of list) { const s = getComputedStyle(e); out.push([s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0 ? 'none' : s.outlineStyle + s.outlineWidth + s.outlineColor, s.boxShadow, s.borderTopColor + s.borderBottomColor + s.borderBottomWidth, s.backgroundColor, s.textDecorationLine, s.color].join('|')); } return out; }`;

const FOCUS_STEP = `(() => {
  const { shown, name, labelOf } = window.__a11y;
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { body: true };
  // Khung nhúng (YouTube, TikTok) / lớp công cụ của next dev: bàn phím đi bên trong, bỏ qua
  if (el.tagName === 'IFRAME' || el.tagName === 'NEXTJS-PORTAL') return { iframe: true, el: name(el), key: el.outerHTML.slice(0, 160) };
  // Vị trí đo TRƯỚC khi bỏ focus (bỏ focus có thể làm khung cuộn tự trả về đầu).
  const r = el.getBoundingClientRect();
  const vw = innerWidth, vh = innerHeight;
  const inView = r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
  // Bị che: điểm giữa không thuộc phần tử (đầu trang dính, thanh đáy, hộp nổi).
  let covered = '';
  if (inView && r.width > 0 && r.height > 0) {
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + 2], [r.right - 2, r.bottom - 2]];
    const hit = pts.map(([x, y]) => document.elementFromPoint(Math.min(vw - 1, Math.max(0, x)), Math.min(vh - 1, Math.max(0, y))));
    const sameLink = (h) => el.href && h.closest && h.closest('a')?.href === el.href; // lớp link phủ trong suốt cùng đích (thẻ sản phẩm)
    if (hit.every((h) => h && h !== el && !el.contains(h) && !h.contains(el) && !sameLink(h))) covered = hit[0] ? name(hit[0]) : '';
  }
  const visible = shown(el);
  const snap = ${SNAP};
  const on = snap(el);
  // So với lúc không focus: ảnh chụp lúc trước khi bắt đầu Tab (PRE_SNAP). Phần tử mới xuất hiện sau đó thì bỏ focus rồi
  // focus lại (focus bằng script có thể không bật :focus-visible — chỉ dùng khi không có ảnh chụp sẵn).
  let off = window.__off && window.__off.get(el);
  if (!off) { el.blur(); off = snap(el); el.focus({ preventScroll: true }); }
  const diff = on.map((x, i) => x !== off[i]);
  const parts = on.map((x, i) => [x.split('|'), off[i].split('|')]);
  const kinds = new Set();
  parts.forEach(([a, b]) => a.forEach((v, j) => { if (v !== b[j]) kinds.add(['outline', 'shadow', 'border', 'background', 'underline', 'color'][j]); }));
  let why = '';
  if (!visible) { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0 || s.clipPath === 'inset(50%)') { why = name(e) + ' ' + (s.display === 'none' ? 'display:none' : s.visibility === 'hidden' ? 'visibility:hidden' : Number(s.opacity) === 0 ? 'opacity:0' : 'clip'); break; } } if (!why) why = 'cỡ ' + Math.round(r.width) + '×' + Math.round(r.height); }
  else if (!inView) why = 'ngoài màn hình (' + Math.round(r.left) + ',' + Math.round(r.top) + ')';
  return { el: name(el), iframe: el.tagName === 'IFRAME', why, label: labelOf(el).slice(0, 40), shown: visible, inView, changed: diff.some(Boolean), kinds: [...kinds], covered, key: el.outerHTML.slice(0, 160) + r.top };
})()`;

/** Chụp kiểu dáng lúc KHÔNG focus của mọi thứ Tab tới được, trước khi bắt đầu bấm Tab. */
const PRE_SNAP = `(() => { const snap = ${SNAP}; window.__off = new Map(); for (const el of document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]')) window.__off.set(el, snap(el)); return window.__off.size; })()`;

async function keyboardWalk(t: Tab, loc: string, label: string) {
  await t.eval(`(document.activeElement && document.activeElement.blur(), window.scrollTo(0, 0), true)`);
  await t.eval(PRE_SNAP);
  let prev = '';
  let same = 0;
  let first = '';
  let stops = 0;
  const noRing: string[] = [];
  const hidden: string[] = [];
  const covered: string[] = [];
  const colorOnly: string[] = [];
  for (let i = 0; i < TAB_LIMIT; i++) {
    await t.key('Tab');
    await new Promise((r) => setTimeout(r, 40));
    let s = await t.eval<any>(FOCUS_STEP);
    if (s.body) { if (i > 0) break; continue; }
    // Có vấn đề thì đo lại sau một nhịp (khối tự mở khi Tab vào, trang đang cuộn tới ô vừa focus…)
    if (!s.iframe && (!s.shown || !s.inView || !s.changed || s.covered)) { await new Promise((r) => setTimeout(r, 250)); s = await t.eval<any>(FOCUS_STEP); }
    if (s.key === first) break; // vòng lại từ đầu
    if (!first) first = s.key;
    stops++;
    if (s.iframe) { if (s.key === prev && ++same >= 40) { err(`Kẹt bàn phím (${label}): Tab không rời được khung ${s.el}`, loc); break; } prev = s.key; continue; } // bàn phím đang đi trong khung nhúng (YouTube, TikTok)
    if (s.key === prev) { if (++same >= 3) { err(`Kẹt bàn phím (${label}): Tab không rời được ${s.el}`, loc); break; } } else same = 0;
    prev = s.key;
    const tag = `${s.el}${s.label ? ` "${s.label}"` : ''}`;
    if (!s.shown || !s.inView) hidden.push(`${tag} [${s.why}]`);
    else {
      if (!s.changed) noRing.push(tag);
      else if (s.kinds.length === 1 && s.kinds[0] === 'color') colorOnly.push(tag);
      if (s.covered) covered.push(`${tag} (bị ${s.covered} che)`);
    }
  }
  const uniq = (l: string[]) => [...new Set(l)];
  if (hidden.length) err(`Tab dừng ở chỗ không nhìn thấy (${label}) — menu / bảng đã đóng vẫn Tab vào được: ${uniq(hidden).slice(0, 3).join('; ')}${hidden.length > 3 ? ` … (${hidden.length} chỗ)` : ''}`, loc);
  if (noRing.length) err(`Không thấy viền focus khi Tab tới (${label}): ${uniq(noRing).slice(0, 3).join('; ')}${noRing.length > 3 ? ` … (${noRing.length} chỗ)` : ''}`, loc);
  if (colorOnly.length) warn(`Focus chỉ đổi màu chữ, khó thấy (${label}): ${uniq(colorOnly).slice(0, 3).join('; ')}`, loc);
  if (covered.length) warn(`Phần tử đang focus bị che (${label}): ${uniq(covered).slice(0, 3).join('; ')}`, loc);
  return stops;
}

// ───────────────────────────── 3. Component dùng chung ─────────────────────────────

const TRIGGERS = `(() => {
  const { shown } = window.__a11y;
  const list = [...document.querySelectorAll('[aria-expanded], [aria-haspopup]:not([aria-haspopup="false"]), .app-menubtn')].filter((e) => shown(e) && !e.disabled && e.tabIndex >= 0 && !e.closest('[inert]'));
  return list.map((e, i) => ({ i, sel: e.matches('.app-menubtn') ? 'menu' : e.getAttribute('aria-haspopup') || 'expand' }));
})()`;

const TRIGGER_STATE = (i: number) => `(() => {
  const { shown, labelOf, name } = window.__a11y;
  const list = [...document.querySelectorAll('[aria-expanded], [aria-haspopup]:not([aria-haspopup="false"]), .app-menubtn')].filter((e) => shown(e) && !e.disabled && e.tabIndex >= 0 && !e.closest('[inert]'));
  const el = window.__trig || list[${i}];
  if (!el) return null;
  const visDialogs = () => [...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open],[aria-modal="true"]')].filter(shown);
  if (!window.__trig) window.__pre = new Set(visDialogs());
  window.__trig = el;
  const ctl = (el.getAttribute('aria-controls') || '').split(/\\s+/).filter(Boolean).map((id) => document.getElementById(id));
  const dialogs = visDialogs().filter((d) => !window.__pre.has(d));
  const a = document.activeElement;
  const lists = [...document.querySelectorAll('[role=listbox]')].filter(shown);
  return {
    name: name(el) + ' "' + labelOf(el).slice(0, 30) + '"',
    expanded: el.getAttribute('aria-expanded'),
    controls: ctl.map((c) => (c ? (shown(c) ? 'shown' : 'hidden') : 'missing')),
    dialog: dialogs.length ? { n: dialogs.length, focusIn: dialogs.some((d) => d.contains(a)), named: dialogs.every((d) => !!(d.getAttribute('aria-label') || d.getAttribute('aria-labelledby'))) } : null,
    listbox: lists.length ? { options: lists[0].querySelectorAll('[role=option]').length, selected: lists[0].querySelectorAll('[role=option][aria-selected]').length } : null,
    focusOnTrigger: a === el,
    sidebar: document.body.hasAttribute('data-sidebar-open'),
    sideVisible: (() => { const s = document.querySelector('.app-side'); if (!s) return null; const r = s.getBoundingClientRect(); return r.right > 10 && shown(s); })(),
  };
})()`;

async function componentChecks(t: Tab, url: string, loc: string, label: string) {
  await t.goto(url);
  await t.eval(HELPERS);
  await t.eval(DISMISS_COOKIE); // trình duyệt nhớ lựa chọn → các lần tải lại sau không còn hộp cookie
  await new Promise((r) => setTimeout(r, 200));
  const triggers = await t.eval<{ i: number; sel: string }[]>(TRIGGERS);
  let tested = 0;
  for (const tr of triggers.slice(0, 10)) {
    if (tested) { await t.goto(url); await t.eval(HELPERS); }
    tested++;
    const before = await t.eval<any>(TRIGGER_STATE(tr.i));
    if (!before) continue;
    await t.eval(`(window.__trig.focus(), true)`);
    await t.key('Enter');
    await new Promise((r) => setTimeout(r, 450));
    const open = await t.eval<any>(TRIGGER_STATE(tr.i));
    const what = `${open.name} (${label})`;
    if (tr.sel === 'menu') {
      if (!open.sidebar && !open.sideVisible) { err(`Nút ☰ menu: bấm Enter không mở menu — ${what}`, loc); continue; }
      if (open.expanded === null) err(`Nút ☰ menu không có aria-expanded (trình đọc màn hình không biết menu đang mở / đóng) — ${what}`, loc);
    } else if (before.expanded === 'false' && open.expanded !== 'true' && !open.dialog && !open.listbox) {
      err(`Bấm Enter không mở được (aria-expanded vẫn "false") — ${what}`, loc); continue;
    }
    if (open.controls.includes('missing')) err(`aria-controls trỏ tới vùng không có sau khi mở — ${what}`, loc);
    else if (open.expanded === 'true' && open.controls.length && !open.controls.includes('shown')) warn(`aria-expanded="true" nhưng vùng aria-controls không hiện — ${what}`, loc);
    if (open.listbox) {
      if (!open.listbox.options) err(`Danh sách chọn (listbox) không có role="option" — ${what}`, loc);
      await t.key('ArrowDown');
    }
    const modal = open.dialog || tr.sel === 'menu';
    if (modal) {
      if (open.dialog && !open.dialog.named) err(`Hộp thoại mở ra không có tên — ${what}`, loc);
      const inside = open.dialog ? open.dialog.focusIn : await t.eval<boolean>(`!!document.querySelector('.app-side')?.contains(document.activeElement)`);
      if (!inside) err(`Mở ${open.dialog ? 'hộp thoại' : 'menu'} nhưng focus không vào trong (người dùng bàn phím vẫn ở nút phía sau) — ${what}`, loc);
      // Tab 12 lần: focus phải ở trong hộp thoại.
      let escaped = '';
      for (let k = 0; k < 12; k++) {
        await t.key('Tab');
        const out = await t.eval<string>(`(() => { const a = document.activeElement; const d = [...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open],[aria-modal="true"]')].filter((x) => window.__a11y.shown(x) && !window.__pre.has(x)); const box = d.length ? d : [document.querySelector('.app-side')].filter(Boolean); return box.some((x) => x.contains(a)) || a === document.body ? '' : window.__a11y.name(a); })()`);
        if (out) { escaped = out; break; }
      }
      if (escaped) err(`Tab lọt ra ngoài ${open.dialog ? 'hộp thoại' : 'menu'} đang mở (tới ${escaped}) — ${what}`, loc);
    }
    // Mục thu gọn thường (accordion): bấm lại để đóng; menu / hộp thoại / danh sách chọn: Esc phải đóng.
    const popup = modal || !!open.listbox || tr.sel !== 'expand';
    if (!popup) {
      await t.eval(`(window.__trig.focus(), true)`);
      await t.key('Enter');
      await new Promise((r) => setTimeout(r, 400));
      const again = await t.eval<any>(TRIGGER_STATE(tr.i));
      if (open.expanded === 'true' && again.expanded !== 'false') warn(`Bấm lại không thu gọn được — ${what}`, loc);
      continue;
    }
    await t.key('Escape');
    await new Promise((r) => setTimeout(r, 400));
    const closed = await t.eval<any>(TRIGGER_STATE(tr.i));
    const stillOpen = closed.expanded === 'true' || (modal && (closed.dialog || closed.sidebar)) || closed.listbox;
    if (stillOpen) (modal || closed.listbox ? err : warn)(`Esc không đóng ${modal ? (open.dialog ? 'hộp thoại' : 'menu') : 'vùng đang mở'} — ${what}`, loc);
    else if ((modal || open.listbox) && !closed.focusOnTrigger) err(`Đóng ${open.listbox ? 'danh sách chọn' : open.dialog ? 'hộp thoại' : 'menu'} xong focus không quay về nút đã mở — ${what}`, loc);
  }
  return tested;
}

// ───────────────────────────── Chạy ─────────────────────────────

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

async function pool<T>(items: T[], fn: (x: T) => Promise<void>, n: number) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); }));
}

async function main() {
  console.log(`Kiểm tra Accessibility trên ${BASE}\n`);
  const all = await sitemapPages();
  const pages = [...(process.env.A11Y_ALL ? all.map(pathOf) : sampleByType(all, PER_TYPE).map(pathOf)), ...EXTRA];
  console.log(`${all.length} trang trong sitemap — mở ${pages.length} trang bằng Chrome (1366 + 390px).`);
  const b = await Browser.launch();
  if (!b) { console.error('Không tìm thấy Chrome — đặt CHROME_PATH'); process.exit(1); }
  let stops = 0;
  try {
    await pool(pages, async (loc) => {
      for (const [w, h, mobile, label] of [[1366, 900, false, 'máy tính'], [390, 844, true, 'điện thoại']] as const) {
        const t = await b.tab({ width: w, height: h, mobile });
        try {
          await t.goto(local(loc));
          await t.eval(HELPERS);
          const r = await t.eval<{ errors: [string, string][]; warns: [string, string][] }>(PROBE);
          for (const [m, el] of r.errors) err(m, `${loc}${el ? `  (${el})` : ''}`);
          for (const [m, el] of r.warns) warn(m, `${loc}${el ? `  (${el})` : ''}`);
          await t.eval(DISMISS_COOKIE);
          await new Promise((r) => setTimeout(r, 200));
          stops += await keyboardWalk(t, loc, label);
        } catch (e) {
          err(`Không đo được (${label}): ${(e as Error).message}`, loc);
        } finally { await t.close(); }
      }
    }, 3);
    console.log(`Đã đọc ${pages.length} trang, bấm Tab qua ${stops} điểm dừng.`);

    // Component dùng chung: trang chủ, một sản phẩm, một danh mục, thanh toán — cả hai cỡ màn.
    const product = all.map(pathOf).find((p) => p.startsWith('/san-pham/'));
    const category = all.map(pathOf).find((p) => /^\/danh-muc\/[^/]+$/.test(p));
    const cpages = COMPONENT_PAGES.map((p) => (p === 'product' ? product : p === 'category' ? category : p)).filter(Boolean) as string[];
    let tested = 0;
    for (const loc of cpages) {
      for (const [w, h, mobile, label] of [[1366, 900, false, 'máy tính'], [390, 844, true, 'điện thoại']] as const) {
        const t = await b.tab({ width: w, height: h, mobile });
        try { tested += await componentChecks(t, local(loc), loc, label); }
        catch (e) { err(`Không thử được component (${label}): ${(e as Error).message}`, loc); }
        finally { await t.close(); }
      }
    }
    console.log(`Đã bấm thử ${tested} nút mở / đóng (menu, hộp thoại, ô chọn, mục thu gọn) trên ${cpages.length} trang.`);
  } finally { await b.close(); }

  print(warnings, `Cảnh báo (${[...warnings.values()].reduce((n, l) => n + l.length, 0)})`);
  print(errors, `LỖI (${[...errors.values()].reduce((n, l) => n + l.length, 0)})`);
  if (errors.size) process.exit(1);
  console.log('\nĐạt.');
}

main().catch((e) => { console.error(e); process.exit(1); });
