/**
 * Redirect + đổi cấu trúc / migration website (mục 16 checklist SEO). Hai cách chạy:
 *
 *  1. TRƯỚC khi đổi (đổi giao diện, đổi cấu trúc đường dẫn, gỡ hàng loạt, đổi tên miền / hosting) — lưu danh sách URL cũ:
 *       npm run seo:migration -- https://www.caycanhmientay.com --luu            (→ seo/url-<ngày>.txt)
 *       npm run seo:migration -- https://www.caycanhmientay.com --luu seo/a.txt
 *     Lấy mọi trang trong sitemap + ảnh khai trong sitemap ảnh, mỗi dòng một URL.
 *
 *  2. SAU khi đổi (máy dev, bản xem trước Vercel hoặc web thật) — mở lại từng URL trong danh sách:
 *       npm run seo:migration -- https://www.caycanhmientay.com seo/url-2026-10-16.txt
 *       npm run seo:migration -- http://localhost:3000 seo/url-quan-trong.txt
 *     Mỗi dòng: một URL (đầy đủ hoặc "/duong-dan"), hoặc "URL cũ  URL mới mong đợi" (cách bằng dấu cách / Tab / →)
 *     để kiểm đúng bảng đối chiếu. Dòng bắt đầu bằng # là ghi chú. Dòng có "!" ở đầu = URL quan trọng (có backlink,
 *     đã in trên tờ rơi, chia sẻ nhiều) — chỉ để in nổi bật trong báo cáo, luật kiểm như nhau.
 *     URL được mở trên máy đang kiểm (giữ đường dẫn + ?tham số, bỏ tên miền trong file).
 *
 * Lỗi (thoát mã 1):
 *  - URL cũ trả 404 / 410 / 5xx (mất trang, không có chuyển hướng) hoặc không trả lời.
 *  - Chuyển hướng tạm (301/308 mới đúng; 302 / 303 / 307 làm Google giữ URL cũ), nhiều bước (A → B → C), vòng lặp,
 *    sang web khác, hoặc dồn về trang chủ (Google coi như trang lỗi — soft 404).
 *  - Đích khác URL mới mong đợi trong bảng đối chiếu.
 *  - robots.txt chặn cả web, trang chủ không trả 200 hoặc bị noindex.
 * Cảnh báo (không làm hỏng lệnh): trang đích đang noindex, canonical trỏ sang URL khác, ảnh / file không đúng loại.
 * Chỉ dùng thư viện có sẵn của Node (chạy được trong GitHub Actions không cần npm ci).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const args = process.argv.slice(2);
const BASE = (args.find((a) => /^https?:\/\//.test(a)) ?? 'http://localhost:3000').replace(/\/+$/, '');
const SAVE = args.includes('--luu');
const FILE = args.find((a) => !/^https?:\/\//.test(a) && a !== '--luu');
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CONCURRENCY = 6;
const MAX_HOPS = 10;

const errors: string[] = [];
const warns: string[] = [];
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const pathOf = (u: string) => { const x = new URL(u, BASE); return x.pathname + x.search; };
const isMedia = (p: string) => /\.(jpe?g|png|webp|gif|avif|svg|pdf|mp4|webm)(\?|$)/i.test(p) || /^\/api\/[a-z-]+-images\//.test(p);

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

const get = (url: string) => fetch(url, { redirect: 'manual', headers: { 'User-Agent': GOOGLEBOT }, signal: AbortSignal.timeout(30_000) });

// ---- 1. Lưu danh sách URL ---------------------------------------------------------------------

async function sitemapUrls() {
  const robots = await (await get(`${BASE}/robots.txt`)).text();
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  const origin = new URL(index).origin;
  const local = (u: string) => (u.startsWith(origin) ? BASE + u.slice(origin.length) : u);
  const xml = async (u: string) => (await get(local(u))).text();
  const pages: string[] = [], images: string[] = [];
  for (const m of (await xml(index)).matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)) {
    const child = await xml(decode(m[1]));
    for (const u of child.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)) pages.push(decode(u[1]));
    for (const u of child.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) images.push(decode(u[1]));
  }
  return { origin, pages, images: [...new Set(images)] };
}

async function save() {
  const { origin, pages, images } = await sitemapUrls();
  const out = FILE ?? `seo/url-${new Date().toISOString().slice(0, 10)}.txt`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, [
    `# Danh sách URL của ${origin} lưu lúc ${new Date().toISOString()} (từ sitemap của ${BASE}).`,
    `# Kiểm lại sau khi đổi cấu trúc: npm run seo:migration -- <địa chỉ web> ${out}`,
    `# Thêm "  /duong-dan-moi" sau một dòng để kiểm đúng đích chuyển hướng; "!" ở đầu dòng = URL quan trọng.`,
    '', `# Trang (${pages.length})`, ...pages, '', `# Ảnh (${images.length})`, ...images, '',
  ].join('\n'));
  console.log(`Đã lưu ${pages.length} trang + ${images.length} ảnh vào ${out}`);
}

// ---- 2. Kiểm danh sách sau khi đổi ------------------------------------------------------------

type Line = { raw: string; from: string; expect: string | null; important: boolean };

function readList(file: string): Line[] {
  return readFileSync(file, 'utf8').split(/\r?\n/).flatMap((l) => {
    const raw = l.trim();
    if (!raw || raw.startsWith('#')) return [];
    const important = raw.startsWith('!');
    const [a, b] = raw.replace(/^!\s*/, '').split(/\s*(?:→|->|\t)\s*|\s+/).filter(Boolean);
    if (!/^(https?:\/\/|\/)/.test(a ?? '') || (b && !/^(https?:\/\/|\/)/.test(b))) {
      errors.push(`Dòng không hiểu được: "${raw}"`);
      return [];
    }
    return [{ raw, from: pathOf(a), expect: b ? pathOf(b) : null, important }];
  });
}

