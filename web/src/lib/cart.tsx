'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isQuote, optionOf, type Product } from './catalog';
import { snapOf, type CartLine } from './cart-snap';
import { computeTotals, type Totals } from './pricing';
import { useAuth } from './auth';
import { useDeliverTo } from './deliver-to';
import { regionOfAddress, type ShipRegion } from './shipping';
import { useShipping } from './shipping-client';

export { SHIP_RULES } from './pricing';
export type { CartLine, CartSnap } from './cart-snap';
export type { Totals } from './pricing';

type CartCtx = {
  lines: CartLine[];
  totals: Totals;
  /** Vùng nhận hàng suy ra từ "Giao đến" ở đầu trang (phí giao cây sống khác nhau theo vùng); null = chưa chọn nơi nhận. */
  region: ShipRegion | null;
  ready: boolean;
  add: (product: Product, option?: number, qty?: number) => void;
  setQty: (slug: string, option: number, qty: number) => void;
  remove: (slug: string, option: number) => void;
  /** Thay dòng giỏ bằng dữ liệu mới từ server (giá đổi, sản phẩm ngừng bán…). */
  replace: (lines: CartLine[]) => void;
  /** Cộng thêm các dòng (Mua lại đơn cũ). */
  merge: (lines: CartLine[]) => void;
  clear: () => void;
  toast: string | null;
  notify: (msg: string) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = 'ccmt-cart-v2';

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { rules, regionProvinces } = useShipping();
  const { place } = useDeliverTo();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setLines(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {}
  }, [lines, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const add = useCallback((p: Product, option = p.options[0]?.idx ?? 0, qty = 1) => {
    const u = optionOf(p, option);
    if (!u || isQuote(u)) return; // chưa có giá: chỉ hỏi giá, không vào giỏ
    if (u.soldOut) { setToast('Quy cách này đang hết hàng'); return; }
    setLines((prev) => {
      const i = prev.findIndex((l) => l.slug === p.slug && l.option === option);
      if (i < 0) return [...prev, { slug: p.slug, option, qty, snap: snapOf(p, option) }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + qty, snap: snapOf(p, option) };
      return next;
    });
    setToast('Đã thêm vào giỏ hàng');
  }, []);

  const setQty = useCallback((slug: string, option: number, qty: number) => {
    setLines((prev) => prev.map((l) => (l.slug === slug && l.option === option ? { ...l, qty: Math.min(99, Math.max(1, qty)) } : l)));
  }, []);

  const remove = useCallback((slug: string, option: number) => {
    setLines((prev) => prev.filter((l) => !(l.slug === slug && l.option === option)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const merge = useCallback((add: CartLine[]) => {
    setLines((prev) => {
      const next = [...prev];
      for (const l of add) {
        const i = next.findIndex((x) => x.slug === l.slug && x.option === l.option);
        if (i < 0) next.push(l);
        else next[i] = { ...l, qty: Math.min(99, next[i].qty + l.qty) };
      }
      return next;
    });
  }, []);

  // Combo 2 cây, chiết khấu đối tác đã duyệt hiện ngay trong giỏ (server tính lại khi đặt).
  const partnerPct = useAuth().user?.partner?.discount ?? 0;
  // Phí giao cây sống tính theo nơi nhận: lấy từ "Giao đến" nếu khách đã chọn, chưa chọn thì tạm tính theo vùng rẻ nhất (thanh toán chốt theo địa chỉ thật).
  const region = useMemo(() => (place ? regionOfAddress(place.detail || place.label, regionProvinces) : null), [place, regionProvinces]);
  const totals = useMemo(() => computeTotals(lines.map((l) => ({ ...l.snap, slug: l.slug, qty: l.qty })), 'ship', 0, rules, partnerPct, region), [lines, rules, partnerPct, region]);

  return (
    <Ctx.Provider value={{ lines, totals, region, ready, add, setQty, remove, replace: setLines, merge, clear, toast, notify: setToast }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart phải nằm trong <CartProvider>');
  return ctx;
}
