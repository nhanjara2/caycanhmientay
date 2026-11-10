'use client';

import { useL } from '@/lib/use-l';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { answerAsCustomerAction, askQuestionAction, deleteAnswerAction, deleteQuestionAction } from '@/app/actions/reviews';
import { peekAfterLogin, saveAfterLogin, takeAfterLogin } from '@/lib/after-login';
import { useAuth } from '@/lib/auth';
import { initials, QUESTION_MAX_CHARS, QUESTION_MIN_CHARS, timeAgo, type AnswerView, type QuestionView } from '@/lib/reviews';
import { HelpfulButton } from './HelpfulButton';
import { Icon } from './Icon';

type Sort = 'new' | 'old' | 'helpful';
const PAGE = 5;

/**
 * Khối QnA dưới đánh giá: ô đặt câu hỏi → chip sắp xếp → câu hỏi + trả lời của kỹ sư + trả lời của khách khác.
 * Khách khác chỉ thấy câu hỏi đã có người trả lời; người hỏi thấy câu hỏi của mình kèm "Đang chờ shop trả lời";
 * người đã mua sản phẩm thấy cả câu hỏi chưa ai trả lời để chia sẻ kinh nghiệm.
 */
export function ProductQnA({ slug, items, pesticide }: { slug: string; items: QuestionView[]; pesticide?: boolean }) {
  const L = useL();
  const en = L('', '1') === '1';
  const { user, ready, openLogin } = useAuth();
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

  const send = (content: string) => start(async () => {
    const r = await askQuestionAction({ slug, content }).catch(() => ({ ok: false as const, error: L('Không gửi được. Vui lòng kiểm tra mạng và thử lại.', 'Could not send. Please check your connection and try again.') }));
    if (!r.ok) { setError(r.error); return; }
    setText('');
    setNotice(L('Đã gửi câu hỏi. Kỹ sư sẽ trả lời trong 2 giờ làm việc, bạn sẽ nhận thông báo khi có trả lời.', 'Question sent. Our engineer will reply within 2 working hours.'));
    router.refresh();
  });

  const submit = () => {
    setError('');
    setNotice('');
    if (!ready) return;
    if (len < QUESTION_MIN_CHARS) { setError(L(`Câu hỏi cần ít nhất ${QUESTION_MIN_CHARS} ký tự`, `Please write at least ${QUESTION_MIN_CHARS} characters`)); boxRef.current?.focus(); return; }
    if (!user) { saveAfterLogin({ kind: 'question', slug, text }); openLogin(); return; }
    send(text);
  };

  // Câu hỏi gửi lúc chưa đăng nhập (lib/after-login.ts): đăng nhập xong (SĐT ngay trên trang, hoặc quay về từ Google) → trả chữ vào ô và gửi luôn.
  // Chưa đăng nhập (vd. hủy chọn tài khoản Google) → chỉ trả chữ vào ô.
  useEffect(() => {
    if (!ready) return;
    // Đang muốn trả lời một câu hỏi: mở rộng danh sách tới câu đó, QuestionItem tự mở ô trả lời.
    const reply = peekAfterLogin('reply', (a) => a.slug === slug);
    const i = reply ? list.findIndex((q) => q.id === reply.questionId) : -1;
    if (i >= shown) setShown(i + 1);
    const p = (user ? takeAfterLogin : peekAfterLogin)('question', (a) => a.slug === slug);
    if (!p) return;
    setText(p.text);
    document.getElementById('cau-hoi')?.scrollIntoView({ block: 'start' });
    if (!user) return;
    setError('');
    setNotice('');
    send(p.text);
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="vx-card app-qa" id="cau-hoi">
      <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
        {L('Hỏi đáp', 'Questions & answers')} <small style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: '0.875rem' }}>({list.length} {L('câu hỏi', 'questions')})</small>
      </h2>
      <div className="vx-ask">
        <textarea
          ref={boxRef}
          className="vx-input"
          value={text}
          maxLength={QUESTION_MAX_CHARS}
          onChange={(e) => setText(e.target.value)}
          placeholder={L('Nhập câu hỏi về cây, cách chăm, giao hàng… Kỹ sư Cây Cảnh Miền Tây sẽ trả lời trong 2 giờ làm việc.', 'Ask about this plant, care, delivery… Our engineer replies within 2 working hours.')}
          aria-label={L('Câu hỏi của bạn', 'Your question')}
        />
        <div className="app-qa__bar">
          <small style={{ color: 'var(--ink-muted)' }}>
            {len ? `${len}/${QUESTION_MAX_CHARS} ${L('ký tự', 'characters')}` : !user ? L('Đăng nhập để gửi câu hỏi và nhận thông báo khi có trả lời', 'Sign in to ask and get notified of answers') : ''}
          </small>
          <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" onClick={submit} disabled={pending}>
            {pending ? L('Đang gửi…', 'Sending…') : L('Gửi câu hỏi', 'Ask question')}
          </button>
        </div>
        {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.8125rem', margin: 0 }}>{error}</p>}
      </div>
      {notice && <div className="vx-note" role="status"><Icon name="check" /><div>{notice}</div></div>}

      {others.length > 1 && (
        <div className="vx-row" style={{ flexWrap: 'wrap' }}>
          <span className="vx-spec">{L('Lọc theo:', 'Filter:')}</span>
          {([['new', L('Mới nhất', 'Newest')], ['old', L('Cũ nhất', 'Oldest')], ['helpful', L('Hữu ích nhất', 'Most helpful')]] as const).map(([k, label]) => (
            <button key={k} type="button" className="vx-chip" aria-pressed={sort === k} onClick={() => { setSort(k); setShown(PAGE); }}>{label}</button>
          ))}
        </div>
      )}

      {list.slice(0, shown).map((q) => <QuestionItem key={q.id} slug={slug} q={q} pesticide={pesticide} />)}
      {!list.length && <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', margin: 0 }}>{L('Chưa có câu hỏi nào. Bạn cần tư vấn gì về sản phẩm này?', 'No questions yet. Anything you want to ask about this product?')}</p>}
      {list.length > shown && (
        <button type="button" className="vx-btn vx-btn--ghost" style={{ alignSelf: 'center' }} onClick={() => setShown((n) => n + 10)}>
          {L(`Xem thêm ${list.length - shown} câu hỏi`, `Show ${list.length - shown} more questions`)}
        </button>
      )}
    </section>
  );
}

function QuestionItem({ slug, q, pesticide }: { slug: string; q: QuestionView; pesticide?: boolean }) {
  const L = useL();
  const en = L('', '1') === '1';
  const { user, ready, openLogin } = useAuth();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const len = text.trim().length;

  // Bấm "Trả lời" lúc chưa đăng nhập → đăng nhập xong mở lại ô trả lời đúng câu hỏi này.
  useEffect(() => {
    if (!ready || !user) return;
    if (!takeAfterLogin('reply', (a) => a.slug === slug && a.questionId === q.id) || !q.open) return;
    setReplying(true);
    setTimeout(() => {
      boxRef.current?.scrollIntoView({ block: 'center' });
      boxRef.current?.focus({ preventScroll: true });
    }, 0);
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = () => {
    if (!confirm(L('Xóa câu hỏi này?', 'Delete this question?'))) return;
    start(async () => {
      const r = await deleteQuestionAction(q.id).catch(() => ({ ok: false as const, error: L('Không xóa được, vui lòng thử lại', 'Could not delete, please try again') }));
      if (!r.ok) { alert(r.error); return; }
      router.refresh();
    });
  };

  const openReply = () => {
    setNotice('');
    if (!ready) return;
    if (!user) { saveAfterLogin({ kind: 'reply', slug, questionId: q.id }); openLogin(); return; }
    setReplying(true);
    setTimeout(() => boxRef.current?.focus(), 0);
  };

  const send = () => {
    setError('');
    if (len < QUESTION_MIN_CHARS) { setError(L(`Câu trả lời cần ít nhất ${QUESTION_MIN_CHARS} ký tự`, `Please write at least ${QUESTION_MIN_CHARS} characters`)); boxRef.current?.focus(); return; }
    start(async () => {
      const r = await answerAsCustomerAction({ questionId: q.id, content: text })
        .catch(() => ({ ok: false as const, error: L('Không gửi được. Vui lòng kiểm tra mạng và thử lại.', 'Could not send. Please check your connection and try again.') }));
      if (!r.ok) { setError(r.error); return; }
      setText('');
      setReplying(false);
      setNotice(q.mine ? L('Đã gửi.', 'Sent.') : L('Cảm ơn bạn đã chia sẻ! Người hỏi sẽ nhận được thông báo.', 'Thanks for sharing! The asker will be notified.'));
      router.refresh();
    });
  };

  const act = (label: string, run: () => void) => (
    <a role="button" tabIndex={0} onClick={pending ? undefined : run} onKeyDown={(e) => e.key === 'Enter' && !pending && run()}>{label}</a>
  );
  const customerAnswers = q.answers.some((a) => !a.staff);

  return (
    <div className="vx-review">
      <span className="vx-avatar vx-avatar--sm">{initials(q.name)}</span>
      <div className="vx-review__body">
        <div className="vx-review__who">{q.name}<small suppressHydrationWarning>{timeAgo(q.createdAt, en)}</small></div>
        <span style={{ whiteSpace: 'pre-line' }}>{q.content}</span>
        <div className="vx-review__acts">
          {!q.askBuyer && <HelpfulButton kind="question" id={q.id} count={q.helpful} voted={q.voted} own={q.mine} />}
          {q.open && !replying && act(q.mine ? L('Bổ sung', 'Add details') : L('Trả lời', 'Reply'), openReply)}
          {q.mine && (
            <>
              <span>{L('Câu hỏi của bạn', 'Your question')}</span>
              {act(pending && !replying ? L('Đang xóa…', 'Deleting…') : L('Xóa', 'Delete'), remove)}
            </>
          )}
        </div>
        {q.answer && (
          <div className="vx-reply">
            <span className="vx-avatar vx-avatar--sm vx-avatar--shop">MT</span>
            <div className="vx-review__body">
              <div className="vx-review__who">
                Cây Cảnh Miền Tây<span className="vx-staff">{L('Kỹ sư', 'Engineer')}</span>
                {q.answeredAt && <small suppressHydrationWarning>{timeAgo(q.answeredAt, en)}</small>}
              </div>
              <span style={{ whiteSpace: 'pre-line' }}>{q.answer}</span>
            </div>
          </div>
        )}
        {q.answers.map((a) => <AnswerItem key={a.id} a={a} />)}
        {pesticide && customerAnswers && (
          <small className="app-qa__wait"><Icon name="alert" size={14} /> {L('Câu trả lời của khách chỉ để tham khảo — liều dùng thuốc làm theo bao bì và hướng dẫn của kỹ sư.', 'Customer answers are for reference only — follow the label and our engineer for dosage.')}</small>
        )}
        {!q.answer && q.mine && (
          <small className="app-qa__wait"><Icon name="clock" size={14} /> {L('Đang chờ shop trả lời — bạn sẽ nhận thông báo khi có trả lời.', 'Waiting for the shop to reply — you will be notified.')}</small>
        )}
        {q.askBuyer && !replying && (
          <small className="app-qa__wait"><Icon name="chat" size={14} /> {L('Chưa có câu trả lời. Bạn đã mua sản phẩm này — hãy chia sẻ kinh nghiệm giúp người hỏi.', 'No answer yet. You bought this product — share your experience.')}</small>
        )}
        {replying && (
          <div className="app-qa__form">
            <textarea
              ref={boxRef}
              className="vx-input"
              value={text}
              maxLength={QUESTION_MAX_CHARS}
              onChange={(e) => setText(e.target.value)}
              placeholder={q.mine ? L('Bổ sung thêm thông tin cho câu hỏi của bạn…', 'Add more details to your question…') : L('Chia sẻ kinh nghiệm của bạn với sản phẩm này…', 'Share your experience with this product…')}
              aria-label={L('Câu trả lời của bạn', 'Your answer')}
            />
            <div className="app-qa__bar">
              <small style={{ color: 'var(--ink-muted)' }}>{len ? `${len}/${QUESTION_MAX_CHARS} ${L('ký tự', 'characters')}` : L('Không ghi số điện thoại, đường link', 'No phone numbers or links')}</small>
              <span style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => { setReplying(false); setError(''); }} disabled={pending}>{L('Hủy', 'Cancel')}</button>
                <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" onClick={send} disabled={pending}>{pending ? L('Đang gửi…', 'Sending…') : L('Gửi', 'Send')}</button>
              </span>
            </div>
            {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.8125rem', margin: 0 }}>{error}</p>}
          </div>
        )}
        {notice && <small className="app-qa__wait" role="status"><Icon name="check" size={14} /> {notice}</small>}
      </div>
    </div>
  );
}

/** Câu trả lời của khách khác (hoặc nhân viên dùng tài khoản trên web) dưới câu hỏi. */
function AnswerItem({ a }: { a: AnswerView }) {
  const L = useL();
  const en = L('', '1') === '1';
  const router = useRouter();
  const [pending, start] = useTransition();
  const remove = () => {
    if (!confirm(L('Xóa câu trả lời này?', 'Delete this answer?'))) return;
    start(async () => {
      const r = await deleteAnswerAction(a.id).catch(() => ({ ok: false as const, error: L('Không xóa được, vui lòng thử lại', 'Could not delete, please try again') }));
      if (!r.ok) { alert(r.error); return; }
      router.refresh();
    });
  };
  return (
    <div className="vx-reply app-qa__ans">
      <span className="vx-avatar vx-avatar--sm">{initials(a.name)}</span>
      <div className="vx-review__body">
        <div className="vx-review__who">
          {a.name}
          {a.staff ? <span className="vx-staff">{L('Nhân viên', 'Staff')}</span> : a.verified && <span className="vx-verified">{L('Đã mua hàng', 'Verified buyer')}</span>}
          <small suppressHydrationWarning>{timeAgo(a.createdAt, en)}</small>
        </div>
        <span style={{ whiteSpace: 'pre-line' }}>{a.content}</span>
        <div className="vx-review__acts">
          <HelpfulButton kind="answer" id={a.id} count={a.helpful} voted={a.voted} own={a.mine} />
          {a.mine && (
            <>
              <span>{L('Câu trả lời của bạn', 'Your answer')}</span>
              <a role="button" tabIndex={0} onClick={pending ? undefined : remove} onKeyDown={(e) => e.key === 'Enter' && remove()}>
                {pending ? L('Đang xóa…', 'Deleting…') : L('Xóa', 'Delete')}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
