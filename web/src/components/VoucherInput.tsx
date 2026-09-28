'use client';

import { useEffect, useState, useTransition } from 'react';
import { applyVoucherAction, welcomeOfferAction } from '@/app/actions/vouchers';
import { useAuth } from '@/lib/auth';
import { money } from '@/lib/format';
import { fmtDate } from '@/lib/order-labels';
import { welcomeText, type WelcomeOffer } from '@/lib/voucher-labels';
import { Icon } from './Icon';

export type AppliedVoucher = { code: string; discount: number };

/**
 * Ô nhập mã giảm giá ở OrderSummary trang thanh toán — xem trước số tiền giảm, chốt thật lúc đặt hàng.
 * Khách có quà tài khoản mới thì hiện sẵn thẻ quà với nút "Dùng" (không phải gõ mã).
 */
export function VoucherInput({ items, phone, subtotal, applied, onApply, onRemove }: {
  items: { slug: string; option: number; qty: number }[];
  phone: string;
  /** Tạm tính (sau giảm giá sản phẩm, chưa gồm phí giao) — so với đơn tối thiểu của quà. */
  subtotal: number;
  applied: AppliedVoucher | null;
  onApply: (v: AppliedVoucher) => void;
  onRemove: () => void;
}) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const [offer, setOffer] = useState<WelcomeOffer | null>(null);

  // Đọc lại khi đăng nhập / đổi tài khoản ngay trên trang thanh toán
  useEffect(() => {
    if (user) welcomeOfferAction().then(setOffer).catch(() => {});
  }, [user]);
  const gift = user && offer?.status === 'available' ? offer : null;

  const apply = (raw: string) => {
    if (!raw.trim() || pending) return;
    setError('');
    start(async () => {
      const r = await applyVoucherAction(raw, items, phone).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      onApply({ code: r.code, discount: r.discount });
      setCode('');
    });
  };

  if (applied) {
    return (
      <div className="vx-check" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Mã <b>{applied.code}</b> — giảm {money(applied.discount)}</span>
        <button type="button" className="vx-link" onClick={onRemove}>Bỏ mã</button>
      </div>
    );
  }

  const short = gift ? gift.minOrder - subtotal : 0;
  return (
    <div className="vx-field">
      {gift && (
        <div className="vx-voucher app-vgift">
          <span className="vx-voucher__ic sale"><Icon name="gift" /></span>
          <span className="vx-voucher__body">
            <b>Quà tài khoản mới</b>
            <span className="cond">{welcomeText(gift, money)} · dùng đến {fmtDate(new Date(gift.expiresAt))}</span>
            {short > 0 && <span className="exp">Mua thêm {money(short)} để dùng quà</span>}
          </span>
          <button type="button" className="vx-btn vx-btn--sm vx-btn--primary" disabled={short > 0 || pending} onClick={() => apply(gift.code)}>
            Dùng
          </button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="vx-input"
          style={{ flex: 1 }}
          placeholder="Nhập mã giảm giá"
          value={code}
          maxLength={30}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(code); } }}
        />
        <button type="button" className={`vx-btn vx-btn--sm ${code.trim() ? 'vx-btn--primary' : 'vx-btn--outline'}`} disabled={!code.trim() || pending} onClick={() => apply(code)}>
          {pending ? 'Đang kiểm tra…' : 'Áp dụng'}
        </button>
      </div>
      {error && <span className="vx-err">{error}</span>}
    </div>
  );
}
