import ExcelJS from 'exceljs';
import { auditText, SEO_DESC_MAX, SEO_DESC_MIN, SEO_TITLE_MAX, SEO_TITLE_MIN, seoDate, seoTime } from '@/lib/seo-cms';
import { plainText } from '@/lib/slug';
import { todayVN } from '@/lib/stock';
import { requireAccess } from '@/server/auth';
import { listRedirects, listSeoAudit } from '@/server/seo-cms';
import { seoIssues, seoPages } from '@/server/seo-report';

/** Mở lại ~100–200 trang; Vercel mặc định cắt hàm sau 300 giây là đủ, ghi rõ để khỏi bị cắt sớm. */
export const maxDuration = 300;

const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CONCURRENCY = 6;

type Seen = { status: number | string; title: string; description: string; robots: string; canonical: string; image: string; h1: number; location?: string };

const decode = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&').trim();

/** Đọc thuộc tính `attr` của thẻ <meta>/<link> đầu tiên khớp `match` trong <head>. */
function tagAttr(head: string, tag: 'meta' | 'link', match: RegExp, attr: string) {
  for (const t of head.match(new RegExp(`<${tag}\\b[^>]*>`, 'gi')) ?? []) {
    if (match.test(t)) {
      const m = new RegExp(`\\b${attr}="([^"]*)"`, 'i').exec(t);
      if (m) return decode(m[1]);
    }
  }
  return '';
}

/** Mở trang như Google (UA Googlebot — Next trả metadata nằm trong <head>), đọc phần SEO. */
async function fetchSeo(url: string): Promise<Seen> {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(20_000), cache: 'no-store' });
    const html = res.status === 200 ? await res.text() : '';
    const head = html.split(/<\/head>/i)[0] ?? '';
    return {
      status: res.status,
      title: decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] ?? ''),
      description: tagAttr(head, 'meta', /name="description"/i, 'content'),
      robots: tagAttr(head, 'meta', /name="robots"/i, 'content'),
      canonical: tagAttr(head, 'link', /rel="canonical"/i, 'href'),
      image: tagAttr(head, 'meta', /property="og:image"/i, 'content'),
      h1: (html.match(/<h1\b/gi) ?? []).length,
      location: res.headers.get('location') ?? undefined,
    };
  } catch (e) {
    return { status: e instanceof Error && e.name === 'TimeoutError' ? 'Quá 20 giây' : 'Không mở được', title: '', description: '', robots: '', canonical: '', image: '', h1: 0 };
  }
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

/**
 * Excel kiểm tra SEO hàng loạt (mục 14 checklist): mỗi trang công khai một dòng — dữ liệu admin (loại, trạng thái,
 * sitemap, SEO đặt tay) + phần Google thật sự đọc được khi mở trang (title, description, robots, canonical, og:image, số H1)
 * + cảnh báo. Thêm sheet Cảnh báo (từ database), Chuyển hướng, Nhật ký. Chỉ Quản lý.
 */