type Hop = { url: string; status: number; location: string | null; type: string; xRobots: string; html: string };

/** Đi theo chuyển hướng từng bước (không để fetch tự đi) để đếm bước, bắt vòng lặp và mã tạm thời. */
async function follow(path: string): Promise<{ hops: Hop[]; loop: boolean; offsite: string | null; failed: string | null }> {
  const hops: Hop[] = [];
  const seen = new Set<string>();
  let url = BASE + path;
  for (let i = 0; i <= MAX_HOPS; i++) {
    if (seen.has(url)) return { hops, loop: true, offsite: null, failed: null };
    seen.add(url);
    let r: Response;
    try { r = await get(url); } catch (e) { return { hops, loop: false, offsite: null, failed: (e as Error).message }; }
    const type = r.headers.get('content-type') ?? '';
    const html = r.status === 200 && /html/.test(type) ? await r.text() : (await r.body?.cancel(), '');
    const location = r.headers.get('location');
    hops.push({ url, status: r.status, location, type, xRobots: r.headers.get('x-robots-tag') ?? '', html });
    if (r.status < 300 || r.status >= 400 || !location) break;
    const next = new URL(location, url);
    if (next.origin !== new URL(BASE).origin) return { hops, loop: false, offsite: next.href, failed: null };
    url = next.href;
  }
  return { hops, loop: false, offsite: null, failed: null };
}

const robotsMeta = (html: string) =>
  (/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i.exec(html) ?? /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i.exec(html))?.[1] ?? '';
