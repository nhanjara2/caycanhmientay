// Kho, lô hàng, vùng giao — dùng chung client/server.

/** Hàng có hạn dùng thì nhập theo lô: thuốc BVTV, phân bón, hạt giống. */
export const tracksLots = (p: { pesticide: boolean; category: string }) =>
  p.pesticide || p.category === 'phan-bon' || p.category === 'hat-giong';

/** Cảnh báo lô sắp hết hạn trước bấy nhiêu ngày. */
export const EXPIRY_WARN_DAYS = 60;

/** Hạng chất lượng của lô (cùng một cây, nhà vườn khác nhau thì chất lượng khác nhau). */
export const LOT_GRADES = ['1', '2', '3'] as const;
export type LotGrade = (typeof LOT_GRADES)[number];
export const GRADE_LABEL: Record<LotGrade, string> = { '1': 'Loại 1', '2': 'Loại 2', '3': 'Loại 3' };
export const isGrade = (v: unknown): v is LotGrade => typeof v === 'string' && (LOT_GRADES as readonly string[]).includes(v);
export const gradeText = (v: string | null | undefined) => (isGrade(v) ? GRADE_LABEL[v] : '');

/** Ngày hôm nay dạng YYYY-MM-DD theo giờ Việt Nam. */
export const todayVN = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);

export const addDays = (ymd: string, days: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export const fmtYmd = (ymd: string) => ymd.split('-').reverse().join('/');

export function expiryLevel(expiry: string | null | undefined, today = todayVN()): 'expired' | 'soon' | 'ok' | null {
  if (!expiry) return null;
  if (expiry < today) return 'expired';
  if (expiry <= addDays(today, EXPIRY_WARN_DAYS)) return 'soon';
  return 'ok';
}

export type StorePoint = { id: number; code: string; name: string; lat: number; lng: number };

/** Cây sống chỉ giao trong bán kính này (km) tính từ cửa hàng gần nhất; xa hơn chỉ giao vật tư qua đơn vị vận chuyển. Giá trị mặc định — số thật chỉnh ở Cài đặt giao hàng. */
export const PLANT_ZONE_KM = 30;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Cửa hàng gần nhất và có nằm trong vùng giao cây sống không. */
export function plantZone(p: { lat: number; lng: number }, stores: StorePoint[], zoneKm: number = PLANT_ZONE_KM) {
  let best: { store: StorePoint; km: number } | null = null;
  for (const s of stores) {
    const km = distanceKm(p, s);
    if (!best || km < best.km) best = { store: s, km };
  }
  return best ? { ...best, inZone: best.km <= zoneKm } : null;
}
