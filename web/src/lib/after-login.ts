import type { VoteKind } from './reviews';

/**
 * Việc khách chưa đăng nhập vừa bấm (gửi câu hỏi, trả lời, viết đánh giá, "Hữu ích", lưu yêu thích) → ghi lại rồi mới mở hộp đăng nhập.
 * Đăng nhập Google chuyển hẳn sang trang của Google rồi tải lại trang, nên thứ chỉ giữ trong React đều mất —
 * phải lưu vào sessionStorage (cùng tab). Đăng nhập xong, component tương ứng lấy ra (`takeAfterLogin`) và làm tiếp.
 * Đóng hộp đăng nhập mà không đăng nhập thì bỏ (AuthProvider) — không tự làm vào lần đăng nhập sau.
 */
export type AfterLogin =
  | { kind: 'question'; slug: string; text: string }
  | { kind: 'reply'; slug: string; questionId: number }
  | { kind: 'review'; slug: string }
  | { kind: 'helpful'; target: VoteKind; id: number }
  | { kind: 'wishlist'; slug: string };

type Of<K extends AfterLogin['kind']> = Extract<AfterLogin, { kind: K }>;

const KEY = 'ccmt_after_login';
const TTL = 10 * 60_000;

export function saveAfterLogin(a: AfterLogin) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...a, at: Date.now() })); } catch { /* trình duyệt chặn lưu trữ: đăng nhập SĐT vẫn làm tiếp được vì không tải lại trang */ }
}

export function clearAfterLogin() {
  try { sessionStorage.removeItem(KEY); } catch { /* như trên */ }
}

/** Xem (không xóa) việc đang chờ nếu đúng loại và khớp điều kiện. */
export function peekAfterLogin<K extends AfterLogin['kind']>(kind: K, match: (a: Of<K>) => boolean): Of<K> | null {
  try {
    const a = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as (Of<K> & { at: number }) | null;
    if (!a || a.kind !== kind || Date.now() - a.at > TTL) return null;
    return match(a) ? a : null;
  } catch { return null; }
}

/** Lấy ra và xóa luôn — chỉ một component làm tiếp (kể cả khi effect chạy 2 lần ở chế độ dev). */
export function takeAfterLogin<K extends AfterLogin['kind']>(kind: K, match: (a: Of<K>) => boolean): Of<K> | null {
  const a = peekAfterLogin(kind, match);
  if (a) clearAfterLogin();
  return a;
}
