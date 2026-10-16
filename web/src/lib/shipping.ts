// Cài đặt giao hàng (admin /admin/cai-dat-giao-hang): phí giao, vùng giao cây sống, khung giờ + số đơn tối đa, ngày nghỉ.
// Dùng chung trình duyệt (giỏ hàng, thanh toán, admin) và server (tính tiền thật, kiểm tra khung giờ khi đặt đơn).
import * as z from 'zod';
import { matchProvince, PROVINCES } from './vn-provinces';

export type FeeRule = { fee: number; freeFrom: number };
export type SlotDef = { key: string; from: string; to: string };

/** Vùng nhận hàng để tính phí giao cây sống: TP. Hồ Chí Minh, miền Tây (cùng khu với vườn), còn lại là tỉnh xa. */
export const SHIP_REGIONS = ['hcm', 'west', 'far'] as const;
export type ShipRegion = (typeof SHIP_REGIONS)[number];
export const REGION_LABEL: Record<ShipRegion, string> = { hcm: 'TP. Hồ Chí Minh', west: 'Miền Tây', far: 'Tỉnh xa' };

/**
 * Cây sống: phí giao theo vùng (`regionFee`), mức miễn phí giao theo vùng (`regionFree`), phụ phí mỗi cây lớn (`bulky`).
 * `fee` / `freeFrom` = mức thấp nhất của 3 vùng — số tạm tính ở giỏ hàng khi chưa biết nơi nhận (tự suy ra, không lưu).
 */
export type PlantRule = FeeRule & { regionFee: Record<ShipRegion, number>; regionFree: Record<ShipRegion, number>; bulky: number };
/** Tỉnh / thành (đúng tên trong `PROVINCES`) thuộc vùng TP.HCM và miền Tây; tỉnh nào không nằm trong hai danh sách này là tỉnh xa. */
export type RegionProvinces = { hcm: string[]; west: string[] };

export type ShippingConfig = {
  /** Phí giao + ngưỡng miễn phí, tách theo nhóm: cây sống giao riêng bằng xe (phí theo vùng + phụ phí cây lớn), vật tư giao nhanh. */
  plant: PlantRule;
  supply: FeeRule;
  regionProvinces: RegionProvinces;
  /** Đơn GIAO HÀNG cần tối thiểu bấy nhiêu tiền hàng (sau combo, trước mã giảm giá / chiết khấu); 0 = không giới hạn. Nhận tại vườn và bán tại quầy không áp dụng. */
  minOrder: number;
  /** Bật = cây sống chỉ giao trong bán kính `plantZoneKm` quanh cửa hàng gần nhất. Tắt (mặc định) = giao cây sống toàn quốc qua đơn vị vận chuyển. */
  plantZoneEnabled: boolean;
  /** Bán kính (km) khi bật giới hạn vùng; vẫn lưu khi đang tắt. */
  plantZoneKm: number;
  /** Bật = khách chọn khung giờ giao (shop có xe / tài xế riêng). Tắt (mặc định) = không hẹn giờ, shop giao qua đơn vị vận chuyển và nhắn khách. */
  slotsEnabled: boolean;
  slots: SlotDef[];
  /** Số đơn giao tối đa mỗi khung theo thứ trong tuần [T2, T3, T4, T5, T6, T7, CN]; 0 = không giao khung đó. */
  cap: Record<string, number[]>;
  /** Khách chọn được giao trong bấy nhiêu ngày kể từ hôm nay (1 = chỉ hôm nay). */
  daysAhead: number;
  /** Ngày nghỉ lễ, Tết: không nhận khung giờ giao. */
  closed: { date: string; note: string }[];
};

/** Phí 35k / 20k, miễn phí từ 800k / 300k. Mặc định giao toàn quốc, không hẹn khung giờ; bật giới hạn vùng (30 km) và khung giờ (2 khung × 2 ngày) ở Cài đặt giao hàng khi shop có xe giao riêng. */
export const DEFAULT_MIN_ORDER = 150_000;