export async function GET(req: Request) {
  await requireAccess('settings');
  const origin = new URL(req.url).origin;
  const [pages, issues, redirects, audit] = await Promise.all([seoPages(), seoIssues(), listRedirects(), listSeoAudit(1000)]);
  const live = pages.filter((p) => p.status.startsWith('Đang hiện'));
  const seen = await pool(live, CONCURRENCY, (p) => fetchSeo(origin + p.path));
  const byPath = new Map(live.map((p, i) => [p.path, seen[i]]));

  // Trùng tiêu đề / mô tả giữa các trang được index.
  const count = (key: 'title' | 'description') => {
    const m = new Map<string, number>();
    for (const s of seen) if (s.status === 200 && !/noindex/i.test(s.robots) && s[key]) m.set(plainText(s[key]), (m.get(plainText(s[key])) ?? 0) + 1);
    return m;
  };
  const titles = count('title'), descs = count('description');

  const problems = (path: string, inSitemap: boolean, s?: Seen) => {
    if (!s) return [];
    const out: string[] = [];
    if (s.status !== 200) out.push(`Mã ${s.status}${s.location ? ` → ${s.location}` : ''}`);
    if (s.status !== 200) return out;
    const noindex = /noindex/i.test(s.robots);
    if (!s.title) out.push('Thiếu title');
    else if (s.title.length > SEO_TITLE_MAX) out.push(`Title dài ${s.title.length} ký tự`);
    else if (s.title.length < SEO_TITLE_MIN) out.push('Title ngắn');
    if (!s.description) out.push('Thiếu description');
    else if (s.description.length > SEO_DESC_MAX) out.push(`Description dài ${s.description.length} ký tự`);
    else if (s.description.length < SEO_DESC_MIN) out.push('Description ngắn');
    if (!noindex && (titles.get(plainText(s.title)) ?? 0) > 1) out.push('Title trùng trang khác');
    if (!noindex && (descs.get(plainText(s.description)) ?? 0) > 1) out.push('Description trùng trang khác');
    if (inSitemap && noindex) out.push('Trong sitemap nhưng noindex');
    const canon = s.canonical.replace(/^https?:\/\/[^/]+/, '') || '/';
    if (!s.canonical) out.push('Thiếu canonical');
    else if (canon !== path) out.push(`Canonical trỏ ${canon}`);
    if (s.h1 !== 1) out.push(`${s.h1} thẻ H1`);
    return out;
  };

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cây Cảnh Miền Tây';
  const font = { name: 'Arial', size: 10 };
  const header = (ws: ExcelJS.Worksheet, cols: { h: string; w: number }[]) => {
    ws.columns = cols.map((c) => ({ width: c.w }));
    const row = ws.addRow(cols.map((c) => c.h));
    row.font = { ...font, bold: true };
    row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F2EA' } }; c.alignment = { vertical: 'middle', wrapText: true }; });
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  };

  const ws = wb.addWorksheet('Trang');
  header(ws, [
    { h: 'URL', w: 48 }, { h: 'Loại', w: 12 }, { h: 'Trạng thái', w: 14 }, { h: 'Trong sitemap', w: 9 }, { h: 'Mã HTTP', w: 8 },
    { h: 'Title (Google đọc)', w: 50 }, { h: 'Số ký tự', w: 8 }, { h: 'Description (Google đọc)', w: 60 }, { h: 'Số ký tự', w: 8 },
    { h: 'Robots', w: 16 }, { h: 'Canonical', w: 40 }, { h: 'Ảnh chia sẻ (og:image)', w: 40 }, { h: 'Số H1', w: 6 },
    { h: 'SEO đặt tay', w: 28 }, { h: 'Chuyển hướng (khi trang gỡ)', w: 30 }, { h: 'Sửa lần cuối', w: 12 }, { h: 'Cảnh báo', w: 50 },
  ]);
  for (const p of pages) {
    const s = byPath.get(p.path);
    const o = p.override;
    const own = o ? [o.title && 'Tiêu đề', o.description && 'Mô tả', o.image && 'Ảnh', o.noindex && 'noindex', o.canonical && `canonical ${o.canonical}`].filter(Boolean).join(', ') : '';
    const warn = problems(p.path, p.inSitemap, s);
    const row = ws.addRow([
      origin + p.path, p.kind, p.status, p.inSitemap ? 'Có' : '', s?.status ?? '',
      s?.title ?? '', s?.title.length || '', s?.description ?? '', s?.description.length || '',
      s?.robots || (s?.status === 200 ? 'index, follow' : ''), s?.canonical ?? '', s?.image ?? '', s ? s.h1 : '',
      own, p.redirectTo ?? '', p.lastmod ? seoDate(p.lastmod) : '', warn.join('; '),
    ]);
    row.font = font;
    row.alignment = { vertical: 'top', wrapText: true };
    if (warn.length) row.getCell(17).font = { ...font, color: { argb: 'FFC62828' } };
  }

  const wi = wb.addWorksheet('Cảnh báo');
  header(wi, [{ h: 'URL', w: 48 }, { h: 'Loại', w: 12 }, { h: 'Mức', w: 9 }, { h: 'Cảnh báo', w: 80 }]);
  for (const i of issues) wi.addRow([origin + i.path, i.kind, i.level === 'error' ? 'Lỗi' : 'Nên sửa', i.text]).font = font;

  const wr = wb.addWorksheet('Chuyển hướng');
  header(wr, [{ h: 'Đường dẫn cũ', w: 44 }, { h: 'Chuyển tới', w: 44 }, { h: 'Lý do', w: 16 }, { h: 'Ghi chú', w: 30 }, { h: 'Lượt dùng', w: 9 }, { h: 'Tạo lúc', w: 16 }, { h: 'Người tạo', w: 16 }]);
  for (const r of redirects) {
    wr.addRow([r.fromPath, r.toPath, r.reason === 'slug' ? 'Đổi đường dẫn' : 'Thêm tay', r.note, r.hits, seoTime(r.createdAt), r.createdBy ?? '']).font = font;
  }

  const wa = wb.addWorksheet('Nhật ký');
  header(wa, [{ h: 'Lúc', w: 16 }, { h: 'Trang', w: 44 }, { h: 'Thay đổi', w: 90 }, { h: 'Người làm', w: 18 }]);
  for (const a of audit) {
    const row = wa.addRow([seoTime(a.createdAt), a.path, auditText(a.action, a.detail), a.actor]);
    row.font = font;
    row.alignment = { vertical: 'top', wrapText: true };
  }

  const file = Buffer.from(await wb.xlsx.writeBuffer());
  return new Response(new Uint8Array(file), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="kiem-tra-seo-${todayVN()}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
