// Cài đặt giao hàng (admin /admin/cai-dat-giao-hang): phí giao, vùng giao cây sống, khung giờ + số đơn tối đa, ngày nghỉ.
// Dùng chung trình duyệt (giỏ hàng, thanh toán, admin) và server (tính tiền thật, kiểm tra khung giờ khi đặt đơn).
import * as z from 'zod';

export type FeeRule = { fee: number; freeFrom: number };
export type SlotDef = { key: string; from: string; to: string };

export type ShippingConfig = {
  /** Phí giao + ngưỡng miễn phí, tách theo nhóm: cây sống giao riêng bằng xe, vật tư giao nhanh. */
  plant: FeeRule;
  supply: FeeRule;
  /** Cây sống chỉ giao trong bán kính này (km) tính từ cửa hàng gần nhất. */
  plantZoneKm: number;
  slots: SlotDef[];
  /** Số đơn giao tối đa mỗi khung theo thứ trong tuần [T2, T3, T4, T5, T6, T7, CN]; 0 = không giao khung đó. */
  cap: Record<string, number[]>;
  /** Khách chọn được giao trong bấy nhiêu ngày kể từ hôm nay (1 = chỉ hôm nay). */
  daysAhead: number;
  /** Ngày nghỉ lễ, Tết: không nhận khung giờ giao. */
  closed: { date: string; note: string }[];
};

/** Khớp cách tính cũ trước khi có trang cài đặt: phí 35k / 20k, miễn phí từ 800k / 300k, 30 km, 2 khung × 2 ngày. */
export const DEFAULT_SHIPPING: ShippingConfig = {
  plant: { fee: 35000, freeFrom: 800000 },
  supply: { fee: 20000, freeFrom: 300000 },
  plantZoneKm: 30,
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
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nghỉ chưa đúng').refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Ngày nghỉ chưa đúng');

export const ShippingConfigSchema = z.object({
  plant: fee,
  supply: fee,
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

/** Đọc cấu hình lưu trong database; thiếu / hỏng thì dùng mặc định (đặt hàng không bao giờ bị chặn vì cấu hình lỗi). */
export function parseShipping(raw: unknown): ShippingConfig {
  const r = ShippingConfigSchema.safeParse(raw);
  if (!r.success) return DEFAULT_SHIPPING;
  const cap = Object.fromEntries(r.data.slots.map((s) => [s.key, r.data.cap[s.key]]));
  return { ...r.data, cap, closed: [...r.data.closed].sort((a, b) => a.date.localeCompare(b.date)) };
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
