import 'server-only';
import { and, asc, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import * as z from 'zod';
import { GOODS_EXPENSE_CATEGORY } from '@/lib/expense-labels';
import { todayVN } from '@/lib/stock';
import { db, schema } from './db';
import { cleanText } from './receipts';

// Đối soát nhà vườn (hàng ký gửi): cây vẫn ở vườn nhà cung cấp, shop đăng bán (ảnh nhà vườn gửi), bán được thì trả tiền nhà vườn
// theo giá vườn của lô. Phải trả = số cây ký gửi đã xuất (bán web, bán tại quầy, đổi cây bảo hành) trừ số trả lại khi hủy đơn, × giá vườn.
// Đã trả = khoản chi nhóm "Mua cây – hàng hóa" ghi từ trang này (`expenses.consign`). Lô ký gửi xóa / kiểm kê bớt (cây chết ở vườn họ) không tính.

const { stockLots: L, stockMoves: M, suppliers: S, expenses: E, products: P, productOptions: O } = schema;

/** Lịch sử kho tính vào tiền phải trả: xuất bán / bảo hành (delta âm) và trả lại khi hủy đơn (delta dương). */
const SOLD_REASONS = sql`(${M.reason} in ('order', 'warranty', 'cancel'))`;

/** Tháng YYYY-MM → [đầu tháng, đầu tháng sau] theo giờ Việt Nam (ms). */
export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  const off = 7 * 3_600_000;
  return { from: Date.UTC(y, m - 1, 1) - off, to: Date.UTC(y, m, 1) - off };
}
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const thisMonth = () => todayVN().slice(0, 7);

export type ConsignRow = {
  id: number; name: string;
  /** Cây ký gửi còn ở vườn họ (đang đăng bán) và giá trị theo giá vườn. */
  stockQty: number; stockValue: number;
  /** Bán trong tháng đang xem. */
  soldQty: number; soldValue: number;
  /** Lũy kế từ trước tới nay. */
  owed: number; paid: number;
  /** Số cây đã bán mà lô chưa ghi giá vườn (chưa tính được tiền). */
  uncosted: number;
};

/** Mỗi nhà vườn có hàng ký gửi (hoặc đã trả tiền ký gửi) một dòng; còn nợ nhiều trước. */
export async function consignSummary(month: string): Promise<ConsignRow[]> {
  const { from, to } = monthRange(month);
  const inMonth = and(gte(M.createdAt, new Date(from)), lt(M.createdAt, new Date(to)));
  const [stock, sold, paid] = await Promise.all([
    db.select({
      id: L.supplierId,
      qty: sql<number>`coalesce(sum(${L.qty}), 0)`.mapWith(Number),
      value: sql<number>`coalesce(sum(${L.qty}::bigint * ${L.unitCost}), 0)`.mapWith(Number),
    }).from(L).where(and(eq(L.consign, true), sql`${L.qty} > 0`)).groupBy(L.supplierId),
    db.select({
      id: L.supplierId,
      owed: sql<number>`coalesce(sum(-${M.delta}::bigint * ${L.unitCost}), 0)`.mapWith(Number),
      soldQty: sql<number>`coalesce(sum(-${M.delta}) filter (where ${inMonth}), 0)`.mapWith(Number),
      soldValue: sql<number>`coalesce(sum(-${M.delta}::bigint * ${L.unitCost}) filter (where ${inMonth}), 0)`.mapWith(Number),
      uncosted: sql<number>`coalesce(sum(-${M.delta}) filter (where ${L.unitCost} is null), 0)`.mapWith(Number),
    }).from(M).innerJoin(L, eq(L.id, M.lotId)).where(and(eq(L.consign, true), SOLD_REASONS)).groupBy(L.supplierId),
    db.select({ id: E.supplierId, total: sql<number>`coalesce(sum(${E.amount}::bigint), 0)`.mapWith(Number) })
      .from(E).where(eq(E.consign, true)).groupBy(E.supplierId),
  ]);
  const ids = [...new Set([...stock, ...sold, ...paid].map((r) => r.id).filter((x): x is number => x != null))];
  if (!ids.length) return [];
  const names = new Map((await db.select({ id: S.id, name: S.name }).from(S).where(inArray(S.id, ids))).map((s) => [s.id, s.name]));
  return ids.map((id) => {
    const st = stock.find((r) => r.id === id), so = sold.find((r) => r.id === id), pa = paid.find((r) => r.id === id);
    return {
      id, name: names.get(id) ?? `Nhà vườn #${id}`,
      stockQty: st?.qty ?? 0, stockValue: st?.value ?? 0,
      soldQty: so?.soldQty ?? 0, soldValue: so?.soldValue ?? 0,
      owed: so?.owed ?? 0, paid: pa?.total ?? 0, uncosted: so?.uncosted ?? 0,
    };
  }).sort((a, b) => (b.owed - b.paid) - (a.owed - a.paid) || a.name.localeCompare(b.name, 'vi'));
}

