// Đánh giá sản phẩm — dùng chung client/server.

export const REVIEW_MIN_CHARS = 10;
export const REVIEW_MAX_CHARS = 1000;
export const REVIEW_REPLY_MAX_CHARS = 1000;
export const MAX_REVIEW_PHOTOS = 3;
/** Đánh giá từ số sao này trở xuống phải chờ admin duyệt mới hiện cho khách khác (người viết không được báo). */
export const REVIEW_HOLD_STARS = 2;

export const STAR_LABEL = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'] as const;

export const starsText = (n: number) => {
  const k = Math.max(0, Math.min(5, Math.round(n)));
  return '★'.repeat(k) + '☆'.repeat(5 - k);
};

/** "Ngọc Hân" → "NH"; tên trống → "KH". */
export function initials(name: string) {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (!w.length) return 'KH';
  return (w.length === 1 ? w[0].slice(0, 2) : w[w.length - 2][0] + w[w.length - 1][0]).toUpperCase();
}

export const reviewPhotoUrl = (file: string) => `/api/review-photos/${file}`;

/** Một đánh giá gửi về trình duyệt. Không có trạng thái duyệt — người viết không biết đánh giá đang chờ duyệt. */
export type ReviewView = {
  id: number;
  name: string;
  stars: number;
  content: string;
  verified: boolean;
  /** ms */
  createdAt: number;
  photos: { file: string; url: string }[];
  reply: string | null;
  repliedAt: number | null;
  mine: boolean;
  /** Số lượt "Hữu ích". */
  helpful: number;
  /** Người xem đã bấm "Hữu ích". */
  voted: boolean;
};

// ---- Hỏi đáp --------------------------------------------------------------------------------

export const QUESTION_MIN_CHARS = 10;
export const QUESTION_MAX_CHARS = 500;
/** Chống spam: tối đa số câu hỏi một tài khoản gửi trong 24 giờ (mọi sản phẩm). */
export const QUESTION_DAILY_LIMIT = 10;

/** Chống spam: tối đa số câu trả lời (khách trả lời nhau) một tài khoản gửi trong 24 giờ. */
export const ANSWER_DAILY_LIMIT = 20;

/** Câu trả lời của khách khác dưới câu hỏi. Không có trạng thái duyệt — người viết thấy như đã đăng. */
export type AnswerView = {
  id: number;
  name: string;
  content: string;
  createdAt: number;
  /** Người trả lời đã mua sản phẩm. */
  verified: boolean;
  /** Nhân viên shop trả lời bằng tài khoản trên web. */
  staff: boolean;
  mine: boolean;
};

/** Một câu hỏi gửi về trình duyệt. */
export type QuestionView = {
  id: number;
  name: string;
  content: string;
  createdAt: number;
  answer: string | null;
  answeredAt: number | null;
  mine: boolean;
  helpful: number;
  voted: boolean;
  /** Khách khác trả lời (sau câu trả lời của shop). */
  answers: AnswerView[];
  /** Được viết câu trả lời (câu hỏi không bị ẩn). */
  open: boolean;
  /** Câu hỏi chưa ai trả lời, chỉ hiện vì người xem đã mua sản phẩm → mời chia sẻ kinh nghiệm. */
  askBuyer: boolean;
};

// ---- Câu hỏi thường gặp ---------------------------------------------------------------------

/** Số câu tối đa ở mục Câu hỏi thường gặp mỗi trang sản phẩm (thiết kế FAQ: 4–6 câu). */
export const FAQ_LIMIT = 6;
export const FAQ_QUESTION_MAX_CHARS = 200;
export const FAQ_ANSWER_MAX_CHARS = 1000;

/** Phạm vi một câu FAQ: riêng sản phẩm, hoặc chung cho mọi cây sống / mọi vật tư / mọi sản phẩm. */
export const FAQ_SCOPES = { product: 'Chỉ sản phẩm này', plant: 'Mọi cây sống', supply: 'Mọi vật tư', all: 'Mọi sản phẩm' } as const;
export type FaqScope = keyof typeof FAQ_SCOPES;

export type VoteKind = 'review' | 'question';

export type ReviewStats = {
  count: number;
  /** 0 khi chưa có đánh giá. */
  avg: number;
  /** Số đánh giá theo sao, chỉ số 0 = 1★ … 4 = 5★. */
  dist: [number, number, number, number, number];
  withPhotos: number;
};

export function reviewStats(items: Pick<ReviewView, 'stars' | 'photos'>[]): ReviewStats {
  const dist: ReviewStats['dist'] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of items) {
    dist[r.stars - 1]++;
    sum += r.stars;
  }
  return {
    count: items.length,
    avg: items.length ? Math.round((sum / items.length) * 10) / 10 : 0,
    dist,
    withPhotos: items.filter((r) => r.photos.length).length,
  };
}

export function timeAgo(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60_000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  if (m < 24 * 60) return `${Math.floor(m / 60)} giờ trước`;
  const d = Math.floor(m / (24 * 60));
  if (d < 7) return `${d} ngày trước`;
  return new Date(ms).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
}
