/**
 * Kiểm tra phân trang, bộ lọc, tìm kiếm và URL có tham số (mục 6 checklist SEO): `npm run seo:params` (máy dev,
 * http://localhost:3000) hoặc `npm run seo:params -- https://www.caycanhmientay.com` (web thật — chạy sau mỗi lần deploy
 * cùng các công cụ seo:* khác).
 *
 * Với mọi trang danh sách trong sitemap (danh mục, thư viện bệnh, Góc chăm cây, Truyền thông, Video):
 *  - đi theo link <a href> phân trang (không cần JavaScript) tới hết các trang: mỗi trang 200, canonical tự trỏ chính nó,
 *    không noindex, trang cuối không có link "sau"; danh mục: sản phẩm không lặp / không thiếu giữa các trang;
 *  - ?trang=1 / 0 / -1 / abc / 02 / 99999, tham số lặp, tham số lạ → chuyển hướng về đúng URL trong ≤ 2 bước, không vòng lặp;
 *    tham số theo dõi (utm_…) không bị chuyển hướng và không đổi canonical;
 *  - link trên trang dẫn tới tổ hợp ≥ 2 bộ lọc / sắp xếp / trang đang lọc phải có rel="nofollow".
 * Danh mục (bộ lọc sản phẩm): giá trị sai, thứ tự khác, sắp xếp mặc định → 308 một bước về dạng chuẩn; trang lọc / sắp xếp /
 * lọc không kết quả là 200 + noindex + canonical về trang gốc (không chặn trong robots.txt để Google đọc được noindex).
 * Tìm kiếm: chặn trong robots.txt, noindex, chuỗi lạ (<script>, ký tự điều khiển, 5000 ký tự, emoji) không gây lỗi 500,
 * không lọt thẻ HTML thô, được rút gọn về URL chuẩn.
 * Có lỗi thì thoát mã 1. Kiểm máy khác tên miền chính thì URL được đổi sang máy đó để mở.
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const MAX_PAGES = 60;

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string, loc: string) => errors.push(`${m} — ${loc}`);
const warn = (m: string, loc: string) => warnings.push(`${m} — ${loc}`);

let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const site = (u: string) => (u.startsWith(BASE) ? siteOrigin + u.slice(BASE.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const abs = (href: string) => new URL(decode(href), siteOrigin).href;
const short = (u: string) => u.replace(siteOrigin, '');

type Hop = { url: string; status: number; location?: string };
/** Mở URL, đi theo chuyển hướng (tối đa 6 bước); trả các bước + HTML trang cuối. */
async function chain(url: string): Promise<{ hops: Hop[]; final: string; status: number; html: string; headers: Headers }> {
  const hops: Hop[] = [];
  let cur = url;
  for (let i = 0; i < 6; i++) {
    const res = await fetch(local(cur), { redirect: 'manual', headers: { 'User-Agent': UA } });
    const location = res.headers.get('location') ?? undefined;
    hops.push({ url: cur, status: res.status, location });
    if (res.status >= 300 && res.status < 400 && location) {
      await res.arrayBuffer();
      cur = site(new URL(location, local(cur)).href);
      if (hops.some((h) => h.url === cur)) return { hops, final: cur, status: 508, html: '', headers: res.headers };
      continue;
    }
    return { hops, final: cur, status: res.status, html: await res.text(), headers: res.headers };
  }
  return { hops, final: cur, status: 310, html: '', headers: new Headers() };
}

const canonicalOf = (html: string) => decode(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(html)?.[1] ?? /<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"/.exec(html)?.[1] ?? '');
const robotsOf = (html: string) => (/<meta\b[^>]*name="robots"[^>]*content="([^"]+)"/.exec(html)?.[1] ?? '').toLowerCase();
const noindex = (html: string, headers?: Headers) => /noindex/.test(robotsOf(html)) || /noindex/.test(headers?.get('x-robots-tag') ?? '');
const anchors = (html: string) => [...html.matchAll(/<a\b([^>]*)>/g)].map((m) => ({
  href: /\bhref="([^"]*)"/.exec(m[1])?.[1], rel: /\brel="([^"]*)"/.exec(m[1])?.[1] ?? '', tag: m[1],
})).filter((a): a is { href: string; rel: string; tag: string } => !!a.href && !a.href.startsWith('#'));
const pagerLinks = (html: string) => {
  const nav = /<nav\b[^>]*class="vx-pager"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '';
  return { next: /<a\b[^>]*aria-label="Trang sau"[^>]*>/.test(nav), links: anchors(nav).map((a) => ({ url: abs(a.href), rel: a.rel })) };
};
/** Sản phẩm trong lưới: link phủ thẻ (.app-pcard__cover) — mỗi thẻ đúng một link này. */
const productCards = (html: string) => anchors(html).filter((a) => /class="app-pcard__cover"/.test(a.tag)).map((a) => a.href);

