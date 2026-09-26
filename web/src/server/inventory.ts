import 'server-only';
import { and, asc, desc, eq, gt, inArray, like, lt, or, sql } from 'drizzle-orm';
import { addDays, EXPIRY_WARN_DAYS, todayVN } from '@/lib/stock';
import { db, schema, type DB } from './db';
import type { STOCK_REASONS } from './db/schema';

const { products, productOptions, stockMoves, stockLots: L, stores } = schema;

export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];
export type StockReason = (typeof STOCK_REASONS)[number];
export type Store = typeof stores.$inferSelect;

/** Mức tồn tối thiểu cho mỗi quy cách (tổng các cửa hàng) — dưới mức này hiện cảnh báo. */
export const MIN_STOCK = 10;

export const listStores = (): Store[] => db.select().from(stores).where(eq(stores.active, true)).orderBy(desc(stores.isDefault), asc(stores.id)).all();

function defaultStoreId(tx: Tx | DB) {
  const s = tx.select({ id: stores.id }).from(stores).where(eq(stores.isDefault, true)).get()
    ?? tx.select({ id: stores.id }).from(stores).orderBy(asc(stores.id)).get();
  if (!s) throw new Error('Chưa có cửa hàng nào');
  return s.id;
}

export type StockOpts = {
  /** Cửa hàng: nhập vào / xuất từ. Không có thì nhập vào kho mặc định; xuất thì ưu tiên kho mặc định rồi các kho khác. */
  storeId?: number;
  /** Nhập vào đúng lô này (dùng khi trả hàng về). */
  lotId?: number;
  lotCode?: string | null;
  expiry?: string | null;
};

/**
 * Thay đổi tồn một quy cách và ghi lịch sử. Mọi thay đổi tồn kho đều phải đi qua hàm này.
 * - delta > 0: cộng vào một lô (tìm lô trùng mã + hạn trong cửa hàng, không có thì tạo).
 * - delta < 0: trừ dần các lô còn hạn, lô hết hạn sớm nhất trước (FEFO). Lô đã hết hạn không bán.
 * Trả về tổng tồn mới, hoặc null nếu không đủ hàng.
 */
export function applyStock(tx: Tx | DB, slug: string, idx: number, delta: number, reason: StockReason, actor: string, note?: string, opts: StockOpts = {}): number | null {
  const where = and(eq(productOptions.productSlug, slug), eq(productOptions.idx, idx));
  const cur = tx.select({ stock: productOptions.stock }).from(productOptions).where(where).get();
  if (!cur || delta === 0) return cur ? cur.stock : null;

  const parts: { lotId: number; storeId: number; delta: number }[] = [];
  if (delta > 0) {
    let lot = opts.lotId ? tx.select().from(L).where(and(eq(L.id, opts.lotId), eq(L.productSlug, slug), eq(L.optionIdx, idx))).get() : undefined;
    if (!lot) {
      const storeId = opts.storeId ?? defaultStoreId(tx);
      const lotCode = opts.lotCode?.trim() || null;
      const expiry = opts.expiry || null;
      lot = tx.select().from(L).where(and(
        eq(L.storeId, storeId), eq(L.productSlug, slug), eq(L.optionIdx, idx),
        lotCode ? eq(L.lotCode, lotCode) : sql`${L.lotCode} is null`,
        expiry ? eq(L.expiry, expiry) : sql`${L.expiry} is null`,
      )).get() ?? tx.insert(L).values({ storeId, productSlug: slug, optionIdx: idx, lotCode, expiry, qty: 0 }).returning().get();
    }
    parts.push({ lotId: lot.id, storeId: lot.storeId, delta });
  } else {
    const def = defaultStoreId(tx);
    const lots = tx.select().from(L).where(and(
      eq(L.productSlug, slug), eq(L.optionIdx, idx), gt(L.qty, 0),
      opts.storeId ? eq(L.storeId, opts.storeId) : undefined,
      opts.lotId ? eq(L.id, opts.lotId) : or(sql`${L.expiry} is null`, sql`${L.expiry} >= ${todayVN()}`),
    )).orderBy(
      sql`case when ${L.storeId} = ${def} then 0 else 1 end`,
      sql`case when ${L.expiry} is null then 1 else 0 end`, asc(L.expiry), asc(L.id),
    ).all();
    let need = -delta;
    for (const lot of lots) {
      if (!need) break;
      const take = Math.min(need, lot.qty);
      parts.push({ lotId: lot.id, storeId: lot.storeId, delta: -take });
      need -= take;
    }
    if (need > 0) return null;
  }

  let after = cur.stock;
  for (const p of parts) {
    tx.update(L).set({ qty: sql`${L.qty} + ${p.delta}` }).where(eq(L.id, p.lotId)).run();
    after += p.delta;
    tx.insert(stockMoves).values({ productSlug: slug, optionIdx: idx, storeId: p.storeId, lotId: p.lotId, delta: p.delta, after, reason, note: note || null, actor }).run();
  }
  tx.update(productOptions).set({ stock: after }).where(where).run();
  return after;
}

