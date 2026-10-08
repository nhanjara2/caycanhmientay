// Cho thuê cây văn phòng: bảng giá theo cỡ cây, các gói, máy tính ước tính — dùng chung trình duyệt (trang /dich-vu/cho-thue-cay-van-phong)
// và server (lưu ở app_settings, khóa "office-rental", sửa ở /admin/thue-cay).
//
// Cách tính: Σ (số cây × giá cỡ cây) → + phụ phí chăm hằng tuần (%) → − giảm theo thời hạn thuê (%) → + VAT (nếu shop bật) → làm tròn nghìn.
// Gói = bộ số cây có sẵn + tần suất chăm, giá gói tính bằng đúng công thức trên (không có giá riêng) nên gói và "tự chọn số cây" luôn khớp nhau.
// Giá mặc định do Claude ước theo mặt bằng thuê cây văn phòng (08/10/2026) — chủ shop rà lại ở trang admin.

import { z } from 'zod';

export const RENTAL_TIERS = ['de-ban', 'vua', 'lon'] as const;
export type RentalTierKey = (typeof RENTAL_TIERS)[number];
export type RentalQty = Record<RentalTierKey, number>;

export type RentalTier = { key: RentalTierKey; name: string; size: string; examples: string; /** đ / cây / tháng, 0 = liên hệ */ price: number };
export type RentalTerm = { months: number; /** % giảm */ discount: number };
export type RentalPackage = {
  key: string; name: string; fit: string; qty: RentalQty;
  /** Chăm hằng tuần (không thì 2 tuần / lần). */
  weekly: boolean;
  perks: string[];
  /** Nhãn "Được chọn nhiều nhất". */
  hot: boolean;
  /** Gói theo yêu cầu (tòa nhà, sự kiện): không tính giá, nút dẫn sang form báo giá. */
  custom: boolean;
};
export type RentalConfig = {
  showPrices: boolean;
  tiers: RentalTier[];
  /** % cộng thêm khi chăm hằng tuần. */
  weeklyExtra: number;
  terms: RentalTerm[];
  minPlants: number;
  /** % VAT, 0 = không hiện ô xuất hóa đơn. */
  vatRate: number;
  includes: string[];
  packages: RentalPackage[];
};

export const RENTAL_KEY = 'office-rental';
export const RENTAL_URL = '/dich-vu/cho-thue-cay-van-phong';
export const MAX_PACKAGES = 4;
export const MAX_TERMS = 4;
export const MAX_QTY = 500;
/** sessionStorage: ước tính khách vừa tính, trang Đặt lịch khảo sát ghi sẵn vào ô Ghi chú. */
export const RENTAL_STORE_KEY = 'ccmt-rental-estimate-v1';

const q = (deBan: number, vua: number, lon: number): RentalQty => ({ 'de-ban': deBan, vua, lon });

export const DEFAULT_RENTAL: RentalConfig = {
  showPrices: true,
  tiers: [
    { key: 'de-ban', name: 'Cây để bàn', size: 'Cao 20–50cm', examples: 'Kim tiền, lưỡi hổ, trầu bà, lan ý, sen đá', price: 30_000 },
    { key: 'vua', name: 'Cây đặt sàn', size: 'Cao 60cm–1,2m', examples: 'Phát tài, kim ngân, trầu bà Nam Mỹ, lưỡi hổ lớn', price: 70_000 },
    { key: 'lon', name: 'Cây lớn', size: 'Cao 1,2–2m', examples: 'Bàng Singapore, thiết mộc lan, cau, đa búp đỏ', price: 150_000 },
  ],
  weeklyExtra: 20,
  terms: [
    { months: 3, discount: 0 },
    { months: 6, discount: 5 },
    { months: 12, discount: 10 },
  ],
  minPlants: 5,
  vatRate: 0,
  includes: [
    'Cây, chậu và đĩa lót — giao và đặt đúng vị trí tại văn phòng',
    'Kỹ sư đến chăm theo lịch: tưới, bón phân, lau lá, cắt tỉa, xử lý sâu bệnh',
    'Thay cây khi cây yếu hoặc hư, không tính thêm tiền',
    'Hết hợp đồng shop đến thu cây và chậu',
  ],
  packages: [
    {
      key: 'goc-xanh', name: 'Góc xanh', fit: 'Phòng nhỏ, quầy lễ tân · 3–8 người', qty: q(6, 2, 0), weekly: false, hot: false, custom: false,
      perks: ['Hợp bàn làm việc và góc tiếp khách'],
    },
    {
      key: 'van-phong-xanh', name: 'Văn phòng xanh', fit: 'Văn phòng 10–25 người', qty: q(12, 5, 1), weekly: false, hot: true, custom: false,
      perks: ['Có 1 cây lớn cho sảnh hoặc phòng họp', 'Kỹ sư gợi ý vị trí đặt từng cây khi khảo sát'],
    },
    {
      key: 'doanh-nghiep', name: 'Doanh nghiệp', fit: 'Văn phòng 30–60 người, nhiều phòng', qty: q(25, 10, 3), weekly: true, hot: false, custom: false,
      perks: ['Hợp văn phòng bật điều hòa cả ngày', 'Cây lớn cho sảnh, hành lang và phòng họp'],
    },
    {
      key: 'theo-yeu-cau', name: 'Tòa nhà, sự kiện', fit: 'Trên 50 cây, nhiều tầng hoặc thuê ngắn ngày', qty: q(0, 0, 0), weekly: true, hot: false, custom: true,
      perks: ['Cây lớn sảnh, tiểu cảnh, vườn tường', 'Trang trí sự kiện, khai trương, Tết', 'Kỹ sư phụ trách riêng'],
    },
  ],
};

