'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteProductAction } from '@/app/actions/admin';

/** Xóa sản phẩm (có hỏi lại). `after` = trang chuyển tới sau khi xóa; bỏ trống = làm mới danh sách hiện tại. */
export function ProductDeleteButton({ slug, name, after }: { slug: string; name: string; after?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');

  const remove = () => {
    if (!confirm(`Xóa vĩnh viễn “${name}”?\nẢnh, quy cách, đánh giá và hỏi đáp của sản phẩm cũng bị xóa. Không thể hoàn tác.`)) return;
    setError('');
    start(async () => {
      const r = await deleteProductAction(slug).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      if (after) router.push(after);
      router.refresh();
    });
  };

  return (
    <span>
      <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" style={{ color: 'var(--danger)' }} disabled={pending} onClick={remove}>
        {pending ? 'Đang xóa…' : 'Xóa'}
      </button>
      {error && <small role="alert" style={{ display: 'block', color: 'var(--danger)', maxWidth: 260 }}>{error}</small>}
    </span>
  );
}
