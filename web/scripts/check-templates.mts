/**
 * Kiểm "hợp đồng SEO" của từng loại trang (mục 9 checklist SEO): `npm run seo:templates` (máy dev, http://localhost:3000)
 * hoặc `npm run seo:templates -- https://www.caycanhmientay.com` (web thật — chạy sau mỗi lần deploy cùng các công cụ seo:* khác).
 *
 * Bảng TEMPLATES dưới đây là hợp đồng: mỗi loại trang (trang chủ, danh mục, sản phẩm, bài viết, địa điểm, landing, thẻ chủ đề,
 * tìm kiếm, tài khoản / thanh toán, 404, trang lọc, trang phân trang…) ghi rõ mã trạng thái, được index hay không, canonical trỏ
 * đâu, schema bắt buộc, breadcrumb, các link bắt buộc. Công cụ lấy URL thật của từng loại (từ sitemap + link trên trang) rồi mở
 * bằng UA Googlebot và so với hợp đồng. Loại trang web KHÔNG có (thương hiệu, tác giả, đa ngôn ngữ) được ghi ở NOT_USED kèm lý do,
 * và công cụ báo lỗi nếu lỡ xuất hiện đường dẫn kiểu đó (/thuong-hieu/, /tac-gia/, /en/…).
 * Đổi luật index / canonical / schema của một loại trang thì sửa bảng này cùng lúc.
 * Có lỗi thì thoát mã 1. Loại trang không tìm được URL mẫu (vd. chưa có bài viết) thì chỉ báo "bỏ qua".
 */

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const PER_TEMPLATE = 5;

type Index = 'index' | 'noindex';
type Canon = 'self' | 'base' | 'none' | 'any';
type Contract = {
  name: string;
  status: number;
  index: Index;
  canonical: Canon;
  /** Trang phải bị chặn trong robots.txt (riêng tư / tìm kiếm). */
  blocked?: boolean;
  breadcrumb?: boolean;
  /** Mỗi mục: một trong các @type này phải có trong JSON-LD. */
  schema?: string[][];
  /** Phải có link tới đường dẫn bắt đầu bằng … (mỗi mục một link). */
  links?: string[];
  /** Thêm luật riêng; trả danh sách lỗi. */
  extra?: (p: Page, url: string) => string[];
  /** Index được thì phải có tối thiểu bấy nhiêu chữ trong <main> (chống trang mỏng) — chỉ cảnh báo. */
  minWords?: number;
};

const has = (re: RegExp, msg: string) => (p: Page) => (re.test(p.html) ? [] : [msg]);
const all = (...fs: ((p: Page, url: string) => string[])[]) => (p: Page, url: string) => fs.flatMap((f) => f(p, url));

