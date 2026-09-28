'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { askQuestionAction, deleteQuestionAction } from '@/app/actions/reviews';
import { useAuth } from '@/lib/auth';
import { initials, QUESTION_MAX_CHARS, QUESTION_MIN_CHARS, timeAgo, type QuestionView } from '@/lib/reviews';
import { HelpfulButton } from './HelpfulButton';
import { Icon } from './Icon';

type Sort = 'new' | 'old' | 'helpful';
const PAGE = 5;

/**
 * Khối QnA dưới đánh giá: ô đặt câu hỏi → chip sắp xếp → câu hỏi + trả lời của kỹ sư.
 * Khách khác chỉ thấy câu hỏi đã trả lời; người hỏi thấy câu hỏi của mình kèm "Đang chờ shop trả lời".
 */
export function ProductQnA({ slug, items }: { slug: string; items: QuestionView[] }) {
  const { user, openLogin } = useAuth();
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sort, setSort] = useState<Sort>('new');
  const [shown, setShown] = useState(PAGE);
  const [pending, start] = useTransition();
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const len = text.trim().length;

  useEffect(() => {
    if (location.hash === '#cau-hoi') document.getElementById('cau-hoi')?.scrollIntoView({ block: 'start' });
  }, []);

  const mine = items.filter((q) => q.mine);
  const others = items.filter((q) => !q.mine).sort((a, b) =>
    sort === 'old' ? a.createdAt - b.createdAt : sort === 'helpful' ? b.helpful - a.helpful || b.createdAt - a.createdAt : b.createdAt - a.createdAt);
  const list = [...mine, ...others];

  const submit = () => {
    setError('');
    setNotice('');
    if (!user) { openLogin(); return; }
    if (len < QUESTION_MIN_CHARS) { setError(`Câu hỏi cần ít nhất ${QUESTION_MIN_CHARS} ký tự`); boxRef.current?.focus(); return; }
    start(async () => {
      const r = await askQuestionAction({ slug, content: text }).catch(() => ({ ok: false as const, error: 'Không gửi được. Vui lòng kiểm tra mạng và thử lại.' }));
      if (!r.ok) { setError(r.error); return; }
      setText('');
      setNotice('Đã gửi câu hỏi. Kỹ sư sẽ trả lời trong 2 giờ làm việc, bạn sẽ nhận thông báo khi có trả lời.');
      router.refresh();
    });
  };

  return (
    <section className="vx-card app-qa" id="cau-hoi">
      <h2 style={{ margin: 0, fontSize: 18 }}>
        Hỏi đáp <small style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: 14 }}>({list.length} câu hỏi)</small>
      </h2>
      <div className="vx-ask">
        <textarea
          ref={boxRef}
          className="vx-input"
          value={text}
          maxLength={QUESTION_MAX_CHARS}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập câu hỏi về cây, cách chăm, giao hàng… Kỹ sư Cây Cảnh Miền Tây sẽ trả lời trong 2 giờ làm việc."
          aria-label="Câu hỏi của bạn"
        />
        <div className="app-qa__bar">
          <small style={{ color: 'var(--ink-muted)' }}>
            {len ? `${len}/${QUESTION_MAX_CHARS} ký tự` : !user ? 'Đăng nhập để gửi câu hỏi và nhận thông báo khi có trả lời' : ''}
          </small>
          <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" onClick={submit} disabled={pending}>
            {pending ? 'Đang gửi…' : 'Gửi câu hỏi'}
          </button>
        </div>
        {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}
      </div>
      {notice && <div className="vx-note" role="status"><Icon name="check" /><div>{notice}</div></div>}

      {others.length > 1 && (
        <div className="vx-row" style={{ flexWrap: 'wrap' }}>
          <span className="vx-spec">Lọc theo:</span>
          {([['new', 'Mới nhất'], ['old', 'Cũ nhất'], ['helpful', 'Hữu ích nhất']] as const).map(([k, label]) => (
            <button key={k} type="button" className="vx-chip" aria-pressed={sort === k} onClick={() => { setSort(k); setShown(PAGE); }}>{label}</button>
          ))}
        </div>
      )}

      {list.slice(0, shown).map((q) => <QuestionItem key={q.id} q={q} />)}
      {!list.length && <p style={{ color: 'var(--ink-muted)', fontSize: 14, margin: 0 }}>Chưa có câu hỏi nào. Bạn cần tư vấn gì về sản phẩm này?</p>}
      {list.length > shown && (
        <button type="button" className="vx-btn vx-btn--ghost" style={{ alignSelf: 'center' }} onClick={() => setShown((n) => n + 10)}>
          Xem thêm {list.length - shown} câu hỏi
        </button>
      )}
    </section>
  );
}

function QuestionItem({ q }: { q: QuestionView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const remove = () => {
    if (!confirm('Xóa câu hỏi này?')) return;
    start(async () => {
      const r = await deleteQuestionAction(q.id).catch(() => ({ ok: false as const, error: 'Không xóa được, vui lòng thử lại' }));
      if (!r.ok) { alert(r.error); return; }
      router.refresh();
    });
  };

  return (
    <div className="vx-review">
      <span className="vx-avatar vx-avatar--sm">{initials(q.name)}</span>
      <div className="vx-review__body">
        <div className="vx-review__who">{q.name}<small suppressHydrationWarning>{timeAgo(q.createdAt)}</small></div>
        <span style={{ whiteSpace: 'pre-line' }}>{q.content}</span>
        <div className="vx-review__acts">
          <HelpfulButton kind="question" id={q.id} count={q.helpful} voted={q.voted} own={q.mine} />
          {q.mine && (
            <>
              <span>Câu hỏi của bạn</span>
              <a role="button" tabIndex={0} onClick={pending ? undefined : remove} onKeyDown={(e) => e.key === 'Enter' && remove()}>
                {pending ? 'Đang xóa…' : 'Xóa'}
              </a>
            </>
          )}
        </div>
        {q.answer ? (
          <div className="vx-reply">
            <span className="vx-avatar vx-avatar--sm vx-avatar--shop">MT</span>
            <div className="vx-review__body">
              <div className="vx-review__who">
                Cây Cảnh Miền Tây<span className="vx-staff">Kỹ sư</span>
                {q.answeredAt && <small suppressHydrationWarning>{timeAgo(q.answeredAt)}</small>}
              </div>
              <span style={{ whiteSpace: 'pre-line' }}>{q.answer}</span>
            </div>
          </div>
        ) : q.mine && (
          <small className="app-qa__wait"><Icon name="clock" size={14} /> Đang chờ shop trả lời — bạn sẽ nhận thông báo khi có trả lời.</small>
        )}
      </div>
    </div>
  );
}
