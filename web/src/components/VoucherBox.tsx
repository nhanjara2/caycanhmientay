'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { welcomeOfferAction } from '@/app/actions/vouchers';
import { useAuth } from '@/lib/auth';
import { money } from '@/lib/format';
import { fmtDate } from '@/lib/order-labels';
import type { Totals } from '@/lib/pricing';
import { voucherAmount } from '@/lib/voucher-scope';
import { voucherDiscount, voucherValueText, type PublicVoucher, type VoucherKind, type WelcomeOffer } from '@/lib/voucher-labels';
import type { VoucherState } from '@/lib/voucher-pick';
import { usePublicVouchers } from '@/lib/vouchers-client';
import { useModalFocus } from '@/lib/use-modal';
import { Icon } from './Icon';

type Ticket = PublicVoucher & { gift?: WelcomeOffer };
type Pick = Record<VoucherKind, string | null>;
const GROUPS: { kind: VoucherKind; title: string }[] = [
  { kind: 'ship', title: 'MÃ MIỄN PHÍ GIAO' },
  { kind: 'discount', title: 'MÃ GIẢM GIÁ' },
];

/**
 * Dòng "Ưu đãi dành cho bạn" trong khối tổng tiền (giỏ hàng, thanh toán) + hộp chọn mã (thiết kế VoucherModal).
 * Khách không phải gõ mã: chọn một mã miễn phí giao + một mã giảm giá trong danh sách (vẫn có ô gõ mã riêng).
 * Không chọn thì đơn không có mã — không tự áp. Số tiền trong hộp là ước tính; bấm Áp dụng thì server kiểm lại (lượt dùng…).
 */
export function VoucherBox({ state, totals, shipFee }: {
  state: VoucherState;
  /** Tổng tiền của giỏ — mỗi mã xét tiền hàng thuộc phạm vi của nó (voucherAmount), so với đơn tối thiểu. */
  totals: Totals;
  /** Tổng phí giao của đơn — mã miễn phí giao giảm tối đa bằng số này. */
  shipFee: number;
}) {
  const { user } = useAuth();
  const publics = usePublicVouchers();
  const [offer, setOffer] = useState<WelcomeOffer | null>(null);
  const [open, setOpen] = useState(false);
  // Quà tài khoản mới (không nằm trong danh sách công khai): đọc lại khi đăng nhập / đổi tài khoản
  useEffect(() => {
    if (user) welcomeOfferAction().then(setOffer).catch(() => {}); else setOffer(null);
  }, [user]);
  const gift: Ticket[] = user && offer?.status === 'available'
    ? [{ code: offer.code, label: 'Quà tài khoản mới', kind: 'discount', discountType: offer.discountType, discountValue: offer.discountValue, maxDiscount: offer.maxDiscount, minOrder: offer.minOrder, gift: offer }]
    : [];
  const tickets: Ticket[] = [...gift, ...publics];
  const { applied } = state;
  const chosen = [applied.ship, applied.discount].filter((v) => v !== null);
  const amountOf = (v: Ticket) => voucherAmount(v.scope, totals);
  const usable = tickets.filter((v) => voucherDiscount(v, amountOf(v), shipFee) > 0).length;

  return (
    <>
      <button type="button" className="app-ventry" data-on={chosen.length > 0 || undefined} data-hot={(!chosen.length && usable > 0) || undefined} onClick={() => setOpen(true)}>
        <span className="app-ventry__ic"><Icon name="tag" /></span>
        <span className="app-ventry__t">
          <b>Ưu đãi dành cho bạn</b>
          {chosen.length > 0
            ? <small className="on">{chosen.map((v) => v.code).join(' + ')} · giảm {money(state.total)}</small>
            : usable > 0
              ? <small className="hot">{usable} mã dùng được cho đơn này</small>
              : <small>{tickets.length > 0 ? 'Xem mã giảm giá, mã miễn phí giao' : 'Chọn hoặc nhập mã'}</small>}
        </span>
        <span className="app-ventry__go">{chosen.length > 0 ? 'Đổi' : 'Chọn mã'}<Icon name="chevron" /></span>
      </button>
      {state.dropped.map((e) => (
        <div key={e.code} className="vx-note app-vdrop" role="status"><Icon name="alert" /><div>Đã bỏ mã <b>{e.code}</b>: {e.error}</div></div>
      ))}
      {open && <VoucherDialog tickets={tickets} state={state} amountOf={amountOf} shipFee={shipFee} onClose={() => setOpen(false)} />}
    </>
  );
}

