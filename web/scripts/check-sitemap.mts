/**
 * Kiểm tra sitemap (mục 1.5 checklist SEO): `npm run seo:sitemap` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:sitemap -- https://www.caycanhmientay.com` (web thật, nên chạy sau mỗi lần deploy).
 *
 * Đọc robots.txt → /sitemap.xml (chỉ mục) → từng sitemap con, rồi mở TỪNG trang + ảnh trong đó bằng UA Googlebot. Báo lỗi khi:
 * file không phải XML UTF-8, vượt 50.000 URL / 50MB, URL không tuyệt đối / không https / khác tên miền chính, URL trùng,
 * trang không trả 200 (404, 500, chuyển hướng), trang có noindex (thẻ meta hoặc X-Robots-Tag), canonical trỏ sang URL khác,
 * URL bị robots.txt chặn, ảnh không tải được. Có lỗi thì thoát mã 1 (dùng được trong CI / cron).
 * Khi kiểm máy khác tên miền chính (localhost, *.vercel.app) thì URL trong sitemap được đổi sang máy đó để mở.
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const MAX_URLS = 50_000;
const MAX_BYTES = 50 * 1024 * 1024;
const CONCURRENCY = 6;

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const get = (url: string) => fetch(url, { redirect: 'manual', headers: { 'User-Agent': UA } });
const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const tags = (xml: string, tag: string) => [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => decode(m[1].trim()));

let siteOrigin = '';
/** URL trong sitemap (tên miền chính) → URL để mở trên máy đang kiểm. */
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);

// ---- robots.txt: luật cho mọi máy (User-agent: *), so khớp tiền tố dài nhất như Google ----
type Rule = { allow: boolean; path: string };
function parseRobots(txt: string) {
  const rules: Rule[] = [];
  const sitemaps: string[] = [];
  let forAll = false;
  for (const raw of txt.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const [k, ...rest] = line.split(':');
    const v = rest.join(':').trim();
    const key = k.toLowerCase();
    if (key === 'user-agent') forAll = v === '*';
    else if (key === 'sitemap') sitemaps.push(v);
    else if (forAll && (key === 'allow' || key === 'disallow') && v) rules.push({ allow: key === 'allow', path: v });
  }
  return { rules, sitemaps };
}
const blocked = (rules: Rule[], path: string) => {
  const hit = rules.filter((r) => path.startsWith(r.path)).sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow))[0];
  return hit ? !hit.allow : false;
};

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

async function readXml(url: string, label: string) {
  const res = await get(local(url));
  if (res.status !== 200) { err(`${label}: mã ${res.status} (cần 200) — ${url}`); return null; }
  const type = res.headers.get('content-type') ?? '';
  if (!/xml/.test(type)) err(`${label}: Content-Type "${type}" không phải XML`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) err(`${label}: nặng ${(buf.length / 1048576).toFixed(1)}MB (tối đa 50MB chưa nén)`);
  const xml = buf.toString('utf8');
  if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>/.test(xml)) err(`${label}: thiếu dòng khai báo <?xml … encoding="UTF-8"?>`);
  if (xml.includes('�')) err(`${label}: có ký tự không phải UTF-8`);
  return xml;
}

