// Sticker "ngày đặc biệt" (ô ghi 15.10, 11.11… ở góc ảnh sản phẩm, kiểu Shopee): ngày shop có ưu đãi riêng.
// Mặc định mỗi tháng có một ngày đôi (1.1, 2.2 … 12.12 — "ngày đẹp"), shop thêm ngày khác ở /admin/ngay-su-kien.
// Dùng chung trình duyệt (admin) và server (đọc / lưu app_settings khóa "sticker-days").
import * as z from 'zod';

export type StickerDay = {
  /** Ngày bắt đầu, YYYY-MM-DD (giờ Việt Nam). */
  date: string;
  /** Ngày kết thúc (gồm cả ngày đó); rỗng = chỉ đúng ngày `date`. */
  endDate: string;
  /** Dòng chữ nhỏ trên ngày, vd "SĂN SALE"; rỗng = mặc định. */
  text: string;
  on: boolean;
};
export type StickerDayConfig = {
  /** Tự có sticker vào các ngày đôi mỗi tháng (1.1, 2.2 … 12.12). */
  monthly: boolean;
  days: StickerDay[];
};

export const DEFAULT_STICKER_DAYS: StickerDayConfig = { monthly: true, days: [] };
export const STICKER_DAY_TEXT = 'SĂN SALE';
export const MAX_STICKER_DAYS = 60;
export const MAX_STICKER_TEXT = 10;

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chưa đúng').refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Ngày chưa đúng');

export const StickerDayConfigSchema = z.object({
  monthly: z.boolean().default(true),
  days: z.array(z.object({
    date: ymd,
    endDate: z.union([z.literal(''), ymd]).default(''),
    text: z.string().trim().max(MAX_STICKER_TEXT, `Chữ nhỏ tối đa ${MAX_STICKER_TEXT} ký tự`).default(''),
    on: z.boolean().default(true),
  }).refine((d) => !d.endDate || d.endDate >= d.date, { message: 'Ngày kết thúc phải sau ngày bắt đầu' })).max(MAX_STICKER_DAYS, `Tối đa ${MAX_STICKER_DAYS} ngày`).default([]),
});

/** Đọc cấu hình đã lưu; thiếu / hỏng thì dùng mặc định (sticker không bao giờ làm hỏng trang). */
export function parseStickerDays(raw: unknown): StickerDayConfig {
  const p = StickerDayConfigSchema.safeParse(raw);
  if (!p.success) return DEFAULT_STICKER_DAYS;
  return { monthly: p.data.monthly, days: [...p.data.days].sort((a, b) => a.date.localeCompare(b.date)) };
}

/** "2026-10-15" → "15.10". */
export const dayLabelOf = (date: string) => `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;

export type ActiveStickerDay = { label: string; text: string; title: string };

/** Ngày đặc biệt đang diễn ra hôm nay (`today` = YYYY-MM-DD giờ Việt Nam), null nếu không có. Ngày shop tự thêm được ưu tiên hơn ngày đôi. */
export function activeStickerDay(cfg: StickerDayConfig, today: string): ActiveStickerDay | null {
  const d = cfg.days.find((x) => x.on && x.date <= today && today <= (x.endDate || x.date));
  if (d) {
    const label = dayLabelOf(d.date);
    return { label, text: (d.text || STICKER_DAY_TEXT).toUpperCase(), title: `Ngày ${label}: ưu đãi đặc biệt của Cây Cảnh Miền Tây${d.text ? ` — ${d.text}` : ''}` };
  }
  const day = Number(today.slice(8, 10));
  if (cfg.monthly && day === Number(today.slice(5, 7))) {
    const label = `${day}.${day}`;
    return { label, text: STICKER_DAY_TEXT, title: `Ngày đôi ${label}: ngày săn sale của Cây Cảnh Miền Tây` };
  }
  return null;
}
