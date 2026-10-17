import 'server-only';
import { eq, inArray } from 'drizzle-orm';
import { cache } from 'react';
import { floorOf, guardDiscounts, MarginGuardSchema, parseMarginGuard, type Discounts, type MarginGuard } from '@/lib/margin-guard';
import { costFromGarden, PRICE_FORMULA, roundPrice, type Totals } from '@/lib/pricing';
import { db, schema } from './db';
import type { Tx } from './inventory';

const { appSettings, productOptions, products } = schema;
const KEY = 'margin-guard';

/** Lãi tối thiểu + hao hụt cây sống đang dùng (chưa lưu / hỏng → 25% / 5%). */
export const getMarginGuard = cache(async (): Promise<MarginGuard> => {
  const [r] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, KEY));
  return parseMarginGuard(r?.value);
});

export async function saveMarginGuard(raw: unknown, actor: string): Promise<{ ok: true; value: MarginGuard } | { ok: false; error: string }> {
  const p = MarginGuardSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Số chưa hợp lệ' };
  await db.insert(appSettings).values({ key: KEY, value: p.data, updatedBy: actor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: p.data, updatedBy: actor, updatedAt: new Date() } });
  return { ok: true, value: p.data };
}

/** Giá gốc dùng cho giá sàn: giá gốc đã có → tính từ giá vườn → tính ngược từ giá lẻ theo công thức (quy cách chưa nhập giá vườn). */
export const unitCost = (o: { cost: number | null; garden: number | null; price: number }) =>
  o.cost ?? (o.garden ? costFromGarden(o.garden) : roundPrice(o.price / (1 + PRICE_FORMULA.retailPct / 100)));

export type FloorLine = { slug: string; option: number; qty: number; ship: 'plant' | 'supply' };

/** Tổng tiền thu tối thiểu của các dòng hàng (đọc giá gốc trong database — không bao giờ gửi xuống trình duyệt). */
export async function orderFloor(lines: FloorLine[], conn: Tx | typeof db = db): Promise<number> {
  if (!lines.length) return 0;
  const opts = (slugs: string[]) => conn.select({
    slug: productOptions.productSlug, idx: productOptions.idx, cost: productOptions.cost, garden: productOptions.garden, price: productOptions.price,
    parts: productOptions.parts, ship: products.ship,
  }).from(productOptions).innerJoin(products, eq(products.slug, productOptions.productSlug)).where(inArray(productOptions.productSlug, slugs));
  const [g, rows] = await Promise.all([getMarginGuard(), opts([...new Set(lines.map((l) => l.slug))])]);
  // Bộ (lib/bundle.ts): giá sàn = cộng giá sàn từng món (món là cây sống mới tính hao hụt)
  const partSlugs = [...new Set(rows.flatMap((r) => r.parts?.map((p) => p.slug) ?? []))];
  const parts = partSlugs.length ? await opts(partSlugs) : [];
  const by = new Map([...rows, ...parts].map((r) => [`${r.slug}#${r.idx}`, r]));
  const floorUnit = (o: (typeof rows)[number], ship: 'plant' | 'supply'): number => (o.parts
    ? o.parts.reduce((s, p) => { const x = by.get(`${p.slug}#${p.idx}`); return x ? s + floorOf(unitCost(x), x.ship === 'plant', g) * p.qty : s; }, 0)
    : floorOf(unitCost(o), ship === 'plant', g));
  return lines.reduce((s, l) => {
    const o = by.get(`${l.slug}#${l.option}`);
    return o ? s + floorUnit(o, l.ship) * l.qty : s;
  }, 0);
}

/** Cắt các khoản giảm của đơn theo giá sàn (xem `guardDiscounts`). */
export const guardOrder = (totals: Totals, floor: number, want: Discounts) =>
  guardDiscounts({ goods: totals.goods, absorbed: totals.plantShipFree + totals.supplyShipFree, floor }, want);
