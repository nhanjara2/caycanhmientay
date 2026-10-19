// Bài viết & video (Góc chăm cây, Truyền thông) — kiểu dữ liệu, chuyên mục, kiểm tra trước khi đăng.
// Dùng chung trình duyệt (trình soạn bài admin) và server (trang khách, lưu bài).
import type { IconName } from '@/components/Icon';
import { normalize } from './catalog';
import { imageUrl } from './images';

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
  { key: 'cam-nang', name: 'Cẩm nang chọn cây', section: 'blog', icon: 'plant', shop: true },
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

/** Mô tả Google của trang từng chuyên mục (/goc-cham-cay?chuyen-muc=…, /tin-tuc?chuyen-muc=…) — mỗi chuyên mục một câu riêng. */
export const CATEGORY_DESCRIPTION: Record<CategoryKey, string> = {
  'cam-nang': 'Cẩm nang chọn cây cảnh: cây để bàn, cây văn phòng, cây ban công, cây công trình, cây hợp mệnh, cây an toàn cho trẻ nhỏ, thú cưng và cách chọn cây khỏe.',
  'cham-soc': 'Hướng dẫn chăm sóc cây cảnh: tưới nước, ánh sáng, đất trồng, bón phân, thay chậu cho cây trong nhà, văn phòng, ban công và sân vườn.',
  'bat-benh': 'Nhận biết và xử lý bệnh cây: thối rễ, vàng lá, nấm, sâu rệp… dấu hiệu sớm, nguyên nhân và cách cứu cây.',
  'thuoc-phan-bon': 'Cách chọn và dùng thuốc bảo vệ thực vật, phân bón đúng liều, đúng lúc, an toàn cho người, thú cưng và cây trồng.',
  'rau-sach': 'Trồng rau sạch tại nhà trong thùng xốp, chậu, ban công: chọn giống, đất trồng, tưới nước và thu hoạch.',
  'phong-thuy': 'Ý nghĩa phong thủy của cây cảnh, cây hợp mệnh, hợp tuổi và cách đặt cây trong nhà, văn phòng.',
  'decor': 'Ý tưởng trang trí không gian bằng cây xanh cho phòng khách, bàn làm việc, ban công, văn phòng và quán cà phê.',
  'theo-mua': 'Chăm cây theo mùa ở miền Tây: mùa mưa, mùa khô, cây Tết, lịch bón phân và phòng bệnh theo thời tiết.',
  'khuyen-mai': 'Chương trình khuyến mãi, mã giảm giá và ưu đãi khi mua cây cảnh, vật tư làm vườn tại Cây Cảnh Miền Tây.',
  'su-kien': 'Workshop trồng cây, sự kiện và hoạt động trải nghiệm do Cây Cảnh Miền Tây tổ chức.',
  'tin-tuc': 'Tin tức, sự kiện và thông báo mới của Cây Cảnh Miền Tây – nhà vườn cây cảnh tại Làng hoa Sa Đéc, Đồng Tháp.',
  'cong-dong': 'Các hoạt động cộng đồng của Cây Cảnh Miền Tây – nhà vườn cây cảnh tại Làng hoa Sa Đéc, Đồng Tháp.',
  'bao-chi': 'Báo chí, truyền hình viết về Cây Cảnh Miền Tây – nhà vườn cung cấp sỉ cây cảnh tại Làng hoa Sa Đéc, Đồng Tháp.',
  'tuyen-dung': 'Tin tuyển dụng của Cây Cảnh Miền Tây: vị trí đang tuyển, quyền lợi và cách ứng tuyển.',
};

/** Trang 2, 3… của danh sách: thêm "Trang n" vào title / mô tả để không trùng trang 1. */
export const pageSuffix = (page: number, sep = ' · ') => (page > 1 ? `${sep}Trang ${page}` : '');
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
/** Khung xem video ngắn: tự chạy, phát lặp lại như YouTube Shorts. */
export const youtubePlayer = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&loop=1&playlist=${id}`;
export const isShortsUrl = (url: string) => /youtube\.com\/shorts\//i.test(url);

// TikTok: phát bằng trình phát chính thức của TikTok (player/v1). TikTok không có link ảnh cố định
// (link ảnh hết hạn sau vài ngày) nên ảnh thẻ video là ảnh bìa của bài — tự lưu khi thêm nhanh, hoặc tải lên ở trang sửa.
export const tiktokPlayer = (id: string, autoplay = false) =>
  `https://www.tiktok.com/player/v1/${id}?rel=0&music_info=0&description=0${autoplay ? '&autoplay=1&loop=1' : ''}`;

