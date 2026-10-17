import 'server-only';
import { and, eq, gt, gte, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { bundlePrice, MAX_BUNDLE_PARTS, MAX_PART_QTY, partKey as key, type BundleChoice, type BundlePart } from '@/lib/bundle';
import { todayVN } from '@/lib/stock';
import { db, schema } from './db';
import type { Tx } from './inventory';
import { unitCost } from './margin-guard';

// Sản phẩm bộ (lib/bundle.ts): đọc thành phần, tồn bán được, giá bộ. Trừ kho theo bộ ở server/inventory.ts (`takeStock`).

const { products: P, productOptions: O, stockLots: L } = schema;

export const BundlePartsSchema = z.array(z.object({
  slug: z.string().min(1).max(120),
  idx: z.number().int().min(0).max(100_000),
  qty: z.number().int().min(1, 'Số lượng mỗi món tối thiểu 1').max(MAX_PART_QTY, `Mỗi món tối đa ${MAX_PART_QTY}`),
})).max(MAX_BUNDLE_PARTS, `Mỗi bộ tối đa ${MAX_BUNDLE_PARTS} món`);

/**
 * Số lượng bán được của các quy cách thành phần = tổng lô còn hàng chưa hết hạn (đúng luật xuất kho khi đặt hàng).
 * `storeId`: chỉ tính lô của cửa hàng đó (bán tại quầy).
 */
export async function partStock(slugs: string[], storeId?: number, conn: Tx | typeof db = db) {
  if (!slugs.length) return new Map<string, number>();
  const rows = await conn.select({ slug: L.productSlug, idx: L.optionIdx, n: sql<number>`sum(${L.qty})`.mapWith(Number) }).from(L)
    .where(and(inArray(L.productSlug, slugs), gt(L.qty, 0), or(isNull(L.expiry), gte(L.expiry, todayVN())), storeId ? eq(L.storeId, storeId) : undefined))
    .groupBy(L.productSlug, L.optionIdx);
  return new Map(rows.map((r) => [key(r.slug, r.idx), r.n]));
}

/** Số bộ bán được = món ít nhất chia số lượng mỗi bộ. */
export const bundleAvailable = (parts: BundlePart[], stock: Map<string, number>) =>
  parts.length ? Math.min(...parts.map((p) => Math.floor((stock.get(key(p.slug, p.idx)) ?? 0) / p.qty))) : 0;

/** Thông tin quy cách thành phần (tên, nhãn, giá lẻ, giá vốn) — chỉ server / admin dùng. */
export async function partInfo(slugs: string[], conn: Tx | typeof db = db) {
  if (!slugs.length) return new Map<string, PartInfo>();
  const rows = await conn.select({
    slug: O.productSlug, idx: O.idx, label: O.label, price: O.price, garden: O.garden, cost: O.cost, deleted: O.deleted, parts: O.parts,
    name: P.name, active: P.active, ship: P.ship,
  }).from(O).innerJoin(P, eq(P.slug, O.productSlug)).where(inArray(O.productSlug, slugs));
  return new Map(rows.map((r) => [key(r.slug, r.idx), r]));
}
export type PartInfo = {
  slug: string; idx: number; label: string; price: number; garden: number | null; cost: number | null; deleted: boolean; parts: BundlePart[] | null;
  name: string; active: boolean; ship: 'plant' | 'supply';
};
export const partOf = (info: Map<string, PartInfo>, p: BundlePart) => info.get(key(p.slug, p.idx));

/**
 * Giá của một bộ tính từ các món: giá lẻ = tổng giá lẻ − BUNDLE_PCT%, giá gạch ngang = tổng giá lẻ, giá vườn / giá gốc = tổng các món
 * (giá vườn chỉ có khi món nào cũng có). Dùng khi lưu sản phẩm và khi giá một món đổi.
 */
export function bundlePricing(parts: BundlePart[], info: Map<string, PartInfo>) {
  let retail = 0, cost = 0, garden: number | null = 0;
  for (const p of parts) {
    const o = partOf(info, p);
    if (!o) continue;
    retail += o.price * p.qty;
    cost += unitCost(o) * p.qty;
    garden = garden !== null && o.garden ? garden + o.garden * p.qty : null;
  }
  const price = bundlePrice(retail);
  return { price, oldPrice: retail > price ? retail : null, cost, garden: garden || null, combo2: null };
}

/** Kiểm tra thành phần của một bộ khi lưu: món có thật, đang bán có giá, không phải bộ khác, không phải chính sản phẩm đang sửa. */
export function partsError(parts: BundlePart[], info: Map<string, PartInfo>, selfSlug: string | undefined, label: string): string | null {
  if (!parts.length) return `Bộ “${label}”: chọn ít nhất 1 món`;
  if (parts.reduce((s, p) => s + p.qty, 0) < 2) return `Bộ “${label}”: cần ít nhất 2 món (hoặc 1 món số lượng 2)`;
  if (new Set(parts.map((p) => key(p.slug, p.idx))).size !== parts.length) return `Bộ “${label}”: có món bị chọn trùng — gộp lại và tăng số lượng`;
  for (const p of parts) {
    if (p.slug === selfSlug) return `Bộ “${label}”: không chọn quy cách của chính sản phẩm này làm thành phần`;
    const o = partOf(info, p);
    if (!o || o.deleted) return `Bộ “${label}”: có món không còn (đã xóa) — chọn lại`;
    if (o.parts) return `Bộ “${label}”: “${o.name}” là một bộ khác — chỉ chọn món lẻ`;
    if (o.price <= 0) return `Bộ “${label}”: “${o.name} · ${o.label}” chưa có giá lẻ — nhập giá cho món đó trước`;
  }
  return null;
}

/** Các bộ đang dùng quy cách này làm thành phần (chặn xóa quy cách / xóa sản phẩm / biến nó thành bộ). */
export async function bundlesUsing(slug: string, idxs?: number[], conn: Tx | typeof db = db) {
  const rows = await conn.select({ slug: O.productSlug, idx: O.idx, label: O.label, parts: O.parts, name: P.name })
    .from(O).innerJoin(P, eq(P.slug, O.productSlug)).where(and(isNotNull(O.parts), eq(O.deleted, false)));
  return rows.filter((r) => r.slug !== slug && r.parts!.some((p) => p.slug === slug && (!idxs || idxs.includes(p.idx))));
}

/** Tính lại giá mọi bộ đang dùng món của các sản phẩm này (giá lẻ / giá vốn của món vừa đổi). */
export async function refreshBundles(tx: Tx, slugs: string[]) {
  const rows = await tx.select({ slug: O.productSlug, idx: O.idx, parts: O.parts }).from(O).where(and(isNotNull(O.parts), eq(O.deleted, false)));
  const hit = rows.filter((r) => r.parts!.some((p) => slugs.includes(p.slug)));
  if (!hit.length) return;
  const info = await partInfo([...new Set(hit.flatMap((r) => r.parts!.map((p) => p.slug)))], tx);
  for (const r of hit) {
    await tx.update(O).set(bundlePricing(r.parts!, info)).where(and(eq(O.productSlug, r.slug), eq(O.idx, r.idx)));
  }
}

/** Món chọn được làm thành phần bộ (form sản phẩm admin): mọi quy cách lẻ có giá, kèm giá vốn để xem trước lãi. */
export async function bundleChoices(): Promise<BundleChoice[]> {
  const rows = await db.select({
    slug: O.productSlug, idx: O.idx, label: O.label, price: O.price, garden: O.garden, cost: O.cost,
    name: P.name, category: P.category, active: P.active,
  }).from(O).innerJoin(P, eq(P.slug, O.productSlug))
    .where(and(eq(O.deleted, false), isNull(O.parts), gt(O.price, 0)))
    .orderBy(P.category, P.name, O.idx);
  return rows.map((r) => ({ slug: r.slug, idx: r.idx, name: r.name, label: r.label, price: r.price, cost: unitCost(r), category: r.category, active: r.active }));
}
