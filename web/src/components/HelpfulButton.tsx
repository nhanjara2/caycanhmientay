'use client';

import { useL } from '@/lib/use-l';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toggleHelpfulAction } from '@/app/actions/reviews';
import { saveAfterLogin, takeAfterLogin } from '@/lib/after-login';
import { useAuth } from '@/lib/auth';
import type { VoteKind } from '@/lib/reviews';

/**
 * Nút "Hữu ích (n)" dưới đánh giá / câu hỏi / câu trả lời của khách. Mục của chính mình chỉ hiện số.
 * Chưa đăng nhập → mở hộp đăng nhập, đăng nhập xong tự bấm (lib/after-login.ts).
 */
export function HelpfulButton({ kind, id, count, voted, own }: { kind: VoteKind; id: number; count: number; voted: boolean; own?: boolean }) {
  const L = useL();
  const en = L('', '1') === '1';
  const { user, ready, openLogin } = useAuth();
  const router = useRouter();
  const [state, setState] = useState({ count, voted });
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  // Trang tải lại dữ liệu (vd. vừa đăng nhập: đã bấm từ trước trên máy khác) → theo số mới của server.
  useEffect(() => setState({ count, voted }), [count, voted]);

  /** addOnly: bấm tiếp sau khi đăng nhập — chỉ thêm, không gỡ lượt đã bấm từ trước; lỗi (vd. hóa ra là mục của mình) thì bỏ qua. */
  const send = (addOnly: boolean) => {
    setError('');
    const prev = state;
    setState(addOnly ? { voted: true, count: prev.count + (prev.voted ? 0 : 1) } : { voted: !prev.voted, count: prev.count + (prev.voted ? -1 : 1) });
    start(async () => {
      const r = await toggleHelpfulAction(kind, id, addOnly || undefined).catch(() => ({ ok: false as const, error: L('Không lưu được, thử lại sau', 'Could not save, try again later') }));
      if (r.ok) setState({ count: r.helpful, voted: r.voted });
      else { setState(prev); if (!addOnly) setError(r.error); }
      if (addOnly) router.refresh(); // lần tải lại lúc đăng nhập có thể về sau lượt bấm này — lấy lại số đúng
    });
  };

  useEffect(() => {
    if (!ready || !user || !takeAfterLogin('helpful', (a) => a.target === kind && a.id === id) || own) return;
    send(true);
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const icon = (
    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: 14, height: 14 }} aria-hidden="true">
      <path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7" />
    </svg>
  );
  if (own) return state.count ? <span className="rvw-help" aria-label={L(`${state.count} người thấy hữu ích`, `${state.count} found this helpful`)}>{icon} {L('Hữu ích', 'Helpful')} ({state.count})</span> : null;

  const click = () => {
    if (!ready) return; // chưa biết đã đăng nhập hay chưa — tránh mở nhầm hộp đăng nhập
    if (!user) { saveAfterLogin({ kind: 'helpful', target: kind, id }); openLogin(); return; }
    send(false);
  };

  return (
    <>
      <button type="button" className="rvw-help" aria-pressed={state.voted} onClick={click} disabled={pending}>
        {icon} {L('Hữu ích', 'Helpful')}{state.count ? ` (${state.count})` : ''}
      </button>
      {error && <small style={{ color: 'var(--danger)' }}>{error}</small>}
    </>
  );
}
