// Cửa hàng hiển thị ở trang khách /he-thong-cua-hang — dùng chung client/server (dữ liệu nhập ở /admin/cua-hang).

export const STORE_SERVICE_KEYS = ['nursery', 'workshop', 'parking', 'clinic', 'supply'] as const;
export type StoreService = (typeof STORE_SERVICE_KEYS)[number];
export const STORE_SERVICES: Record<StoreService, string> = {
  nursery: 'Vườn ươm',
  workshop: 'Workshop',
  parking: 'Bãi đỗ ô tô',
  clinic: 'Khám bệnh cây',
  supply: 'Tro trấu & giá thể',
};

/** 'store' = cửa hàng / vườn của shop; 'partner' = đối tác cung cấp (chỉ hiện trên web, không có kho). */
export type StoreKind = 'store' | 'partner';

export type PublicStore = {
  id: number;
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  contactName: string | null;
  open24h: boolean;
  openFrom: string | null;
  openTo: string | null;
  services: StoreService[];
  kind: StoreKind;
  note: string | null;
};

/** "HH:MM", 24 giờ. */
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Hours = Pick<PublicStore, 'open24h' | 'openFrom' | 'openTo'>;

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const shortTime = (t: string) => t.replace(/^0/, '');

/** Số phút đã qua trong ngày theo giờ Việt Nam (máy khách ở múi giờ nào cũng đúng). */
function vnMinutes(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get('hour') * 60 + get('minute');
}

/** Cửa hàng đã khai giờ mở cửa chưa. */
export const hasHours = (s: Hours) => s.open24h || Boolean(s.openFrom && s.openTo);

/** Đang mở cửa không; null = chưa khai giờ. Giờ đóng nhỏ hơn giờ mở (VD 18:00 – 02:00) là qua nửa đêm. */
export function isOpenNow(s: Hours, now: Date): boolean | null {
  if (s.open24h) return true;
  if (!s.openFrom || !s.openTo) return null;
  const m = vnMinutes(now), from = toMin(s.openFrom), to = toMin(s.openTo);
  return from < to ? m >= from && m < to : m >= from || m < to;
}

/** "Mở cửa 24/24" · "Mở 7:00 – 21:00 hằng ngày" · "" (chưa khai). */
export function hoursText(s: Hours): string {
  if (s.open24h) return 'Mở cửa 24/24';
  if (s.openFrom && s.openTo) return `Mở ${shortTime(s.openFrom)} – ${shortTime(s.openTo)} hằng ngày`;
  return '';
}

/** 0703005001 → 0703 005 001 */
export const formatPhone = (p: string) => p.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');

/** Mở Google Maps chỉ đường tới cửa hàng (theo tọa độ). */
export const directionsUrl = (s: Pick<PublicStore, 'lat' | 'lng'>) =>
  `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`;