/** Mặc định chưa đổi giá của khách: ba vùng cùng 35.000đ, phụ phí cây lớn 0 — chủ shop đặt số từng vùng ở Cài đặt giao hàng. Miền Tây = 5 tỉnh đồng bằng + Tây Ninh (đã gồm Long An cũ). */
export const DEFAULT_REGION_PROVINCES: RegionProvinces = {
  hcm: ['TP. Hồ Chí Minh'],
  west: ['TP. Cần Thơ', 'An Giang', 'Cà Mau', 'Đồng Tháp', 'Vĩnh Long', 'Tây Ninh'],
};

export const DEFAULT_SHIPPING: ShippingConfig = {
  plant: { fee: 35000, freeFrom: 800000, regionFee: { hcm: 35000, west: 35000, far: 35000 }, regionFree: { hcm: 800000, west: 800000, far: 800000 }, bulky: 0 },
  supply: { fee: 20000, freeFrom: 300000 },
  regionProvinces: DEFAULT_REGION_PROVINCES,
  minOrder: DEFAULT_MIN_ORDER,
  plantZoneEnabled: false,
  plantZoneKm: 30,
  slotsEnabled: false,
  slots: [{ key: 'sang', from: '08:00', to: '12:00' }, { key: 'chieu', from: '14:00', to: '18:00' }],
  cap: { sang: [20, 20, 20, 20, 20, 20, 20], chieu: [20, 20, 20, 20, 20, 20, 20] },
  daysAhead: 2,
  closed: [],
};

export const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;
export const MAX_SLOTS = 6;
/** Khung giờ đóng nhận đơn trước giờ kết thúc bấy nhiêu phút (8–12h đóng lúc 10h). */
export const SLOT_CLOSE_BEFORE_END_MIN = 120;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ chưa đúng (VD 08:00)');
const money = (label: string) => z.number().int(`${label} phải là số nguyên`).min(0, `${label} không được âm`).max(1_000_000_000, `${label} quá lớn`);
const fee = z.object({ fee: money('Phí giao'), freeFrom: money('Ngưỡng miễn phí') });
// Cây sống: cấu hình cũ chỉ có `fee` (một mức cho mọi nơi) — vẫn đọc được, thiếu `regionFee` thì cả 3 vùng dùng mức đó.
const plantFee = z.object({
  fee: money('Phí giao').optional(),
  freeFrom: money('Ngưỡng miễn phí').optional(),
  regionFee: z.object({ hcm: money('Phí giao TP. Hồ Chí Minh'), west: money('Phí giao miền Tây'), far: money('Phí giao tỉnh xa') }).optional(),
  /** Cấu hình cũ (trước 16/10/2026) chỉ có một ngưỡng `freeFrom` cho cả 3 vùng. */
  regionFree: z.object({ hcm: money('Miễn phí giao TP. Hồ Chí Minh'), west: money('Miễn phí giao miền Tây'), far: money('Miễn phí giao tỉnh xa') }).optional(),
  bulky: money('Phụ phí cây lớn').optional(),
});
const provinceNames = z.array(z.string().trim().max(40)).max(40);
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nghỉ chưa đúng').refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Ngày nghỉ chưa đúng');

