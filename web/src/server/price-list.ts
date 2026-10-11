import 'server-only';
import { and, asc, desc, eq, ilike, or } from 'drizzle-orm';
import { costFromGarden, PRICE_FORMULA, roundPrice } from '@/lib/pricing';
import { db, schema } from './db';

const { products, productOptions } = schema;

// Bảng giá theo nhóm khách (admin /admin/bang-gia + file Excel gửi đại lý). Chỉ chạy trên server:
// hệ số sỉ và giá vườn / giá gốc không bao giờ gửi xuống trình duyệt của khách.
// Giá sỉ = giá gốc + % theo cấp (chủ shop chốt 11/10/2026). Mới dùng để xem và báo giá — chưa áp vào giỏ hàng / đặt hàng.
export const WHOLESALE_TIERS = [
  { key: 'dl2', label: 'Đại lý cấp 2', pct: 30 },
  { key: 'dl1', label: 'Đại lý cấp 1', pct: 22 },
  { key: 'ct', label: 'Công trình', pct: 15 },
] as const;
export type TierKey = (typeof WHOLESALE_TIERS)[number]['key'];
export const isTierKey = (v: unknown): v is TierKey => WHOLESALE_TIERS.some((t) => t.key === v);

/** Thuế hộ kinh doanh bán hàng hóa tính trên doanh thu (%), chỉ để ước lãi sau thuế ở bảng giá — hỏi kế toán mức đúng. */
export const REVENUE_TAX_PCT = 1.5;

export type PriceRow = {
  slug: string; sku: string; name: string; active: boolean; unit: string;
  idx: number; label: string; stock: number;
  /** Giá tại vườn / giá gốc: có thể trống với quy cách chưa nhập giá vườn. */
  garden: number | null; cost: number | null;
  price: number; combo2: number | null; oldPrice: number | null;
  /** Giá sỉ từng cấp (null khi chưa có giá gốc). */
  tiers: Record<TierKey, number | null>;
  /** Lãi trên tiền bán (0–1), null khi thiếu giá gốc hoặc giá bán. */
  retailMargin: number | null;
  /** Giá lẻ đang thấp hơn / bằng giá đại lý cấp 2 → đại lý không còn chỗ bán lại. */
  retailTooLow: boolean;
};

const margin = (sell: number | null, cost: number | null) => (sell && cost ? (sell - cost) / sell : null);

/** Mọi quy cách đang có (không gồm quy cách đã xóa), cây đang bán trước, theo tên. */
export async function listPriceRows({ q, onlyActive = false }: { q?: string; onlyActive?: boolean } = {}): Promise<PriceRow[]> {
  const term = q?.trim() ? `%${q.trim().replace(/[%_]/g, '')}%` : undefined;
  const rows = await db.select({
    slug: products.slug, sku: products.sku, name: products.name, active: products.active, unit: products.unit,
    idx: productOptions.idx, label: productOptions.label, stock: productOptions.stock,
    garden: productOptions.garden, cost: productOptions.cost, price: productOptions.price, combo2: productOptions.combo2, oldPrice: productOptions.oldPrice,
  })
    .from(productOptions).innerJoin(products, eq(products.slug, productOptions.productSlug))
    .where(and(eq(productOptions.deleted, false), onlyActive ? eq(products.active, true) : undefined, term ? or(ilike(products.name, term), ilike(products.sku, term)) : undefined))
    .orderBy(desc(products.active), asc(products.name), asc(productOptions.idx));
  return rows.map((r) => {
    const cost = r.cost ?? (r.garden ? costFromGarden(r.garden) : null);
    const tiers = Object.fromEntries(WHOLESALE_TIERS.map((t) => [t.key, cost ? roundPrice(cost * (1 + t.pct / 100)) : null])) as Record<TierKey, number | null>;
    return { ...r, cost, tiers, retailMargin: margin(r.price, cost), retailTooLow: !!tiers.dl2 && r.price > 0 && r.price <= tiers.dl2 };
  });
}

/**
 * Bảng hệ số hiện ở đầu trang Bảng giá: mỗi loại giá = giá gốc × hệ số = giá vườn × hệ số.
 * Trong code chỉ lưu phần trăm (`PRICE_FORMULA`, `WHOLESALE_TIERS`); hệ số = 1 + % / 100, tính ra ở đây để dễ nhìn.
 */
export function factorTable() {
  const cost = 1 + PRICE_FORMULA.costPct / 100;
  const retail = 1 + PRICE_FORMULA.retailPct / 100;
  const row = (label: string, how: string, onCost: number) => ({ label, how, onCost, onGarden: onCost * cost });
  return [
    { label: 'Giá gốc', how: `giá vườn + ${PRICE_FORMULA.costPct}%`, onCost: 1, onGarden: cost },
    row('Giá lẻ', `giá gốc + ${PRICE_FORMULA.retailPct}%`, retail),
    row('Combo 2 cây (tính mỗi cây)', `giá lẻ − ${PRICE_FORMULA.comboPct}%`, retail * (1 - PRICE_FORMULA.comboPct / 100)),
    ...WHOLESALE_TIERS.map((t) => row(t.label, `giá gốc + ${t.pct}%`, 1 + t.pct / 100)),
  ];
}
