'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveFaqAction } from '@/app/actions/faqs';
import { answerQuestionAction, moderateAnswerAction, moderateReviewAction } from '@/app/actions/reviews';
import { Icon, Thumb } from '@/components/Icon';
import { stripGreeting, type Suggestion } from '@/lib/reply-suggest';
import { REVIEW_REPLY_MAX_CHARS, starsText, timeAgo } from '@/lib/reviews';
import { FaqForm } from './FaqAdmin';
import { ReviewWarranty } from './ReviewWarranty';

export type AdminReviewRow = {
  id: number;
  status: 'published' | 'pending' | 'hidden';
  stars: number;
  content: string;
  verified: boolean;
  customer: string;
  userId: number;
  productSlug: string;
  productName: string;
  image: string | null;
  icon: string;
  photos: string[];
  flags: { label: string; tone: 'danger' | 'info' | 'warn' }[];
  reply: string;
  createdAt: number;
  edited: boolean;
  moderatedBy: string | null;
  helpful: number;
  suggestion: Suggestion | null;
  /** Yêu cầu bảo hành nhân viên đã tạo thay khách từ đánh giá này. */
  warranty: { id: number; code: string } | null;
};

/** Nhãn tự động của đánh giá xấu cây sống đã mua → có nút tạo yêu cầu bảo hành thay khách. */
const NEEDS_WARRANTY = 'Có thể cần bảo hành';

const TONE = { danger: 'vx-badge--danger', info: 'vx-badge--info', warn: 'vx-badge--sun' } as const;

/** Khung "Gợi ý trả lời" (thiết kế AdminReviews): nháp để nhân viên sửa — bấm "Dùng gợi ý" chỉ chép vào ô trả lời, không tự gửi. */
function SuggestBox({ s, current, onUse }: { s: Suggestion; current: string; onUse: (text: string) => void }) {
  return (
    <div className="rv-ai">
      <b><Icon name="spark" size={11} /> GỢI Ý TRẢ LỜI</b>
      <p>{s.text}</p>
      <small>{s.basis}</small>
      <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={current.trim() === s.text} onClick={() => onUse(s.text)}>
        {current.trim() ? 'Thay bằng gợi ý' : 'Dùng gợi ý'}
      </button>
    </div>
  );
}

/** Một dòng AdminReviews: nội dung + nhãn tự động bên trái, ô trả lời công khai + Duyệt / Ẩn bên phải. */
/** `canCreateWarranty`: người xem có quyền Bảo hành cây toàn quyền (CSKH chỉ xem thì không có nút tạo yêu cầu). */
export function ReviewRow({ r, canCreateWarranty = true }: { r: AdminReviewRow; canCreateWarranty?: boolean }) {
  const router = useRouter();
  const [reply, setReply] = useState(r.reply);
  const [error, setError] = useState('');
  const [wOpen, setWOpen] = useState(false);
  const [pending, start] = useTransition();
  const changed = reply.trim() !== r.reply;
  const canWarranty = r.flags.some((f) => f.label === NEEDS_WARRANTY);

  const act = (action: 'publish' | 'hide' | 'reply') => {
    if (action === 'hide' && !confirm('Chỉ ẩn đánh giá vi phạm (quảng cáo, lộ thông tin cá nhân, xúc phạm). Ẩn đánh giá này?')) return;
    setError('');
    start(async () => {
      const res = await moderateReviewAction({ id: r.id, action, reply }).catch(() => ({ ok: false as const, error: 'Không lưu được, vui lòng thử lại' }));
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  };

  return (
    <div className="rv-item">
      <Link href={`/san-pham/${r.productSlug}#danh-gia`} className="ad-thumb" target="_blank" title="Mở trang sản phẩm">
        <Thumb src={r.image} icon={r.icon} />
      </Link>
      <span>
        <span className="meta">
          <Link href={`/admin/khach-hang/${r.userId}`} className="who">{r.customer}</Link>
          <span className="vx-stars" aria-label={`${r.stars} sao`}>{starsText(r.stars)}</span>
          {' · '}{r.productName}{' · '}
          <span suppressHydrationWarning>{timeAgo(r.createdAt)}{r.edited ? ' (đã sửa)' : ''}</span>
          {r.helpful > 0 && <>{' · '}{r.helpful} người thấy hữu ích</>}
          {r.verified && <span className="vx-verified">Đã mua hàng</span>}
        </span>
        <p className="txt" style={{ whiteSpace: 'pre-line' }}>{r.content}</p>
        {r.photos.length > 0 && (
          <div className="vx-photos rvw-photos" style={{ margin: '4px 0' }}>
            {r.photos.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" aria-label="Xem ảnh lớn"><img src={url} alt="" loading="lazy" /></a>
            ))}
          </div>
        )}
        {r.flags.length > 0 && (
          <span className="flags">
            {r.flags.map((f) => <span key={f.label} className={`vx-badge ${TONE[f.tone]}`}>{f.label}</span>)}
            {canWarranty && (
              <Link href={`/admin/khach-hang/${r.userId}`} className="vx-badge">Xem đơn &amp; bảo hành của khách →</Link>
            )}
            {r.warranty && (
              <Link href={`/admin/bao-hanh/${r.warranty.id}`} className="vx-badge vx-badge--success">Đã tạo bảo hành {r.warranty.code} →</Link>
            )}
          </span>
        )}
        {r.status === 'hidden' && r.moderatedBy && <small style={{ display: 'block', color: 'var(--ink-muted)', marginTop: 4 }}>Ẩn bởi {r.moderatedBy}</small>}
      </span>
      <span className="rv-act">
        {!r.reply && r.suggestion && <SuggestBox s={r.suggestion} current={reply} onUse={setReply} />}
        <textarea
          className="vx-input"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          maxLength={REVIEW_REPLY_MAX_CHARS}
          placeholder="Trả lời công khai (khách khác cũng thấy)…"
          aria-label="Trả lời công khai"
        />
        {error && <small style={{ color: 'var(--danger)' }}>{error}</small>}
        <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {r.status === 'pending' && (
            <>
              <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending} onClick={() => act('publish')}>
                {reply.trim() ? 'Duyệt & trả lời' : 'Duyệt'}
              </button>
              <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={() => act('hide')}>Ẩn</button>
            </>
          )}
          {r.status === 'published' && (
            <>
              <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending || !changed} onClick={() => act('reply')}>
                {r.reply ? 'Lưu trả lời' : 'Trả lời'}
              </button>
              <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={() => act('hide')}>Ẩn</button>
            </>
          )}
          {r.status === 'hidden' && (
            <>
              <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => act('publish')}>Hiện lại</button>
              {changed && <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={() => act('reply')}>Lưu trả lời</button>}
            </>
          )}
          {canWarranty && canCreateWarranty && !r.warranty && !wOpen && (
            <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => setWOpen(true)}>Tạo yêu cầu bảo hành</button>
          )}
        </span>
      </span>
      {wOpen && <ReviewWarranty reviewId={r.id} userId={r.userId} onClose={() => setWOpen(false)} />}
    </div>
  );
}