/** Hủy đơn: trả đúng số lượng về đúng lô/cửa hàng đã xuất (theo lịch sử xuất của mã đơn). */
export function restoreOrderStock(tx: Tx, code: string, actor: string) {
  const out = tx.select().from(stockMoves)
    .where(and(eq(stockMoves.note, code), inArray(stockMoves.reason, ['order', 'warranty']), lt(stockMoves.delta, 0))).all();
  for (const m of out) {
    applyStock(tx, m.productSlug, m.optionIdx, -m.delta, 'cancel', actor, code, m.lotId ? { lotId: m.lotId } : { storeId: m.storeId ?? undefined });
  }
}

/** Kiểm kê một lô: đặt lại số đếm thực tế. Trả về tổng tồn mới. */
export function countLot(tx: Tx, lotId: number, qty: number, actor: string, note?: string) {
  const lot = tx.select().from(L).where(eq(L.id, lotId)).get();
  if (!lot) return null;
  const cur = tx.select({ stock: productOptions.stock }).from(productOptions)
    .where(and(eq(productOptions.productSlug, lot.productSlug), eq(productOptions.idx, lot.optionIdx))).get();
  if (lot.qty === qty) return cur?.stock ?? null;
  return applyStock(tx, lot.productSlug, lot.optionIdx, qty - lot.qty, 'adjust', actor, note || 'Kiểm kê', { lotId, storeId: lot.storeId });
}

/** Chuyển hàng giữa hai cửa hàng, giữ nguyên mã lô và hạn dùng. Trả về false nếu kho đi không đủ. */
export function transferStock(tx: Tx, slug: string, idx: number, from: number, to: number, qty: number, actor: string, note?: string) {
  const [fromName, toName] = [from, to].map((id) => tx.select({ code: stores.code }).from(stores).where(eq(stores.id, id)).get()?.code);
  if (!fromName || !toName || from === to) return false;
  const before = tx.select({ id: stockMoves.id }).from(stockMoves).orderBy(desc(stockMoves.id)).get()?.id ?? 0;
  const text = `${fromName} → ${toName}${note ? ` · ${note}` : ''}`;
  if (applyStock(tx, slug, idx, -qty, 'transfer', actor, text, { storeId: from }) === null) return false;
  const taken = tx.select().from(stockMoves).where(gt(stockMoves.id, before)).all();
  for (const m of taken) {
    const lot = m.lotId ? tx.select().from(L).where(eq(L.id, m.lotId)).get() : undefined;
    applyStock(tx, slug, idx, -m.delta, 'transfer', actor, text, { storeId: to, lotCode: lot?.lotCode, expiry: lot?.expiry });
  }
  return true;
}

// ---- Màn Kho ---------------------------------------------------------------------------------

export const INVENTORY_TABS = {
  'tat-ca': 'Tất cả',
  'cay-song': 'Cây sống',
  'thuoc-bvtv': 'Thuốc BVTV',
  'phan-bon': 'Phân bón',
  'vat-tu': 'Vật tư',
  'duoi-muc': 'Dưới mức',
  'han-dung': 'Sắp / đã hết hạn',
} as const;
export type InventoryTab = keyof typeof INVENTORY_TABS;

const expiringKeys = () => sql`(${productOptions.productSlug}, ${productOptions.idx}) in (
  select ${L.productSlug}, ${L.optionIdx} from ${L} where ${L.qty} > 0 and ${L.expiry} is not null and ${L.expiry} <= ${addDays(todayVN(), EXPIRY_WARN_DAYS)})`;

function tabFilter(tab: InventoryTab) {
  switch (tab) {
    case 'cay-song': return eq(products.ship, 'plant');
    case 'thuoc-bvtv': return eq(products.pesticide, true);
    case 'phan-bon': return eq(products.category, 'phan-bon');
    case 'vat-tu': return and(eq(products.ship, 'supply'), eq(products.pesticide, false), sql`${products.category} <> 'phan-bon'`);
    case 'duoi-muc': return lt(productOptions.stock, MIN_STOCK);
    case 'han-dung': return expiringKeys();
    default: return undefined;
  }
}