async function main() {
  console.log(`Kiểm tra sitemap trên ${BASE}\n`);

  const robotsRes = await get(`${BASE}/robots.txt`);
  const robots = robotsRes.status === 200 ? parseRobots(await robotsRes.text()) : (err(`robots.txt: mã ${robotsRes.status}`), { rules: [], sitemaps: [] });
  if (!robots.sitemaps.length) err('robots.txt: chưa khai báo dòng Sitemap:');

  const indexUrl = robots.sitemaps[0] ?? `${BASE}/sitemap.xml`;
  siteOrigin = new URL(indexUrl).origin;
  if (!indexUrl.startsWith('https://')) err(`robots.txt: Sitemap phải là https — ${indexUrl}`);

  const index = await readXml(indexUrl, 'sitemap.xml');
  if (!index) return;
  if (!index.includes('<sitemapindex')) err('sitemap.xml: không phải file chỉ mục <sitemapindex>');
  const children = tags(index, 'loc');
  console.log(`Chỉ mục có ${children.length} sitemap con.`);

  const seen = new Set<string>();
  const pages: string[] = [];
  const images = new Set<string>();
  for (const child of children) {
    if (!child.startsWith(`${siteOrigin}/`)) err(`sitemap.xml: sitemap con khác tên miền chính — ${child}`);
    const name = child.split('/').pop()!;
    const xml = await readXml(child, name);
    if (!xml) continue;
    const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
    if (urls.length > MAX_URLS) err(`${name}: ${urls.length} URL (tối đa ${MAX_URLS})`);
    if (!urls.length) warn(`${name}: không có URL nào`);
    for (const u of urls) {
      const [loc] = tags(u, 'loc');
      const lastmod = tags(u, 'lastmod')[0];
      if (!loc?.startsWith(`${siteOrigin}/`) || !loc.startsWith('https://')) err(`${name}: URL không tuyệt đối / không https / khác tên miền chính — ${loc}`);
      if (seen.has(loc)) err(`${name}: URL trùng — ${loc}`);
      seen.add(loc);
      if (lastmod && (Number.isNaN(Date.parse(lastmod)) || Date.parse(lastmod) > Date.now() + 86_400_000)) err(`${name}: lastmod sai hoặc ở tương lai (${lastmod}) — ${loc}`);
      if (/[?&](utm_|fbclid|gclid|sap_xep|trang=|v=)/.test(loc)) err(`${name}: URL có tham số theo dõi / lọc / phân trang — ${loc}`);
      pages.push(loc);
      for (const img of tags(u, 'image:loc')) images.add(img);
    }
    console.log(`  ${name}: ${urls.length} URL`);
  }

  const checkNoindex = !/\.vercel\.app$/.test(new URL(BASE).hostname);
  if (!checkNoindex) warn('Đang kiểm bản *.vercel.app (cả bản bị gắn noindex có chủ đích) — bỏ qua kiểm tra noindex.');

  console.log(`\nMở ${pages.length} trang + ${images.size} ảnh…`);
  await pool(pages, async (loc) => {
    const path = new URL(loc).pathname + new URL(loc).search;
    if (blocked(robots.rules, path)) err(`Bị robots.txt chặn — ${loc}`);
    let res: Response;
    try { res = await get(local(loc)); } catch (e) { err(`Không mở được (${(e as Error).message}) — ${loc}`); return; }
    if (res.status !== 200) {
      err(`Mã ${res.status}${res.headers.get('location') ? ` → ${res.headers.get('location')}` : ''} (cần 200) — ${loc}`);
      return;
    }
    const html = await res.text();
    if (checkNoindex && /noindex/i.test(res.headers.get('x-robots-tag') ?? '')) err(`X-Robots-Tag noindex — ${loc}`);
    const meta = /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i.exec(html)?.[1] ?? /<meta[^>]+content="([^"]*)"[^>]+name="robots"/i.exec(html)?.[1];
    if (checkNoindex && meta && /noindex/i.test(meta)) err(`Trang có noindex (${meta}) — ${loc}`);
    const canonical = /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i.exec(html)?.[1] ?? /<link[^>]+href="([^"]*)"[^>]+rel="canonical"/i.exec(html)?.[1];
    if (!canonical) err(`Thiếu canonical — ${loc}`);
    // so bằng URL đã chuẩn hóa: "https://www.x.com" và "https://www.x.com/" là cùng một trang chủ
    else if (new URL(decode(canonical), loc).href !== new URL(loc).href) err(`Canonical trỏ sang URL khác (${decode(canonical)}) — ${loc}`);
  });
  await pool([...images], async (img) => {
    if (blocked(robots.rules, new URL(img).pathname)) err(`Ảnh bị robots.txt chặn — ${img}`);
    try {
      const res = await get(local(img));
      if (res.status !== 200) err(`Ảnh mã ${res.status} — ${img}`);
      else if (!(res.headers.get('content-type') ?? '').startsWith('image/')) err(`Ảnh trả về không phải ảnh — ${img}`);
      await res.body?.cancel();
    } catch (e) { err(`Không tải được ảnh (${(e as Error).message}) — ${img}`); }
  });
}

await main().catch((e) => err(`Lỗi khi kiểm tra: ${(e as Error).message}`));
for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `\n${errors.length} lỗi.` : '\nSitemap đạt: mọi URL trả 200, không noindex, canonical đúng, không bị robots.txt chặn.');
process.exit(errors.length ? 1 : 0);
