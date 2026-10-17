import 'server-only';
import { and, asc, count, desc, eq, gt, ilike, inArray, isNull, lt, or, sql, type AnyColumn } from 'drizzle-orm';
import { costFromGarden } from '@/lib/pricing';
import { addDays, EXPIRY_WARN_DAYS, todayVN } from '@/lib/stock';
import { refreshBundles } from './bundles';
import { mainImageOf } from './catalog';
import { db, schema, type DB } from './db';
import type { STOCK_REASONS } from './db/schema';

const { products, productOptions, stockMoves, stockLots: L, stores, purchaseReceipts, suppliers } = schema;

export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];
export type StockReason = (typeof STOCK_REASONS)[number];
export type Store = typeof stores.$inferSelect;

/** Mức tồn tối thiểu cho mỗi quy cách (tổng các cửa hàng) — dưới mức này hiện cảnh báo. */
export const MIN_STOCK = 10;

export const listStores = (): Promise<Store[]> => db.select().from(stores).where(eq(stores.active, true)).orderBy(desc(stores.isDefault), asc(stores.id));

async function defaultStoreId(tx: Tx | DB) {
  const [s] = await tx.select({ id: stores.id }).from(stores).orderBy(desc(stores.isDefault), asc(stores.id)).limit(1);
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
  /** Phiếu nhập tạo ra lần thay đổi này (ghi vào lịch sử kho). */
  receiptId?: number;
  /** Nhập lô mới: nhà vườn, giá vườn / đơn vị, hạng chất lượng, hàng ký gửi. Chỉ cộng dồn vào lô có đúng các thông tin này. */
  supplierId?: number | null;
  unitCost?: number | null;
  grade?: string | null;
  consign?: boolean;
};

/** So khớp cột có thể null: null chỉ khớp null. */
const same = (col: AnyColumn, v: string | number | null | undefined) => (v == null ? sql`${col} is null` : eq(col, v));

/**
 * Thay đổi tồn một quy cách và ghi lịch sử. Mọi thay đổi tồn kho đều phải đi qua hàm này.
 * - delta > 0: cộng vào một lô (tìm lô trùng mã + hạn trong cửa hàng, không có thì tạo).
 * - delta < 0: trừ dần các lô còn hạn, lô hết hạn sớm nhất trước (FEFO). Lô đã hết hạn không bán.
 * Trả về tổng tồn mới, hoặc null nếu không đủ hàng.
 * Khóa dòng quy cách (FOR UPDATE) nên hai đơn cùng lúc không bán quá tồn — gọi trong transaction.
 */
export async function applyStock(tx: Tx | DB, slug: string, idx: number, delta: number, reason: StockReason, actor: string, note?: string, opts: StockOpts = {}): Promise<number | null> {
  const where = and(eq(productOptions.productSlug, slug), eq(productOptions.idx, idx));
  const [cur] = await tx.select({ stock: productOptions.stock }).from(productOptions).where(where).for('update');
  if (!cur || delta === 0) return cur ? cur.stock : null;

  const parts: { lotId: number; storeId: number; delta: number }[] = [];
  if (delta > 0) {
    let lot = opts.lotId ? (await tx.select().from(L).where(and(eq(L.id, opts.lotId), eq(L.productSlug, slug), eq(L.optionIdx, idx))))[0] : undefined;
    if (!lot) {
      const storeId = opts.storeId ?? await defaultStoreId(tx);
      const lotCode = opts.lotCode?.trim() || null;
      const expiry = opts.expiry || null;
      const attrs = { supplierId: opts.supplierId ?? null, unitCost: opts.unitCost ?? null, grade: opts.grade ?? null, consign: opts.consign ?? false };
      lot = (await tx.select().from(L).where(and(
        eq(L.storeId, storeId), eq(L.productSlug, slug), eq(L.optionIdx, idx),
        same(L.lotCode, lotCode), same(L.expiry, expiry),
        same(L.supplierId, attrs.supplierId), same(L.unitCost, attrs.unitCost), same(L.grade, attrs.grade), eq(L.consign, attrs.consign),
      )).limit(1))[0] ?? (await tx.insert(L).values({ storeId, productSlug: slug, optionIdx: idx, lotCode, expiry, qty: 0, ...attrs }).returning())[0];
    }
    parts.push({ lotId: lot.id, storeId: lot.storeId, delta });
  } else {
    const def = await defaultStoreId(tx);
    const lots = await tx.select().from(L).where(and(
      eq(L.productSlug, slug), eq(L.optionIdx, idx), gt(L.qty, 0),
      opts.storeId ? eq(L.storeId, opts.storeId) : undefined,
      opts.lotId ? eq(L.id, opts.lotId) : or(sql`${L.expiry} is null`, sql`${L.expiry} >= ${todayVN()}`),
    )).orderBy(
      // Kho mặc định trước; hàng shop đã mua trước hàng ký gửi (ký gửi chỉ trả tiền nhà vườn khi bán được); rồi hạn dùng sớm nhất.
      sql`case when ${L.storeId} = ${def} then 0 else 1 end`, sql`case when ${L.consign} then 1 else 0 end`,
      sql`case when ${L.expiry} is null then 1 else 0 end`, asc(L.expiry), asc(L.id),
    ).for('update');
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
    await tx.update(L).set({ qty: sql`${L.qty} + ${p.delta}` }).where(eq(L.id, p.lotId));
    after += p.delta;
    await tx.insert(stockMoves).values({ productSlug: slug, optionIdx: idx, storeId: p.storeId, lotId: p.lotId, delta: p.delta, after, reason, note: note || null, actor, receiptId: opts.receiptId ?? null });
  }
  await tx.update(productOptions).set({ stock: after }).where(where);
  return after;
}

