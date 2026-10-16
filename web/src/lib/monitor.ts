/**
 * Giám sát SEO (mục 19 checklist SEO) — phần dùng chung client / server / proxy: nhận diện máy tìm kiếm, nhóm trang,
 * ngày theo giờ Việt Nam, tên chỉ số tốc độ. Ghi / đọc database ở server/monitor-store.ts + server/monitor.ts.
 */

/** Máy đọc trang, theo thứ tự dò (mẫu đầu khớp thắng). `verify` = xác minh được bằng tra ngược DNS địa chỉ IP. */
export const BOTS = [
  { key: 'google', label: 'Googlebot', re: /googlebot|google-inspectiontool|googleother|storebot-google|adsbot-google|mediapartners-google|apis-google|feedfetcher-google/i, verify: /\.(googlebot|google)\.com$/ },
  { key: 'bing', label: 'Bingbot', re: /bingbot|msnbot|adidxbot|bingpreview/i, verify: /\.search\.msn\.com$/ },
  { key: 'coccoc', label: 'Cốc Cốc', re: /coccocbot/i },
  { key: 'facebook', label: 'Facebook', re: /facebookexternalhit|facebookcatalog|meta-externalagent/i },
  { key: 'zalo', label: 'Zalo', re: /zalo/i },
  { key: 'apple', label: 'Applebot', re: /applebot/i },
  { key: 'seo-tool', label: 'Công cụ SEO (Ahrefs, Semrush…)', re: /ahrefsbot|semrushbot|mj12bot|dotbot|rogerbot|screaming frog|sitebulb|dataforseobot/i },
  { key: 'ai', label: 'Máy AI (GPTBot, ClaudeBot…)', re: /gptbot|chatgpt-user|oai-searchbot|claudebot|claude-user|perplexitybot|ccbot|bytespider|amazonbot/i },
  { key: 'other', label: 'Máy khác', re: /bot\b|crawl|spider|slurp|yandex|baidu|sogou|petalbot/i },
] as const;

export type BotKey = (typeof BOTS)[number]['key'];

/** User-Agent → máy đọc trang (null = người thật / trình duyệt). */
export function botOf(ua: string | null | undefined): BotKey | null {
  if (!ua) return null;
  return BOTS.find((b) => b.re.test(ua))?.key ?? null;
}

export const botLabel = (key: string) => BOTS.find((b) => b.key === key)?.label ?? key;
export const verifiableBot = (key: string) => BOTS.some((b) => b.key === key && 'verify' in b);
/** Tên máy chủ (PTR) hợp lệ cho máy này, vd. "crawl-66-249-66-1.googlebot.com". */
export function botHostOk(key: string, host: string) {
  const b = BOTS.find((x) => x.key === key);
  return !!b && 'verify' in b && b.verify.test(host.replace(/\.$/, ''));
}

/** Nhóm trang theo đoạn đầu đường dẫn — để xem máy tìm kiếm tải nhóm nào, tốc độ nhóm nào chậm. */
export const PAGE_GROUPS: Record<string, string> = {
  'trang-chu': 'Trang chủ',
  'san-pham': 'Sản phẩm',
  'danh-muc': 'Danh mục',
  'benh-cay': 'Bệnh cây',
  'goc-cham-cay': 'Góc chăm cây',
  'tin-tuc': 'Truyền thông',
  video: 'Video',
  'doi-tac': 'Đối tác sỉ / công trình',
  'chinh-sach': 'Chính sách',
  'tim-kiem': 'Tìm kiếm',
  'khuyen-mai': 'Khuyến mãi',
  'he-thong-cua-hang': 'Hệ thống cửa hàng',
  'tu-van-chon-cay': 'Tư vấn chọn cây',
  'bao-gia-si': 'Báo giá sỉ',
  'gio-hang': 'Giỏ / thanh toán',
  'thanh-toan': 'Giỏ / thanh toán',
  'tai-khoan': 'Tài khoản',
  'cay-tet': 'Cây Tết',
  'flash-sale': 'Flash sale',
  khac: 'Khác',
};

/** "/san-pham/kim-tien" → "san-pham"; có ?tham số thì thêm "?" ("danh-muc?") để thấy máy tìm kiếm có sa vào URL lọc không. */
export function pageGroupOf(pathname: string, hasQuery = false) {
  const first = pathname.split('/').filter(Boolean)[0] ?? 'trang-chu';
  const key = first in PAGE_GROUPS ? first : 'khac';
  return hasQuery ? `${key}?` : key;
}
export const pageGroupLabel = (g: string) => `${PAGE_GROUPS[g.replace(/\?$/, '')] ?? g}${g.endsWith('?') ? ' (có tham số)' : ''}`;

/** Ngày theo giờ Việt Nam "YYYY-MM-DD" (máy chủ Vercel chạy giờ UTC). */
export const vnDay = (d = new Date()) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);

/** Chỉ số Core Web Vitals đo trên máy khách thật. Ngưỡng theo web.dev (tốt / kém). */
export const VITALS = {
  LCP: { label: 'LCP — tải nội dung chính', unit: 'ms', good: 2500, poor: 4000 },
  INP: { label: 'INP — phản hồi khi bấm', unit: 'ms', good: 200, poor: 500 },
  CLS: { label: 'CLS — nhảy bố cục', unit: '', good: 0.1, poor: 0.25 },
  FCP: { label: 'FCP — hiện chữ đầu tiên', unit: 'ms', good: 1800, poor: 3000 },
  TTFB: { label: 'TTFB — máy chủ trả byte đầu', unit: 'ms', good: 800, poor: 1800 },
} as const;
export type VitalName = keyof typeof VITALS;
export const VITAL_RATINGS = ['good', 'needs-improvement', 'poor'] as const;
export type VitalRating = (typeof VITAL_RATINGS)[number];
export const rateVital = (name: VitalName, value: number): VitalRating =>
  value <= VITALS[name].good ? 'good' : value > VITALS[name].poor ? 'poor' : 'needs-improvement';

/** Loại lỗi ghi vào bảng error_events. */
export const ERROR_KINDS: Record<string, string> = {
  ssr: 'Dựng trang (máy chủ)',
  api: 'API',
  action: 'Server action',
  proxy: 'Proxy',
  client: 'Script trình duyệt',
  hydration: 'Hydration',
};

/** Rút gọn nội dung lỗi để gom: bỏ số dài / mã ngẫu nhiên, tối đa 300 ký tự. */
export const errorKey = (message: string) =>
  message.replace(/\s+/g, ' ').replace(/\b[0-9a-f]{16,}\b/gi, '#').replace(/\d{5,}/g, '#').trim().slice(0, 300) || '(không có nội dung)';

/** Đường dẫn hợp lệ để ghi (bỏ tham số, tối đa 300 ký tự). */
export const cleanPath = (p: string) => (p.startsWith('/') ? p.split(/[?#]/)[0].slice(0, 300) : '/');
