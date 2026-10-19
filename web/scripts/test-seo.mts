/**
 * Kiểm thử đơn vị các hàm SEO (mục 20.1 checklist SEO): `npm run test:seo`.
 * Hàm thuần, không cần database / máy chủ — chạy trong vài giây, chạy được trên GitHub Actions trước khi deploy.
 * Gồm: title, description, slug, canonical, robots, hreflang (web một ngôn ngữ → không sinh), sitemap, chuyển hướng,
 * trạng thái nội dung. JSON-LD có bộ riêng: `npm run test:jsonld` (lệnh `test:seo-all` chạy cả hai). Có lỗi thì thoát mã 1.
 */
import assert from 'node:assert/strict';
import type { Metadata } from 'next';
import * as robotsModule from '../src/app/robots.ts';
import { autoCategoryDescription, categorySeo, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from '../src/lib/category-seo.ts';
import { clipText } from '../src/lib/format.ts';
import { CATEGORY_DESCRIPTION, pageSuffix, postState } from '../src/lib/posts.ts';
import { BASE_OPEN_GRAPH, withShare } from '../src/lib/seo.ts';
import { redirectable, sitePath } from '../src/lib/seo-cms.ts';
import { autoSeoName, SEO_NAME_MAX, seoNameOf } from '../src/lib/seo-name.ts';
import {
  applySeoOverride, canonicalOf, contentRobots, contentState, listingRobots, MAX_REDIRECT_HOPS, NOINDEX_FOLLOW, resolveRedirect,
} from '../src/lib/seo-rules.ts';
import { absoluteUrl, SITE_ORIGIN } from '../src/lib/site.ts';
import { indexXml, parseSitemapName, SITEMAP_KIND_NAMES, urlsetXml } from '../src/lib/sitemap-xml.ts';
import { canonicalPath, slugify, SLUG_RE } from '../src/lib/slug.ts';
import { TRACKING_PARAM } from '../src/lib/url-params.ts';

// tsx nạp file .ts của app dạng CommonJS → export default có thể nằm ở .default.default.
const robots = ((m: { default: unknown }) => (typeof m.default === 'function' ? m.default : (m.default as { default: unknown }).default))(robotsModule as { default: unknown }) as typeof robotsModule.default;

let passed = 0;
const failed: string[] = [];
const pending: Promise<void>[] = [];
function test(name: string, fn: () => void | Promise<void>) {
  const fail = (e: unknown) => { failed.push(`✗ ${name}\n    ${(e as Error).message.split('\n').join('\n    ')}`); };
  try {
    const r = fn();
    if (r instanceof Promise) pending.push(r.then(() => { passed++; }, fail));
    else passed++;
  } catch (e) { fail(e); }
}

// ---- Title ---------------------------------------------------------------------------------

test('title danh mục: admin viết thì dùng, trống thì là tên danh mục', () => {
  assert.equal(categorySeo({ name: 'Cây để bàn' }, []).title, 'Cây để bàn');
  assert.equal(categorySeo({ name: 'Cây để bàn', seoTitle: 'Cây để bàn đẹp giá vườn' }, []).title, 'Cây để bàn đẹp giá vườn');
});

test('title phân trang: trang 1 không có hậu tố, trang 2+ thêm "· Trang n"', () => {
  assert.equal(pageSuffix(1), '');
  assert.equal(pageSuffix(2), ' · Trang 2');
  assert.equal(pageSuffix(3, '. '), '. Trang 3');
});

test('title sản phẩm (tên chi tiết SEO): tự tạo có tên cây, ≤ 160 ký tự; ô admin thắng', () => {
  const base = { name: 'Cây kim tiền', category: 'cay-canh', sub: 'cay-de-ban', specs: [['Ánh sáng', 'Chịu bóng, ánh sáng tán xạ']] as [string, string][] };
  const auto = autoSeoName({ ...base, keywords: ['Kim phát tài'], fengshui: { elements: ['Mộc'], meaning: 'Mang lại tài lộc' } });
  assert.ok(auto.startsWith('Cây kim tiền'), auto);
  assert.ok(auto.length <= SEO_NAME_MAX, `${auto.length} ký tự`);
  assert.equal(seoNameOf({ ...base, seoName: '  Kim tiền giá vườn  ' }), 'Kim tiền giá vườn');
  assert.equal(seoNameOf({ ...base, seoName: '' }), autoSeoName(base));
  const long = autoSeoName({ ...base, name: 'Cây ' + 'rất dài '.repeat(40) });
  assert.ok(long.length <= SEO_NAME_MAX, `${long.length} ký tự`);
});

// ---- Description -----------------------------------------------------------------------------

test('description danh mục tự tạo: ≤ 170 ký tự, có số loại + vài tên cây, không rỗng khi chưa có sản phẩm', () => {
  const names = Array.from({ length: 40 }, (_, i) => `Cây số ${i + 1} tên khá dài`);
  const d = autoCategoryDescription('Cây để bàn', names);
  assert.ok(d.length <= SEO_DESCRIPTION_MAX, `${d.length} ký tự`);
  assert.ok(d.includes('40 loại') && d.includes('Cây số 1'));
  assert.ok(autoCategoryDescription('Cây để bàn', []).length > 30);
  assert.equal(categorySeo({ name: 'X', seoDescription: 'Mô tả tay' }, names).description, 'Mô tả tay');
  assert.ok(SEO_TITLE_MAX === 70 && SEO_DESCRIPTION_MAX === 170);
});

test('description chuyên mục bài viết: đủ mọi chuyên mục, 50–170 ký tự, không trùng nhau', () => {
  const all = Object.values(CATEGORY_DESCRIPTION);
  for (const d of all) assert.ok(d.length >= 50 && d.length <= 170, `${d.length}: ${d}`);
  assert.equal(new Set(all).size, all.length);
});

test('clipText: cắt ở ranh giới từ, thêm "…", không vượt giới hạn; chữ ngắn giữ nguyên, gom khoảng trắng', () => {
  const s = 'Cây kim tiền là loại cây dễ chăm, chịu bóng tốt, hợp đặt bàn làm việc, phòng khách và văn phòng công ty, mang ý nghĩa tài lộc.';
  const c = clipText(s, 60);
  assert.ok(c.length <= 60 && c.endsWith('…') && !/\s…$/.test(c), c);
  assert.equal(clipText('  ngắn   thôi ', 60), 'ngắn thôi');
});

// ---- Slug ------------------------------------------------------------------------------------

test('slugify: bỏ dấu, chữ thường, nối "-", không "-" đầu / cuối, cắt theo max', () => {
  assert.equal(slugify('Cây Đuôi Công Tím'), 'cay-duoi-cong-tim');
  assert.equal(slugify('  Trị nấm -- (Hồng môn)!  '), 'tri-nam-hong-mon');
  assert.equal(slugify('Thuốc BVTV 50% WP'), 'thuoc-bvtv-50-wp');
  const long = slugify('a b '.repeat(100), 20);
  assert.ok(long.length <= 20 && SLUG_RE.test(long), long);
  assert.equal(slugify('!!!'), '');
});

test('SLUG_RE: chỉ nhận slug chuẩn', () => {
  for (const ok of ['kim-tien', 'a1', 'cay-canh-2']) assert.ok(SLUG_RE.test(ok), ok);
  for (const bad of ['Kim-tien', 'kim--tien', '-kim', 'kim-', 'kim_tien', 'kim tien', 'cây']) assert.ok(!SLUG_RE.test(bad), bad);
});

test('canonicalPath (proxy 308): hoa / có dấu / dấu cách / "_" / "//" → slug chuẩn; % hỏng hoặc đoạn rỗng chữ → null', () => {
  assert.equal(canonicalPath('/San-Pham/Kim%20Ti%E1%BB%81n'), '/san-pham/kim-tien');
  assert.equal(canonicalPath('/danh-muc//cay_canh'), '/danh-muc/cay-canh');
  assert.equal(canonicalPath('/san-pham/kim-tien'), '/san-pham/kim-tien');
  assert.equal(canonicalPath('/'), '/');
  assert.equal(canonicalPath('/san-pham/%E0%A4%A'), null);
  assert.equal(canonicalPath('/san-pham/!!!'), null);
});

// ---- Canonical -------------------------------------------------------------------------------

test('absoluteUrl: đường dẫn → URL https trên tên miền chính; URL tuyệt đối giữ nguyên', () => {
  assert.ok(SITE_ORIGIN.startsWith('https://www.'));
  assert.equal(absoluteUrl('/san-pham/x'), `${SITE_ORIGIN}/san-pham/x`);
  assert.equal(absoluteUrl('san-pham/x'), `${SITE_ORIGIN}/san-pham/x`);
  assert.equal(absoluteUrl('https://i.ytimg.com/a.jpg'), 'https://i.ytimg.com/a.jpg');
});

test('sitePath: chữ admin gõ → đường dẫn chuẩn trong web; web khác → null', () => {
  assert.equal(sitePath('san-pham/Kim-Tien/'), '/san-pham/kim-tien');
  assert.equal(sitePath(`${SITE_ORIGIN}/san-pham/kim-tien?utm_source=zalo`), '/san-pham/kim-tien');
  assert.equal(sitePath('https://caycanhmientay.com/danh-muc/cay-canh'), '/danh-muc/cay-canh');
  assert.equal(sitePath('https://example.com/san-pham/x'), null);
  assert.equal(sitePath('/goc-cham-cay?trang=2', true), '/goc-cham-cay?trang=2');
  assert.equal(sitePath('/'), '/');
});

test('canonicalOf: đọc được canonical dạng chuỗi / URL / object, kể cả URL tuyệt đối', () => {
  assert.equal(canonicalOf({ alternates: { canonical: '/san-pham/x' } }), '/san-pham/x');
  assert.equal(canonicalOf({ alternates: { canonical: new URL(`${SITE_ORIGIN}/benh-cay/y`) } }), '/benh-cay/y');
  assert.equal(canonicalOf({ alternates: { canonical: { url: '/tin-tuc?trang=2' } } }), '/tin-tuc?trang=2');
  assert.equal(canonicalOf({}), null);
});

test('withShare: og:url = canonical, giữ khung chung (site_name, locale vi_VN), trống ảnh → ảnh mặc định, tối đa 4 ảnh không trùng', () => {
  const m = withShare({ title: 'A', alternates: { canonical: '/san-pham/a' } }, { images: ['/1.jpg', '/1.jpg', null, '/2.jpg', '/3.jpg', '/4.jpg', '/5.jpg'] });
  const og = m.openGraph as Record<string, unknown> & { images: { url: string }[] };
  assert.equal(og.url, '/san-pham/a');
  assert.equal(og.siteName, BASE_OPEN_GRAPH.siteName);
  assert.equal(og.locale, 'vi_VN');
  assert.deepEqual(og.images.map((i) => i.url), ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg']);
  const d = withShare({ alternates: { canonical: '/' } }).openGraph as { images: unknown };
  assert.deepEqual(d.images, BASE_OPEN_GRAPH.images);
  // Không ghi og:title / og:description riêng — Next tự lấy từ <title> / description của trang.
  assert.ok(!('title' in og) && !('description' in og));
});

test('withShare bài viết: article, ngày sửa chỉ ghi khi sửa sau ngày đăng > 1 phút', () => {
  const pub = new Date('2026-10-01T00:00:00Z');
  const a = withShare({ alternates: { canonical: '/goc-cham-cay/a' } }, { type: 'article', article: { publishedTime: pub, modifiedTime: new Date(pub.getTime() + 30_000) } }).openGraph as Record<string, unknown>;
  assert.equal(a.type, 'article');
  assert.equal(a.publishedTime, pub.toISOString());
  assert.equal(a.modifiedTime, undefined);
  const b = withShare({ alternates: { canonical: '/goc-cham-cay/a' } }, { type: 'article', article: { publishedTime: pub, modifiedTime: new Date('2026-10-05T00:00:00Z') } }).openGraph as Record<string, unknown>;
  assert.equal(b.modifiedTime, '2026-10-05T00:00:00.000Z');
});

test('Tham số theo dõi (utm_, fbclid, gclid, zarsrc…) được nhận ra để không đổi canonical; tham số thật thì không', () => {
  for (const p of ['utm_source', 'utm_campaign', 'fbclid', 'gclid', 'zarsrc', 'srsltid']) assert.ok(TRACKING_PARAM.test(p), p);
  for (const p of ['trang', 'q', 'sap_xep', 'chuyen-muc']) assert.ok(!TRACKING_PARAM.test(p), p);
});

// ---- Robots ----------------------------------------------------------------------------------

test('listingRobots: trang danh sách trống / đang lọc → noindex, follow; bình thường → không đặt (index)', () => {
  assert.equal(listingRobots(false, false), undefined);
  assert.deepEqual(listingRobots(false, true), NOINDEX_FOLLOW);
  assert.deepEqual(listingRobots(true), { index: false, follow: true });
  assert.equal(listingRobots(), undefined);
});

test('applySeoOverride: tiêu đề / mô tả / canonical / ảnh chỉ áp trang gốc, noindex áp cả biến thể, không bật index lại', () => {
  const meta: Metadata = { title: 'Gốc', description: 'Mô tả gốc', alternates: { canonical: '/san-pham/a' }, openGraph: { url: '/san-pham/a' } };
  const o = { title: 'Tiêu đề tay', description: 'Mô tả tay', noindex: false, canonical: '/san-pham/b', image: '/images/x.jpg' };
  const base = applySeoOverride(meta, o, true);
  assert.deepEqual(base.title, { absolute: 'Tiêu đề tay' });
  assert.equal(base.description, 'Mô tả tay');
  assert.equal((base.alternates as { canonical: string }).canonical, '/san-pham/b');
  assert.equal((base.openGraph as { url: string }).url, '/san-pham/b');
  const page2 = applySeoOverride({ ...meta, title: 'Gốc · Trang 2' }, o, false);
  assert.equal(page2.title, 'Gốc · Trang 2');
  assert.equal(page2.alternates, meta.alternates);
  const hidden = applySeoOverride(meta, { ...o, title: null, description: null, canonical: null, image: null, noindex: true }, false);
  assert.deepEqual(hidden.robots, NOINDEX_FOLLOW);
  // Trang tự noindex theo luật (trang lọc…) + ô admin không noindex → vẫn noindex.
  const filtered = applySeoOverride({ ...meta, robots: NOINDEX_FOLLOW }, { ...o, noindex: false }, true);
  assert.deepEqual(filtered.robots, NOINDEX_FOLLOW);
  assert.equal(applySeoOverride(meta, null, true), meta);
});

test('robots.txt: không chặn cả web, không chặn /_next, chặn trang riêng tư, mở ảnh công khai, Sitemap trên tên miền chính', () => {
  const r = robots();
  const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
  const disallow = ([] as string[]).concat(rule.disallow ?? []);
  const allow = ([] as string[]).concat(rule.allow ?? []);
  assert.equal(rule.userAgent, '*');
  assert.ok(!disallow.includes('/') && !disallow.some((d) => d.startsWith('/_next') || d.startsWith('/images')));
  for (const p of ['/admin', '/tai-khoan', '/gio-hang', '/thanh-toan', '/tim-kiem']) assert.ok(disallow.includes(p), p);
  for (const p of ['/san-pham', '/danh-muc', '/benh-cay', '/goc-cham-cay']) assert.ok(!disallow.some((d) => p.startsWith(d)), p);
  assert.ok(allow.includes('/api/product-images/'));
  assert.ok(([] as string[]).concat(r.sitemap ?? []).includes(`${SITE_ORIGIN}/sitemap.xml`));
  // Máy AI được mời đích danh, cùng luật chặn trang riêng tư, không bị chặn cả web.
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
  const ai = rules.find((x) => ([] as string[]).concat(x.userAgent ?? []).includes('GPTBot'));
  assert.ok(ai && !([] as string[]).concat(ai.disallow ?? []).includes('/'));
  assert.ok(([] as string[]).concat(ai!.allow ?? []).includes('/llms.txt'));
});

// ---- Hreflang --------------------------------------------------------------------------------

test('hreflang: web một ngôn ngữ — metadata không sinh alternates.languages / og:locale:alternate', () => {
  const m = withShare({ alternates: { canonical: '/' } });
  assert.equal((m.alternates as { languages?: unknown }).languages, undefined);
  assert.equal((m.openGraph as { alternateLocale?: unknown }).alternateLocale, undefined);
  assert.equal(BASE_OPEN_GRAPH.locale, 'vi_VN');
});

// ---- Sitemap ---------------------------------------------------------------------------------

test('parseSitemapName: tên hợp lệ → loại + trang; "-1", số 0, loại lạ, đuôi khác → null', () => {
  assert.deepEqual(parseSitemapName('san-pham.xml'), { kind: 'san-pham', page: 1 });
  assert.deepEqual(parseSitemapName('san-pham-2.xml'), { kind: 'san-pham', page: 2 });
  assert.deepEqual(parseSitemapName('cong-trinh.xml'), { kind: 'cong-trinh', page: 1 });
  for (const bad of ['san-pham-1.xml', 'san-pham-0.xml', 'gio-hang.xml', 'san-pham.txt', '../x.xml', 'San-pham.xml']) assert.equal(parseSitemapName(bad), null, bad);
  for (const k of SITEMAP_KIND_NAMES) assert.ok(parseSitemapName(`${k}.xml`), k);
});

test('urlsetXml: XML hợp lệ, escape & < > " \', lastmod ISO không mili giây, có ảnh + video, bỏ thời lượng sai', () => {
  const xml = urlsetXml([
    { loc: `${SITE_ORIGIN}/san-pham/a?x=1&y=2`, lastmod: new Date('2026-10-16T01:02:03.456Z'), images: [`${SITE_ORIGIN}/api/product-images/a.jpg`] },
    { loc: `${SITE_ORIGIN}/goc-cham-cay/v`, videos: [{ thumbnail: 'https://i.ytimg.com/vi/x/hqdefault.jpg', title: 'Tưới <cây> & "lá"', description: "Mô tả 'ngắn'", player: 'https://www.youtube-nocookie.com/embed/x', seconds: 99999, published: new Date('2026-10-01T00:00:00Z') }] },
  ]);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<loc>https://www.caycanhmientay.com/san-pham/a?x=1&amp;y=2</loc>'));
  assert.ok(xml.includes('<lastmod>2026-10-16T01:02:03Z</lastmod>'));
  assert.ok(xml.includes('<image:loc>'));
  assert.ok(xml.includes('Tưới &lt;cây&gt; &amp; &quot;lá&quot;') && xml.includes('&apos;ngắn&apos;'));
  assert.ok(!xml.includes('<video:duration>'));
  assert.equal((xml.match(/<url>/g) ?? []).length, 2);
  assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml.replace(/<\?xml[^>]*>/, '')));
});

