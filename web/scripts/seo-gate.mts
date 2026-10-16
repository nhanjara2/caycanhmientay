/**
 * CỔNG SEO trước / ngay sau khi deploy (mục 20.4 checklist SEO): `npm run seo:gate -- <địa chỉ web>`.
 * Nhanh (~20–60 giây), chỉ dùng thư viện có sẵn của Node (chạy trong GitHub Actions không cần npm ci). Kiểm mẫu mỗi loại trang
 * trong sitemap — không thay các công cụ seo:* chi tiết (chạy đủ bằng `npm run seo:all`).
 *
 * Ba mức:
 *  - CHẶN (blocker, thoát mã 1): robots.txt chặn cả web; sitemap không đọc được / XML hỏng / rỗng / URL ngoài tên miền chính;
 *    trang chủ không 200; trang trong sitemap trả 5xx; cả một loại trang bị noindex (hoặc X-Robots-Tag noindex trên tên miền
 *    chính); ≥ 20% trang có canonical trỏ tên miền khác (staging, *.vercel.app, localhost); ≥ 50% trang hỏng metadata (thiếu /
 *    nhiều <title>, description, canonical — lỗi component metadata toàn web); cả một loại trang mất nội dung chính trong HTML
 *    (không <main> / h1 / chữ); chuyển hướng vòng lặp; trang 404 trả 5xx.
 *  - NGHIÊM TRỌNG (in ra, chỉ làm hỏng lệnh khi GATE_STRICT=1): từng trang lẻ bị các lỗi trên, trang trong sitemap trả 3xx / 404,
 *    canonical trỏ trang khác, chuyển hướng nhiều bước / tạm thời, trang không tồn tại trả 200 (soft 404), robots.txt chặn /_next.
 *  - CẢNH BÁO: title > 70 / description > 170 ký tự, trang trả chậm > 3 giây.
 *
 * Bản xem trước Vercel bật "Deployment Protection" thì đặt VERCEL_AUTOMATION_BYPASS_SECRET (Vercel → Settings → Deployment
 * Protection → Protection Bypass for Automation) — gửi kèm header x-vercel-protection-bypass. Bản *.vercel.app luôn có
 * X-Robots-Tag noindex (cố ý) nên header này chỉ xét trên tên miền chính.
 * Biến môi trường: GATE_PER_TEMPLATE (mặc định 3 trang / loại), GATE_STRICT=1. Có GITHUB_STEP_SUMMARY thì ghi báo cáo vào đó.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const BASE = (args.find((a) => /^https?:\/\//.test(a)) ?? 'http://localhost:3000').replace(/\/+$/, '');
const SITE_ORIGIN = 'https://www.caycanhmientay.com';
const PER_TEMPLATE = Number(process.env.GATE_PER_TEMPLATE) || 3;
const STRICT = process.env.GATE_STRICT === '1';
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const GOOGLEBOT = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const MAIN_MIN_CHARS = 150;
const baseHost = new URL(BASE).hostname;
const isProductionHost = baseHost === new URL(SITE_ORIGIN).hostname;

type Level = 'blocker' | 'serious' | 'warn';
const found: Record<Level, string[]> = { blocker: [], serious: [], warn: [] };
const add = (level: Level, msg: string) => { found[level].push(msg); };

const headers = { 'User-Agent': GOOGLEBOT, ...(BYPASS ? { 'x-vercel-protection-bypass': BYPASS, 'x-vercel-set-bypass-cookie': 'false' } : {}) };
const get = (url: string) => fetch(url, { redirect: 'manual', headers, signal: AbortSignal.timeout(30_000) });
const local = (u: string) => (u.startsWith(SITE_ORIGIN) ? BASE + u.slice(SITE_ORIGIN.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const pathOf = (u: string) => { const x = new URL(u, BASE); return x.pathname + x.search; };

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]); }));
}

/** Loại trang theo đường dẫn (khớp các "template" của web). */
function templateOf(path: string) {
  if (path === '/') return 'Trang chủ';
  const m = /^\/(san-pham|danh-muc|benh-cay|goc-cham-cay|tin-tuc|chinh-sach|doi-tac\/cong-trinh)\//.exec(path);
  if (m) return `/${m[1]}/…`;
  return 'Trang tĩnh / danh sách';
}

