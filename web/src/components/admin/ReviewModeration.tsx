'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { answerQuestionAction, moderateReviewAction } from '@/app/actions/reviews';
import { Thumb } from '@/components/Icon';
import { REVIEW_REPLY_MAX_CHARS, starsText, timeAgo } from '@/lib/reviews';

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
};

const TONE = { danger: 'vx-badge--danger', info: 'vx-badge--info', warn: 'vx-badge--sun' } as const;

/** Một dòng AdminReviews: nội dung + nhãn tự động bên trái, ô trả lời công khai + Duyệt / Ẩn bên phải. */
export function ReviewRow({ r }: { r: AdminReviewRow }) {
  const router = useRouter();
  const [reply, setReply] = useState(r.reply);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const changed = reply.trim() !== r.reply;

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
            {r.flags.some((f) => f.label === 'Có thể cần bảo hành') && (
              <Link href={`/admin/khach-hang/${r.userId}`} className="vx-badge">Xem đơn &amp; bảo hành của khách →</Link>
            )}
          </span>
        )}
        {r.status === 'hidden' && r.moderatedBy && <small style={{ display: 'block', color: 'var(--ink-muted)', marginTop: 4 }}>Ẩn bởi {r.moderatedBy}</small>}
      </span>
      <span className="rv-act">
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
        </span>
      </span>
    </div>
  );
}

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
};

/** Một câu hỏi của khách (tab Câu hỏi): trả lời công khai → hiện trên trang sản phẩm + báo cho người hỏi. */
export function QuestionRow({ q }: { q: AdminQuestionRow }) {
  const router = useRouter();
  const [answer, setAnswer] = useState(q.answer);
  const [error, setError] = useState('');
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
        {q.flags.length > 0 && (
          <span className="flags">
            {q.flags.map((f) => <span key={f.label} className={`vx-badge ${TONE[f.tone]}`}>{f.label}</span>)}
          </span>
        )}
        {q.answer && q.answerBy && <small style={{ display: 'block', color: 'var(--ink-muted)', marginTop: 4 }}>Trả lời bởi {q.answerBy}</small>}
        {q.status === 'hidden' && q.moderatedBy && <small style={{ display: 'block', color: 'var(--ink-muted)', marginTop: 4 }}>Ẩn bởi {q.moderatedBy}</small>}
      </span>
      <span className="rv-act">
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
            </>
          ) : (
            <button type="button" className="vx-btn vx-btn--outline vx-btn--sm" disabled={pending} onClick={() => act('show')}>Hiện lại</button>
          )}
        </span>
      </span>
    </div>
  );
}