/**
 * Xuất bán `qty` đơn vị một quy cách (đơn web, bán tại quầy, đơn bảo hành). Quy cách là bộ (lib/bundle.ts) thì trừ kho từng món
 * (`qty` × số lượng mỗi món) — lịch sử kho ghi theo món, cùng ghi chú mã đơn nên hủy đơn (`restoreOrderStock`) trả đúng từng món.
 * Trả về false khi không đủ hàng (gọi trong transaction: ném lỗi để hủy cả đơn).
 */
export async function takeStock(tx: Tx, slug: string, idx: number, qty: number, reason: StockReason, actor: string, note: string, opts: StockOpts = {}): Promise<boolean> {
  const [o] = await tx.select({ parts: productOptions.parts }).from(productOptions).where(and(eq(productOptions.productSlug, slug), eq(productOptions.idx, idx)));
  if (!o?.parts) return await applyStock(tx, slug, idx, -qty, reason, actor, note, opts) !== null;
  for (const p of o.parts) {
    if (await applyStock(tx, p.slug, p.idx, -qty * p.qty, reason, actor, note, opts) === null) return false;
  }
  return true;
}

/**
 * Giá vườn của quy cách theo các lô còn hàng: lấy giá cao nhất (an toàn cho giá sàn), giá gốc = giá vườn + 10% tiền xe.
 * Gọi sau khi nhập hàng có giá. Không còn lô nào có giá thì giữ nguyên số cũ.
 */
export async function syncGardenFromLots(tx: Tx, slug: string, idx: number) {
  const [r] = await tx.select({ g: sql<number | null>`max(${L.unitCost})` }).from(L)
    .where(and(eq(L.productSlug, slug), eq(L.optionIdx, idx), gt(L.qty, 0), sql`${L.unitCost} is not null`));
  if (!r?.g) return;
  await tx.update(productOptions).set({ garden: r.g, cost: costFromGarden(r.g) })
    .where(and(eq(productOptions.productSlug, slug), eq(productOptions.idx, idx)));
  await refreshBundles(tx, [slug]);
}

/** Hủy đơn: trả đúng số lượng về đúng lô/cửa hàng đã xuất (theo lịch sử xuất của mã đơn). */
export async function restoreOrderStock(tx: Tx, code: string, actor: string) {
  const out = await tx.select().from(stockMoves)
    .where(and(eq(stockMoves.note, code), inArray(stockMoves.reason, ['order', 'warranty']), lt(stockMoves.delta, 0))).orderBy(asc(stockMoves.id));
  for (const m of out) {
    await applyStock(tx, m.productSlug, m.optionIdx, -m.delta, 'cancel', actor, code, m.lotId ? { lotId: m.lotId } : { storeId: m.storeId ?? undefined });
  }
}

