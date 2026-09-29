'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createWarrantyFromReviewAction, reviewWarrantyOptionsAction } from '@/app/actions/warranty';
import { SYMPTOMS } from '@/lib/warranty-labels';

type Options = Extract<Awaited<ReturnType<typeof reviewWarrantyOptionsAction>>, { ok: true }>;

const date = (ms: number) => new Date(ms).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' });

/**
 * Nhân viên tạo yêu cầu bảo hành thay khách từ đánh giá xấu (thiết kế AdminReviews): chọn cây trong đơn đã giao,
 * triệu chứng (chọn sẵn theo nội dung đánh giá), mô tả. Ảnh trong đánh giá được chép sang yêu cầu.
 */
export function ReviewWarranty({ reviewId, userId, onClose }: { reviewId: number; userId: number; onClose: () => void }) {
  const router = useRouter();
  const [opts, setOpts] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState('');
  const [itemId, setItemId] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ id: number; code: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let alive = true;
    reviewWarrantyOptionsAction(reviewId)
      .then((r) => {
        if (!alive) return;
        if (!r.ok) { setLoadError(r.error); return; }
        setOpts(r);
        setItemId(r.items.find((i) => !i.openCode)?.itemId ?? null);
        setSymptoms(r.symptoms);
        setDescription(r.description);
      })
      .catch(() => alive && setLoadError('Không tải được thông tin đơn của khách, vui lòng thử lại'));
    return () => { alive = false; };
  }, [reviewId]);

  const submit = () => {
    setError('');
    if (!itemId) { setError('Chọn cây cần bảo hành'); return; }
    if (!symptoms.length) { setError('Chọn ít nhất một triệu chứng'); return; }
    start(async () => {
      const r = await createWarrantyFromReviewAction({ reviewId, orderItemId: itemId, symptoms, description })
        .catch(() => ({ ok: false as const, error: 'Không tạo được, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setDone({ id: r.id, code: r.code });
      router.refresh();
    });
  };

  const item = opts?.items.find((i) => i.itemId === itemId);
  const selectable = Boolean(opts?.items.some((i) => !i.openCode));

  return (
    <div className="rv-faq rv-wr">
      <b>Tạo yêu cầu bảo hành thay khách</b>
      {loadError && <small role="alert" style={{ color: 'var(--danger)' }}>{loadError}</small>}
      {!opts && !loadError && <small>Đang tải đơn của khách…</small>}
      {done && (
        <p style={{ margin: 0 }}>
          Đã tạo yêu cầu <b>{done.code}</b>, khách đã nhận thông báo.{' '}
          <Link href={`/admin/bao-hanh/${done.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>Mở yêu cầu để xử lý →</Link>
        </p>
      )}
      {opts && !done && (opts.existing ? (
        <p style={{ margin: 0 }}>
          Đánh giá này đã có yêu cầu <Link href={`/admin/bao-hanh/${opts.existing.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{opts.existing.code} →</Link>
        </p>
      ) : !opts.items.length ? (
        <p style={{ margin: 0 }}>
          Không tìm thấy đơn đã giao có cây này của khách (có thể khách đặt bằng SĐT khác chưa gắn vào tài khoản).{' '}
          <Link href={`/admin/khach-hang/${userId}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>Xem đơn của khách →</Link>
        </p>
      ) : (
        <>
          <fieldset className="rv-wr__items">
            <legend>Cây cần bảo hành</legend>
            {opts.items.map((i) => (
              <label key={i.itemId} className="vx-check" aria-disabled={Boolean(i.openCode)}>
                <input type="radio" name={`wr-${reviewId}`} checked={itemId === i.itemId} disabled={Boolean(i.openCode)} onChange={() => setItemId(i.itemId)} />
                <span>
                  {i.name} · {i.label} — đơn {i.code}, giao {date(i.deliveredAt)}
                  <small>
                    {i.openCode ? <>Đã có yêu cầu <Link href={`/admin/bao-hanh/${i.openId}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{i.openCode} →</Link></>
                      : i.daysLeft > 0 ? `Còn ${i.daysLeft} ngày bảo hành` : `Đã quá hạn bảo hành ${-i.daysLeft + 1} ngày — tạo là ngoại lệ của shop`}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
          {!selectable && <small>Mọi cây này của khách đều đã có yêu cầu bảo hành — mở yêu cầu đó để xử lý tiếp.</small>}
          {item && item.daysLeft <= 0 && !item.openCode && (
            <small style={{ color: 'var(--warning, #b45309)' }}>Cây đã quá 7 ngày bảo hành. Chỉ tạo khi shop đồng ý hỗ trợ ngoại lệ.</small>
          )}
          <div>
            <span className="rv-wr__lbl">Triệu chứng</span>
            <div className="row">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="vx-chip"
                  aria-pressed={symptoms.includes(s)}
                  onClick={() => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <label>
            Mô tả (khách thấy trong mục Bảo hành cây)
            <textarea className="vx-input" value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <small>
            {opts.photos
              ? `${opts.photos} ảnh trong đánh giá sẽ được chép sang yêu cầu bảo hành.`
              : 'Đánh giá không có ảnh — nên gọi / nhắn Zalo xin ảnh cây trước khi quyết định.'}
          </small>
          {error && <small role="alert" style={{ color: 'var(--danger)' }}>{error}</small>}
        </>
      ))}
      <div className="row">
        {opts && !done && !opts.existing && selectable && (
          <button type="button" className="vx-btn vx-btn--primary vx-btn--sm" disabled={pending} onClick={submit}>
            {pending ? 'Đang tạo…' : 'Tạo yêu cầu bảo hành'}
          </button>
        )}
        <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" disabled={pending} onClick={onClose}>{done ? 'Đóng' : 'Hủy'}</button>
      </div>
    </div>
  );
}