const TEMPLATES: Record<string, Contract> = {
  home: {
    name: 'Trang chủ', status: 200, index: 'index', canonical: 'self', breadcrumb: false,
    schema: [['Organization'], ['WebSite']], links: ['/danh-muc', '/doi-tac', '/benh-cay', '/goc-cham-cay', '/he-thong-cua-hang'], minWords: 150,
  },
  category: {
    name: 'Danh mục / nhóm con', status: 200, index: 'index', canonical: 'self', breadcrumb: true,
    schema: [['CollectionPage'], ['BreadcrumbList']], links: ['/san-pham/'], minWords: 60,
  },
  product: {
    name: 'Chi tiết sản phẩm', status: 200, index: 'index', canonical: 'self', breadcrumb: true,
    schema: [['BreadcrumbList']], links: ['/danh-muc/'], minWords: 80,
    extra: all(has(/<meta\b[^>]*property="og:image"/, 'thiếu og:image'), (p) => (/"@type":"Product"/.test(p.html) || /Liên hệ báo giá/.test(p.html) ? [] : ['thiếu schema Product (chỉ được thiếu khi "Liên hệ báo giá")'])),
  },
  article: {
    name: 'Bài viết', status: 200, index: 'index', canonical: 'self', breadcrumb: true,
    schema: [['BlogPosting', 'NewsArticle', 'Article', 'VideoObject'], ['BreadcrumbList']], minWords: 120,
    extra: all(
      has(/class="ar-by"/, 'thiếu khối tác giả (ar-by)'),
      has(/<time\b[^>]*dateTime="\d{4}-\d{2}-\d{2}/i, 'thiếu ngày đăng <time datetime>'),
      has(/property="article:published_time"|"datePublished"/, 'thiếu ngày đăng trong meta / schema'),
      (p) => (/"author":\{/.test(p.html) || /"@type":"VideoObject"/.test(p.html) ? [] : ['schema bài thiếu author']),
      has(/<meta\b[^>]*property="og:image"/, 'thiếu ảnh đại diện (og:image)'),
    ),
  },
  disease: {
    name: 'Bài bệnh cây', status: 200, index: 'index', canonical: 'self', breadcrumb: true,
    schema: [['Article'], ['BreadcrumbList']], links: ['/benh-cay'], minWords: 120,
  },
  listing: {
    name: 'Trang danh sách bài / bệnh / video', status: 200, index: 'index', canonical: 'self', breadcrumb: true, minWords: 40,
    extra: (p, url) => {
      const path = new URL(url).pathname;
      return new RegExp(`href="${path}/[a-z0-9-]+"|href="/(goc-cham-cay|tin-tuc)/[a-z0-9-]+"|class="shv-`).test(p.html) ? [] : ['không có link tới trang chi tiết nào'];
    },
  },
  project: {
    name: 'Công trình', status: 200, index: 'index', canonical: 'self', breadcrumb: true, schema: [['BreadcrumbList']], links: ['/doi-tac'], minWords: 40,
  },
  location: {
    name: 'Địa điểm (Hệ thống cửa hàng)', status: 200, index: 'index', canonical: 'self', breadcrumb: true,
    schema: [['GardenStore', 'LocalBusiness', 'Store'], ['BreadcrumbList']], minWords: 40,
    extra: all(has(/href="tel:/, 'thiếu số điện thoại bấm được'), has(/"address":\{/, 'schema cửa hàng thiếu địa chỉ'), has(/"geo":\{/, 'schema cửa hàng thiếu tọa độ')),
  },
  landing: {
    name: 'Landing page', status: 200, index: 'index', canonical: 'self', breadcrumb: true, schema: [['BreadcrumbList']], minWords: 60,
  },
  policy: {
    name: 'Chính sách / giới thiệu', status: 200, index: 'index', canonical: 'self', breadcrumb: true, schema: [['BreadcrumbList']], minWords: 80,
  },
  tag: {
    name: 'Thẻ chủ đề (?the=)', status: 200, index: 'noindex', canonical: 'base',
  },
  filter: {
    name: 'Trang lọc / sắp xếp', status: 200, index: 'noindex', canonical: 'base',
  },
  paged: {
    name: 'Trang phân trang (?trang=n)', status: 200, index: 'index', canonical: 'self', breadcrumb: true,
  },
  search: {
    name: 'Tìm kiếm', status: 200, index: 'noindex', canonical: 'any', blocked: true,
    extra: (p, url) => (new URL(url).searchParams.get('q')?.startsWith('zzq') && !/class="vx-empty|app-empty|Không tìm thấy/i.test(p.html) ? ['tìm không có kết quả mà không có khung "không tìm thấy"'] : []),
  },
  private: {
    name: 'Tài khoản / giỏ / thanh toán', status: 200, index: 'noindex', canonical: 'none', blocked: true,
    extra: (p) => (/\bpublic\b/.test(p.headers.get('cache-control') ?? '') ? ['Cache-Control public — CDN có thể giữ trang riêng tư'] : []),
  },
  // Đường dẫn không khớp trang nào: HTML máy chủ có đủ giao diện (h1 + link về trang chủ).
  notfound: {
    name: 'Trang 404', status: 404, index: 'noindex', canonical: 'none', links: ['/'],
    extra: has(/<h1\b/, 'trang 404 thiếu tiêu đề h1'),
  },
  // Trang gọi notFound() (sản phẩm / bài / danh mục không có): Next 16 trả HTML rỗng <html id="__next_error__">, giao diện
  // hiện sau khi chạy JS (hành vi của Next, app tối giản cũng vậy) — chỉ kiểm mã 404 + noindex + không canonical.
  notfoundCall: {
    name: 'Trang 404 (notFound)', status: 404, index: 'noindex', canonical: 'none',
  },
};

/** Loại trang trong checklist mà web không dùng — lỡ có URL kiểu này thì là lỗi (trang chưa có hợp đồng). */
const NOT_USED: { name: string; why: string; re: RegExp }[] = [
  { name: 'Trang thương hiệu', why: 'web chỉ bán hàng của chính shop; "Thương hiệu" ở trang sản phẩm trỏ /chinh-sach/gioi-thieu', re: /^\/(thuong-hieu|brand)\b/ },
  { name: 'Trang tác giả', why: 'tác giả bài là chữ ghi trên bài + schema author, không có trang riêng', re: /^\/(tac-gia|author)\b/ },
  { name: 'Trang đa ngôn ngữ', why: 'web một ngôn ngữ (mục 8)', re: /^\/(en|vi)(\/|$)/ },
];
const TODO_500 = 'Trang 500: không gây lỗi được từ ngoài — đã thử tay ở mục 1.3 (database chết → 500 + noindex + no-store).';

// ---------------------------------------------------------------------------------------------

type Page = { status: number; html: string; headers: Headers };
let siteOrigin = '';
const local = (u: string) => (siteOrigin && u.startsWith(siteOrigin) ? BASE + u.slice(siteOrigin.length) : u);
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const short = (u: string) => u.replace(siteOrigin, '') || '/';

async function open(url: string): Promise<Page> {
  const res = await fetch(local(url), { redirect: 'manual', headers: { 'User-Agent': UA } });
  return { status: res.status, html: res.status < 300 || res.status >= 400 ? await res.text() : (await res.arrayBuffer(), ''), headers: res.headers };
}
const canonicalOf = (html: string) => {
  // new URL(): "https://…com" và "https://…com/" là một.
  return [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)].map((m) => { const h = decode(/href="([^"]+)"/.exec(m[0])?.[1] ?? ''); try { return new URL(h).href; } catch { return h; } });
};
const robotsOf = (p: Page) => ((/<meta\b[^>]*name="robots"[^>]*content="([^"]*)"/.exec(p.html)?.[1] ?? '') + ' ' + (p.headers.get('x-robots-tag') ?? '')).toLowerCase();
const ldTypes = (html: string) => {
  const out = new Set<string>();
  const walk = (o: unknown) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== 'object') return;
    const t = (o as Record<string, unknown>)['@type'];
    (Array.isArray(t) ? t : [t]).forEach((x) => typeof x === 'string' && out.add(x));
    Object.values(o).forEach(walk);
  };
  for (const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) { try { walk(JSON.parse(m[1])); } catch { /* seo:schema bắt */ } }
  return out;
};
const mainWords = (html: string) => {
  const m = /<main\b[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
  return decode(m.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
};
const hrefs = (html: string) => [...html.matchAll(/<a\b[^>]*href="([^"#][^"]*)"/g)].map((m) => decode(m[1]));

async function sitemapUrls() {
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  const index = /^sitemap:\s*(\S+)/im.exec(robots)?.[1];
  if (!index) throw new Error('robots.txt chưa khai báo Sitemap');
  siteOrigin = new URL(index).origin;
  const locs = async (u: string) => [...(await (await fetch(local(u))).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const out: string[] = [];
  for (const child of await locs(index)) out.push(...await locs(child));
  return { urls: out, disallow: [...robots.matchAll(/^disallow:\s*(\S+)/gim)].map((m) => m[1]), allow: [...robots.matchAll(/^allow:\s*(\S+)/gim)].map((m) => m[1]) };
}

function classify(path: string): keyof typeof TEMPLATES | null {
  if (path === '/') return 'home';
  if (/^\/danh-muc(\/|$)/.test(path)) return 'category';
  if (path.startsWith('/san-pham/')) return 'product';
  if (/^\/(goc-cham-cay|tin-tuc)\/[^/]+$/.test(path)) return 'article';
  if (path.startsWith('/benh-cay/')) return 'disease';
  if (/^\/(benh-cay|goc-cham-cay|tin-tuc|video)$/.test(path)) return 'listing';
  if (path.startsWith('/doi-tac/cong-trinh/')) return 'project';
  if (path === '/he-thong-cua-hang') return 'location';
  if (path.startsWith('/chinh-sach/')) return 'policy';
  return 'landing';
}

const errors: string[] = [];
const warnings: string[] = [];
const skipped: string[] = [];

async function check(kind: keyof typeof TEMPLATES, url: string, ctx: { disallow: string[]; allow: string[] }, base?: string) {
  const c = TEMPLATES[kind];
  const loc = `[${c.name}] ${short(url)}`;
  const p = await open(url);
  const bad = (m: string) => errors.push(`${loc}: ${m}`);
  if (p.status !== c.status) return bad(`mã trạng thái ${p.status}, hợp đồng là ${c.status}`);
  const robots = robotsOf(p);
  if (c.index === 'index' && /noindex/.test(robots)) bad('bị noindex nhưng loại trang này phải index');
  if (c.index === 'noindex' && !/noindex/.test(robots)) bad('thiếu noindex');
  if (c.index === 'noindex' && c.canonical === 'base' && !/(^|[ ,])follow/.test(robots.replace('nofollow', ''))) bad('trang lọc / thẻ phải "noindex, follow"');
  const canon = canonicalOf(p.html);
  if (c.canonical === 'none' && canon.length) bad(`không được có canonical (đang có ${canon[0]})`);
  if (c.canonical === 'self' && (canon.length !== 1 || canon[0] !== url)) bad(`canonical phải trỏ chính nó, đang là ${canon.join(', ') || 'không có'}`);
  if (c.canonical === 'base' && (canon.length !== 1 || canon[0] !== base)) bad(`canonical phải về trang gốc ${base}, đang là ${canon.join(', ') || 'không có'}`);
  const path = new URL(url).pathname;
  const blocked = ctx.disallow.some((d) => path.startsWith(d)) && !ctx.allow.some((a) => path.startsWith(a) && a.length > 1);
  if (c.blocked && !blocked) bad('chưa chặn trong robots.txt');
  if (!c.blocked && blocked) bad('bị robots.txt chặn — Google không đọc được');
  if (c.index === 'index') {
    if (!/<title>[^<]+<\/title>/.test(p.html)) bad('thiếu <title>');
    if (!/<meta\b[^>]*name="description"[^>]*content="[^"]+"/.test(p.html)) bad('thiếu meta description');
    if ((p.html.match(/<h1\b/g) ?? []).length !== 1) bad('không đúng một <h1>');
    const words = mainWords(p.html);
    if (c.minWords && words < c.minWords) warnings.push(`${loc}: <main> chỉ ${words} chữ (nên ≥ ${c.minWords}) — có thể bị coi là trang mỏng`);
  }
  if (c.breadcrumb === true && !/<nav\b[^>]*class="vx-crumb"/.test(p.html)) bad('thiếu breadcrumb');
  if (c.breadcrumb === false && /<nav\b[^>]*class="vx-crumb"/.test(p.html)) bad('không được có breadcrumb');
  const types = ldTypes(p.html);
  for (const want of c.schema ?? []) if (!want.some((t) => types.has(t))) bad(`thiếu schema ${want.join(' / ')}`);
  const links = hrefs(p.html).map((h) => (h.startsWith(siteOrigin) ? h.slice(siteOrigin.length) || '/' : h));
  for (const l of c.links ?? []) if (!links.some((h) => (l === '/' ? h === '/' : h.startsWith(l)))) bad(`thiếu link tới ${l}`);
  for (const m of c.extra?.(p, url) ?? []) bad(m);
  return p;
}

async function main() {
  const { urls, disallow, allow } = await sitemapUrls();
  const ctx = { disallow, allow };
  const groups = new Map<string, string[]>();
  for (const u of urls) {
    const path = new URL(u).pathname;
    for (const n of NOT_USED) if (n.re.test(path)) errors.push(`${short(u)}: ${n.name} chưa có hợp đồng SEO (${n.why}) — thêm vào TEMPLATES trước khi đưa lên sitemap`);
    const k = classify(path);
    if (k) groups.set(k, [...(groups.get(k) ?? []), u]);
  }
  const pick = (k: string) => {
    const l = groups.get(k) ?? [];
    return l.length <= PER_TEMPLATE ? l : [l[0], ...Array.from({ length: PER_TEMPLATE - 1 }, (_, i) => l[Math.floor(((i + 1) * l.length) / PER_TEMPLATE)])];
  };

  const opened = new Map<string, Page>();
  for (const k of Object.keys(TEMPLATES).filter((k) => groups.has(k))) {
    for (const u of pick(k)) { const p = await check(k as keyof typeof TEMPLATES, u, ctx); if (p) opened.set(u, p); }
  }
  for (const k of Object.keys(TEMPLATES)) if (['home', 'category', 'product', 'article', 'disease', 'listing', 'project', 'location', 'landing', 'policy'].includes(k) && !groups.has(k)) skipped.push(`${TEMPLATES[k].name}: sitemap chưa có trang nào`);

  // Trang không nằm trong sitemap: lấy từ link trên trang đã mở.
  const allLinks = [...opened.entries()].flatMap(([u, p]) => hrefs(p.html).map((h) => ({ from: u, to: new URL(h, siteOrigin).href }))).filter((l) => l.to.startsWith(siteOrigin));
  const findLink = (re: RegExp) => allLinks.find((l) => re.test(l.to.slice(siteOrigin.length)));

  const tag = findLink(/^\/goc-cham-cay\?the=/);
  if (tag) await check('tag', tag.to, ctx, `${siteOrigin}/goc-cham-cay`); else skipped.push('Thẻ chủ đề: không có link ?the= nào');

  const sort = findLink(/^\/danh-muc\/[^?]+\?(.*&)?sap_xep=/);
  if (sort) await check('filter', sort.to, ctx, sort.to.split('?')[0]); else skipped.push('Trang lọc / sắp xếp: không thấy link sap_xep');

  const paged = findLink(/\?(.*&)?trang=2(&|$)/);
  if (paged) await check('paged', paged.to, ctx); else skipped.push('Trang phân trang: chưa danh sách nào đủ 2 trang');

  await check('search', `${siteOrigin}/tim-kiem?q=${encodeURIComponent('kim tiền')}`, ctx);
  await check('search', `${siteOrigin}/tim-kiem?q=zzqxv`, ctx);

  for (const path of ['/tai-khoan', '/tai-khoan/don-hang', '/gio-hang', '/thanh-toan']) await check('private', siteOrigin + path, ctx);

  await check('notfound', `${siteOrigin}/khong-co-trang-nay-xyz`, ctx);
  for (const path of ['/san-pham/khong-co-san-pham-xyz', '/danh-muc/khong-co-xyz', '/goc-cham-cay/khong-co-bai-xyz', '/benh-cay/khong-co-xyz', '/doi-tac/cong-trinh/khong-co-xyz']) await check('notfoundCall', siteOrigin + path, ctx);

  console.log(`Hợp đồng SEO theo loại trang — ${BASE}`);
  for (const k of Object.keys(TEMPLATES)) console.log(`  ${TEMPLATES[k].name}: ${groups.has(k) ? `${groups.get(k)!.length} trang trong sitemap` : 'không vào sitemap — lấy URL mẫu'}`);
  console.log('Không dùng (đã ghi lý do):');
  for (const n of NOT_USED) console.log(`  ${n.name}: ${n.why}`);
  console.log(`  ${TODO_500}`);
  if (skipped.length) { console.log('\nBỏ qua:'); skipped.forEach((s) => console.log('  ' + s)); }
  if (warnings.length) { console.log(`\nCảnh báo (${warnings.length}):`); warnings.forEach((w) => console.log('  ' + w)); }
  if (errors.length) { console.log(`\nLỗi (${errors.length}):`); errors.forEach((e) => console.log('  ' + e)); process.exit(1); }
  console.log('\nĐạt: mọi loại trang đúng hợp đồng.');
}

main().catch((e) => { console.error(e); process.exit(1); });