/** Kiểm kê một lô: đặt lại số đếm thực tế. Trả về tổng tồn mới. */
export async function countLot(tx: Tx, lotId: number, qty: number, actor: string, note?: string) {
  const [lot] = await tx.select().from(L).where(eq(L.id, lotId)).for('update');
  if (!lot) return null;
  const [cur] = await tx.select({ stock: productOptions.stock }).from(productOptions)
    .where(and(eq(productOptions.productSlug, lot.productSlug), eq(productOptions.idx, lot.optionIdx)));
  if (lot.qty === qty) return cur?.stock ?? null;
  return applyStock(tx, lot.productSlug, lot.optionIdx, qty - lot.qty, 'adjust', actor, note || 'Kiểm kê', { lotId, storeId: lot.storeId });
}

/**
 * Xóa một lô khỏi kho (hết hạn, hư, nhập nhầm): trừ hết số còn lại và ghi một dòng lịch sử 'discard'.
 * Dòng lô giữ lại với qty = 0 (không hiện ở màn Kho) để lịch sử cũ còn tra được số lô + hạn dùng.
 * Trả về thông tin lô, hoặc null nếu không có lô này.
 */
export async function deleteLot(tx: Tx, lotId: number, actor: string, note?: string) {
  const [lot] = await tx.select().from(L).where(eq(L.id, lotId)).for('update');
  if (!lot) return null;
  if (lot.qty > 0) await applyStock(tx, lot.productSlug, lot.optionIdx, -lot.qty, 'discard', actor, note || 'Xóa lô', { lotId, storeId: lot.storeId });
  return lot;
}