const canonicalOf = (html: string) => {
  const tag = [...html.matchAll(/<link\b[^>]*>/gi)].find((m) => /\brel=["']?canonical\b/i.test(m[0]))?.[0];
  const href = tag && /\bhref=["']([^"']*)["']/i.exec(tag)?.[1];
  return href ? pathOf(decode(href)) : null;
};

const stats = { direct: 0, moved: 0, bad: 0 };

async function checkLine(l: Line) {
  const tag = l.important ? '[QUAN TRỌNG] ' : '';
  const fail = (m: string) => { stats.bad++; errors.push(`${tag}${m} — ${l.from}`); };
  const { hops, loop, offsite, failed } = await follow(l.from);
  if (failed) return fail(`Không trả lời (${failed})`);
  const chain = [l.from, ...hops.slice(1).map((h) => pathOf(h.url))].join(' → ');
  if (loop) return fail(`Chuyển hướng vòng lặp: ${chain} → …`);
  if (offsite) return fail(`Chuyển hướng sang web khác: ${offsite}`);
  const end = hops[hops.length - 1];
  const final = pathOf(end.url);
  const moves = hops.slice(0, -1);
  if (end.status >= 300 && end.status < 400) return fail(`Chuyển hướng quá ${MAX_HOPS} bước`);
  if (end.status >= 500) return fail(`Lỗi máy chủ ${end.status}${moves.length ? ` (sau ${chain})` : ''}`);
  if (end.status >= 400) return fail(`Mất trang: mã ${end.status}${moves.length ? ` (sau ${chain})` : ''} — thêm chuyển hướng tới trang thay thế gần nhất`);
  if (end.status !== 200) return fail(`Mã ${end.status}`);

  const temp = moves.find((h) => ![301, 308].includes(h.status));
  if (temp) fail(`Chuyển hướng tạm thời (mã ${temp.status}) — đổi vĩnh viễn phải dùng 301 / 308`);
  if (moves.length > 1) fail(`Chuyển hướng nhiều bước (${chain}) — trỏ thẳng tới đích cuối`);
  if (moves.length && final === '/' && l.from.split('?')[0] !== '/') fail('Chuyển hướng dồn về trang chủ — Google coi như trang lỗi; trỏ về trang cùng nội dung hoặc danh mục gần nhất');
  if (l.expect && final !== l.expect) fail(`Tới ${final}, bảng đối chiếu ghi ${l.expect}`);
  if (moves.length) stats.moved++; else stats.direct++;

  if (isMedia(l.from)) {
    if (!/^(image|video|application\/pdf)/.test(end.type)) warns.push(`${tag}File trả loại "${end.type || '(trống)'}", không phải ảnh / PDF / video — ${l.from}`);
    return;
  }
  if (!end.html) return;
  if (/noindex/i.test(robotsMeta(end.html)) || /noindex/i.test(end.xRobots)) warns.push(`${tag}Trang đích đang noindex (${final}) — ${l.from}`);
  const c = canonicalOf(end.html);
  if (c && c !== final) warns.push(`${tag}Trang đích ${final} có canonical trỏ sang ${c} — ${l.from}`);
}

/** Web mới không bị chặn: robots.txt không cấm cả web, trang chủ 200 và không noindex. */
async function checkOpen() {
  const r = await get(`${BASE}/robots.txt`);
  if (r.status !== 200) errors.push(`robots.txt trả mã ${r.status}`);
  else {
    let applies = false, prevAgent = false;
    for (const raw of (await r.text()).split(/\r?\n/)) {
      const [k, ...rest] = raw.replace(/#.*/, '').split(':');
      const key = k.trim().toLowerCase(), v = rest.join(':').trim();
      if (key === 'user-agent') { applies = (prevAgent && applies) || v === '*' || /googlebot/i.test(v); prevAgent = true; continue; }
      prevAgent = false;
      if (applies && key === 'disallow' && v === '/') errors.push('robots.txt chặn cả web với Googlebot (Disallow: /)');
    }
  }
  const home = await follow('/');
  const end = home.hops[home.hops.length - 1];
  if (!end || end.status !== 200) errors.push(`Trang chủ không trả 200 (mã ${end?.status ?? 'không trả lời'})`);
  else if (/noindex/i.test(robotsMeta(end.html)) || /noindex/i.test(end.xRobots)) {
    if (new URL(BASE).hostname.endsWith('.vercel.app')) warns.push('Trang chủ noindex — đúng với bản *.vercel.app, web thật không được như vậy');
    else errors.push('Trang chủ đang noindex — Google sẽ bỏ cả web');
  }
}

async function check(file: string) {
  const lines = readList(file);
  const uniq = [...new Map(lines.map((l) => [l.from, l])).values()];
  console.log(`Kiểm ${uniq.length} URL trong ${file} trên ${BASE}\n`);
  await checkOpen();
  await pool(uniq, checkLine);
}

try {
  if (SAVE) await save();
  else if (!FILE) errors.push('Thiếu file danh sách URL (vd. seo/url-quan-trong.txt), hoặc thêm --luu để lưu danh sách hiện tại');
  else await check(FILE);
} catch (e) {
  errors.push(`Lỗi khi kiểm tra: ${(e as Error).message}`);
}

if (!SAVE) {
  errors.sort((a, b) => Number(b.startsWith('[QUAN TRỌNG]')) - Number(a.startsWith('[QUAN TRỌNG]')));
  for (const w of warns) console.log(`! ${w}`);
  for (const e of errors) console.log(`✗ ${e}`);
  console.log(`\n${stats.direct} URL mở thẳng, ${stats.moved} URL chuyển hướng 1 bước đúng, ${stats.bad} URL lỗi.`);
  console.log(errors.length ? `${errors.length} lỗi${warns.length ? `, ${warns.length} cảnh báo` : ''}.` : `Đạt${warns.length ? ` (${warns.length} cảnh báo)` : ''}: mọi URL cũ còn mở được, chuyển hướng vĩnh viễn một bước tới đúng trang.`);
}
process.exit(errors.length ? 1 : 0);