// ——— Kiểm tra dữ liệu khi lưu ———

const text = (max: number, label: string) => z.string().trim().min(1, `${label} không được để trống`).max(max, `${label} tối đa ${max} ký tự`);
const lines = (maxItems: number, maxLen: number, label: string) =>
  z.array(z.string().trim().max(maxLen, `${label}: mỗi dòng tối đa ${maxLen} ký tự`)).transform((a) => a.filter(Boolean)).pipe(z.array(z.string()).max(maxItems, `${label}: tối đa ${maxItems} dòng`));
const int = (min: number, max: number, label: string) => z.number().int(`${label} phải là số nguyên`).min(min, `${label} tối thiểu ${min}`).max(max, `${label} tối đa ${max}`);
const QtySchema = z.object({ 'de-ban': int(0, MAX_QTY, 'Số cây'), vua: int(0, MAX_QTY, 'Số cây'), lon: int(0, MAX_QTY, 'Số cây') });

export const RentalConfigSchema = z.object({
  showPrices: z.boolean(),
  tiers: z.array(z.object({
    key: z.enum(RENTAL_TIERS),
    name: text(40, 'Tên cỡ cây'),
    size: z.string().trim().max(40, 'Chiều cao tối đa 40 ký tự'),
    examples: z.string().trim().max(120, 'Ví dụ cây tối đa 120 ký tự'),
    price: int(0, 5_000_000, 'Giá thuê'),
  })).length(RENTAL_TIERS.length),
  weeklyExtra: int(0, 200, 'Phụ phí chăm hằng tuần (%)'),
  terms: z.array(z.object({ months: int(1, 60, 'Số tháng'), discount: int(0, 50, 'Mức giảm (%)') }))
    .min(1, 'Cần ít nhất một thời hạn thuê').max(MAX_TERMS, `Tối đa ${MAX_TERMS} thời hạn`)
    .refine((t) => new Set(t.map((x) => x.months)).size === t.length, 'Hai thời hạn thuê trùng số tháng'),
  minPlants: int(1, 100, 'Số cây tối thiểu'),
  vatRate: int(0, 20, 'VAT (%)'),
  includes: lines(8, 140, 'Mỗi gói đều gồm'),
  packages: z.array(z.object({
    key: z.string().trim().max(40),
    name: text(40, 'Tên gói'),
    fit: z.string().trim().max(80, 'Dòng "phù hợp" tối đa 80 ký tự'),
    qty: QtySchema,
    weekly: z.boolean(),
    perks: lines(5, 120, 'Điểm nổi bật của gói'),
    hot: z.boolean(),
    custom: z.boolean(),
  }).refine((p) => p.custom || plantCount(p.qty) > 0, { message: 'Gói (không phải "theo yêu cầu") cần ít nhất 1 cây' }))
    .min(1, 'Cần ít nhất một gói').max(MAX_PACKAGES, `Tối đa ${MAX_PACKAGES} gói`),
});

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'goi';

/** Chuẩn hóa sau khi kiểm tra: thời hạn tăng dần, chỉ một gói "nổi bật", khóa gói không trùng. */
export function normalizeRental(c: RentalConfig): RentalConfig {
  const tiers = RENTAL_TIERS.map((k) => c.tiers.find((t) => t.key === k) ?? DEFAULT_RENTAL.tiers.find((t) => t.key === k)!);
  const hotAt = c.packages.findIndex((p) => p.hot);
  const used = new Set<string>();
  const packages = c.packages.map((p, i) => {
    let key = p.key || slug(p.name);
    for (let n = 2; used.has(key); n++) key = `${slug(p.name)}-${n}`;
    used.add(key);
    return { ...p, key, hot: i === hotAt, qty: p.custom ? q(0, 0, 0) : p.qty };
  });
  return { ...c, tiers, terms: [...c.terms].sort((a, b) => a.months - b.months), packages };
}

