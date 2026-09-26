'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { decideWarrantyAction } from '@/app/actions/warranty';
import { confirmRefundAction } from '@/app/actions/warranty';
import { money } from '@/lib/format';
import { WARRANTY_RESOLUTION_HINT, WARRANTY_RESOLUTION_LABEL } from '@/lib/warranty-labels';

type Resolution = keyof typeof WARRANTY_RESOLUTION_LABEL;

/** Kỹ sư đánh giá: nguyên nhân, ghi chú cho khách, chọn 1 trong 4 hướng xử lý. */
export function WarrantyDecision({ id, itemQty, itemPrice }: { id: number; itemQty: number; itemPrice: number }) {
  const router = useRouter();
  const [resolution, setResolution] = useState<Resolution>('replace');
  const [cause, setCause] = useState('');
  const [note, setNote] = useState('');
  const [qty, setQty] = useState(1);
  const [refund, setRefund] = useState('');
  const [gift, setGift] = useState(true);
  const [error, setError] = useState('');
  const refundDefault = itemPrice * qty;
  const [pending, start] = useTransition();

  const submit = () => {
    setError('');
    start(async () => {
      const r = await decideWarrantyAction({
        id, resolution, cause: cause || undefined, note: note || undefined, qty, gift,
        refundAmount: resolution === 'refund' && refund ? Number(refund) : undefined,
      })
        .catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      router.refresh();
    });
  };

  return (
    <>
      <div className="ad-card">
        <div className="ad-card__h">Kỹ sư đánh giá</div>
        <div className="ad-card__b">
          <div className="ad-f">
            <label htmlFor="wd-cause">Nguyên nhân</label>
            <input id="wd-cause" className="vx-input" value={cause} onChange={(e) => setCause(e.target.value)} placeholder="Úng rễ do giá thể giữ nước" maxLength={200} />
          </div>
          <div className="ad-f">
            <label htmlFor="wd-note">Ghi chú cho khách</label>
            <textarea id="wd-note" className="vx-input" style={{ minHeight: 56 }} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          </div>
          <div className="ad-decide" role="radiogroup" aria-label="Hướng xử lý">
            {(Object.keys(WARRANTY_RESOLUTION_LABEL) as Resolution[]).map((k) => (
              <button key={k} type="button" role="radio" className="ad-opt" aria-checked={resolution === k} onClick={() => setResolution(k)}
                style={{ font: 'inherit', color: 'inherit', background: undefined, textAlign: 'left', cursor: 'pointer' }}>
                <span className="vx-radio" />
                <span><b>{WARRANTY_RESOLUTION_LABEL[k]}</b><small>{WARRANTY_RESOLUTION_HINT[k]}</small></span>
              </button>
            ))}
          </div>
          {(resolution === 'replace' || resolution === 'refund') && itemQty > 1 && (
            <div className="ad-f">
              <label htmlFor="wd-qty">Số cây {resolution === 'replace' ? 'đổi' : 'hoàn tiền'} (đơn gốc có {itemQty})</label>
              <input id="wd-qty" className="vx-input" type="number" min={1} max={itemQty} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(itemQty, Number(e.target.value) || 1)))} />
            </div>
          )}
          {resolution === 'refund' && (
            <div className="ad-f">
              <label htmlFor="wd-refund">Số tiền hoàn (để trống = {money(refundDefault)})</label>
              <input id="wd-refund" className="vx-input" inputMode="numeric" value={refund} placeholder={String(refundDefault)} onChange={(e) => setRefund(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
          )}
          {resolution === 'rescue' && (
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} />
              Tặng 1 chai Trichoderma (tự tạo đơn 0đ, trừ kho)
            </label>
          )}
        </div>
      </div>
      <div className="ad-sticky">
        <span className="note">{error ? <span className="vx-err" role="alert">{error}</span> : 'Kết quả sẽ hiện trong mục Bảo hành cây của khách'}</span>
        <button type="button" className="vx-btn vx-btn--primary" onClick={submit} disabled={pending}>
          {pending ? 'Đang lưu…' : `Duyệt: ${WARRANTY_RESOLUTION_LABEL[resolution]}`}
        </button>
      </div>
    </>
  );
}

/** Kế toán xác nhận đã chuyển tiền hoàn (chưa có cổng thanh toán nên làm tay). */
export function RefundConfirm({ id, amount, method }: { id: number; amount: number; method: string }) {
  const router = useRouter();
  const [ref, setRef] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const submit = () => {
    setError('');
    start(async () => {
      const r = await confirmRefundAction({ id, ref }).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      router.refresh();
    });
  };
  return (
    <div className="ad-f" style={{ marginTop: 12 }}>
      <label htmlFor="rf-ref">Đã chuyển {money(amount)} ({method})? Nhập mã giao dịch / nội dung chuyển khoản</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input id="rf-ref" className="vx-input" style={{ flex: 1 }} value={ref} onChange={(e) => setRef(e.target.value)} maxLength={120} placeholder="FT26269xxxxx" />
        <button type="button" className="vx-btn vx-btn--primary" onClick={submit} disabled={pending || ref.trim().length < 3}>{pending ? 'Đang lưu…' : 'Xác nhận đã hoàn'}</button>
      </div>
      {error && <span className="vx-err" role="alert">{error}</span>}
    </div>
  );
}
