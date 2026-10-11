'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { shippingRulesAction } from '@/app/actions/shipping';
import type { ShipRules } from './pricing';
import { SHIP_RULES } from './pricing';
import { DEFAULT_MIN_ORDER } from './shipping';
import { PLANT_ZONE_KM } from './stock';

/** Phí giao + vùng giao cây sống mà khách thấy: lấy từ Cài đặt giao hàng, mặc định cho tới khi tải xong. `minOrder` = đơn giao hàng tối thiểu (tiền hàng), 0 = không giới hạn. */
export type PublicShipping = { rules: ShipRules; plantZoneKm: number; plantZoneEnabled: boolean; slotsEnabled: boolean; minOrder: number };
const DEFAULTS: PublicShipping = { rules: SHIP_RULES, plantZoneKm: PLANT_ZONE_KM, plantZoneEnabled: false, slotsEnabled: false, minOrder: DEFAULT_MIN_ORDER };

const Ctx = createContext<PublicShipping>(DEFAULTS);
const CACHE_KEY = 'ccmt-shipping-v6';
const CACHE_MS = 3 * 60_000;

export function ShippingProvider({ children }: { children: ReactNode }) {
  const [v, setV] = useState<PublicShipping>(DEFAULTS);
  useEffect(() => {
    let live = true;
    // Nhớ 3 phút trong tab này để không gọi server ở mỗi lần chuyển trang
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null') as { t: number; v: PublicShipping } | null;
      if (c && Date.now() - c.t < CACHE_MS) { setV(c.v); return; }
    } catch {}
    shippingRulesAction().then((r) => {
      if (!live) return;
      setV(r);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: r })); } catch {}
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export const useShipping = () => useContext(Ctx);