/** Kiểm tra + chuẩn hóa, không hợp lệ → null (admin xem trước giá gói khi đang sửa). */
export function tryParseRental(raw: unknown): RentalConfig | null {
  const p = RentalConfigSchema.safeParse(raw);
  return p.success ? normalizeRental(p.data) : null;
}

/** Đọc cài đặt đã lưu (thiếu / hỏng → mặc định, trang khách không bao giờ lỗi). */
export const parseRental = (raw: unknown): RentalConfig => tryParseRental(raw) ?? DEFAULT_RENTAL;

// ——— Tính tiền ———

export const plantCount = (qty: RentalQty) => RENTAL_TIERS.reduce((s, k) => s + (qty[k] || 0), 0);
const roundK = (n: number) => Math.round(n / 1000) * 1000;

export type RentalInput = { qty: RentalQty; weekly: boolean; months: number; vat: boolean };
export type RentalEstimate = {
  plants: number;
  lines: { tier: RentalTier; qty: number; amount: number }[];
  base: number; care: number; discount: number; vat: number;
  /** Đ / tháng. */
  monthly: number;
  /** Cả thời hạn thuê. */
  total: number;
  term: RentalTerm;
  belowMin: boolean;
  /** Có cỡ cây đang để giá 0 (liên hệ) → không ra được con số. */
  needsQuote: boolean;
};

export function estimateRental(cfg: RentalConfig, input: RentalInput): RentalEstimate {
  const lines = cfg.tiers.map((tier) => {
    const qty = Math.max(0, Math.min(MAX_QTY, Math.floor(input.qty[tier.key] || 0)));
    return { tier, qty, amount: qty * tier.price };
  });
  const plants = lines.reduce((s, l) => s + l.qty, 0);
  const base = lines.reduce((s, l) => s + l.amount, 0);
  // Mỗi khoản làm tròn nghìn nên các dòng cộng lại đúng bằng tổng hiện trên trang
  const care = input.weekly ? roundK(base * cfg.weeklyExtra / 100) : 0;
  const term = cfg.terms.find((t) => t.months === input.months) ?? cfg.terms[0];
  const discount = roundK((base + care) * term.discount / 100);
  const vat = input.vat && cfg.vatRate > 0 ? roundK((base + care - discount) * cfg.vatRate / 100) : 0;
  const monthly = base + care - discount + vat;
  return {
    plants, lines, base, care, discount, vat, monthly, total: monthly * term.months, term,
    belowMin: plants > 0 && plants < cfg.minPlants,
    needsQuote: lines.some((l) => l.qty > 0 && l.tier.price === 0),
  };
}

/** Giá một gói theo thời hạn ngắn nhất (giá "từ") và dài nhất (giá thấp nhất). */
export function packagePrice(cfg: RentalConfig, p: RentalPackage) {
  const first = cfg.terms[0], last = cfg.terms[cfg.terms.length - 1];
  const a = estimateRental(cfg, { qty: p.qty, weekly: p.weekly, months: first.months, vat: false });
  const b = estimateRental(cfg, { qty: p.qty, weekly: p.weekly, months: last.months, vat: false });
  return { monthly: a.monthly, needsQuote: p.custom || a.needsQuote, longest: last, longestMonthly: b.monthly, perPlant: a.plants ? roundK(a.monthly / a.plants) : 0 };
}

/** Giá thấp nhất trên bảng (để ghi "từ … / cây / tháng"), 0 = không có giá nào. */
export const lowestTierPrice = (cfg: RentalConfig) => Math.min(...cfg.tiers.map((t) => t.price || Infinity)) || 0;

/** Gợi ý số cây từ số người và diện tích: 1 cây để bàn / 2 người, 1 cây đặt sàn / 12m², 1 cây lớn / 100m² (từ 60m²). */
export function suggestQty(people: number, area: number): RentalQty {
  const p = Math.max(0, Math.floor(people || 0)), a = Math.max(0, Math.floor(area || 0));
  return {
    'de-ban': Math.min(MAX_QTY, Math.ceil(p / 2)),
    vua: Math.min(MAX_QTY, a >= 15 ? Math.max(1, Math.round(a / 12)) : 0),
    lon: Math.min(MAX_QTY, a >= 60 ? Math.ceil(a / 100) : 0),
  };
}

export const careLabel = (weekly: boolean) => (weekly ? 'Chăm hằng tuần' : 'Chăm 2 tuần / lần');
export const termLabel = (t: RentalTerm) => `${t.months} tháng`;

/** Một dòng tóm tắt số cây: "12 cây để bàn, 5 cây đặt sàn, 1 cây lớn". */
export function qtySummary(cfg: RentalConfig, qty: RentalQty) {
  return cfg.tiers.filter((t) => qty[t.key] > 0).map((t) => `${qty[t.key]} ${t.name.toLowerCase()}`).join(', ');
}