/** Mã video TikTok trong link đầy đủ (tiktok.com/@kenh/video/<mã>, m.tiktok.com/v/<mã>.html, link nhúng). */
export function parseTiktokId(input: string): string | null {
  const s = input.trim();
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || !/(^|\.)tiktok\.com$/i.test(u.hostname)) return null;
  return u.pathname.match(/\/(?:video|v|embed(?:\/v2)?|player\/v1)\/(\d{8,25})/)?.[1] ?? null;
}
/** Link rút gọn khi bấm Chia sẻ trong app TikTok (vt.tiktok.com/…, vm.tiktok.com/…, tiktok.com/t/…): phải mở ra mới biết mã video. */
export const isTiktokShortLink = (input: string) => /^(https?:\/\/)?((vt|vm)\.tiktok\.com\/|(www\.)?tiktok\.com\/t\/)/i.test(input.trim());

/**
 * Tên, kênh, ảnh (link tạm) của video TikTok qua oEmbed — gọi từ trình duyệt admin (ở Việt Nam): máy chủ web đặt ở Ấn Độ,
 * nơi TikTok bị cấm, thường không lấy được. Không được (TikTok chặn) thì null — admin gõ tên, ảnh bìa tải tay.
 */
export async function tiktokOembed(url: string) {
  try {
    const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const j = (await r.json()) as { title?: unknown; author_name?: unknown; thumbnail_url?: unknown };
    return {
      title: typeof j.title === 'string' ? cleanVideoTitle(j.title) : '',
      channel: typeof j.author_name === 'string' ? j.author_name : '',
      thumb: typeof j.thumbnail_url === 'string' && j.thumbnail_url.startsWith('https://') ? j.thumbnail_url : null,
    };
  } catch {
    return null;
  }
}

export type VideoSource = 'youtube' | 'tiktok';
/** Khung xem video ngắn: tự chạy, phát lặp lại. */
export const videoPlayer = (source: VideoSource, id: string) => (source === 'tiktok' ? tiktokPlayer(id, true) : youtubePlayer(id));

/** Trang Video ngắn: mọi video đã đăng (bài loại "video"), bấm là xem ngay. */
export const VIDEO_PAGE = '/video';
/** Admin "Thêm nhanh video ngắn": tối đa bấy nhiêu link một lần. */
export const MAX_QUICK_VIDEOS = 30;
export const videoShareUrl = (slug: string) => `${VIDEO_PAGE}?v=${encodeURIComponent(slug)}`;

/** Video cho thẻ + khung xem video ngắn (components/ShortVideos.tsx). */
export type ShortVideo = {
  id: number; slug: string; href: string; category: string; categoryName: string; title: string;
  source: VideoSource; videoId: string; vertical: boolean; seconds: number | null;
  /** null = video TikTok chưa có ảnh bìa → thẻ hiện nền TikTok. */
  thumb: string | null;
  /** Ảnh YouTube của video ngang (có viền đen trên / dưới) — phóng to cho kín thẻ dọc. */
  zoomThumb: boolean;
};