/** Chuyển hướng phải về đúng `want`, trong số bước cho phép, mã 301/308 (vĩnh viễn) hoặc 307 khi `temp`. */
async function expectRedirect(from: string, want: string, what: string, o: { maxHops?: number; temp?: boolean } = {}) {
  const c = await chain(from);
  const redirects = c.hops.filter((h) => h.status >= 300 && h.status < 400);
  if (c.status === 508) return err(`${what}: vòng lặp chuyển hướng (${c.hops.map((h) => short(h.url)).join(' → ')})`, from);
  if (c.status !== 200) return err(`${what}: trang cuối trả ${c.status}`, from);
  if (!redirects.length) return err(`${what}: không chuyển hướng (200 ngay, URL trùng nội dung)`, from);
  if (c.final !== want) return err(`${what}: chuyển về ${short(c.final)} (cần ${short(want)})`, from);
  if (redirects.length > (o.maxHops ?? 1)) err(`${what}: ${redirects.length} bước chuyển hướng (${c.hops.map((h) => `${h.status} ${short(h.url)}`).join(' → ')})`, from);
  if (!o.temp && redirects.some((h) => h.status !== 308 && h.status !== 301)) err(`${what}: chuyển hướng tạm (${redirects.map((h) => h.status).join(', ')}) — nên 308`, from);
}

const withQ = (u: string, q: string) => u + (u.includes('?') ? '&' : '?') + q;

/** Đi hết các trang của một danh sách qua link phân trang. */
async function walkPages(start: string, products: boolean) {
  const seen = new Set<string>();
  const queue = [start];
  const items = new Map<string, string>();
  let total: number | undefined;
  while (queue.length && seen.size < MAX_PAGES) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    const c = await chain(url);
    if (c.hops.length > 1 || c.status !== 200) { err(`Link phân trang ${c.hops.length > 1 ? 'bị chuyển hướng' : `trả ${c.status}`}`, url); continue; }
    if (canonicalOf(c.html) !== url) err(`Trang phân trang có canonical ${short(canonicalOf(c.html)) || '(không có)'} (cần tự trỏ chính nó)`, url);
    if (noindex(c.html, c.headers)) err('Trang phân trang của danh sách gốc bị noindex', url);
    const p = pagerLinks(c.html);
    const n = Number(new URL(url).searchParams.get('trang') ?? 1);
    const max = Math.max(1, ...p.links.map((l) => Number(new URL(l.url).searchParams.get('trang') ?? 1)));
    if (n >= max && p.next) err('Trang cuối vẫn có link "Trang sau"', url);
    for (const l of p.links) {
      if (/[?&]trang=1(&|$)/.test(l.url)) err(`Link phân trang tới ?trang=1 (${short(l.url)}) — trang 1 phải là URL gốc`, url);
      if (l.rel.includes('nofollow')) err(`Link phân trang của danh sách gốc bị nofollow (${short(l.url)})`, url);
      if (!seen.has(l.url)) queue.push(l.url);
    }
    if (products) {
      total ??= Number(/<h1\b[^>]*>[\s\S]*?<small>(\d+)\s*sản phẩm<\/small>/.exec(c.html.replace(/<!--[\s\S]*?-->/g, ''))?.[1] ?? NaN);
      for (const href of productCards(c.html)) {
        const key = abs(href);
        if (items.has(key)) err(`Sản phẩm ${short(key)} lặp lại ở ${short(items.get(key)!)} và trang này`, url);
        else items.set(key, url);
      }
    }
  }
  if (products && total !== undefined && Number.isFinite(total) && items.size !== total) err(`Đi hết ${seen.size} trang chỉ thấy ${items.size}/${total} sản phẩm (thiếu hoặc lặp)`, start);
  return seen.size;
}

