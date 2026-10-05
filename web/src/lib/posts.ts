// Bài viết & video (Góc chăm cây, Truyền thông) — kiểu dữ liệu, chuyên mục, kiểm tra trước khi đăng.
// Dùng chung trình duyệt (trình soạn bài admin) và server (trang khách, lưu bài).
import type { IconName } from '@/components/Icon';
import { normalize } from './catalog';

export type PostSection = 'blog' | 'news';
export type PostKind = 'article' | 'video';
export type PostStatus = 'draft' | 'review' | 'published';

export const SECTIONS: Record<PostSection, { name: string; path: string }> = {
  blog: { name: 'Góc chăm cây', path: '/goc-cham-cay' },
  news: { name: 'Truyền thông', path: '/tin-tuc' },
};

type Category = {
  key: string; name: string; section: PostSection; icon: IconName;
  /** Bài chuyên môn: nên có kỹ sư kiểm duyệt. */
  expert?: boolean;
  /** Bài hướng dẫn: nên gắn khối sản phẩm để khách mua ngay. */
  shop?: boolean;
  /** Khuyến mãi / sự kiện: gom chung một khối thẻ ở trang Góc chăm cây. */
  promo?: boolean;
};

export const CATEGORIES = [
  { key: 'cham-soc', name: 'Chăm sóc cây', section: 'blog', icon: 'leaf', shop: true },
  { key: 'bat-benh', name: 'Bắt bệnh cây', section: 'blog', icon: 'bug', expert: true, shop: true },
  { key: 'thuoc-phan-bon', name: 'Thuốc & Phân bón', section: 'blog', icon: 'flask', expert: true, shop: true },
  { key: 'rau-sach', name: 'Rau sạch tại nhà', section: 'blog', icon: 'sprout', shop: true },
  { key: 'phong-thuy', name: 'Phong thủy', section: 'blog', icon: 'spark' },
  { key: 'decor', name: 'Decor & Không gian', section: 'blog', icon: 'home' },
  { key: 'theo-mua', name: 'Cây theo mùa', section: 'blog', icon: 'rain' },
  { key: 'khuyen-mai', name: 'Tin khuyến mãi', section: 'blog', icon: 'tag', promo: true },
  { key: 'su-kien', name: 'Workshop & Sự kiện', section: 'blog', icon: 'gift', promo: true },
  { key: 'tin-tuc', name: 'Tin tức & Sự kiện', section: 'news', icon: 'bell' },
  { key: 'cong-dong', name: 'Hoạt động cộng đồng', section: 'news', icon: 'heart' },
  { key: 'bao-chi', name: 'Báo chí nói về chúng tôi', section: 'news', icon: 'receipt' },
  { key: 'tuyen-dung', name: 'Tuyển dụng', section: 'news', icon: 'user' },
] as const satisfies readonly Category[];

export type CategoryKey = (typeof CATEGORIES)[number]['key'];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as [CategoryKey, ...CategoryKey[]];
export const categoryOf = (key: string): Category | undefined => CATEGORIES.find((c) => c.key === key);
export const isCategory = (key: string | undefined): key is CategoryKey => !!key && CATEGORIES.some((c) => c.key === key);
export const sectionOf = (category: string): PostSection => categoryOf(category)?.section ?? 'blog';
export const postPath = (p: { slug: string; category: string }) => `${SECTIONS[sectionOf(p.category)].path}/${p.slug}`;

// ---- Nội dung bài: danh sách khối ------------------------------------------------------------

export type PostBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'image'; file: string; caption: string }
  | { type: 'video'; youtubeId: string; caption: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'note'; title: string; text: string }
  | { type: 'products'; title: string; slugs: string[] };

export type BlockType = PostBlock['type'];

export const BLOCK_NAMES: Record<BlockType, string> = {
  h2: 'Tiêu đề mục', h3: 'Tiêu đề nhỏ', p: 'Đoạn văn', list: 'Danh sách', image: 'Ảnh', video: 'Video YouTube',
  table: 'Bảng', note: 'Hộp lưu ý', products: 'Khối sản phẩm',
};