// ---- 1. robots.txt --------------------------------------------------------------------------

async function checkRobots() {
  const r = await get(`${BASE}/robots.txt`).catch(() => null);
  if (!r || r.status !== 200) { add('blocker', `robots.txt không trả 200 (${r?.status ?? 'không trả lời'})`); return null; }
  const text = await r.text();
  // Nhóm luật cho User-agent: * (và Googlebot nếu có riêng).
  let applies = false;
  let lastWasAgent = false;
  const disallow: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const [k, ...rest] = line.split(':');
    const key = k?.trim().toLowerCase();
    const val = rest.join(':').trim();
    if (key === 'user-agent') {
      if (!lastWasAgent) applies = false;
      if (val === '*' || /googlebot/i.test(val)) applies = true;
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (applies && key === 'disallow' && val) disallow.push(val);
  }
  if (disallow.includes('/') || disallow.includes('/*')) add('blocker', 'robots.txt chặn CẢ WEB (Disallow: /) với Googlebot');
  if (disallow.some((d) => d.startsWith('/_next'))) add('serious', 'robots.txt chặn /_next — Google không tải được CSS / JS để dựng trang');
  const sitemap = /^sitemap:\s*(\S+)/im.exec(text)?.[1];
  if (!sitemap) { add('serious', 'robots.txt không khai báo Sitemap'); return `${SITE_ORIGIN}/sitemap.xml`; }
  if (!sitemap.startsWith(SITE_ORIGIN)) add('blocker', `robots.txt trỏ Sitemap sang tên miền khác: ${sitemap}`);
  return sitemap;
}

// ---- 2. Sitemap -----------------------------------------------------------------------------

