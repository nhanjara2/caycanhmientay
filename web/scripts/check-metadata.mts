/**
 * Kiểm tra title / description / robots (mục 2.1 checklist SEO): `npm run seo:metadata` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:metadata -- https://www.caycanhmientay.com` (web thật, chạy sau mỗi lần deploy cùng seo:sitemap, seo:canonical).
 *
 * Mở mọi trang trong sitemap (UA Googlebot) và kiểm, trong <head>:
 *  - đúng MỘT <title>, không rỗng, không "undefined" / "null" / "[object Object]" / "NaN", không còn thẻ HTML hay mã script;
 *  - đúng MỘT <meta name="description">, cũng không rỗng / không chữ lạ ở trên;
 *  - title và description KHÔNG trùng giữa các trang (trùng = lỗi);
 *  - nhiều nhất MỘT <meta name="robots">, và trang trong sitemap không được noindex.
 * Độ dài chỉ cảnh báo (Google tự cắt): title nên 15–70 ký tự, description 50–170 ký tự.
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính (localhost, *.vercel.app) thì URL được đổi sang máy đó để mở.
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CONCURRENCY = 6;
const TITLE = [15, 70];
const DESC = [50, 170];
const JUNK = /\b(undefined|null|NaN)\b|\[object Object\]/;

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const short = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n)}…` : s);

async function pool<T>(items: T[], fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
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
  return out;
}

const metaContent = (head: string, name: string) =>
  [...head.matchAll(/<meta\b[^>]*>/gi)].flatMap((m) =>
    new RegExp(`\\bname=["']${name}["']`, 'i').test(m[0]) ? [decode(/\bcontent=["']([^"']*)["']/i.exec(m[0])?.[1] ?? '')] : []);

function bad(text: string) {
  if (!text.trim()) return 'rỗng';
  if (JUNK.test(text)) return `có chữ lạ "${JUNK.exec(text)![0]}"`;
  if (/<\/?[a-z][^>]*>|javascript:/i.test(text)) return 'còn thẻ HTML / mã script';
  return null;
}

async function main() {
  console.log(`Kiểm tra title / description trên ${BASE}\n`);
  const pages = await sitemapPages();
  console.log(`${pages.length} trang trong sitemap.`);
  const titles = new Map<string, string[]>();
  const descs = new Map<string, string[]>();

  await pool(pages, async (loc) => {
    const r = await fetch(local(loc), { redirect: 'manual', headers: { 'User-Agent': UA } });
    if (r.status !== 200) { err(`Mã ${r.status} — ${loc}`); return; }
    const html = await r.text();
    const end = html.indexOf('</head>');
    const head = end > 0 ? html.slice(0, end) : '';
    const body = end > 0 ? html.slice(end) : html;

    const t = [...head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1]).trim());
    if (/<title[\s>]/i.test(body.replace(/<svg[\s\S]*?<\/svg>/gi, ''))) err(`<title> nằm ngoài <head> — ${loc}`);
    if (!t.length) err(`Thiếu <title> — ${loc}`);
    else {
      if (t.length > 1) err(`Có ${t.length} thẻ <title> — ${loc}`);
      const why = bad(t[0]);
      if (why) err(`Title ${why}: "${t[0]}" — ${loc}`);
      else if (t[0].length < TITLE[0] || t[0].length > TITLE[1]) warn(`Title ${t[0].length} ký tự (nên ${TITLE[0]}–${TITLE[1]}): "${short(t[0])}" — ${loc}`);
      titles.set(t[0], [...(titles.get(t[0]) ?? []), loc]);
    }

    const d = metaContent(head, 'description');
    if (!d.length) err(`Thiếu meta description — ${loc}`);
    else {
      if (d.length > 1) err(`Có ${d.length} meta description — ${loc}`);
      const why = bad(d[0]);
      if (why) err(`Description ${why}: "${short(d[0])}" — ${loc}`);
      else if (d[0].length < DESC[0] || d[0].length > DESC[1]) warn(`Description ${d[0].length} ký tự (nên ${DESC[0]}–${DESC[1]}): "${short(d[0])}" — ${loc}`);
      descs.set(d[0], [...(descs.get(d[0]) ?? []), loc]);
    }
    if (metaContent(body, 'description').length) err(`meta description nằm ngoài <head> — ${loc}`);

    const robots = metaContent(head, 'robots');
    if (robots.length > 1) err(`Có ${robots.length} meta robots — ${loc}`);
    if (robots.some((x) => /noindex/i.test(x))) err(`Trang trong sitemap có noindex — ${loc}`);
  });

  for (const [t, locs] of titles) if (locs.length > 1) err(`${locs.length} trang dùng chung title "${short(t, 60)}": ${locs.join(', ')}`);
  for (const [d, locs] of descs) if (locs.length > 1) err(`${locs.length} trang dùng chung description "${short(d, 60)}": ${locs.join(', ')}`);
}

await main().catch((e) => err(`Lỗi khi kiểm tra: ${(e as Error).message}`));
for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `\n${errors.length} lỗi, ${warnings.length} cảnh báo.` : `\nMetadata đạt (${warnings.length} cảnh báo độ dài).`);
process.exit(errors.length ? 1 : 0);