export type LotRow = typeof L.$inferSelect;

/** Mỗi dòng là một quy cách (SKU) của một sản phẩm, kèm tồn theo từng cửa hàng và các lô còn hàng. */
export function listInventory({ tab = 'tat-ca', q }: { tab?: InventoryTab; q?: string } = {}) {
  const term = q?.trim() ? `%${q.trim().replace(/[%_]/g, '')}%` : undefined;
  const rows = db.select({
    slug: products.slug, sku: products.sku, name: products.name, icon: products.icon, unit: products.unit,
    ship: products.ship, pesticide: products.pesticide, category: products.category, active: products.active,
    idx: productOptions.idx, label: productOptions.label, price: productOptions.price, stock: productOptions.stock,
  })
    .from(productOptions).innerJoin(products, eq(products.slug, productOptions.productSlug))
    .where(and(tabFilter(tab), term ? or(like(products.name, term), like(products.sku, term)) : undefined))
    .orderBy(asc(productOptions.stock), asc(products.name)).all();
  if (!rows.length) return [];
  const lots = db.select().from(L).where(and(gt(L.qty, 0), inArray(L.productSlug, [...new Set(rows.map((r) => r.slug))])))
    .orderBy(sql`case when ${L.expiry} is null then 1 else 0 end`, asc(L.expiry), asc(L.id)).all();
  return rows.map((r) => {
    const mine = lots.filter((l) => l.productSlug === r.slug && l.optionIdx === r.idx);
    const byStore: Record<number, number> = {};
    for (const l of mine) byStore[l.storeId] = (byStore[l.storeId] ?? 0) + l.qty;
    return { ...r, lots: mine, byStore, nearestExpiry: mine.find((l) => l.expiry)?.expiry ?? null };
  });
}
export type InventoryRow = ReturnType<typeof listInventory>[number];

export function inventorySummary() {
  const r = db.select({
    value: sql<number>`coalesce(sum(${productOptions.stock} * ${productOptions.price}), 0)`,
    skus: sql<number>`count(*)`,
    low: sql<number>`sum(case when ${productOptions.stock} < ${MIN_STOCK} and ${productOptions.stock} > 0 then 1 else 0 end)`,
    out: sql<number>`sum(case when ${productOptions.stock} = 0 then 1 else 0 end)`,
  }).from(productOptions).get();
  const today = todayVN();
  const exp = db.select({
    expired: sql<number>`coalesce(sum(case when ${L.expiry} < ${today} then 1 else 0 end), 0)`,
    soon: sql<number>`coalesce(sum(case when ${L.expiry} >= ${today} and ${L.expiry} <= ${addDays(today, EXPIRY_WARN_DAYS)} then 1 else 0 end), 0)`,
  }).from(L).where(and(gt(L.qty, 0), sql`${L.expiry} is not null`)).get();
  const counts = Object.fromEntries(
    (Object.keys(INVENTORY_TABS) as InventoryTab[]).map((t) => [t, db.select({ n: sql<number>`count(*)` }).from(productOptions)
      .innerJoin(products, eq(products.slug, productOptions.productSlug)).where(tabFilter(t)).get()?.n ?? 0]),
  ) as Record<InventoryTab, number>;
  return { value: r?.value ?? 0, skus: r?.skus ?? 0, low: r?.low ?? 0, out: r?.out ?? 0, expired: exp?.expired ?? 0, soon: exp?.soon ?? 0, counts };
}

/** Các lô còn hàng của một quy cách, theo cửa hàng rồi hạn dùng. */
export const lotsOf = (slug: string, idx: number) =>
  db.select().from(L).where(and(eq(L.productSlug, slug), eq(L.optionIdx, idx), gt(L.qty, 0))).orderBy(asc(L.storeId), asc(L.expiry), asc(L.id)).all();

export function recentMoves(slug: string, idx: number, limit = 10) {
  return db.select({ m: stockMoves, store: stores.code, lotCode: L.lotCode, expiry: L.expiry }).from(stockMoves)
    .leftJoin(stores, eq(stores.id, stockMoves.storeId)).leftJoin(L, eq(L.id, stockMoves.lotId))
    .where(and(eq(stockMoves.productSlug, slug), eq(stockMoves.optionIdx, idx)))
    .orderBy(desc(stockMoves.id)).limit(limit).all();
}
