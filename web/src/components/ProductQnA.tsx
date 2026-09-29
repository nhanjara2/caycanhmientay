'use client';

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
    const r = await askQuestionAction({ slug, content }).catch(() => ({ ok: false as const, error: 'Không gửi được. Vui lòng kiểm tra mạng và thử lại.' }));
    if (!r.ok) { setError(r.error); return; }
    setText('');
    setNotice('Đã gửi câu hỏi. Kỹ sư sẽ trả lời trong 2 giờ làm việc, bạn sẽ nhận thông báo khi có trả lời.');
    router.refresh();
  });

  const submit = () => {
    setError('');
    setNotice('');
    if (!ready) return;
    if (len < QUESTION_MIN_CHARS) { setError(`Câu hỏi cần ít nhất ${QUESTION_MIN_CHARS} ký tự`); boxRef.current?.focus(); return; }
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

      {list.slice(0, shown).map((q) => <QuestionItem key={q.id} slug={slug} q={q} pesticide={pesticide} />)}
      {!list.length && <p style={{ color: 'var(--ink-muted)', fontSize: 14, margin: 0 }}>Chưa có câu hỏi nào. Bạn cần tư vấn gì về sản phẩm này?</p>}
      {list.length > shown && (
        <button type="button" className="vx-btn vx-btn--ghost" style={{ alignSelf: 'center' }} onClick={() => setShown((n) => n + 10)}>
          Xem thêm {list.length - shown} câu hỏi
        </button>
      )}
    </section>
  );
}

function QuestionItem({ slug, q, pesticide }: { slug: string; q: QuestionView; pesticide?: boolean }) {
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
    if (!confirm('Xóa câu hỏi này?')) return;
    start(async () => {
      const r = await deleteQuestionAction(q.id).catch(() => ({ ok: false as const, error: 'Không xóa được, vui lòng thử lại' }));
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
    if (len < QUESTION_MIN_CHARS) { setError(`Câu trả lời cần ít nhất ${QUESTION_MIN_CHARS} ký tự`); boxRef.current?.focus(); return; }
    start(async () => {
      const r = await answerAsCustomerAction({ questionId: q.id, content: text })
        .catch(() => ({ ok: false as const, error: 'Không gửi được. Vui lòng kiểm tra mạng và thử lại.' }));
      if (!r.ok) { setError(r.error); return; }
      setText('');
      setReplying(false);
      setNotice(q.mine ? 'Đã gửi.' : 'Cảm ơn bạn đã chia sẻ! Người hỏi sẽ nhận được thông báo.');
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
        <div className="vx-review__who">{q.name}<small suppressHydrationWarning>{timeAgo(q.createdAt)}</small></div>
        <span style={{ whiteSpace: 'pre-line' }}>{q.content}</span>
        <div className="vx-review__acts">
          {!q.askBuyer && <HelpfulButton kind="question" id={q.id} count={q.helpful} voted={q.voted} own={q.mine} />}
          {q.open && !replying && act(q.mine ? 'Bổ sung' : 'Trả lời', openReply)}
          {q.mine && (
            <>
              <span>Câu hỏi của bạn</span>
              {act(pending && !replying ? 'Đang xóa…' : 'Xóa', remove)}
            </>
          )}
        </div>
        {q.answer && (
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
        )}
        {q.answers.map((a) => <AnswerItem key={a.id} a={a} />)}
        {pesticide && customerAnswers && (
          <small className="app-qa__wait"><Icon name="alert" size={14} /> Câu trả lời của khách chỉ để tham khảo — liều dùng thuốc làm theo bao bì và hướng dẫn của kỹ sư.</small>
        )}
        {!q.answer && q.mine && (
          <small className="app-qa__wait"><Icon name="clock" size={14} /> Đang chờ shop trả lời — bạn sẽ nhận thông báo khi có trả lời.</small>
        )}
        {q.askBuyer && !replying && (
          <small className="app-qa__wait"><Icon name="chat" size={14} /> Chưa có câu trả lời. Bạn đã mua sản phẩm này — hãy chia sẻ kinh nghiệm giúp người hỏi.</small>
        )}
        {replying && (
          <div className="app-qa__form">
            <textarea
              ref={boxRef}
              className="vx-input"
              value={text}
              maxLength={QUESTION_MAX_CHARS}
              onChange={(e) => setText(e.target.value)}
              placeholder={q.mine ? 'Bổ sung thêm thông tin cho câu hỏi của bạn…' : 'Chia sẻ kinh nghiệm của bạn với sản phẩm này…'}
              aria-label="Câu trả lời của bạn"
            />
            <div className="app-qa__bar">
              <small style={{ color: 'var(--ink-muted)' }}>{len ? `${len}/${QUESTION_MAX_CHARS} ký tự` : 'Không ghi số điện thoại, đường link'}</small>
              <span style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={() => { setReplying(false); setError(''); }} disabled={pending}>Hủy</button>
                <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" onClick={send} disabled={pending}>{pending ? 'Đang gửi…' : 'Gửi'}</button>
              </span>
            </div>
            {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}
          </div>
        )}
        {notice && <small className="app-qa__wait" role="status"><Icon name="check" size={14} /> {notice}</small>}
      </div>
    </div>
  );
}

/** Câu trả lời của khách khác (hoặc nhân viên dùng tài khoản trên web) dưới câu hỏi. */
function AnswerItem({ a }: { a: AnswerView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const remove = () => {
    if (!confirm('Xóa câu trả lời này?')) return;
    start(async () => {
      const r = await deleteAnswerAction(a.id).catch(() => ({ ok: false as const, error: 'Không xóa được, vui lòng thử lại' }));
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
          {a.staff ? <span className="vx-staff">Nhân viên</span> : a.verified && <span className="vx-verified">Đã mua hàng</span>}
          <small suppressHydrationWarning>{timeAgo(a.createdAt)}</small>
        </div>
        <span style={{ whiteSpace: 'pre-line' }}>{a.content}</span>
        <div className="vx-review__acts">
          <HelpfulButton kind="answer" id={a.id} count={a.helpful} voted={a.voted} own={a.mine} />
          {a.mine && (
            <>
              <span>Câu trả lời của bạn</span>
              <a role="button" tabIndex={0} onClick={pending ? undefined : remove} onKeyDown={(e) => e.key === 'Enter' && remove()}>
                {pending ? 'Đang xóa…' : 'Xóa'}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
