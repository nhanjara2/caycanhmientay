/**
 * Tham số trên đường dẫn của các trang danh sách (mục 6 checklist SEO: phân trang, bộ lọc, tìm kiếm, URL động).
 *
 * Mỗi trang danh sách có một DANH SÁCH TRẮNG tham số, viết theo đúng thứ tự chuẩn. Đường dẫn khác dạng chuẩn
 * (tham số lạ, giá trị sai, thứ tự khác, ?trang=1, ô rỗng…) → `redirectIfNotCanonical` chuyển hẳn (308) về dạng chuẩn
 * trong MỘT bước, nên mỗi nội dung chỉ có một URL và tổ hợp tham số không sinh vô hạn URL.
 * Giữ nguyên tham số theo dõi (utm_…, fbclid…) — canonical đã bỏ chúng, chuyển hướng thì mất số liệu quảng cáo.
 * Tham số lặp (?q=a&q=b) đã được src/proxy.ts gộp trước khi tới trang.
 */
import { permanentRedirect } from 'next/navigation';

export type SearchParams = Record<string, string | string[] | undefined>;

/** Tham số theo dõi quảng cáo / chia sẻ — không đổi nội dung trang. */
export const TRACKING_PARAM = /^(utm_[a-z_]+|fbclid|gclid|gbraid|wbraid|dclid|msclkid|ttclid|igshid|srsltid|zarsrc|mc_cid|mc_eid|_ga|_gl)$/i;

/** Giá trị đầu tiên của một tham số (searchParams cho mảng khi tham số lặp lại). */
export const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

/** "?trang=" hợp lệ: số nguyên dương viết chuẩn (không 0, không số 0 đầu, không âm). */
export const PAGE_RE = /^[1-9]\d{0,3}$/;

/** Số trang đang xem (1 khi không có / sai dạng). */
export const pageOf = (v: string | string[] | undefined) => {
  const s = one(v);
  return s && PAGE_RE.test(s) ? Number(s) : 1;
};

/** Chuỗi query chuẩn từ danh sách [tên, giá trị] theo đúng thứ tự (bỏ giá trị rỗng); dấu phẩy giữ nguyên cho dễ đọc. */
export function buildQuery(pairs: [string, string | number | undefined | null][]): string {
  const q = new URLSearchParams();
  for (const [k, v] of pairs) if (v !== undefined && v !== null && String(v) !== '') q.append(k, String(v));
  return q.toString().replace(/%2C/gi, ',');
}

export const withParams = (path: string, pairs: [string, string | number | undefined | null][]) => {
  const q = buildQuery(pairs);
  return q ? `${path}?${q}` : path;
};

/** Tham số đang có trên URL (bỏ tham số theo dõi và tham số nội bộ của Next bắt đầu bằng "_"), đúng thứ tự. */
function currentPairs(sp: SearchParams): [string, string][] {
  return Object.entries(sp).flatMap(([k, v]) =>
    TRACKING_PARAM.test(k) || k.startsWith('_') ? [] : (Array.isArray(v) ? v : [v ?? '']).map((x): [string, string] => [k, x]));
}

/**
 * Chuyển hẳn (308) về dạng chuẩn nếu URL đang mở khác: `want` là tham số chuẩn theo thứ tự (giá trị undefined = không có).
 * So bằng chuỗi query đã mã hóa nên khác thứ tự, khác hoa thường, thừa tham số hay ô rỗng đều bị bắt.
 */
export function redirectIfNotCanonical(path: string, sp: SearchParams, want: [string, string | number | undefined | null][]) {
  const now = buildQuery(currentPairs(sp));
  const target = buildQuery(want);
  if (now === target) return;
  const keep = Object.entries(sp).flatMap(([k, v]): [string, string][] => (TRACKING_PARAM.test(k) ? [[k, one(v) ?? '']] : []));
  permanentRedirect(withParams(path, [...want, ...keep]));
}
