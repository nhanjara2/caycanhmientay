'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { saveVoucherAction } from '@/app/actions/vouchers';
import { WELCOME_CODE, WELCOME_DAYS, type DiscountType, type VoucherKind } from '@/lib/voucher-labels';

export type VoucherFormValue = {
  id?: number;
  code: string;
  label: string;
  kind: VoucherKind;
  discountType: DiscountType;
  discountValue: string;
  maxDiscount: string;
  minOrder: string;
  usageLimit: string;
  perCustomerLimit: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const digits = (s: string) => s.replace(/\D/g, '');

/** AdminVoucherForm: /admin/khuyen-mai/moi để tạo, /admin/khuyen-mai/<id> để sửa. Mã không đổi được sau khi tạo. */
export function VoucherForm({ initial }: { initial: VoucherFormValue }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof VoucherFormValue>(k: K, val: VoucherFormValue[K]) => { setV((x) => ({ ...x, [k]: val })); setSaved(false); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      id: v.id,
      code: v.code,
      label: v.label,
      kind: v.kind,
      discountType: v.discountType,
      discountValue: Number(digits(v.discountValue) || 0),
      maxDiscount: v.discountType === 'percent' && v.maxDiscount ? Number(digits(v.maxDiscount)) : undefined,
      minOrder: Number(digits(v.minOrder) || 0),
      usageLimit: v.usageLimit ? Number(digits(v.usageLimit)) : undefined,
      perCustomerLimit: Number(digits(v.perCustomerLimit) || 1),
      startsAt: v.startsAt || undefined,
      endsAt: v.endsAt || undefined,
      active: v.active,
    };
    start(async () => {
      const r = await saveVoucherAction(payload).catch(() => ({ ok: false as const, error: 'Có lỗi, vui lòng thử lại' }));
      if (!r.ok) { setError(r.error); return; }
      setSaved(true);
      if (!v.id && 'id' in r) router.push(`/admin/khuyen-mai/${r.id}`);
      router.refresh();
    });
  };

  return (
    <form className="ad-body" onSubmit={submit} style={{ paddingBottom: 0 }}>
      <div className="ad-title">
        <h1>{v.id ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá'}</h1>
        <span className="vx-crumb"><Link href="/admin/khuyen-mai">Khuyến mãi</Link>/<span>{v.code || 'Mới'}</span></span>
      </div>
      {v.id && v.code === WELCOME_CODE && (
        <div className="vx-note">
          <div>
            <b>Mã quà tài khoản mới.</b> Khách đăng nhập lần đầu được báo quà (hộp chào + chuông thông báo), trang thanh toán tự gợi ý nút “Dùng”.
            Chỉ tài khoản đã đăng nhập, trong {WELCOME_DAYS} ngày kể từ lần đăng nhập đầu tiên mới dùng được; mỗi tài khoản / số điện thoại theo “Số lượt tối đa mỗi khách”.
            Đổi số tiền, đơn tối thiểu, thời gian chạy hoặc tắt mã ngay ở đây.
          </div>
        </div>
      )}
      <div className="ad-card">
        <div className="ad-card__b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ad-f">
            <label htmlFor="vc-code">Mã (khách chọn trong hộp ưu đãi hoặc nhập lúc thanh toán)</label>
            <input
              id="vc-code" className="vx-input" style={{ textTransform: 'uppercase' }} maxLength={30}
              value={v.code} disabled={Boolean(v.id)}
              onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="SALE10" required
            />
            {v.id && <span className="vx-help">Mã đã tạo không đổi được — tắt mã này và tạo mã mới nếu cần đổi.</span>}
          </div>
          <div className="ad-f">
            <label htmlFor="vc-label">Tên hiển thị</label>
            <input id="vc-label" className="vx-input" maxLength={120} value={v.label} onChange={(e) => set('label', e.target.value)} placeholder="Giảm 10% đơn từ 300.000đ" required />
          </div>
          <div className="ad-f">
            <label>Mã giảm vào đâu</label>
            <div className="vx-seg">
              <button type="button" className="vx-chip" aria-pressed={v.kind === 'discount'} onClick={() => set('kind', 'discount')}>Giảm tiền hàng</button>
              <button type="button" className="vx-chip" aria-pressed={v.kind === 'ship'} onClick={() => setV((x) => ({ ...x, kind: 'ship', discountType: 'amount', maxDiscount: '' }))}>Miễn phí giao (giảm phí giao)</button>
            </div>
            <span className="vx-help">Mỗi đơn khách chọn được 1 mã giảm tiền hàng + 1 mã miễn phí giao. Mã miễn phí giao giảm tối đa bằng phí giao của đơn, không dùng được khi đơn đã miễn phí giao hoặc nhận tại vườn.</span>
          </div>
          {v.kind === 'discount' && (
            <div className="ad-f">
              <label>Loại giảm giá</label>
              <div className="vx-seg">
                <button type="button" className="vx-chip" aria-pressed={v.discountType === 'percent'} onClick={() => set('discountType', 'percent')}>Phần trăm (%)</button>
                <button type="button" className="vx-chip" aria-pressed={v.discountType === 'amount'} onClick={() => set('discountType', 'amount')}>Số tiền cố định (đ)</button>
              </div>
            </div>
          )}
          <div className="ad-frow">
            <div className="ad-f">
              <label htmlFor="vc-value">{v.kind === 'ship' ? 'Giảm phí giao tối đa (đ)' : v.discountType === 'percent' ? 'Phần trăm giảm' : 'Số tiền giảm'}</label>
              <input id="vc-value" className="vx-input" inputMode="numeric" value={v.discountValue} onChange={(e) => set('discountValue', digits(e.target.value))} placeholder={v.discountType === 'percent' ? '10' : '20.000'} required />
            </div>
            {v.discountType === 'percent' && (
              <div className="ad-f">
                <label htmlFor="vc-max">Giảm tối đa (đ, để trống = không giới hạn)</label>
                <input id="vc-max" className="vx-input" inputMode="numeric" value={v.maxDiscount} onChange={(e) => set('maxDiscount', digits(e.target.value))} placeholder="50.000" />
              </div>
            )}
          </div>
          <div className="ad-frow">
            <div className="ad-f">
              <label htmlFor="vc-min">Giá trị đơn tối thiểu (đ)</label>
              <input id="vc-min" className="vx-input" inputMode="numeric" value={v.minOrder} onChange={(e) => set('minOrder', digits(e.target.value))} placeholder="0" />
            </div>
            <div className="ad-f">
              <label htmlFor="vc-limit">Tổng số lượt (để trống = không giới hạn)</label>
              <input id="vc-limit" className="vx-input" inputMode="numeric" value={v.usageLimit} onChange={(e) => set('usageLimit', digits(e.target.value))} placeholder="100" />
            </div>
            <div className="ad-f">
              <label htmlFor="vc-per">Số lượt tối đa mỗi khách</label>
              <input id="vc-per" className="vx-input" inputMode="numeric" value={v.perCustomerLimit} onChange={(e) => set('perCustomerLimit', digits(e.target.value))} placeholder="1" required />
            </div>
          </div>
          <div className="ad-frow">
            <div className="ad-f">
              <label htmlFor="vc-start">Bắt đầu (để trống = áp dụng ngay)</label>
              <input id="vc-start" className="vx-input" type="date" value={v.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
            </div>
            <div className="ad-f">
              <label htmlFor="vc-end">Kết thúc (để trống = không hết hạn)</label>
              <input id="vc-end" className="vx-input" type="date" value={v.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
            </div>
          </div>
          <label className="vx-check">
            <input type="checkbox" checked={v.active} onChange={(e) => set('active', e.target.checked)} />
            Bật mã này (hiện trong hộp ưu đãi của khách ngay khi trong thời gian áp dụng)
          </label>
        </div>
      </div>
      {error && <div className="vx-note" role="alert" style={{ margin: '0 var(--space-4)' }}>{error}</div>}
      <div className="ad-title" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <span className="acts">
          <Link href="/admin/khuyen-mai" className="vx-btn vx-btn--outline">Hủy</Link>
          <button className="vx-btn vx-btn--primary" disabled={pending}>{pending ? 'Đang lưu…' : saved ? 'Đã lưu' : 'Lưu mã giảm giá'}</button>
        </span>
      </div>
    </form>
  );
}