export type AdminAnswerRow = {
  id: number;
  customer: string;
  userId: number;
  content: string;
  status: 'published' | 'pending' | 'hidden';
  verified: boolean;
  staff: boolean;
  createdAt: number;
  moderatedBy: string | null;
  flags: { label: string; tone: 'danger' | 'info' | 'warn' }[];
  helpful: number;
};

export type AdminQuestionRow = {
  id: number;
  status: 'visible' | 'hidden';
  content: string;
  customer: string;
  userId: number;
  productSlug: string;
  productName: string;
  image: string | null;
  icon: string;
  flags: { label: string; tone: 'danger' | 'info' | 'warn' }[];
  answer: string;
  answerBy: string | null;
  createdAt: number;
  moderatedBy: string | null;
  helpful: number;
  answers: AdminAnswerRow[];
  /** Đã đưa lên Câu hỏi thường gặp. */
  faqId: number | null;
  /** Số câu hỏi khác gần giống câu này. */
  repeats: number;
  suggestion: Suggestion | null;
};

/** Nên đưa lên FAQ: được hỏi lại nhiều hoặc nhiều người thấy hữu ích. */
const FAQ_WORTHY = (q: AdminQuestionRow) => Boolean(q.answer) && !q.faqId && (q.repeats >= 2 || q.helpful >= 3);

/**
 * Một câu hỏi của khách (tab Câu hỏi): trả lời công khai → hiện trên trang sản phẩm + báo cho người hỏi;
 * duyệt / ẩn câu trả lời của khách khác; đưa câu hỏi hay lên Câu hỏi thường gặp.
 */