test('indexXml: file chỉ mục đúng chuẩn sitemaps.org', () => {
  const xml = indexXml([{ loc: `${SITE_ORIGIN}/sitemaps/trang.xml` }, { loc: `${SITE_ORIGIN}/sitemaps/san-pham.xml`, lastmod: new Date('2026-10-16T00:00:00Z') }]);
  assert.ok(xml.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.equal((xml.match(/<sitemap>/g) ?? []).length, 2);
  assert.ok(xml.includes('<lastmod>2026-10-16T00:00:00Z</lastmod>'));
});

// ---- Chuyển hướng ----------------------------------------------------------------------------

test('redirectable: chỉ trang nội dung (sản phẩm, danh mục, bài, bệnh, công trình) — không trang chủ / riêng tư / tiền tố trơn', () => {
  for (const ok of ['/san-pham/a', '/danh-muc/cay-canh', '/goc-cham-cay/a', '/tin-tuc/a', '/benh-cay/a', '/doi-tac/cong-trinh/a']) assert.ok(redirectable(ok), ok);
  for (const bad of ['/', '/san-pham/', '/tai-khoan/x', '/admin/x', '/gio-hang']) assert.ok(!redirectable(bad), bad);
});

test('resolveRedirect: một bước; đích đã gỡ có chuyển hướng riêng → đi tiếp tới đích cuối; đích còn hiện → dừng', async () => {
  const map: Record<string, string> = { '/san-pham/a': '/san-pham/b', '/san-pham/b': '/san-pham/c' };
  const direct = (p: string) => map[p] ?? null;
  assert.equal(await resolveRedirect('/san-pham/a', direct, () => false), '/san-pham/c');
  assert.equal(await resolveRedirect('/san-pham/a', direct, (p) => p === '/san-pham/b'), '/san-pham/b');
  assert.equal(await resolveRedirect('/san-pham/x', direct, () => false), null);
});

test('resolveRedirect: vòng lặp A → B → A không treo, không trả về chính nó; chuỗi dài dừng sau MAX_REDIRECT_HOPS', async () => {
  const loop: Record<string, string> = { '/a': '/b', '/b': '/a' };
  const r = await resolveRedirect('/a', (p) => loop[p] ?? null, () => false);
  assert.equal(r, '/b');
  const chain = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`/p${i}`, `/p${i + 1}`]));
  let calls = 0;
  const end = await resolveRedirect('/p0', (p) => { calls++; return chain[p] ?? null; }, () => false);
  assert.equal(end, `/p${MAX_REDIRECT_HOPS + 1}`);
  assert.ok(calls <= MAX_REDIRECT_HOPS + 1);
});