export const MAX_BLOCK_PRODUCTS = 6;
export const NOTE_TITLE = 'Lưu ý an toàn';
export const PRODUCTS_TITLE = 'Dùng trong bài này';

/** Mỗi tài khoản đọc ~200 chữ/phút. */
export function readMinutes(title: string, excerpt: string, body: PostBlock[]) {
  const text = [title, excerpt, ...body.flatMap(blockText)].join(' ');
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
}

export function blockText(b: PostBlock): string[] {
  switch (b.type) {
    case 'h2': case 'h3': case 'p': return [b.text];
    case 'list': return b.items;
    case 'note': return [b.title, b.text];
    case 'table': return b.rows.flat();
    case 'image': case 'video': return [b.caption];
    case 'products': return [];
  }
}

/** Mã neo cho mục lục: "1. Lá vàng từ dưới lên" → "1-la-vang-tu-duoi-len". */
export const headingId = (text: string, i: number) =>
  normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || `muc-${i + 1}`;

/** Mục lục: các tiêu đề mục (H2), mã neo không trùng nhau. */
export function tableOfContents(body: PostBlock[]) {
  const seen = new Set<string>();
  const out: { index: number; id: string; text: string }[] = [];
  body.forEach((b, i) => {
    if (b.type !== 'h2' || !b.text.trim()) return;
    let id = headingId(b.text, out.length);
    while (seen.has(id)) id += '-2';
    seen.add(id);
    out.push({ index: i, id, text: b.text });
  });
  return out;
}

// ---- Chữ trong đoạn văn: **in đậm** và [chữ](đường dẫn) ------------------------------------

export type Inline = { t: 'text'; v: string } | { t: 'b'; v: string } | { t: 'a'; v: string; href: string };