/** Chi tiết một nhà vườn: cây bán trong tháng (từng lần xuất), cây ký gửi còn lại, các lần đã trả tiền. */
export async function consignDetail(supplierId: number, month: string) {
  const { from, to } = monthRange(month);
  const [[supplier], sold, stock, payments] = await Promise.all([
    db.select({ id: S.id, name: S.name }).from(S).where(eq(S.id, supplierId)),
    db.select({
      at: M.createdAt, code: M.note, reason: M.reason, qty: sql<number>`-${M.delta}`.mapWith(Number),
      name: P.name, sku: P.sku, idx: M.optionIdx, label: O.label, grade: L.grade, unitCost: L.unitCost,
    }).from(M).innerJoin(L, eq(L.id, M.lotId)).leftJoin(P, eq(P.slug, M.productSlug))
      .leftJoin(O, and(eq(O.productSlug, M.productSlug), eq(O.idx, M.optionIdx)))
      .where(and(eq(L.consign, true), eq(L.supplierId, supplierId), SOLD_REASONS, gte(M.createdAt, new Date(from)), lt(M.createdAt, new Date(to))))
      .orderBy(asc(M.createdAt), asc(M.id)),
    db.select({ id: L.id, qty: L.qty, unitCost: L.unitCost, grade: L.grade, name: P.name, label: O.label, sku: P.sku, idx: L.optionIdx })
      .from(L).leftJoin(P, eq(P.slug, L.productSlug)).leftJoin(O, and(eq(O.productSlug, L.productSlug), eq(O.idx, L.optionIdx)))
      .where(and(eq(L.consign, true), eq(L.supplierId, supplierId), sql`${L.qty} > 0`)).orderBy(asc(P.name), asc(L.optionIdx)),
    db.select({ id: E.id, spentOn: E.spentOn, amount: E.amount, note: E.note, actor: E.actor })
      .from(E).where(and(eq(E.consign, true), eq(E.supplierId, supplierId))).orderBy(desc(E.spentOn), desc(E.id)).limit(50),
  ]);
  return supplier ? { supplier, sold, stock, payments } : null;
}
export type ConsignDetail = NonNullable<Awaited<ReturnType<typeof consignDetail>>>;

export const ConsignPaySchema = z.object({
  supplierId: z.number().int().positive(),
  amount: z.number().int().min(1000, 'Số tiền tối thiểu 1.000đ').max(1_000_000_000, 'Số tiền quá lớn'),
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chưa đúng'),
  note: z.string().trim().max(200).optional(),
});

/** Ghi một lần trả tiền cây ký gửi cho nhà vườn: thành khoản chi nhóm mua hàng (sổ Chi phí, Thu chi, lãi lỗ đều thấy). */
export async function payConsign(v: z.infer<typeof ConsignPaySchema>, actor: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (v.spentOn > todayVN()) return { ok: false, error: 'Ngày trả không được ở tương lai' };
  const [s] = await db.select({ id: S.id }).from(S).where(eq(S.id, v.supplierId));
  if (!s) return { ok: false, error: 'Không tìm thấy nhà vườn' };
  await db.insert(E).values({
    spentOn: v.spentOn, categorySlug: GOODS_EXPENSE_CATEGORY, amount: v.amount, storeId: null, supplierId: v.supplierId,
    note: cleanText(v.note, 200) ?? 'Trả tiền cây ký gửi', consign: true, actor,
  });
  return { ok: true };
}
