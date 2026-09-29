'use client';

import { useState, useTransition } from 'react';
import { toggleHelpfulAction } from '@/app/actions/reviews';
import { useAuth } from '@/lib/auth';
import type { VoteKind } from '@/lib/reviews';

/** Nút "Hữu ích (n)" dưới đánh giá / câu hỏi. Chưa đăng nhập → mở hộp đăng nhập; mục của chính mình chỉ hiện số. */
export function HelpfulButton({ kind, id, count, voted, own }: { kind: VoteKind; id: number; count: number; voted: boolean; own?: boolean }) {
  const { user, ready, openLogin } = useAuth();
  const [state, setState] = useState({ count, voted });
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const icon = (
    <svg className="vx-ico" viewBox="0 0 24 24" style={{ width: 14, height: 14 }} aria-hidden="true">
      <path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7" />
    </svg>
  );
  if (own) return state.count ? <span className="rvw-help" aria-label={`${state.count} người thấy hữu ích`}>{icon} Hữu ích ({state.count})</span> : null;

  const click = () => {
    if (!ready) return; // chưa biết đã đăng nhập hay chưa — tránh mở nhầm hộp đăng nhập
    if (!user) { openLogin(); return; }
    setError('');
    const prev = state;
    setState({ voted: !prev.voted, count: prev.count + (prev.voted ? -1 : 1) });
    start(async () => {
      const r = await toggleHelpfulAction(kind, id).catch(() => ({ ok: false as const, error: 'Không lưu được, thử lại sau' }));
      if (r.ok) setState({ count: r.helpful, voted: r.voted });
      else { setState(prev); setError(r.error); }
    });
  };

  return (
    <>
      <button type="button" className="rvw-help" aria-pressed={state.voted} onClick={click} disabled={pending}>
        {icon} Hữu ích{state.count ? ` (${state.count})` : ''}
      </button>
      {error && <small style={{ color: 'var(--danger)' }}>{error}</small>}
    </>
  );
}