async function readSitemap(index: string): Promise<string[]> {
  const r = await get(local(index)).catch(() => null);
  if (!r || r.status !== 200) { add('blocker', `Sitemap chỉ mục ${index} không trả 200 (${r?.status ?? 'không trả lời'})`); return []; }
  const xml = await r.text();
  if (!/^\s*<\?xml/.test(xml) || !/<sitemapindex[\s>]/.test(xml) || !/<\/sitemapindex>\s*$/.test(xml)) {
    add('blocker', 'Sitemap chỉ mục không phải XML sitemapindex hợp lệ');
    return [];
  }
  const children = [...xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  if (!children.length) { add('blocker', 'Sitemap chỉ mục không có sitemap con nào'); return []; }
  const urls: string[] = [];
  for (const c of children) {
    if (!c.startsWith(SITE_ORIGIN)) add('blocker', `Sitemap con nằm ngoài tên miền chính: ${c}`);
    const cr = await get(local(c)).catch(() => null);
    if (!cr || cr.status !== 200) { add('blocker', `Sitemap con ${c} không trả 200 (${cr?.status ?? 'không trả lời'})`); continue; }
    const body = await cr.text();
    if (!/^\s*<\?xml/.test(body) || !/<urlset[\s>]/.test(body) || !/<\/urlset>\s*$/.test(body)) { add('blocker', `Sitemap con ${c} không phải XML urlset hợp lệ`); continue; }
    const locs = [...body.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
    const outside = locs.filter((u) => !u.startsWith(`${SITE_ORIGIN}/`) && u !== SITE_ORIGIN);
    if (outside.length) add('blocker', `${c}: ${outside.length} URL ngoài tên miền chính (vd. ${outside[0]}) — sitemap trỏ staging / localhost?`);
    urls.push(...locs);
  }
  if (!urls.length) add('blocker', 'Sitemap không có trang nào');
  return [...new Set(urls)];
}

// ---- 3. Mẫu mỗi loại trang -------------------------------------------------------------------

type PageResult = {
  path: string; template: string; status: number; ms: number;
  noindex?: boolean; headerNoindex?: boolean; metaBroken?: string; canonicalStaging?: string; canonicalOther?: string; noContent?: string;
};

const stripSvg = (h: string) => h.replace(/<svg[\s\S]*?<\/svg>/gi, '');
const attr = (tag: string, name: string) => decode(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag)?.[1] ?? new RegExp(`\\s${name}\\s*=\\s*'([^']*)'`, 'i').exec(tag)?.[1] ?? '');
const textOf = (h: string) => decode(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<template[\s\S]*?<\/template>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

async function checkPage(url: string): Promise<PageResult> {
  const path = pathOf(url);
  const t0 = Date.now();
  const res: PageResult = { path, template: templateOf(path), status: 0, ms: 0 };
  const r = await get(local(url)).catch(() => null);
  res.ms = Date.now() - t0;
  if (!r) return res;
  res.status = r.status;
  if (r.status !== 200) { await r.body?.cancel(); return res; }
  if (isProductionHost && /noindex/i.test(r.headers.get('x-robots-tag') ?? '')) res.headerNoindex = true;
  const html = await r.text();
  const headEnd = html.search(/<\/head>/i);
  const head = stripSvg(headEnd > 0 ? html.slice(0, headEnd) : '');
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const titles = [...head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1]).trim());
  const descs = metas.filter((m) => /name\s*=\s*["']description["']/i.test(m)).map((m) => attr(m, 'content').trim());
  const canons = links.filter((l) => /rel\s*=\s*["']canonical["']/i.test(l)).map((l) => attr(l, 'href'));
  const robots = metas.filter((m) => /name\s*=\s*["'](robots|googlebot)["']/i.test(m)).map((m) => attr(m, 'content'));
  res.noindex = robots.some((x) => /noindex/i.test(x));

  const broken: string[] = [];
  if (titles.length !== 1 || !titles[0] || /undefined|null|\[object/i.test(titles[0])) broken.push(`${titles.length} <title>`);
  if (descs.length !== 1 || !descs[0] || /undefined|\[object/i.test(descs[0])) broken.push(`${descs.length} description`);
  if (canons.length !== 1) broken.push(`${canons.length} canonical`);
  if (broken.length) res.metaBroken = broken.join(', ');
  if (titles[0] && titles[0].length > 70) add('warn', `${path}: title ${titles[0].length} ký tự`);
  if (descs[0] && descs[0].length > 170) add('warn', `${path}: description ${descs[0].length} ký tự`);

  if (canons.length === 1) {
    const c = canons[0];
    if (!c.startsWith(`${SITE_ORIGIN}/`) && c !== SITE_ORIGIN) res.canonicalStaging = c;
    else if (pathOf(c) !== path && !res.noindex) res.canonicalOther = c;
  }

  // Nội dung chính phải có ngay trong HTML máy chủ trả (không chờ JavaScript).
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1];
  const h1 = (html.match(/<h1\b/gi) ?? []).length;
  if (main == null) res.noContent = 'không có <main>';
  else if (!h1) res.noContent = 'không có <h1>';
  else if (textOf(main).length < MAIN_MIN_CHARS) res.noContent = `<main> chỉ ${textOf(main).length} ký tự`;
  if (res.ms > 3000) add('warn', `${path}: trả HTML mất ${(res.ms / 1000).toFixed(1)} giây`);
  return res;
}

function judgePages(results: PageResult[]) {
  const byTpl = new Map<string, PageResult[]>();
  for (const r of results) byTpl.set(r.template, [...(byTpl.get(r.template) ?? []), r]);
  const ok = results.filter((r) => r.status === 200);

  for (const r of results) {
    if (r.status >= 500 || r.status === 0) add('blocker', `${r.path}: trả ${r.status || 'không trả lời'} (trang trong sitemap)`);
    else if (r.status !== 200) add('serious', `${r.path}: trong sitemap nhưng trả ${r.status}`);
  }
  for (const [tpl, list] of byTpl) {
    const live = list.filter((r) => r.status === 200);
    if (!live.length) continue;
    const share = (f: (r: PageResult) => unknown) => live.filter(f);
    const noidx = share((r) => r.noindex);
    if (noidx.length === live.length) add('blocker', `${tpl}: CẢ ${live.length} trang mẫu bị meta noindex (vd. ${noidx[0].path})`);
    else for (const r of noidx) add('serious', `${r.path}: trong sitemap nhưng meta noindex`);
    const hdr = share((r) => r.headerNoindex);
    if (hdr.length) add('blocker', `${tpl}: X-Robots-Tag noindex trên tên miền chính (vd. ${hdr[0].path})`);
    const empty = share((r) => r.noContent);
    if (empty.length === live.length) add('blocker', `${tpl}: mất nội dung chính trong HTML ở cả ${live.length} trang mẫu (${empty[0].noContent}, vd. ${empty[0].path})`);
    else for (const r of empty) add('serious', `${r.path}: ${r.noContent}`);
  }
  if (!ok.length) return;
  const meta = ok.filter((r) => r.metaBroken);
  if (meta.length / ok.length >= 0.5) add('blocker', `${meta.length}/${ok.length} trang hỏng metadata — lỗi component metadata toàn web (vd. ${meta[0].path}: ${meta[0].metaBroken})`);
  else for (const r of meta) add('serious', `${r.path}: ${r.metaBroken}`);
  const staging = ok.filter((r) => r.canonicalStaging);
  if (staging.length / ok.length >= 0.2) add('blocker', `${staging.length}/${ok.length} trang có canonical ngoài tên miền chính (vd. ${staging[0].path} → ${staging[0].canonicalStaging})`);
  else for (const r of staging) add('serious', `${r.path}: canonical ngoài tên miền chính → ${r.canonicalStaging}`);
  for (const r of ok.filter((x) => x.canonicalOther)) add('serious', `${r.path}: canonical trỏ trang khác → ${r.canonicalOther}`);
}

// ---- 4. Chuyển hướng + 404 ------------------------------------------------------------------

/** Đi theo chuyển hướng (tối đa 10 bước): trả số bước, mã từng bước, đích cuối, có vòng lặp không. */
async function follow(start: string) {
  const seen = new Set<string>();
  let url = start;
  const codes: number[] = [];
  for (let i = 0; i < 10; i++) {
    if (seen.has(url)) return { codes, final: url, loop: true };
    seen.add(url);
    const r = await get(url).catch(() => null);
    if (!r) return { codes: [...codes, 0], final: url, loop: false };
    codes.push(r.status);
    await r.body?.cancel();
    const loc = r.headers.get('location');
    if (r.status < 300 || r.status >= 400 || !loc) return { codes, final: url, loop: false };
    url = local(new URL(loc, url).toString());
  }
  return { codes, final: url, loop: true };
}

async function checkRedirects(samples: string[]) {
  const starts: { from: string; want?: string }[] = [];
  const file = 'seo/url-quan-trong.txt';
  if (existsSync(file)) {
    for (const raw of readFileSync(file, 'utf8').split('\n')) {
      const line = raw.replace(/^!/, '').trim();
      if (!line || line.startsWith('#')) continue;
      const [from, want] = line.split(/\s*→\s*|\s+/).filter(Boolean);
      starts.push({ from: pathOf(from), want: want ? pathOf(want) : undefined });
    }
  }
  // Biến thể đường dẫn phải về đúng trang trong MỘT bước 308 (proxy chuẩn hóa slug).
  for (const s of samples.slice(0, 3)) {
    const p = pathOf(s);
    if (p !== '/') starts.push({ from: p.toUpperCase(), want: p });
  }
  await pool(starts, 4, async ({ from, want }) => {
    const r = await follow(BASE + from);
    const hops = r.codes.filter((c) => c >= 300 && c < 400).length;
    const last = r.codes.at(-1);
    if (r.loop) add('blocker', `${from}: chuyển hướng VÒNG LẶP / quá 10 bước`);
    else if (last && last >= 500) add('blocker', `${from}: trả ${last}`);
    else if (last !== 200) add('serious', `${from}: kết thúc bằng ${last ?? 'không trả lời'} (${r.codes.join(' → ')})`);
    else {
      if (hops > 1) add('serious', `${from}: chuyển hướng ${hops} bước (${r.codes.join(' → ')})`);
      if (r.codes.some((c) => c === 302 || c === 303 || c === 307)) add('serious', `${from}: chuyển hướng tạm thời (${r.codes.join(' → ')}) — nên 308`);
      if (want && pathOf(r.final) !== want) add('serious', `${from}: về ${pathOf(r.final)}, mong đợi ${want}`);
    }
  });
}

async function check404() {
  const rand = Math.random().toString(36).slice(2, 10);
  for (const p of [`/san-pham/khong-ton-tai-${rand}`, `/duong-dan-khong-co-${rand}`, `/benh-cay/khong-co-${rand}`]) {
    const r = await get(BASE + p).catch(() => null);
    await r?.body?.cancel();
    if (!r || r.status >= 500) add('blocker', `${p}: trang không tồn tại trả ${r?.status ?? 'không trả lời'} (phải 404)`);
    else if (r.status === 200) add('serious', `${p}: trang không tồn tại trả 200 (soft 404)`);
    else if (r.status !== 404 && !(r.status >= 300 && r.status < 400)) add('serious', `${p}: trả ${r.status}, phải 404`);
  }
}

// ---- Chạy -----------------------------------------------------------------------------------

const t0 = Date.now();
console.log(`Cổng SEO: ${BASE}${STRICT ? ' (GATE_STRICT)' : ''}`);
const home = await get(`${BASE}/`).catch(() => null);
await home?.body?.cancel();
if (!home || home.status !== 200) add('blocker', `Trang chủ không trả 200 (${home?.status ?? 'không trả lời'})`);

const sitemap = await checkRobots();
const urls = sitemap ? await readSitemap(sitemap) : [];
const byTpl = new Map<string, string[]>();
for (const u of urls) { const t = templateOf(pathOf(u)); byTpl.set(t, [...(byTpl.get(t) ?? []), u]); }
const sample = [...byTpl.values()].flatMap((list) => {
  // Lấy đầu, giữa, cuối danh sách cho đỡ trùng kiểu trang.
  const pick = new Set([0, Math.floor(list.length / 2), list.length - 1, 1, 2, 3].filter((i) => i < list.length));
  return [...pick].slice(0, PER_TEMPLATE).map((i) => list[i]);
});
const results: PageResult[] = [];
await pool(sample, 6, async (u) => { results.push(await checkPage(u)); });
judgePages(results);
await checkRedirects(sample.filter((u) => templateOf(pathOf(u)) !== 'Trang chủ'));
await check404();

const NAMES: Record<Level, string> = { blocker: 'CHẶN DEPLOY', serious: 'NGHIÊM TRỌNG', warn: 'CẢNH BÁO' };
const lines: string[] = [];
for (const lv of ['blocker', 'serious', 'warn'] as Level[]) {
  const list = [...new Set(found[lv])];
  if (!list.length) continue;
  lines.push(`\n${NAMES[lv]} (${list.length})`);
  for (const m of list.slice(0, 40)) lines.push(`  - ${m}`);
  if (list.length > 40) lines.push(`  … và ${list.length - 40} dòng nữa`);
}
const summary = `${urls.length} trang trong sitemap, kiểm mẫu ${results.length} trang / ${byTpl.size} loại, ${((Date.now() - t0) / 1000).toFixed(0)} giây — ` +
  `${found.blocker.length} chặn, ${found.serious.length} nghiêm trọng, ${found.warn.length} cảnh báo`;
console.log(lines.join('\n') || '\nKhông có lỗi.');
console.log(`\n${summary}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    `## Cổng SEO — ${BASE}`, '', summary, '',
    ...(['blocker', 'serious', 'warn'] as Level[]).flatMap((lv) => found[lv].length ? [`### ${NAMES[lv]}`, ...[...new Set(found[lv])].slice(0, 60).map((m) => `- ${m}`), ''] : []),
  ].join('\n') + '\n');
}

const fail = found.blocker.length > 0 || (STRICT && found.serious.length > 0);
if (fail) console.error(found.blocker.length ? '\n✗ Có lỗi CHẶN DEPLOY.' : '\n✗ Có lỗi nghiêm trọng (GATE_STRICT=1).');
else console.log('\n✓ Qua cổng SEO.');
process.exit(fail ? 1 : 0);