/** Chuyển hàng giữa hai cửa hàng, giữ nguyên mã lô và hạn dùng. Trả về false nếu kho đi không đủ. */
export async function transferStock(tx: Tx, slug: string, idx: number, from: number, to: number, qty: number, actor: string, note?: string) {
  const names = await tx.select({ id: stores.id, code: stores.code }).from(stores).where(inArray(stores.id, [from, to]));
  const [fromName, toName] = [from, to].map((id) => names.find((s) => s.id === id)?.code);
  if (!fromName || !toName || from === to) return false;
  const before = (await tx.select({ id: stockMoves.id }).from(stockMoves).orderBy(desc(stockMoves.id)).limit(1))[0]?.id ?? 0;
  const text = `${fromName} → ${toName}${note ? ` · ${note}` : ''}`;
  if (await applyStock(tx, slug, idx, -qty, 'transfer', actor, text, { storeId: from }) === null) return false;
  // Chỉ lấy các dòng xuất vừa ghi trong transaction này (cùng quy cách, lý do chuyển kho).
  const taken = await tx.select().from(stockMoves).where(and(gt(stockMoves.id, before), eq(stockMoves.productSlug, slug), eq(stockMoves.optionIdx, idx), eq(stockMoves.reason, 'transfer'), lt(stockMoves.delta, 0), eq(stockMoves.note, text)));
  for (const m of taken) {
    const lot = m.lotId ? (await tx.select().from(L).where(eq(L.id, m.lotId)))[0] : undefined;
    await applyStock(tx, slug, idx, -m.delta, 'transfer', actor, text, {
      storeId: to, lotCode: lot?.lotCode, expiry: lot?.expiry, supplierId: lot?.supplierId, unitCost: lot?.unitCost, grade: lot?.grade, consign: lot?.consign,
    });
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

/** Quy cách đã xóa (product_options.deleted) không hiện ở Kho, Nhập hàng. */
// Bộ (lib/bundle.ts) không có tồn riêng — không hiện ở Kho; tồn nằm ở từng món.
const live = and(eq(productOptions.deleted, false), isNull(productOptions.parts));

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
export async function listInventory({ tab = 'tat-ca', q }: { tab?: InventoryTab; q?: string } = {}) {
  const term = q?.trim() ? `%${q.trim().replace(/[%_]/g, '')}%` : undefined;
  const rows = await db.select({
    slug: products.slug, sku: products.sku, name: products.name, icon: products.icon, image: mainImageOf(products.slug), unit: products.unit, origin: products.origin,
    ship: products.ship, pesticide: products.pesticide, category: products.category, active: products.active,
    idx: productOptions.idx, label: productOptions.label, price: productOptions.price, stock: productOptions.stock,
  })
    .from(productOptions).innerJoin(products, eq(products.slug, productOptions.productSlug))
    .where(and(live, tabFilter(tab), term ? or(ilike(products.name, term), ilike(products.sku, term)) : undefined))
    .orderBy(asc(productOptions.stock), asc(products.name));
  if (!rows.length) return [];
  const lots = (await db.select({ l: L, supplier: suppliers.name }).from(L).leftJoin(suppliers, eq(suppliers.id, L.supplierId))
    .where(and(gt(L.qty, 0), inArray(L.productSlug, [...new Set(rows.map((r) => r.slug))])))
    .orderBy(sql`case when ${L.expiry} is null then 1 else 0 end`, asc(L.expiry), asc(L.id))).map((r) => ({ ...r.l, supplier: r.supplier }));
  return rows.map((r) => {
    const mine = lots.filter((l) => l.productSlug === r.slug && l.optionIdx === r.idx);
    const byStore: Record<number, number> = {};
    for (const l of mine) byStore[l.storeId] = (byStore[l.storeId] ?? 0) + l.qty;
    return { ...r, lots: mine, byStore, nearestExpiry: mine.find((l) => l.expiry)?.expiry ?? null };
  });
}
export type InventoryRow = Awaited<ReturnType<typeof listInventory>>[number];

export async function inventorySummary() {
  const [r] = await db.select({
    value: sql`coalesce(sum(${productOptions.stock}::bigint * ${productOptions.price}), 0)`.mapWith(Number),
    skus: sql`count(*)`.mapWith(Number),
    low: sql`coalesce(sum(case when ${productOptions.stock} < ${MIN_STOCK} and ${productOptions.stock} > 0 then 1 else 0 end), 0)`.mapWith(Number),
    out: sql`coalesce(sum(case when ${productOptions.stock} = 0 then 1 else 0 end), 0)`.mapWith(Number),
  }).from(productOptions).where(live);
  const today = todayVN();
  const [exp] = await db.select({
    expired: sql`coalesce(sum(case when ${L.expiry} < ${today} then 1 else 0 end), 0)`.mapWith(Number),
    soon: sql`coalesce(sum(case when ${L.expiry} >= ${today} and ${L.expiry} <= ${addDays(today, EXPIRY_WARN_DAYS)} then 1 else 0 end), 0)`.mapWith(Number),
  }).from(L).where(and(gt(L.qty, 0), sql`${L.expiry} is not null`));
  const counts = Object.fromEntries(await Promise.all(
    (Object.keys(INVENTORY_TABS) as InventoryTab[]).map(async (t) => [t, (await db.select({ n: count() }).from(productOptions)
      .innerJoin(products, eq(products.slug, productOptions.productSlug)).where(and(live, tabFilter(t))))[0]?.n ?? 0]),
  )) as Record<InventoryTab, number>;
  return { value: r?.value ?? 0, skus: r?.skus ?? 0, low: r?.low ?? 0, out: r?.out ?? 0, expired: exp?.expired ?? 0, soon: exp?.soon ?? 0, counts };
}

/** Các lô còn hàng của một quy cách, theo cửa hàng rồi hạn dùng. */
export const lotsOf = (slug: string, idx: number) =>
  db.select().from(L).where(and(eq(L.productSlug, slug), eq(L.optionIdx, idx), gt(L.qty, 0))).orderBy(asc(L.storeId), asc(L.expiry), asc(L.id));

export async function recentMoves(slug: string, idx: number, limit = 10) {
  return db.select({ m: stockMoves, store: stores.code, lotCode: L.lotCode, expiry: L.expiry, receipt: purchaseReceipts.code }).from(stockMoves)
    .leftJoin(stores, eq(stores.id, stockMoves.storeId)).leftJoin(L, eq(L.id, stockMoves.lotId)).leftJoin(purchaseReceipts, eq(purchaseReceipts.id, stockMoves.receiptId))
    .where(and(eq(stockMoves.productSlug, slug), eq(stockMoves.optionIdx, idx)))
    .orderBy(desc(stockMoves.id)).limit(limit);
}
