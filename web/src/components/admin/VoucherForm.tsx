'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { saveVoucherAction } from '@/app/actions/vouchers';
import type { ScopeOptions } from '@/server/vouchers';
import type { VoucherScope } from '@/lib/voucher-scope';
import { VOUCHER_USED_HOT, VOUCHER_USED_SHOW, WELCOME_CODE, WELCOME_DAYS, type DiscountType, type VoucherKind } from '@/lib/voucher-labels';

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
  /** null = mọi sản phẩm. */
  scope: VoucherScope | null;
};

const digits = (s: string) => s.replace(/\D/g, '');

/** AdminVoucherForm: /admin/khuyen-mai/moi để tạo, /admin/khuyen-mai/<id> để sửa. Mã không đổi được sau khi tạo. */
export function VoucherForm({ initial, options }: { initial: VoucherFormValue; options: ScopeOptions }) {
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
      scope: v.scope,
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
                <label htmlFor="vc-max">Giảm tối đa (đ)</label>
                <input id="vc-max" className="vx-input" inputMode="numeric" value={v.maxDiscount} onChange={(e) => set('maxDiscount', digits(e.target.value))} placeholder="50.000" required />
                <span className="vx-help">Bắt buộc với mã %: khách thấy "giảm {v.discountValue || 'n'}%" nhưng mỗi đơn chỉ giảm tối đa số tiền này.</span>
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
              <span className="vx-help">Có giới hạn thì thẻ mã hiện "Đã dùng n%" khi đã dùng từ {VOUCHER_USED_SHOW}% (đỏ từ {VOUCHER_USED_HOT}%).</span>
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
          <ScopePicker value={v.scope} options={options} onChange={(s) => set('scope', s)} />
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

const NO_SCOPE: VoucherScope = { cats: [], subs: [], products: [] };
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

/** Ô "Áp dụng cho": mọi sản phẩm, hoặc chọn danh mục / nhóm con / từng sản phẩm. */
function ScopePicker({ value, options, onChange }: { value: VoucherScope | null; options: ScopeOptions; onChange: (s: VoucherScope | null) => void }) {
  const [limited, setLimited] = useState(value !== null);
  const [q, setQ] = useState('');
  const s = value ?? NO_SCOPE;
  const toggle = (k: keyof VoucherScope, x: string) => {
    const list = s[k].includes(x) ? s[k].filter((y) => y !== x) : [...s[k], x];
    onChange({ ...s, [k]: list });
  };
  const name = new Map(options.products.map((p) => [p.slug, p.name]));
  const hits = q.trim() ? options.products.filter((p) => !s.products.includes(p.slug) && fold(p.name).includes(fold(q.trim()))).slice(0, 8) : [];
  const empty = limited && !s.cats.length && !s.subs.length && !s.products.length;
  return (
    <div className="ad-f">
      <label>Áp dụng cho</label>
      <div className="vx-seg">
        <button type="button" className="vx-chip" aria-pressed={!limited} onClick={() => { setLimited(false); onChange(null); }}>Mọi sản phẩm</button>
        <button type="button" className="vx-chip" aria-pressed={limited} onClick={() => { setLimited(true); onChange(value ?? NO_SCOPE); }}>Chỉ danh mục / nhóm cây / sản phẩm</button>
      </div>
      {limited && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          {options.cats.map((c) => {
            const whole = s.cats.includes(c.slug);
            const subs = c.subs.filter((x) => x.active || s.subs.includes(`${c.slug}/${x.slug}`));
            return (
              <div key={c.slug}>
                <label className="vx-check"><input type="checkbox" checked={whole} onChange={() => toggle('cats', c.slug)} /> <b>{c.name}</b>{subs.length > 0 && ' (cả danh mục)'}</label>
                {!whole && subs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, paddingLeft: 28 }}>
                    {subs.map((x) => {
                      const key = `${c.slug}/${x.slug}`;
                      return <button key={key} type="button" className="vx-chip" aria-pressed={s.subs.includes(key)} onClick={() => toggle('subs', key)}>{x.name}</button>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div className="ad-f">
            <label htmlFor="vc-scope-q">Thêm từng sản phẩm</label>
            <input id="vc-scope-q" className="vx-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ tên cây…" autoComplete="off" />
            {hits.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {hits.map((p) => <button key={p.slug} type="button" className="vx-chip" onClick={() => { toggle('products', p.slug); setQ(''); }}>+ {p.name}{!p.active && ' (ẩn)'}</button>)}
              </div>
            )}
            {s.products.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {s.products.map((slug) => <button key={slug} type="button" className="vx-chip" aria-pressed onClick={() => toggle('products', slug)} aria-label={`Bỏ ${name.get(slug) ?? slug}`}>{name.get(slug) ?? slug} ✕</button>)}
              </div>
            )}
          </div>
          {empty && <span className="vx-err">Chưa chọn gì — lưu lúc này mã áp dụng cho mọi sản phẩm.</span>}
        </div>
      )}
      <span className="vx-help">Có phạm vi thì đơn tối thiểu và số tiền giảm chỉ tính trên sản phẩm thuộc phạm vi. Sản phẩm bật “Không áp mã giảm giá” không bao giờ được giảm.</span>
    </div>
  );
}
