/**
 * Giám sát SEO định kỳ (mục 19 checklist SEO): `npm run seo:monitor -- https://www.caycanhmientay.com`.
 * GitHub Actions "Giám sát web" chạy mỗi 6 giờ — lỗi thì GitHub gửi email; báo cáo ghi vào trang tóm tắt của lần chạy.
 *
 * Phần 1 (không cần gì thêm): sitemap còn / XML hợp lệ; mọi trang sitemap mở bằng Googlebot → mã HTTP (404 / 5xx /
 * chuyển hướng), thời gian phản hồi (trung vị, p95), noindex, canonical trỏ chỗ khác, thiếu title / canonical trên từng loại
 * trang; trang mới trong sitemap chưa có link nội bộ nào; so với lần chạy trước (MONITOR_BASELINE=<file>): số trang lỗi tăng,
 * thời gian phản hồi tăng gấp đôi.
 * Phần 2 (cần SEO_MONITOR_TOKEN — biến môi trường trên Vercel + secret GitHub cùng tên): đọc /api/giam-sat/tong-hop —
 * nhiều đường dẫn 404 mới (deploy làm gãy link?), 404 mới có backlink / Googlebot ghé, lỗi máy chủ, lỗi hydration,
 * Googlebot thật không ghé 2 ngày.
 * robots.txt đổi bất thường, chứng chỉ, header bảo mật: seo:security (cùng workflow). Có lỗi thì thoát mã 1.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CONCURRENCY = 6;
const SLOW_MS = 1500, VERY_SLOW_MS = 5000;
const NEW_404_ALERT = 30;

const errors: string[] = [], warnings: string[] = [], notes: string[] = [];
const err = (s: string) => errors.push(s), warn = (s: string) => warnings.push(s), note = (s: string) => notes.push(s);
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
let origin = '';
const local = (u: string) => (origin && u.startsWith(origin) ? BASE + u.slice(origin.length) : u);
const short = (u: string) => u.replace(origin, '') || '/';

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (i < items.length) await fn(items[i++]); }));
}

type Res = { url: string; status: number; ms: number; location: string | null; html: string };
async function get(url: string): Promise<Res> {
  const t = Date.now();
  try {
    const r = await fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20_000) });
    const html = /html/.test(r.headers.get('content-type') ?? '') ? await r.text() : (await r.body?.cancel(), '');
    return { url, status: r.status, ms: Date.now() - t, location: r.headers.get('location'), html };
  } catch { return { url, status: 0, ms: Date.now() - t, location: null, html: '' }; }
}

const template = (u: string) => { const p = new URL(u).pathname.split('/').filter(Boolean); return p.length ? (p.length > 1 ? `${p[0]}/*` : p[0]) : 'trang-chu'; };
const pct = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };

async function main() {
  console.log(`Giám sát SEO ${BASE}\n`);
  // ---- Sitemap
  const robots = await (await fetch(`${BASE}/robots.txt`)).text().catch(() => '');
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) { err('robots.txt không khai báo Sitemap (hoặc không tải được)'); return finish({}); }
  origin = new URL(index).origin;
  const urls: string[] = [];
  const idx = await fetch(local(index)).then(async (r) => ({ status: r.status, xml: await r.text() })).catch(() => ({ status: 0, xml: '' }));
  if (idx.status !== 200 || !/<sitemapindex[\s>]/.test(idx.xml) || !/<\/sitemapindex>\s*$/.test(idx.xml.trim() + '\n')) err(`Sitemap chỉ mục ${short(index)} mất hoặc XML không hợp lệ (mã ${idx.status})`);
  for (const child of [...idx.xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]))) {
    const r = await fetch(local(child)).then(async (x) => ({ status: x.status, xml: await x.text() })).catch(() => ({ status: 0, xml: '' }));
    if (r.status !== 200 || !/<urlset[\s>]/.test(r.xml) || !r.xml.trim().endsWith('</urlset>')) { err(`Sitemap ${short(child)} mất hoặc XML không hợp lệ (mã ${r.status})`); continue; }
    urls.push(...[...r.xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1])));
  }
  if (!urls.length) err('Sitemap không có trang nào');

  // ---- Từng trang
  const res: Res[] = [];
  const linked = new Set<string>();
  const byTemplate = new Map<string, { title: number; canonical: number; n: number }>();
  await pool([...new Set(urls)], async (u) => {
    const r = await get(u);
    res.push(r);
    const at = short(u);
    if (r.status === 0) return err(`${at}: không trả lời (quá 20 giây / lỗi mạng)`);
    if (r.status >= 500) return err(`${at}: lỗi máy chủ ${r.status}`);
    if (r.status === 404 || r.status === 410) return err(`${at}: trong sitemap nhưng trả ${r.status}`);
    if (r.status >= 300 && r.status < 400) return err(`${at}: trong sitemap nhưng chuyển hướng ${r.status} → ${r.location ?? '?'}`);
    if (r.status !== 200) return err(`${at}: mã ${r.status}`);
    if (r.ms > VERY_SLOW_MS) err(`${at}: phản hồi ${r.ms}ms`);
    const head = r.html.split(/<\/head>/i)[0];
    const robotsMeta = /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i.exec(head)?.[1] ?? '';
    if (/noindex/i.test(robotsMeta)) err(`${at}: trong sitemap nhưng noindex`);
    const canonical = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i.exec(head)?.[1];
    if (canonical && decode(canonical) !== u) err(`${at}: canonical trỏ sang ${short(decode(canonical))}`);
    const t = byTemplate.get(template(u)) ?? { title: 0, canonical: 0, n: 0 };
    t.n++; if (/<title[\s>][^<]*\S/.test(head)) t.title++; if (canonical) t.canonical++;
    byTemplate.set(template(u), t);
    for (const m of r.html.matchAll(/<a\b[^>]*\bhref="([^"#]+)"/g)) {
      try {
        const x = new URL(decode(m[1]), u);
        if (x.origin === origin || x.origin === BASE) linked.add(origin + x.pathname + x.search);
      } catch { /* bỏ */ }
    }
  });
  for (const [t, v] of byTemplate) {
    if (v.title < v.n) err(`Loại trang ${t}: ${v.n - v.title}/${v.n} trang thiếu <title>`);
    if (v.canonical < v.n) err(`Loại trang ${t}: ${v.n - v.canonical}/${v.n} trang thiếu canonical`);
  }
  // Trang phân trang (?trang=) cũng là chỗ link tới sản phẩm / bài → mở thêm để tính link.
  const pagers = [...linked].filter((u) => /[?&]trang=\d+/.test(u) && !urls.includes(u)).slice(0, 60);
  await pool(pagers, async (u) => {
    const r = await get(u);
    for (const m of r.html.matchAll(/<a\b[^>]*\bhref="([^"#]+)"/g)) { try { const x = new URL(decode(m[1]), u); linked.add(origin + x.pathname + x.search); } catch { /* bỏ */ } }
  });
  const orphans = urls.filter((u) => short(u) !== '/' && !linked.has(u));
  for (const u of orphans.slice(0, 20)) err(`${short(u)}: trong sitemap nhưng không trang nào link tới (trang mới chưa có link nội bộ?)`);

  const ok = res.filter((r) => r.status === 200).map((r) => r.ms);
  const p50 = pct(ok, 0.5), p95 = pct(ok, 0.95);
  if (p95 > SLOW_MS) warn(`Thời gian phản hồi chậm: p95 ${p95}ms (trung vị ${p50}ms)`);
  const bad = res.filter((r) => r.status !== 200).length;
  note(`${urls.length} trang sitemap · ${bad} lỗi / chuyển hướng · phản hồi trung vị ${p50}ms, p95 ${p95}ms · ${orphans.length} trang mồ côi`);

  // ---- Số liệu ghi trên máy chủ
  const token = process.env.SEO_MONITOR_TOKEN;
  if (!token) warn('Chưa có SEO_MONITOR_TOKEN — bỏ qua phần 404 / lỗi máy chủ / Googlebot (đặt biến trên Vercel + secret GitHub cùng tên)');
  else {
    const r = await fetch(`${BASE}/api/giam-sat/tong-hop?gio=6`, { headers: { authorization: `Bearer ${token}` } }).catch(() => null);
    if (!r || r.status !== 200) err(`/api/giam-sat/tong-hop trả mã ${r?.status ?? 'lỗi mạng'} (token trên Vercel và GitHub khác nhau?)`);
    else {
      const h = await r.json() as {
        notFound: { active: number; fresh: number; fresh_backlink: number; fresh_bot: number; newPaths: { path: string; hits: number; bot_hits: number; referrer: string; external: boolean }[] };
        errors: { kind: string; path: string; message: string; hits: number; fresh: boolean }[];
        googlebot: { day: string; verified: boolean; hits: number }[];
      };
      const nf = h.notFound;
      note(`6 giờ qua: ${nf.active} đường dẫn 404 có lượt (${nf.fresh} mới) · ${h.errors.length} loại lỗi`);
      if (nf.fresh >= NEW_404_ALERT) err(`${nf.fresh} đường dẫn 404 MỚI trong 6 giờ — lần deploy gần nhất làm gãy link? (xem /admin/seo → Theo dõi)`);
      for (const p of nf.newPaths.filter((x) => x.external || x.bot_hits > 0 || x.hits >= 10).slice(0, 10))
        warn(`404 mới ${p.path} (${p.hits} lượt${p.external ? `, link từ ${p.referrer}` : ''}${p.bot_hits ? ', Googlebot đã ghé' : ''}) — nên thêm chuyển hướng`);
      for (const e of h.errors) {
        const line = `${e.kind} ${e.path}: ${e.message.slice(0, 120)} (${e.hits} lượt${e.fresh ? ', mới' : ''})`;
        if (['ssr', 'api', 'action', 'proxy'].includes(e.kind)) (e.fresh || e.hits >= 10 ? err : warn)(`Lỗi máy chủ ${line}`);
        else if (e.kind === 'hydration') warn(`Lỗi hydration ${line}`);
      }
      const real = h.googlebot.filter((g) => g.verified);
      const recent = real.filter((g) => g.day >= new Date(Date.now() - 2 * 86_400_000 + 7 * 3_600_000).toISOString().slice(0, 10)).reduce((n, g) => n + g.hits, 0);
      if (real.length && !recent) warn('Googlebot thật không ghé trang nào trong 2 ngày qua (trước đó có) — xem robots.txt, tường lửa Vercel');
      note(`Googlebot thật 7 ngày: ${real.reduce((n, g) => n + g.hits, 0)} lượt · giả mạo ${h.googlebot.filter((g) => !g.verified).reduce((n, g) => n + g.hits, 0)}`);
    }
  }
  finish({ bad, p50, pages: urls.length });
}

function finish(now: { bad?: number; p50?: number; pages?: number }) {
  const file = process.env.MONITOR_BASELINE;
  if (file && existsSync(file)) {
    const before = JSON.parse(readFileSync(file, 'utf8')) as typeof now;
    if (now.bad !== undefined && before.bad !== undefined && now.bad > before.bad + 3) err(`Số trang lỗi tăng từ ${before.bad} lên ${now.bad} so với lần chạy trước`);
    if (now.p50 && before.p50 && now.p50 > before.p50 * 2 && now.p50 > 800) warn(`Thời gian phản hồi trung vị tăng gấp đôi: ${before.p50}ms → ${now.p50}ms`);
  }
  if (file && !errors.length && now.pages) writeFileSync(file, JSON.stringify(now));

  const out = [
    `## Giám sát SEO ${errors.length ? '✗' : '✓'}`, '', ...notes.map((n) => `- ${n}`), '',
    ...(errors.length ? ['### Lỗi', ...errors.map((e) => `- ${e}`), ''] : []),
    ...(warnings.length ? ['### Cảnh báo', ...warnings.map((w) => `- ${w}`), ''] : []),
  ].join('\n');
  console.log(out);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${out}\n`);
  process.exit(errors.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