// ---- Trạng thái nội dung ---------------------------------------------------------------------

test('contentState / contentRobots: ẩn / lên lịch → gone (404); thiếu nội dung → noindex, follow; đủ → index', () => {
  const now = Date.parse('2026-10-16T00:00:00Z');
  assert.equal(contentState({ visible: false }, now), 'gone');
  assert.equal(contentState({ visible: true, publishedAt: '2026-10-20T00:00:00Z' }, now), 'gone');
  assert.equal(contentState({ visible: true, publishedAt: '2026-10-01T00:00:00Z' }, now), 'live');
  assert.equal(contentState({ visible: true, hasDetail: false }, now), 'thin');
  assert.equal(contentRobots('live'), undefined);
  assert.deepEqual(contentRobots('thin'), NOINDEX_FOLLOW);
  assert.deepEqual(contentRobots('gone'), { index: false });
});

test('postState: nháp / chờ duyệt giữ nguyên; đã đăng giờ tương lai = lên lịch', () => {
  const now = Date.parse('2026-10-16T00:00:00Z');
  assert.equal(postState({ status: 'draft', publishedAt: null }, now), 'draft');
  assert.equal(postState({ status: 'review', publishedAt: null }, now), 'review');
  assert.equal(postState({ status: 'published', publishedAt: '2026-10-17T00:00:00Z' }, now), 'scheduled');
  assert.equal(postState({ status: 'published', publishedAt: '2026-10-15T00:00:00Z' }, now), 'published');
});

await Promise.all(pending);
if (failed.length) {
  console.error(failed.join('\n'));
  console.error(`\n${failed.length} lỗi, ${passed} đạt`);
  process.exit(1);
}
console.log(`✓ ${passed} nhóm kiểm thử SEO đạt`);