export const ShippingConfigSchema = z.object({
  plant: plantFee,
  supply: fee,
  regionProvinces: z.object({ hcm: provinceNames, west: provinceNames }).optional(),
  minOrder: money('Đơn tối thiểu').default(DEFAULT_MIN_ORDER),
  plantZoneEnabled: z.boolean().default(false),
  slotsEnabled: z.boolean().default(false),
  plantZoneKm: z.number().min(1, 'Vùng giao cây sống tối thiểu 1 km').max(500, 'Vùng giao cây sống tối đa 500 km'),
  slots: z.array(z.object({ key: z.string().regex(/^[a-z0-9-]{1,20}$/), from: hhmm, to: hhmm })).min(1, 'Cần ít nhất một khung giờ').max(MAX_SLOTS, `Tối đa ${MAX_SLOTS} khung giờ`),
  cap: z.record(z.string(), z.array(z.number().int().min(0, 'Số đơn không được âm').max(999, 'Số đơn tối đa 999')).length(7)),
  daysAhead: z.number().int().min(1, 'Cho khách chọn giao trong ít nhất 1 ngày').max(14, 'Tối đa 14 ngày'),
  closed: z.array(z.object({ date: ymd, note: z.string().trim().max(60) })).max(80, 'Tối đa 80 ngày nghỉ'),
}).superRefine((v, ctx) => {
  const keys = new Set<string>();
  v.slots.forEach((s, i) => {
    if (keys.has(s.key)) ctx.addIssue({ code: 'custom', path: ['slots', i, 'key'], message: 'Trùng mã khung giờ' });
    keys.add(s.key);
    if (s.from >= s.to) ctx.addIssue({ code: 'custom', path: ['slots', i, 'to'], message: `Khung ${s.from}: giờ kết thúc phải sau giờ bắt đầu` });
    if (!v.cap[s.key]) ctx.addIssue({ code: 'custom', path: ['cap', s.key], message: 'Thiếu số đơn tối đa của khung giờ' });
  });
  const sorted = [...v.slots].sort((a, b) => a.from.localeCompare(b.from));
  sorted.forEach((s, i) => { if (i && s.from < sorted[i - 1].to) ctx.addIssue({ code: 'custom', path: ['slots'], message: 'Các khung giờ không được chồng lên nhau' }); });
});

const REAL_PROVINCES = new Set(PROVINCES.map((p) => p.name));

/** Chỉ giữ tên tỉnh có thật, bỏ trùng; tỉnh đã ở TP.HCM thì không nằm thêm ở miền Tây. */
function normProvinces(v: { hcm: string[]; west: string[] } | undefined): RegionProvinces {
  if (!v) return DEFAULT_REGION_PROVINCES;
  const hcm = [...new Set(v.hcm.filter((n) => REAL_PROVINCES.has(n)))];
  const west = [...new Set(v.west.filter((n) => REAL_PROVINCES.has(n) && !hcm.includes(n)))];
  return { hcm, west };
}

function normPlant(p: z.infer<typeof plantFee>): PlantRule {
  const flat = p.fee ?? DEFAULT_SHIPPING.plant.fee;
  const regionFee = p.regionFee ?? { hcm: flat, west: flat, far: flat };
  const free = p.freeFrom ?? DEFAULT_SHIPPING.plant.freeFrom;
  const regionFree = p.regionFree ?? { hcm: free, west: free, far: free };
  return {
    regionFee, regionFree, bulky: p.bulky ?? 0,
    fee: Math.min(regionFee.hcm, regionFee.west, regionFee.far), freeFrom: Math.min(regionFree.hcm, regionFree.west, regionFree.far),
  };
}