/** Chỉ nhận link trong trang ("/…"), http(s), tel:, mailto: — chặn javascript: và các kiểu lạ. */
export const safeHref = (href: string) => (/^(\/(?!\/)|https?:\/\/|tel:|mailto:)/i.test(href.trim()) ? href.trim() : null);

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });
    const href = m[3] ? safeHref(m[3]) : null;
    if (m[1] !== undefined) out.push({ t: 'b', v: m[1] });
    else if (href) out.push({ t: 'a', v: m[2], href });
    else out.push({ t: 'text', v: m[0] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}

/** Bỏ ký hiệu ** và [](...) — dùng cho mô tả, đoạn trích. */
export const plainText = (text: string) => parseInline(text).map((x) => x.v).join('');

// ---- Video -----------------------------------------------------------------------------------

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
export const isShortsUrl = (url: string) => /youtube\.com\/shorts\//i.test(url);

export function durationLabel(sec: number | null | undefined) {
  if (!sec) return '';
  if (sec < 120) return `${sec} giây`;
  const m = Math.floor(sec / 60), s = sec % 60;
  return s ? `${m} phút ${s} giây` : `${m} phút`;
}

// ---- Ảnh -------------------------------------------------------------------------------------

export const postImageUrl = (file: string) => `/api/post-images/${file}`;

// ---- Trạng thái ------------------------------------------------------------------------------

export type PostState = 'draft' | 'review' | 'scheduled' | 'published';

export const STATE_LABELS: Record<PostState, { label: string; pill: string }> = {
  draft: { label: 'Nháp', pill: 'wait' },
  review: { label: 'Chờ duyệt', pill: 'new' },
  scheduled: { label: 'Lên lịch', pill: 'prep' },
  published: { label: 'Đã đăng', pill: 'done' },
};

export function postState(p: { status: PostStatus; publishedAt: Date | string | null }, now = Date.now()): PostState {
  if (p.status !== 'published') return p.status;
  return p.publishedAt && new Date(p.publishedAt).getTime() > now ? 'scheduled' : 'published';
}

// ---- Kiểm tra trước khi đăng -----------------------------------------------------------------

export type PostDraft = {
  kind: PostKind; category: string; title: string; excerpt: string; body: PostBlock[];
  coverFile: string | null; youtubeId: string | null; reviewerName: string; seoDescription: string;
};

export type Check = { ok: boolean; label: string; /** Thiếu thì không đăng được. */ required?: boolean };

const PESTICIDE_WORDS = /thuoc (bvtv|bao ve thuc vat|tru )|hoat chat|thoi gian cach ly|phun thuoc|pha thuoc|thuoc hoa hoc/;

/** Bài có nhắc tới thuốc BVTV: chữ trong bài hoặc khối sản phẩm có thuốc. */
export function mentionsPesticide(p: Pick<PostDraft, 'title' | 'excerpt' | 'body'>, pesticideSlugs: ReadonlySet<string>) {
  if (p.body.some((b) => b.type === 'products' && b.slugs.some((s) => pesticideSlugs.has(s)))) return true;
  return PESTICIDE_WORDS.test(normalize([p.title, p.excerpt, ...p.body.flatMap(blockText)].join(' ')));
}

export const TITLE_MIN = 10, TITLE_MAX = 150, SEO_MIN = 50, SEO_MAX = 160;

export function postChecks(p: PostDraft, pesticideSlugs: ReadonlySet<string>): Check[] {
  const cat = categoryOf(p.category);
  const len = p.title.trim().length;
  const seo = (p.seoDescription.trim() || plainText(p.excerpt).trim()).length;
  const out: Check[] = [
    len < TITLE_MIN || len > TITLE_MAX
      ? { ok: false, required: true, label: `Tiêu đề ${len} ký tự (cần ${TITLE_MIN}–${TITLE_MAX})` }
      : { ok: len <= 70, label: len <= 70 ? `Tiêu đề ${len} ký tự (tốt cho SEO)` : `Tiêu đề ${len} ký tự — Google chỉ hiện ~70 ký tự đầu` },
  ];
  if (p.kind === 'video') {
    out.push({ ok: !!p.youtubeId, required: true, label: p.youtubeId ? 'Có link video YouTube' : 'Chưa dán link video YouTube' });
  } else {
    const hasText = p.body.some((b) => b.type === 'p' && b.text.trim());
    out.push({ ok: hasText, required: true, label: hasText ? 'Có nội dung bài' : 'Chưa có đoạn văn nào trong bài' });
    out.push({ ok: !!p.coverFile, label: p.coverFile ? 'Có ảnh bìa' : 'Chưa có ảnh bìa (trang sẽ hiện hình minh họa)' });
  }
  out.push({ ok: !!plainText(p.excerpt).trim(), label: p.excerpt.trim() ? 'Có đoạn dẫn' : 'Chưa có đoạn dẫn (hiện dưới tiêu đề và trên thẻ bài)' });
  if (cat?.shop) {
    const has = p.body.some((b) => b.type === 'products' && b.slugs.length);
    out.push({ ok: has, label: has ? 'Có khối sản phẩm' : 'Chưa có khối sản phẩm' });
  }
  if (mentionsPesticide(p, pesticideSlugs)) {
    const has = p.body.some((b) => b.type === 'note' && b.text.trim());
    out.push({ ok: has, required: true, label: has ? 'Có hộp lưu ý an toàn (bài có thuốc BVTV)' : 'Bài nhắc tới thuốc BVTV: phải có hộp lưu ý an toàn' });
  }
  out.push(seo >= SEO_MIN && seo <= SEO_MAX
    ? { ok: true, label: 'Có mô tả SEO' }
    : { ok: false, label: seo ? `Mô tả SEO ${seo} ký tự (nên ${SEO_MIN}–${SEO_MAX})` : 'Chưa có mô tả SEO' });
  if (cat?.expert) out.push({ ok: !!p.reviewerName.trim(), label: p.reviewerName.trim() ? 'Có kỹ sư kiểm duyệt' : 'Chưa có kỹ sư kiểm duyệt' });
  return out;
}

export const blockingChecks = (checks: Check[]) => checks.filter((c) => c.required && !c.ok);
