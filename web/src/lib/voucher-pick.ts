'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applyVouchersAction } from '@/app/actions/vouchers';
import { withVouchers, type Totals } from './pricing';
import type { ShipRegion } from './shipping';

// Mã khách đã chọn trong hộp "Ưu đãi dành cho bạn" — dùng chung giỏ hàng và trang thanh toán.
// Chỉ lưu MÃ trong sessionStorage của tab; số tiền giảm luôn hỏi lại server theo giỏ hiện tại (đổi số lượng, đổi cách nhận hàng là tính lại).

const KEY = 'ccmt-vouchers-v1';

export type AppliedVoucher = { code: string; discount: number; capped?: boolean };
/**
 * Mỗi đơn tối đa một mã giảm tiền hàng + một mã miễn phí giao.
 * `partner` = chiết khấu đối tác server đã cắt theo giá sàn (null = chưa hỏi server — giỏ dùng số tự tính).
 */
export type AppliedVouchers = { discount: AppliedVoucher | null; ship: AppliedVoucher | null; partner: { discount: number; capped: boolean } | null };
export type VoucherError = { code: string; error: string };
const NONE: AppliedVouchers = { discount: null, ship: null, partner: null };

const read = (): string[] => {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((c): c is string => typeof c === 'string').slice(0, 2) : [];
  } catch { return []; }
};
const save = (codes: string[]) => {
  try { if (codes.length) sessionStorage.setItem(KEY, JSON.stringify(codes)); else sessionStorage.removeItem(KEY); } catch {}
};
/** Tổng tiền hiển thị sau khi trừ mã đã chọn + chiết khấu đối tác (số server đã cắt theo giá sàn). */
export const withApplied = (t: Totals, a: AppliedVouchers) => withVouchers(
  t, a.discount?.discount ?? 0, a.ship?.discount ?? 0, a.partner?.discount ?? null,
  { voucher: !!a.discount?.capped, ship: !!a.ship?.capped, partner: !!a.partner?.capped },
);

/** Đặt hàng xong: bỏ mã đã chọn. */
export const clearVoucherPick = () => save([]);

export function useAppliedVouchers({ items, phone, delivery, region = null, partner = false, enabled = true }: {
  items: { slug: string; option: number; qty: number }[];
  phone: string;
  delivery: 'ship' | 'pickup';
  /** Vùng nhận hàng (phí giao cây sống khác nhau theo vùng → mã miễn phí giao giảm theo phí của vùng đó). */
  region?: ShipRegion | null;
  /** Tài khoản đối tác có chiết khấu: luôn hỏi server (kể cả chưa chọn mã) để chiết khấu hiện đúng số sau khi cắt theo giá sàn. */
  partner?: boolean;
  /** false khi giỏ chưa nạp xong. */
  enabled?: boolean;
}) {
  const [applied, setApplied] = useState<AppliedVouchers>(NONE);
  /** Mã bị bỏ khi đơn thay đổi (giảm số lượng, đổi sang nhận tại vườn…) — hiện cho khách biết lý do. */
  const [dropped, setDropped] = useState<VoucherError[]>([]);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const latest = useRef({ items, phone, delivery, region, partner });
  latest.current = { items, phone, delivery, region, partner };

  /** Hỏi server các mã này với giỏ hiện tại. `must`: mã khách vừa gõ tay — mã này lỗi thì giữ nguyên trạng thái cũ. */
  const check = useCallback(async (codes: string[], must?: string): Promise<VoucherError[]> => {
    const n = ++seq.current;
    if ((!codes.length && !latest.current.partner) || !latest.current.items.length) { setApplied(NONE); setDropped([]); save([]); return []; }
    setBusy(true);
    const { items, phone, delivery, region } = latest.current;
    const r = await applyVouchersAction(codes, items, phone, delivery, region).catch(() => null);
    if (n !== seq.current) return [];
    setBusy(false);
    if (!r || !r.ok) return [{ code: codes[0], error: r?.error ?? 'Không kiểm tra được mã, vui lòng thử lại' }];
    if (must && r.errors.some((e) => e.code === must)) return r.errors.filter((e) => e.code === must);
    setApplied({ discount: r.discount, ship: r.ship, partner: r.partner });
    save([r.discount?.code, r.ship?.code].filter((c): c is string => !!c));
    return r.errors;
  }, []);

  /** Khách bấm "Áp dụng" trong hộp chọn mã. */
  const apply = useCallback(async (codes: string[], must?: string) => {
    setDropped([]);
    return check(codes, must);
  }, [check]);

  // Mở trang / đổi giỏ / đổi cách nhận hàng: tính lại các mã đã chọn; mã không còn dùng được thì bỏ và báo lý do.
  const sig = `${delivery}|${region ?? ''}|${partner}|${items.map((i) => `${i.slug}:${i.option}:${i.qty}`).join(',')}`;
  useEffect(() => {
    if (!enabled) return;
    const codes = read();
    if (!codes.length && !partner) { setApplied(NONE); return; }
    const t = setTimeout(() => { void check(codes).then(setDropped); }, 250);
    return () => clearTimeout(t);
  }, [sig, enabled, partner, check]);

  return { applied, dropped, busy, apply, total: (applied.discount?.discount ?? 0) + (applied.ship?.discount ?? 0) };
}
export type VoucherState = ReturnType<typeof useAppliedVouchers>;