function VoucherDialog({ tickets, state, amountOf, shipFee, onClose }: {
  tickets: Ticket[]; state: VoucherState; amountOf: (v: Ticket) => number; shipFee: number; onClose: () => void;
}) {
  const est = (v: Ticket) => voucherDiscount(v, amountOf(v), shipFee);
  const best = (kind: VoucherKind) => tickets.filter((v) => v.kind === kind && est(v) > 0).sort((a, b) => est(b) - est(a))[0]?.code ?? null;
  // Mở hộp: giữ mã đang áp dụng; chưa có thì chọn sẵn mã giảm nhiều nhất của từng loại (khách bỏ chọn được, phải bấm Áp dụng mới tính)
  const [pick, setPick] = useState<Pick>(() => {
    const { ship, discount } = state.applied;
    return ship || discount ? { ship: ship?.code ?? null, discount: discount?.code ?? null } : { ship: best('ship'), discount: best('discount') };
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const box = useRef<HTMLDivElement>(null);
  useModalFocus(box, onClose);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Mã đang áp dụng mà không có trong danh sách (khách gõ tay mã riêng): vẫn hiện để bỏ chọn được
  const extra: Ticket[] = (['ship', 'discount'] as const).flatMap((kind) => {
    const a = state.applied[kind];
    return a && !tickets.some((t) => t.code === a.code)
      ? [{ code: a.code, label: 'Mã bạn đã nhập', kind, discountType: 'amount' as const, discountValue: a.discount, maxDiscount: null, minOrder: 0 }]
      : [];
  });
  const all = [...extra, ...tickets];
  const picked = all.filter((v) => pick[v.kind] === v.code);
  const saving = picked.reduce((s, v) => s + est(v), 0);

  const submit = async (codes: string[], must?: string) => {
    if (busy) return;
    setBusy(true); setError('');
    const errs = await state.apply(codes, must);
    setBusy(false);
    if (errs.length) { setError(errs.map((e) => `${e.code}: ${e.error}`).join(' · ')); return; }
    onClose();
  };
  const typed = code.trim().toUpperCase();
  // Mã gõ tay được ưu tiên: thay mã cùng loại đang chọn, giữ mã loại còn lại
  const applyTyped = () => { if (typed) void submit([typed, ...picked.map((v) => v.code).filter((c) => c !== typed)], typed); };

  // Gắn vào <body>: khối tổng tiền dính (sticky) tạo lớp xếp chồng riêng, để trong đó thì đầu trang đè lên hộp
  return createPortal(
    <div ref={box} tabIndex={-1} className="app-modal app-vmodal" role="dialog" aria-modal="true" aria-label="Ưu đãi dành cho bạn" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="vx-modal">
        <div className="vx-modal__head">
          Ưu đãi dành cho bạn
          <button type="button" aria-label="Đóng" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="vx-modal__body">
          <div className={typed ? 'vx-code ready' : 'vx-code'}>
            <input
              placeholder="Có mã riêng? Nhập tại đây" aria-label="Nhập mã giảm giá" maxLength={30} value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyTyped(); } }}
            />
            <button type="button" disabled={!typed || busy} onClick={applyTyped}>Áp dụng mã</button>
          </div>
          {error && <span className="vx-err" role="alert">{error}</span>}
          {all.length === 0 && <p className="app-vempty">Hiện chưa có mã nào đang chạy.</p>}
          {all.length > 0 && (
            <div className="vx-vlist">
              {GROUPS.map(({ kind, title }) => {
                const list = all.filter((v) => v.kind === kind).sort((a, b) => (est(b) > 0 ? 1 : 0) - (est(a) > 0 ? 1 : 0) || est(b) - est(a) || a.minOrder - b.minOrder);
                if (!list.length) return null;
                const top = best(kind);
                return (
                  <div key={kind} className="app-vgroup" role="radiogroup" aria-label={title}>
                    <p className="vx-vgroup">{title}</p>
                    {list.map((v) => {
                      const gain = est(v);
                      const on = pick[kind] === v.code;
                      const amount = amountOf(v);
                      const need = v.minOrder - amount;
                      const outside = Boolean(v.scopeText) && amount <= 0;
                      const off = gain <= 0 && !on;
                      return (
                        <button
                          key={v.code} type="button" role="radio" className="vx-voucher app-vpick" aria-checked={on} aria-disabled={off || undefined}
                          onClick={() => { if (!off) setPick((p) => ({ ...p, [kind]: on ? null : v.code })); }}
                        >
                          <span className={`vx-voucher__ic ${kind === 'ship' ? 'ship' : 'sale'}`}><Icon name={v.gift ? 'gift' : kind === 'ship' ? 'truck' : 'tag'} /></span>
                          <span className="vx-voucher__body">
                            {v.code === top && gain > 0 && <span className="vx-voucher__tag">Giảm nhiều nhất</span>}
                            <b>{v.gift ? `Quà tài khoản mới — ${voucherValueText(v, money).toLowerCase()}` : voucherValueText(v, money)}</b>
                            <span className="cond">
                              {v.scopeText && `${v.scopeText} · `}{v.minOrder > 0 ? `Đơn từ ${money(v.minOrder)}` : 'Không cần đơn tối thiểu'} · Mã {v.code}
                              {v.gift && ` · dùng đến ${fmtDate(new Date(v.gift.expiresAt))}`}
                            </span>
                            {gain > 0
                              ? <span className="need">Giảm {money(gain)} cho đơn này</span>
                              : outside ? <span className="exp">Không áp dụng cho sản phẩm trong giỏ</span>
                              : need > 0 && (
                                <>
                                  <span className="exp">Mua thêm {money(need)} để dùng mã này</span>
                                  <span className="left"><span className="bar"><i style={{ width: `${Math.min(100, (amount / v.minOrder) * 100)}%` }} /></span></span>
                                </>
                              )}
                          </span>
                          <span className="vx-vcheck">{on && <Icon name="check" />}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="vx-modal__foot vx-vfoot">
          <div className="vx-vfoot__sum">
            <span>{picked.length > 0 ? `Đã chọn ${picked.length} ưu đãi` : 'Chưa chọn ưu đãi nào'}</span>
            {saving > 0 && <span>Tiết kiệm <b>-{money(saving)}</b></span>}
          </div>
          <button type="button" className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block" disabled={busy} onClick={() => submit(picked.map((v) => v.code))}>
            {busy ? 'Đang kiểm tra…' : picked.length > 0 ? 'Áp dụng' : 'Không dùng mã'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