/** Đọc cấu hình lưu trong database; thiếu / hỏng thì dùng mặc định (đặt hàng không bao giờ bị chặn vì cấu hình lỗi). */
export function parseShipping(raw: unknown): ShippingConfig {
  const r = ShippingConfigSchema.safeParse(raw);
  if (!r.success) return DEFAULT_SHIPPING;
  const cap = Object.fromEntries(r.data.slots.map((s) => [s.key, r.data.cap[s.key]]));
  return {
    ...r.data, plant: normPlant(r.data.plant), regionProvinces: normProvinces(r.data.regionProvinces),
    cap, closed: [...r.data.closed].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** Vùng của một tỉnh / thành (tên mới hoặc tên cũ như "Bến Tre"); tỉnh không có trong danh sách TP.HCM / miền Tây là tỉnh xa. */
export function regionOfProvince(name: string, rp: RegionProvinces): ShipRegion {
  const p = matchProvince(name);
  if (!p) return 'far';
  return rp.hcm.includes(p.name) ? 'hcm' : rp.west.includes(p.name) ? 'west' : 'far';
}

/**
 * Vùng nhận hàng từ chuỗi địa chỉ ("25 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh"): tìm tỉnh / thành từ cuối chuỗi lên đầu.
 * Địa chỉ trống → null (chưa biết nơi nhận, giỏ hàng tạm tính theo phí thấp nhất); có địa chỉ mà không nhận ra tỉnh → tỉnh xa.
 * Client và server dùng chung hàm này nên số tiền khách thấy khớp số tiền chốt đơn.
 */
export function regionOfAddress(address: string | null | undefined, rp: RegionProvinces): ShipRegion | null {
  const parts = (address ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  if (!parts.length) return null;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (matchProvince(parts[i])) return regionOfProvince(parts[i], rp);
  }
  return 'far';
}

// ---- Ngày giờ Việt Nam -----------------------------------------------------------------------

const DAY = 86_400_000;
const VN_OFFSET = 7 * 3_600_000;

/** Ngày YYYY-MM-DD theo giờ Việt Nam. */
export const vnDate = (ms = Date.now()) => new Date(ms + VN_OFFSET).toISOString().slice(0, 10);
export const addDaysYmd = (ymdStr: string, days: number) => new Date(Date.parse(`${ymdStr}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
/** 0 = thứ Hai … 6 = Chủ nhật. */
export const weekdayIdx = (ymdStr: string) => (new Date(`${ymdStr}T00:00:00Z`).getUTCDay() + 6) % 7;
/** Phút trong ngày (giờ VN) của thời điểm ms. */
export const vnMinutes = (ms = Date.now()) => {
  const d = new Date(ms + VN_OFFSET);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
export const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

const h = (t: string) => `${Number(t.slice(0, 2))}:${t.slice(3, 5)}`;
/** "8:00 – 12:00" */
export const slotTime = (s: Pick<SlotDef, 'from' | 'to'>) => `${h(s.from)} – ${h(s.to)}`;

export const dayLabel = (date: string, today = vnDate()) => {
  if (date === today) return 'Hôm nay';
  if (date === addDaysYmd(today, 1)) return 'Ngày mai';
  const [, m, d] = date.split('-');
  return `${['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'][weekdayIdx(date)]} ${d}/${m}`;
};

/** "dd/mm" cho tiêu đề ngắn. */
export const shortDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

export type SlotOption = { key: string; time: string; left: number; full: boolean; past: boolean };
export type DayOption = { date: string; label: string; closed: string | null; slots: SlotOption[] };

/**
 * Khung giờ khách chọn được cho `daysAhead` ngày tới. `used` = số đơn đã giữ chỗ theo "ngày|khung".
 * Khung hết chỗ vẫn hiện (nhãn "Đã kín"); khung có số đơn tối đa = 0 hoặc ngày nghỉ thì ẩn.
 */
export function buildSlotOptions(cfg: ShippingConfig, used: ReadonlyMap<string, number>, now = Date.now()): DayOption[] {
  const today = vnDate(now);
  const mins = vnMinutes(now);
  return Array.from({ length: cfg.daysAhead }, (_, i) => {
    const date = addDaysYmd(today, i);
    const closed = cfg.closed.find((c) => c.date === date);
    const wd = weekdayIdx(date);
    const slots = closed ? [] : cfg.slots.flatMap((s): SlotOption[] => {
      const cap = cfg.cap[s.key]?.[wd] ?? 0;
      if (!cap) return [];
      const left = Math.max(0, cap - (used.get(`${date}|${s.key}`) ?? 0));
      const past = date === today && mins >= toMinutes(s.to) - SLOT_CLOSE_BEFORE_END_MIN;
      return [{ key: s.key, time: slotTime(s), left, full: left <= 0, past }];
    });
    return { date, label: dayLabel(date, today), closed: closed ? closed.note || 'Nghỉ lễ' : null, slots };
  }).filter((d) => d.closed || d.slots.length);
}