/** Link trên trang gốc dẫn tới tổ hợp ≥ 2 bộ lọc hoặc có sắp xếp → phải nofollow. */
function checkFacetLinks(html: string, loc: string, keys: string[], sortKey?: string) {
  for (const a of anchors(html)) {
    let u: URL;
    try { u = new URL(decode(a.href), siteOrigin); } catch { continue; }
    if (u.origin !== siteOrigin || u.pathname !== new URL(loc).pathname) continue;
    const n = keys.filter((k) => u.searchParams.has(k)).length;
    const sorted = sortKey ? u.searchParams.has(sortKey) : false;
    if ((n >= 2 || sorted || u.searchParams.has('q')) && !a.rel.includes('nofollow')) err(`Link tới tổ hợp lọc ${short(u.href)} thiếu rel="nofollow"`, loc);
  }
}

async function main() {
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  siteOrigin = new URL(index).origin;
  const locs = async (u: string) => [...(await (await fetch(local(u))).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const pages: string[] = [];
  for (const child of await locs(index)) pages.push(...await locs(child));

  const listing = pages.filter((u) => {
    const p = new URL(u);
    return /^\/danh-muc\/[^/]+(\/[^/]+)?$/.test(p.pathname) || ['/benh-cay', '/goc-cham-cay', '/tin-tuc', '/video'].includes(p.pathname);
  });
  console.log(`Kiểm ${listing.length} trang danh sách + tìm kiếm của ${BASE}…`);
  let walked = 0;

  for (const L of listing) {
    const path = new URL(L).pathname;
    const isCat = path.startsWith('/danh-muc/');
    const paged = isCat || path === '/benh-cay' || path === '/tin-tuc' || (path === '/goc-cham-cay' && L.includes('chuyen-muc='));
    if (paged) walked += await walkPages(L, isCat);

    // Biến thể tham số
    if (paged) {
      for (const bad of ['trang=1', 'trang=0', 'trang=-1', 'trang=abc', 'trang=02', 'trang=']) await expectRedirect(withQ(L, bad), L, `?${bad}`);
      await expectRedirect(withQ(L, 'trang=99999'), L, '?trang=99999 (quá số trang)', { maxHops: 2, temp: true }).catch(() => {});
    } else {
      await expectRedirect(withQ(L, 'trang=2'), L, '?trang= ở trang không phân trang');
    }
    await expectRedirect(withQ(L, 'tham-so-la=1'), L, 'Tham số lạ');
    const utm = await chain(withQ(L, 'utm_source=zalo&fbclid=abc'));
    if (utm.hops.length > 1) err('Thêm utm_… / fbclid bị chuyển hướng (mất số liệu quảng cáo)', L);
    else if (canonicalOf(utm.html) !== L) err(`Thêm utm_… làm canonical thành ${short(canonicalOf(utm.html))}`, L);
    const first = await chain(L);

    if (isCat) {
      checkFacetLinks(first.html, L, ['vi-tri', 'kich-thuoc', 'mau', 'menh', 'khac', 'nha-vuon'], 'sap_xep');
      const cayCanh = path.startsWith('/danh-muc/cay-canh');
      await expectRedirect(withQ(L, 'sap_xep=pho-bien'), L, 'Sắp xếp mặc định');
      await expectRedirect(withQ(L, 'sap_xep=khong-co'), L, 'Sắp xếp sai');
      await expectRedirect(withQ(L, 'mau=khong-co'), L, 'Giá trị lọc sai');
      await expectRedirect(withQ(L, 'khac=con-hang&khac=giam-gia'), withQ(L, 'khac=con-hang'), 'Tham số lặp', { maxHops: 2 });
      if (cayCanh) {
        await expectRedirect(withQ(L, 'mau=vang,xanh'), withQ(L, 'mau=xanh,vang'), 'Giá trị lọc khác thứ tự');
        await expectRedirect(withQ(L, 'sap_xep=gia-tang&vi-tri=trong-nha'), withQ(L, 'vi-tri=trong-nha&sap_xep=gia-tang'), 'Tham số khác thứ tự');
      }
      for (const q of ['sap_xep=gia-tang', 'khac=con-hang', 'khac=giam-gia,con-hang,moi']) {
        const c = await chain(withQ(L, q));
        if (c.status !== 200) { err(`?${q} trả ${c.status}`, L); continue; }
        if (c.hops.length > 1) { err(`?${q} bị chuyển hướng tới ${short(c.final)}`, L); continue; }
        if (!noindex(c.html)) err(`Trang lọc / sắp xếp ?${q} không noindex`, L);
        if (!/follow/.test(robotsOf(c.html)) || /nofollow/.test(robotsOf(c.html))) err(`Trang lọc ?${q} phải "noindex, follow"`, L);
        if (canonicalOf(c.html) !== L) err(`Trang lọc ?${q} có canonical ${short(canonicalOf(c.html))} (cần trang gốc)`, L);
        checkFacetLinks(c.html, L, [], undefined);
      }
    }
    if (path === '/benh-cay') {
      checkFacetLinks(first.html, L, ['bo_phan', 'nguyen_nhan', 'cay']);
      await expectRedirect(withQ(L, 'bo_phan=khong-co'), L, 'Bộ phận sai');
      await expectRedirect(withQ(L, 'q=+++'), L, 'Ô tìm toàn khoảng trắng');
      const one = await chain(withQ(L, 'bo_phan=la'));
      if (one.status !== 200 || !noindex(one.html) || canonicalOf(one.html) !== L) err('Trang lọc ?bo_phan=la phải 200 + noindex + canonical /benh-cay', L);
    }
  }

  // ---- Tìm kiếm ----
  const S = `${siteOrigin}/tim-kiem`;
  if (!/^disallow:\s*\/tim-kiem/im.test(robots)) err('robots.txt chưa chặn /tim-kiem', `${siteOrigin}/robots.txt`);
  const nasty: [string, string][] = [
    ['q=%3Cscript%3Ealert(1)%3C%2Fscript%3E', 'thẻ <script>'],
    ['q=%22%3E%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E', 'thẻ <img onerror>'],
    [`q=${'a'.repeat(5000)}`, 'chuỗi 5000 ký tự'],
    ['q=c%C3%A2y%00%01%E2%80%8B', 'ký tự điều khiển'],
    ['q=%F0%9F%8C%B5%20x%C6%B0%C6%A1ng%20r%E1%BB%93ng', 'emoji + có dấu'],
    ['q=%E0%A4%A', 'mã %-sai'],
    ['q=kim&q=ti%E1%BB%81n', 'tham số lặp'],
    ['q=zzzzqqqxxx', 'không có kết quả'],
    ['q=', 'ô rỗng'],
  ];
  for (const [q, what] of nasty) {
    const c = await chain(`${S}?${q}`);
    if (c.status === 508 || c.status === 310) { err(`Tìm kiếm (${what}): vòng lặp / quá nhiều chuyển hướng`, `${S}?${q.slice(0, 60)}`); continue; }
    if (c.status >= 500) { err(`Tìm kiếm (${what}) trả ${c.status}`, `${S}?${q.slice(0, 60)}`); continue; }
    if (c.status !== 200 && c.status !== 400) { err(`Tìm kiếm (${what}) trả ${c.status}`, `${S}?${q.slice(0, 60)}`); continue; }
    if (c.status === 200 && !noindex(c.html, c.headers)) err(`Trang tìm kiếm (${what}) không noindex`, `${S}?${q.slice(0, 60)}`);
    if (/<script>alert\(1\)|<img src=x onerror/i.test(c.html)) err(`Tìm kiếm (${what}): chữ người dùng lọt vào HTML thô`, `${S}?${q.slice(0, 60)}`);
    if (c.final.length > 400) err(`Tìm kiếm (${what}): URL sau cùng dài ${c.final.length} ký tự (chưa rút gọn)`, `${S}?${q.slice(0, 60)}`);
  }
  console.log(`Đã đi ${walked} trang phân trang.`);
}

await main().catch((e) => errors.push(`Lỗi khi kiểm tra: ${(e as Error).message}`));
for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✗ ${e}`);
console.log(errors.length ? `\n${errors.length} lỗi, ${warnings.length} cảnh báo.` : `\nPhân trang, bộ lọc, tìm kiếm đạt (${warnings.length} cảnh báo).`);
process.exit(errors.length ? 1 : 0);
