/**
 * Chạy TOÀN BỘ kiểm thử SEO một lần rồi ghi báo cáo (mục 20.2 + 20.3 + "báo cáo crawl audit" mục 21 checklist SEO):
 *   npm run seo:all -- <địa chỉ web>              (vd. https://www.caycanhmientay.com, bản xem trước Vercel, http://localhost:3000)
 *   npm run seo:all -- <địa chỉ web> --nhanh      bỏ 3 công cụ mở Chrome thật (seo:mobile, seo:a11y, seo:perf)
 *   npm run seo:all -- <địa chỉ web> --db         thêm đối chiếu database ở seo:data (cần DATABASE_URL / .env.local)
 *
 * Thứ tự: kiểm thử đơn vị (test:seo, test:jsonld) → cổng SEO (seo:gate) → từng công cụ seo:* (crawl mọi trang trong sitemap).
 * Mỗi công cụ chạy riêng, lỗi một cái không dừng cái sau. Báo cáo Markdown ghi vào seo/bao-cao/kiem-tra-<ngày giờ>.md
 * (bảng đạt / lỗi + đoạn cuối kết quả của công cụ lỗi) — đính kèm khi bàn giao (seo/BAN-GIAO-SEO.md). Có lỗi thì thoát mã 1.
 * Công cụ mở Chrome cần Chrome cài trên máy (hoặc CHROME_PATH).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const BASE = (args.find((a) => /^https?:\/\//.test(a)) ?? 'http://localhost:3000').replace(/\/+$/, '');
const FAST = args.includes('--nhanh');
const DB = args.includes('--db');

type Step = { name: string; covers: string; cmd: string[]; chrome?: boolean };
const tool = (file: string, ...extra: string[]) => ['tsx', `scripts/${file}.mts`, BASE, ...extra];
const STEPS: Step[] = [
  { name: 'test:seo', covers: '20.1 title, description, slug, canonical, robots, hreflang, sitemap, redirect, trạng thái nội dung', cmd: ['tsx', 'scripts/test-seo.mts'] },
  { name: 'test:jsonld', covers: '20.1 JSON-LD', cmd: ['tsx', 'scripts/test-jsonld.mts'] },
  { name: 'seo:gate', covers: '20.4 lỗi chặn deploy (robots, sitemap, 5xx, noindex, canonical staging, metadata, nội dung chính, vòng lặp)', cmd: tool('seo-gate') },
  { name: 'seo:sitemap', covers: 'Sitemap chỉ chứa URL hợp lệ (200, index, canonical tự trỏ)', cmd: tool('check-sitemap') },
  { name: 'seo:canonical', covers: 'Canonical đúng tên miền + URL, một canonical, biến thể / utm, link nội bộ không qua chuyển hướng', cmd: tool('check-canonical') },
  { name: 'seo:metadata', covers: 'Một title / description, không trùng title, trang trong sitemap không noindex', cmd: tool('check-metadata') },
  { name: 'seo:head', covers: 'Thẻ <head>, Open Graph, favicon, manifest', cmd: tool('check-head') },
  { name: 'seo:html', covers: 'H1 thiếu / trùng, HTML semantic, link có href, trang mồ côi', cmd: tool('check-html') },
  { name: 'seo:images', covers: 'Ảnh, alt, ảnh hỏng, video sitemap', cmd: tool('check-images') },
  { name: 'seo:schema', covers: 'Structured data hợp lệ + khớp nội dung', cmd: tool('check-schema') },
  { name: 'seo:params', covers: 'Phân trang, lọc, tìm kiếm, URL tham số phát sinh bất thường', cmd: tool('check-params') },
  { name: 'seo:breadcrumb', covers: 'Breadcrumb hiển thị + schema', cmd: tool('check-breadcrumb') },
  { name: 'seo:locale', covers: 'Ngôn ngữ / khu vực, không hreflang sai', cmd: tool('check-locale') },
  { name: 'seo:templates', covers: 'Mỗi loại trang trả mã đúng + đủ metadata cần thiết', cmd: tool('check-templates') },
  { name: 'seo:components', covers: 'Header, menu, footer, thẻ sản phẩm, pager, trang 404 thật', cmd: tool('check-components') },
  { name: 'seo:ecommerce', covers: 'Sản phẩm, giá, hết hàng, danh mục', cmd: tool('check-ecommerce') },
  { name: 'seo:data', covers: 'Nội dung đã xóa / ẩn / nháp → 404, trang mỏng / rỗng, dữ liệu riêng tư', cmd: tool('check-data', ...(DB ? ['--db'] : [])) },
  { name: 'seo:migration', covers: 'URL quan trọng sau deploy: 200 / 308 một bước, không vòng lặp', cmd: tool('check-migration', 'seo/url-quan-trong.txt') },
  { name: 'seo:security', covers: 'HTTPS, header bảo mật, robots, file nhạy cảm', cmd: tool('check-security') },
  { name: 'seo:mobile', covers: 'Máy tính + điện thoại, HTML gốc so với HTML sau khi chạy JavaScript', cmd: tool('check-mobile'), chrome: true },
  { name: 'seo:a11y', covers: 'Đọc được bằng bàn phím / trình đọc màn hình', cmd: tool('check-a11y'), chrome: true },
  { name: 'seo:perf', covers: 'Core Web Vitals trong phòng thí nghiệm', cmd: tool('check-perf'), chrome: true },
];

const started = new Date();
const rows: { step: Step; code: number | null; secs: number; tail: string; skipped?: boolean }[] = [];
for (const step of STEPS) {
  if (FAST && step.chrome) { rows.push({ step, code: null, secs: 0, tail: '', skipped: true }); continue; }
  process.stdout.write(`▶ ${step.name} … `);
  const t0 = Date.now();
  const r = spawnSync('npx', step.cmd, { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024, timeout: 20 * 60_000 });
  const secs = Math.round((Date.now() - t0) / 1000);
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
  const tail = out.split('\n').slice(-40).join('\n');
  rows.push({ step, code: r.status, secs, tail });
  console.log(r.status === 0 ? `đạt (${secs}s)` : `LỖI mã ${r.status ?? r.signal} (${secs}s)`);
}

const bad = rows.filter((r) => !r.skipped && r.code !== 0);
const stamp = started.toISOString().slice(0, 16).replace(':', 'h').replace('T', '-');
const file = `seo/bao-cao/kiem-tra-${stamp}.md`;
mkdirSync('seo/bao-cao', { recursive: true });
writeFileSync(file, [
  `# Báo cáo kiểm thử SEO — ${BASE}`,
  '',
  `Chạy lúc ${started.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (giờ Việt Nam) bằng \`npm run seo:all -- ${args.join(' ')}\`.`,
  `Kết quả: **${rows.filter((r) => r.code === 0).length} đạt, ${bad.length} lỗi${FAST ? `, ${rows.filter((r) => r.skipped).length} bỏ qua (--nhanh)` : ''}**.`,
  '',
  '| Công cụ | Kiểm gì | Kết quả | Thời gian |',
  '|---|---|---|---|',
  ...rows.map((r) => `| \`${r.step.name}\` | ${r.step.covers} | ${r.skipped ? 'bỏ qua' : r.code === 0 ? 'đạt' : `**lỗi** (mã ${r.code})`} | ${r.skipped ? '' : `${r.secs}s`} |`),
  '',
  ...(bad.length ? ['## Chi tiết công cụ lỗi (40 dòng cuối)', ''] : []),
  ...bad.flatMap((r) => [`### ${r.step.name}`, '', '```', r.tail, '```', '']),
  '## Đạt (dòng tóm tắt cuối)', '',
  ...rows.filter((r) => r.code === 0).map((r) => `- \`${r.step.name}\`: ${r.tail.split('\n').filter(Boolean).at(-1) ?? ''}`),
  '',
].join('\n'));
console.log(`\nBáo cáo: ${file}`);
process.exit(bad.length ? 1 : 0);