/** Tiêu đề lấy từ YouTube / TikTok: bỏ hashtag (#shorts #caycanh…), gom khoảng trắng, cắt cho vừa TITLE_MAX. */
export function cleanVideoTitle(raw: string) {
  const s = raw.replace(/(^|\s)#[^\s#]+/gu, ' ').replace(/\s+/g, ' ').trim().replace(/[\s|·•,;:–-]+$/u, '');
  if (s.length <= TITLE_MAX) return s;
  const cut = s.slice(0, TITLE_MAX - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

export function durationLabel(sec: number | null | undefined) {
  if (!sec) return '';
  if (sec < 120) return `${sec} giây`;
  const m = Math.floor(sec / 60), s = sec % 60;
  return s ? `${m} phút ${s} giây` : `${m} phút`;
}

// ---- Ảnh -------------------------------------------------------------------------------------

/**
 * Ảnh bài viết có hai loại: ảnh tải lên (tên file trong bảng post_images) hoặc **link ảnh ngoài** (https://…, vd. ảnh
 * Wikimedia Commons / StockSnap không cần ghi nguồn) — link ngoài hiện thẳng từ máy chủ ảnh kia, không tải về database.
 */
export const EXTERNAL_IMAGE_MAX = 1000;
export const isExternalImage = (f: string) => f.length <= EXTERNAL_IMAGE_MAX && /^https:\/\/[^\s"'<>()\\]+$/i.test(f);
export const postImageUrl = (file: string, slug?: string) => (isExternalImage(file) ? file : imageUrl('post-images', file, slug));

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
  coverFile: string | null; youtubeId: string | null; tiktokId: string | null; reviewerName: string; seoDescription: string;
};

export type Check = { ok: boolean; label: string; /** Thiếu thì không đăng được. */ required?: boolean };

const PESTICIDE_WORDS = /thuoc (bvtv|bao ve thuc vat|tru )|hoat chat|thoi gian cach ly|phun thuoc|pha thuoc|thuoc hoa hoc/;

/** Bài có nhắc tới thuốc BVTV: chữ trong bài hoặc khối sản phẩm có thuốc. */
export function mentionsPesticide(p: Pick<PostDraft, 'title' | 'excerpt' | 'body'>, pesticideSlugs: ReadonlySet<string>) {
  if (p.body.some((b) => b.type === 'products' && b.slugs.some((s) => pesticideSlugs.has(s)))) return true;
  return PESTICIDE_WORDS.test(normalize([p.title, p.excerpt, ...p.body.flatMap(blockText)].join(' ')));
}

export const TITLE_MIN = 10, TITLE_MAX = 150, SEO_MIN = 50, SEO_MAX = 160;

/** Đoạn dẫn nên dài bao nhiêu từ để làm đoạn trả lời nhanh (AI Overview, ChatGPT, Perplexity trích). */
export const LEAD_WORDS_MIN = 25;
export const LEAD_WORDS_MAX = 70;
/** Tiêu đề mục dạng câu hỏi — kiểu người dùng hỏi máy AI. */
export const isQuestionHeading = (s: string) => /\?\s*$/.test(s.trim()) || /(là gì|thế nào|ra sao|bao lâu|bao nhiêu|khi nào|vì sao|tại sao|có nên|cách )/i.test(s);

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
    const has = !!(p.youtubeId || p.tiktokId);
    out.push({ ok: has, required: true, label: has ? `Có link video ${p.tiktokId ? 'TikTok' : 'YouTube'}` : 'Chưa dán link video YouTube / TikTok' });
    if (p.tiktokId) out.push({ ok: !!p.coverFile, label: p.coverFile ? 'Có ảnh bìa' : 'Chưa có ảnh bìa (thẻ video TikTok sẽ hiện nền trơn)' });
  } else {
    const hasText = p.body.some((b) => b.type === 'p' && b.text.trim());
    out.push({ ok: hasText, required: true, label: hasText ? 'Có nội dung bài' : 'Chưa có đoạn văn nào trong bài' });
    out.push({ ok: !!p.coverFile, label: p.coverFile ? 'Có ảnh bìa' : 'Chưa có ảnh bìa (trang sẽ hiện hình minh họa)' });
  }
  // Đoạn dẫn = câu trả lời thẳng cho máy AI / Google trích (AEO): ~40–60 từ là vừa.
  const leadWords = plainText(p.excerpt).trim().split(/\s+/).filter(Boolean).length;
  out.push(!leadWords
    ? { ok: false, label: 'Chưa có đoạn dẫn (hiện dưới tiêu đề và trên thẻ bài)' }
    : { ok: leadWords >= LEAD_WORDS_MIN && leadWords <= LEAD_WORDS_MAX, label: leadWords >= LEAD_WORDS_MIN && leadWords <= LEAD_WORDS_MAX
      ? `Đoạn dẫn ${leadWords} từ (vừa để Google / AI trích làm câu trả lời)`
      : `Đoạn dẫn ${leadWords} từ — nên ${LEAD_WORDS_MIN}–${LEAD_WORDS_MAX} từ, trả lời thẳng câu hỏi chính của bài` });
  if (p.kind === 'article') {
    const h2 = p.body.filter((b): b is { type: 'h2'; text: string } => b.type === 'h2');
    const asks = h2.some((b) => isQuestionHeading(b.text));
    if (h2.length) out.push({ ok: asks, label: asks ? 'Có tiêu đề mục dạng câu hỏi' : 'Nên có ít nhất một tiêu đề mục (H2) dạng câu hỏi: "… là gì?", "Cách … như thế nào?"' });
  }
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