export function QuestionRow({ q }: { q: AdminQuestionRow }) {
  const router = useRouter();
  const [answer, setAnswer] = useState(q.answer);
  const [error, setError] = useState('');
  const [faqOpen, setFaqOpen] = useState(false);
  const [pending, start] = useTransition();
  const changed = answer.trim() !== q.answer;

  const act = (action: 'answer' | 'hide' | 'show') => {
    if (action === 'hide' && !confirm('Ẩn câu hỏi này (spam, quảng cáo, xúc phạm)? Khách khác sẽ không thấy.')) return;
    setError('');
    start(async () => {
      const res = await answerQuestionAction({ id: q.id, action, answer }).catch(() => ({ ok: false as const, error: 'Không lưu được, vui lòng thử lại' }));
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  };

  return (
    <div className="rv-item">
      <Link href={`/san-pham/${q.productSlug}#cau-hoi`} className="ad-thumb" target="_blank" title="Mở trang sản phẩm">
        <Thumb src={q.image} icon={q.icon} />
      </Link>
      <span>
        <span className="meta">
          <Link href={`/admin/khach-hang/${q.userId}`} className="who">{q.customer}</Link>
          {' hỏi · '}{q.productName}{' · '}
          <span suppressHydrationWarning>{timeAgo(q.createdAt)}</span>
          {q.helpful > 0 && <>{' · '}{q.helpful} người thấy hữu ích</>}
        </span>
        <p className="txt" style={{ whiteSpace: 'pre-line' }}>{q.content}</p>
        {(q.flags.length > 0 || q.repeats > 0 || q.faqId || FAQ_WORTHY(q)) && (
          <span className="flags">
            {q.flags.map((f) => <span key={f.label} className={`vx-badge ${TONE[f.tone]}`}>{f.label}</span>)}
            {q.repeats > 0 && <span className="vx-badge vx-badge--info">Được hỏi lại {q.repeats} lần</span>}
            {FAQ_WORTHY(q) && <span className="vx-badge vx-badge--sun">Nên đưa lên FAQ</span>}
            {q.faqId && <Link href="/admin/danh-gia?tab=faq" className="vx-badge vx-badge--success">Đã ở Câu hỏi thường gặp →</Link>}
          </span>
        )}
        {q.answer && q.answerBy && <small style={{ display: 'block', color: 'var(--ink-muted)', marginTop: 4 }}>Trả lời bởi {q.answerBy}</small>}
        {q.status === 'hidden' && q.moderatedBy && <small style={{ display: 'block', color: 'var(--ink-muted)', marginTop: 4 }}>Ẩn bởi {q.moderatedBy}</small>}
        {q.answers.length > 0 && (
          <span className="rv-ans">
            {q.answers.map((a) => <AnswerLine key={a.id} a={a} />)}
          </span>
        )}
      </span>
      <span className="rv-act">
        {!q.answer && q.status === 'visible' && q.suggestion && <SuggestBox s={q.suggestion} current={answer} onUse={setAnswer} />}
        <textarea
          className="vx-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          maxLength={REVIEW_REPLY_MAX_CHARS}
          placeholder="Trả lời công khai (khách khác cũng thấy)…"
          aria-label="Câu trả lời"
        />
        {error && <small style={{ color: 'var(--danger)' }}>{error}</small>}
        <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {q.status === 'visible' ? (
            <>
              <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending || !answer.trim() || !changed} onClick={() => act('answer')}>
                {q.answer ? 'Lưu trả lời' : 'Trả lời'}
              </button>
              <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={() => act('hide')}>Ẩn</button>
              {q.answer && !q.faqId && !faqOpen && (
                <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => setFaqOpen(true)}>Đưa lên FAQ</button>
              )}
            </>
          ) : (
            <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => act('show')}>Hiện lại</button>
          )}
        </span>
      </span>
      {faqOpen && (
        <FaqForm
          initial={{ question: q.content, answer: stripGreeting(q.answer), scope: 'product', active: true }}
          productName={q.productName}
          submitLabel="Đưa lên Câu hỏi thường gặp"
          onCancel={() => setFaqOpen(false)}
          onSubmit={async (v) => {
            const r = await saveFaqAction({ questionId: q.id, ...v });
            if (!r.ok) return r.error;
            setFaqOpen(false);
            router.refresh();
            return null;
          }}
        />
      )}
    </div>
  );
}

const ANSWER_STATUS = { pending: ['Chờ duyệt', 'vx-badge--sun'], hidden: ['Đã ẩn', ''], published: null } as const;

/** Câu trả lời của khách dưới câu hỏi (admin): có SĐT/link → chờ duyệt; nhân viên duyệt / ẩn / hiện lại. */
function AnswerLine({ a }: { a: AdminAnswerRow }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const st = ANSWER_STATUS[a.status];

  const act = (action: 'publish' | 'hide') => {
    if (action === 'hide' && !confirm('Ẩn câu trả lời này (quảng cáo, sai thông tin, xúc phạm)?')) return;
    setError('');
    start(async () => {
      const res = await moderateAnswerAction({ id: a.id, action }).catch(() => ({ ok: false as const, error: 'Không lưu được, vui lòng thử lại' }));
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  };

  return (
    <div>
      <span className="meta">
        <Link href={`/admin/khach-hang/${a.userId}`} className="who">{a.customer}</Link>
        {' trả lời · '}
        <span suppressHydrationWarning>{timeAgo(a.createdAt)}</span>
        {a.helpful > 0 && <>{' · '}{a.helpful} người thấy hữu ích</>}
        {a.staff ? <span className="vx-staff">Nhân viên</span> : a.verified && <span className="vx-verified">Đã mua hàng</span>}
        {st && <span className={`vx-badge ${st[1]}`}>{st[0]}</span>}
        {a.flags.map((f) => <span key={f.label} className={`vx-badge ${TONE[f.tone]}`}>{f.label}</span>)}
      </span>
      <span style={{ whiteSpace: 'pre-line' }}>{a.content}</span>
      <span className="acts">
        {a.status !== 'published' && (
          <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => act('publish')}>
            {a.status === 'pending' ? 'Duyệt' : 'Hiện lại'}
          </button>
        )}
        {a.status !== 'hidden' && <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={() => act('hide')}>Ẩn</button>}
        {a.status === 'hidden' && a.moderatedBy && <small style={{ color: 'var(--ink-muted)' }}>Ẩn bởi {a.moderatedBy}</small>}
        {error && <small style={{ color: 'var(--danger)' }}>{error}</small>}
      </span>
    </div>
  );
}
