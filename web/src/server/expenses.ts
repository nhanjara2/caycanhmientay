import 'server-only';
import { and, asc, count, desc, eq, gte, ilike, lt, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { SLUG_RE, toSlug } from '@/lib/catalog';
import {
  addMonths, EXPENSE_MAX, FALLBACK_EXPENSE_CATEGORY, GOODS_EXPENSE_CATEGORY, isRealYmd, lastDueMonth, MAX_EXPENSE_NOTE, MAX_EXPENSE_SUPPLIER, MONTH_RE, RECURRING_BACKFILL_MONTHS,
} from '@/lib/expense-labels';
import { todayVN } from '@/lib/stock';
import { db, schema } from './db';
import { cleanText, supplierId as findOrCreateSupplier } from './receipts';
import type { SavedImage } from './uploads';

const { expenses: E, expenseCategories: C, recurringExpenses: R, expensePhotos: P, stores, suppliers, purchaseReceipts: PR, purchaseReceiptLines: PL } = schema;

// Sổ chi phí của cửa hàng: mọi khoản tiền đã chi. Tiền mua cây / hàng về bán ghi ở nhóm GOODS_EXPENSE_CATEGORY — báo cáo cộng nhóm này
// vào "Tiền mua hàng" cùng với phiếu nhập có giá nhập (server/receipts.ts) — phiếu hàng ký gửi không tính (chưa trả tiền; tiền trả nhà vườn
// ghi ở trang Đối soát nhà vườn thành khoản chi nhóm mua hàng, `expenses.consign = true`). Một lần mua chỉ ghi MỘT nơi (sổ này hoặc giá nhập trên phiếu), ghi cả hai là tính hai lần.

const VN_OFFSET = 7 * 3_600_000;
const ymdOf = (ms: number) => new Date(ms + VN_OFFSET).toISOString().slice(0, 10);
/** 0h ngày `ymd` theo giờ Việt Nam (ms UTC). */
export const ymdStartMs = (ymd: string) => Date.parse(`${ymd}T00:00:00Z`) - VN_OFFSET;

export type ExpenseResult = { ok: true; id: number } | { ok: false; error: string };
export type CatResult = { ok: true; slug: string } | { ok: false; error: string };

// ---- Nhóm chi --------------------------------------------------------------------------------

export const listExpenseCategories = () => db.select().from(C).orderBy(asc(C.sort), asc(C.createdAt));

/** Số khoản chi + khoản định kỳ đang dùng từng nhóm (để biết nhóm nào xóa được). */
export async function expenseCategoryUsage(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const r of await db.select({ s: E.categorySlug, n: count() }).from(E).groupBy(E.categorySlug)) out[r.s] = (out[r.s] ?? 0) + r.n;
  for (const r of await db.select({ s: R.categorySlug, n: count() }).from(R).groupBy(R.categorySlug)) out[r.s] = (out[r.s] ?? 0) + r.n;
  return out;
}

export const ExpenseCategorySchema = z.object({
  /** Có = sửa nhóm này (đường dẫn không đổi); không có = thêm nhóm mới. */
  slug: z.string().max(60).optional(),
  name: z.string().trim().min(2, 'Tên nhóm cần ít nhất 2 ký tự').max(40, 'Tên nhóm tối đa 40 ký tự'),
  active: z.boolean(),
});
export type ExpenseCategoryInput = z.infer<typeof ExpenseCategorySchema>;

export async function saveExpenseCategory(v: ExpenseCategoryInput): Promise<CatResult> {
  const dupe = (await db.select({ slug: C.slug }).from(C).where(sql`lower(${C.name}) = lower(${v.name})`)).find((r) => r.slug !== v.slug);
  if (dupe) return { ok: false, error: `Đã có nhóm chi tên “${v.name}”` };
  if (v.slug) {
    if (v.slug === FALLBACK_EXPENSE_CATEGORY && !v.active) return { ok: false, error: 'Nhóm “Khác” luôn hiện để xếp các khoản chưa phân loại' };
    const r = await db.update(C).set({ name: v.name, active: v.active }).where(eq(C.slug, v.slug)).returning({ slug: C.slug });
    return r.length ? { ok: true, slug: v.slug } : { ok: false, error: 'Không tìm thấy nhóm chi' };
  }
  const base = toSlug(v.name) || 'nhom-chi';
  let slug = base;
  for (let i = 2; (await db.select({ s: C.slug }).from(C).where(eq(C.slug, slug))).length; i++) slug = `${base}-${i}`;
  const [{ last }] = await db.select({ last: sql<number | null>`max(${C.sort})` }).from(C);
  await db.insert(C).values({ slug, name: v.name, active: v.active, sort: (last ?? -1) + 1 });
  return { ok: true, slug };
}

export async function deleteExpenseCategory(slug: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!SLUG_RE.test(slug)) return { ok: false, error: 'Yêu cầu không hợp lệ' };
  if (slug === FALLBACK_EXPENSE_CATEGORY) return { ok: false, error: 'Nhóm “Khác” là nhóm hệ thống, không xóa được' };
  if (slug === GOODS_EXPENSE_CATEGORY) return { ok: false, error: 'Nhóm mua hàng là nhóm hệ thống, không xóa được. Hãy chuyển sang “Ẩn”.' };
  const used = (await expenseCategoryUsage())[slug] ?? 0;
  if (used) return { ok: false, error: `Nhóm này đang có ${used} khoản chi / chi định kỳ nên không xóa được. Hãy chuyển sang “Ẩn”.` };
  const r = await db.delete(C).where(eq(C.slug, slug)).returning({ slug: C.slug });
  return r.length ? { ok: true } : { ok: false, error: 'Không tìm thấy nhóm chi' };
}

// ---- Khoản chi -------------------------------------------------------------------------------

const amount = z.number('Nhập số tiền').int('Số tiền phải là số nguyên').min(1, 'Nhập số tiền lớn hơn 0').max(EXPENSE_MAX, 'Số tiền tối đa 1 tỷ đồng cho mỗi khoản');
const note = z.string().trim().max(MAX_EXPENSE_NOTE, `Ghi chú tối đa ${MAX_EXPENSE_NOTE} ký tự`).optional();
const supplier = z.string().trim().max(MAX_EXPENSE_SUPPLIER, `Tên nhà cung cấp tối đa ${MAX_EXPENSE_SUPPLIER} ký tự`).optional();

export const ExpenseSchema = z.object({
  /** Có = sửa khoản chi này. */
  id: z.number().int().positive().optional(),
  spentOn: z.string().refine(isRealYmd, { message: 'Chọn ngày chi hợp lệ' }).refine((d) => d >= '2000-01-01', { message: 'Ngày chi quá xa' }),
  category: z.string().min(1, 'Chọn nhóm chi').max(60),
  amount,
  /** null = chi chung. */
  storeId: z.number().int().positive().nullable(),
  supplier,
  note,
});
export type ExpenseInput = z.infer<typeof ExpenseSchema>;

/** Nhóm chi + cửa hàng phải có thật; nhóm đang ẩn chỉ giữ được cho khoản đã thuộc nhóm đó. */
async function checkRefs(v: { category: string; storeId: number | null }, keepCategory?: string): Promise<string | null> {
  const [cat] = await db.select({ active: C.active }).from(C).where(eq(C.slug, v.category));
  if (!cat) return 'Nhóm chi không tồn tại';
  if (!cat.active && v.category !== keepCategory) return 'Nhóm chi này đang ẩn, hãy chọn nhóm khác';
  if (v.storeId) {
    const [s] = await db.select({ id: stores.id }).from(stores).where(eq(stores.id, v.storeId));
    if (!s) return 'Cửa hàng không tồn tại';
  }
  return null;
}

/** Lỗi vi phạm ràng buộc duy nhất của Postgres (drizzle bọc lỗi gốc trong `cause`). */
const isUniqueViolation = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (('code' in e && e.code === '23505') || ('cause' in e && isUniqueViolation(e.cause)));

export async function saveExpense(v: ExpenseInput, actor: string): Promise<ExpenseResult> {
  if (v.spentOn > todayVN()) return { ok: false, error: 'Ngày chi không được ở tương lai' };
  const existing = v.id ? (await db.select().from(E).where(eq(E.id, v.id)))[0] : undefined;
  if (v.id && !existing) return { ok: false, error: 'Không tìm thấy khoản chi (có thể đã bị xóa)' };
  const bad = await checkRefs(v, existing?.categorySlug);
  if (bad) return { ok: false, error: bad };
  const name = cleanText(v.supplier, MAX_EXPENSE_SUPPLIER);
  try {
    return await db.transaction(async (tx) => {
      const sid = name ? await findOrCreateSupplier(tx, name) : null;
      const values = { spentOn: v.spentOn, categorySlug: v.category, amount: v.amount, storeId: v.storeId, supplierId: sid, note: cleanText(v.note, MAX_EXPENSE_NOTE) };
      if (existing) {
        await tx.update(E).set(values).where(eq(E.id, existing.id));
        return { ok: true as const, id: existing.id };
      }
      const [row] = await tx.insert(E).values({ ...values, actor }).returning({ id: E.id });
      return { ok: true as const, id: row.id };
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, error: 'Khoản chi định kỳ này đã có một khoản khác trong đúng ngày đó' };
    throw e;
  }
}

export async function deleteExpense(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await db.delete(E).where(eq(E.id, id)).returning({ id: E.id });
  return r.length ? { ok: true } : { ok: false, error: 'Không tìm thấy khoản chi (có thể đã bị xóa)' };
}

export type ExpenseFilter = { from: string; to: string; category?: string; store?: 'chung' | number; q?: string };

/** Điều kiện lọc dùng chung cho danh sách + tổng (cần join nhóm chi và nhà cung cấp). */
function expenseWhere(f: ExpenseFilter) {
  const term = f.q?.trim() ? `%${f.q.trim().replace(/[%_]/g, '')}%` : undefined;
  return and(
    gte(E.spentOn, f.from), lt(E.spentOn, f.to),
    f.category ? eq(E.categorySlug, f.category) : undefined,
    f.store === 'chung' ? sql`${E.storeId} is null` : f.store ? eq(E.storeId, f.store) : undefined,
    term ? or(ilike(E.note, term), ilike(suppliers.name, term), ilike(C.name, term)) : undefined,
  );
}

export const EXPENSE_LIST_LIMIT = 200;

/** Các khoản chi theo bộ lọc, mới nhất trước (tối đa EXPENSE_LIST_LIMIT dòng) + tổng của TOÀN BỘ khoản khớp bộ lọc. */
export async function listExpenses(f: ExpenseFilter) {
  const where = expenseWhere(f);
  const [rows, [sum]] = await Promise.all([
    db.select({
      id: E.id, spentOn: E.spentOn, amount: E.amount, note: E.note, actor: E.actor, recurringId: E.recurringId,
      categorySlug: E.categorySlug, category: C.name, storeId: E.storeId, store: stores.name, supplier: suppliers.name, photo: P.file,
    }).from(E)
      .innerJoin(C, eq(C.slug, E.categorySlug)).leftJoin(stores, eq(stores.id, E.storeId)).leftJoin(suppliers, eq(suppliers.id, E.supplierId)).leftJoin(P, eq(P.expenseId, E.id))
      .where(where).orderBy(desc(E.spentOn), desc(E.id)).limit(EXPENSE_LIST_LIMIT),
    db.select({ n: count(), total: sql`coalesce(sum(${E.amount}::bigint), 0)`.mapWith(Number) }).from(E)
      .innerJoin(C, eq(C.slug, E.categorySlug)).leftJoin(suppliers, eq(suppliers.id, E.supplierId)).where(where),
  ]);
  return { rows, count: sum?.n ?? 0, total: sum?.total ?? 0, truncated: (sum?.n ?? 0) > rows.length };
}
export type ExpenseRow = Awaited<ReturnType<typeof listExpenses>>['rows'][number];

/** Tất cả khoản chi của khoảng ngày (cho file Excel), không giới hạn dòng. */
export async function expensesForExport(f: ExpenseFilter) {
  return db.select({
    spentOn: E.spentOn, category: C.name, note: E.note, store: stores.name, supplier: suppliers.name, amount: E.amount, actor: E.actor, recurring: sql<boolean>`${E.recurringId} is not null`,
  }).from(E)
    .innerJoin(C, eq(C.slug, E.categorySlug)).leftJoin(stores, eq(stores.id, E.storeId)).leftJoin(suppliers, eq(suppliers.id, E.supplierId))
    .where(expenseWhere(f)).orderBy(asc(E.spentOn), asc(E.id));
}

// ---- Tổng hợp theo kỳ (trang Chi phí + Báo cáo lãi lỗ) ---------------------------------------

export type Finance = {
  /** Chi phí khác: sổ chi phí, KHÔNG gồm nhóm mua hàng. */
  expenses: number;
  /** Số khoản của `expenses` (không đếm nhóm mua hàng). */
  expenseCount: number;
  /** Tiền mua hàng = nhóm mua hàng trong sổ chi phí (`goods`) + phiếu nhập (số lượng × giá nhập, chỉ các dòng đã ghi giá). */
  purchases: number;
  /** Phần của `purchases` ghi trong sổ chi phí (nhóm mua hàng). */
  goods: number;
  /** Số dòng phiếu nhập chưa ghi giá nhập (không cộng vào purchases). */
  uncosted: number;
  /** Mọi nhóm của sổ chi phí, kể cả nhóm mua hàng. */
  byCategory: { slug: string; name: string; total: number }[];
  /** Chi theo cửa hàng; id null = chi chung. `purchases` gồm cả nhóm mua hàng của sổ chi phí. */
  byStore: { id: number | null; name: string; expenses: number; purchases: number }[];
};

/** Tiền chi trong kỳ [fromMs, toMs) theo giờ Việt Nam. Chi phí lấy theo ngày chi, phiếu nhập theo ngày lập phiếu. */
export async function periodFinance(fromMs: number, toMs: number): Promise<Finance> {
  const [from, to] = [ymdOf(fromMs), ymdOf(toMs)];
  const inRange = and(gte(E.spentOn, from), lt(E.spentOn, to));
  const [byCategory, byStoreExp, byStorePur, [unc], allStores] = await Promise.all([
    db.select({ slug: C.slug, name: C.name, total: sql`sum(${E.amount}::bigint)`.mapWith(Number) }).from(E).innerJoin(C, eq(C.slug, E.categorySlug))
      .where(inRange).groupBy(C.slug, C.name, C.sort).orderBy(desc(sql`sum(${E.amount})`), asc(C.sort)),
    db.select({
      id: E.storeId, n: sql`count(*) filter (where ${E.categorySlug} <> ${GOODS_EXPENSE_CATEGORY})`.mapWith(Number),
      total: sql`coalesce(sum(${E.amount}::bigint) filter (where ${E.categorySlug} <> ${GOODS_EXPENSE_CATEGORY}), 0)`.mapWith(Number),
      goods: sql`coalesce(sum(${E.amount}::bigint) filter (where ${E.categorySlug} = ${GOODS_EXPENSE_CATEGORY}), 0)`.mapWith(Number),
    }).from(E).where(inRange).groupBy(E.storeId),
    db.select({ id: PL.storeId, total: sql`coalesce(sum(${PL.qty}::bigint * ${PL.unitCost}), 0)`.mapWith(Number) }).from(PL).innerJoin(PR, eq(PR.id, PL.receiptId))
      .where(and(gte(PR.createdAt, new Date(fromMs)), lt(PR.createdAt, new Date(toMs)), eq(PR.consign, false))).groupBy(PL.storeId),
    db.select({ n: sql`count(*) filter (where ${PL.unitCost} is null)`.mapWith(Number) }).from(PL).innerJoin(PR, eq(PR.id, PL.receiptId))
      .where(and(gte(PR.createdAt, new Date(fromMs)), lt(PR.createdAt, new Date(toMs)), eq(PR.consign, false))),
    db.select({ id: stores.id, name: stores.name }).from(stores).orderBy(asc(stores.id)),
  ]);
  const exp = new Map(byStoreExp.map((r) => [r.id, r.total]));
  const pur = new Map(byStorePur.map((r) => [r.id as number | null, r.total]));
  for (const r of byStoreExp) if (r.goods) pur.set(r.id, (pur.get(r.id) ?? 0) + r.goods);
  const goods = byStoreExp.reduce((a, r) => a + r.goods, 0);
  const ids: (number | null)[] = [...new Set<number | null>([...exp.keys(), ...pur.keys()])];
  const byStore = ids.map((id) => ({ id, name: id === null ? 'Chi chung' : (allStores.find((s) => s.id === id)?.name ?? `Cửa hàng ${id}`), expenses: exp.get(id) ?? 0, purchases: pur.get(id) ?? 0 }))
    .sort((a, b) => b.expenses + b.purchases - (a.expenses + a.purchases));
  return {
    expenses: byStoreExp.reduce((a, r) => a + r.total, 0),
    expenseCount: byStoreExp.reduce((a, r) => a + r.n, 0),
    purchases: [...pur.values()].reduce((a, n) => a + n, 0),
    goods,
    uncosted: unc?.n ?? 0,
    byCategory, byStore,
  };
}

// ---- Chi phí định kỳ -------------------------------------------------------------------------

export const RecurringSchema = z.object({
  id: z.number().int().positive().optional(),
  category: z.string().min(1, 'Chọn nhóm chi').max(60),
  amount,
  storeId: z.number().int().positive().nullable(),
  supplier,
  note,
  day: z.number('Nhập ngày trong tháng').int().min(1, 'Ngày chi từ 1 đến 28').max(28, 'Ngày chi từ 1 đến 28 (tháng nào cũng có)'),
  startMonth: z.string().regex(MONTH_RE, 'Chọn tháng bắt đầu'),
  endMonth: z.string().regex(MONTH_RE, 'Tháng kết thúc không hợp lệ').nullable(),
  active: z.boolean(),
});
export type RecurringInput = z.infer<typeof RecurringSchema>;

export async function listRecurring() {
  return db.select({
    id: R.id, categorySlug: R.categorySlug, category: C.name, amount: R.amount, storeId: R.storeId, store: stores.name, supplier: suppliers.name, note: R.note,
    day: R.dayOfMonth, startMonth: R.startMonth, endMonth: R.endMonth, generatedThrough: R.generatedThrough, active: R.active,
  }).from(R).innerJoin(C, eq(C.slug, R.categorySlug)).leftJoin(stores, eq(stores.id, R.storeId)).leftJoin(suppliers, eq(suppliers.id, R.supplierId))
    .orderBy(desc(R.active), asc(R.dayOfMonth), asc(R.id));
}
export type RecurringRow = Awaited<ReturnType<typeof listRecurring>>[number];

export async function saveRecurring(v: RecurringInput): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const today = todayVN();
  const existing = v.id ? (await db.select().from(R).where(eq(R.id, v.id)))[0] : undefined;
  if (v.id && !existing) return { ok: false, error: 'Không tìm thấy khoản định kỳ (có thể đã bị xóa)' };
  const startMonth = existing?.startMonth ?? v.startMonth;
  if (!existing && startMonth < addMonths(today.slice(0, 7), -RECURRING_BACKFILL_MONTHS)) return { ok: false, error: `Tháng bắt đầu chỉ được lùi tối đa ${RECURRING_BACKFILL_MONTHS} tháng` };
  if (v.endMonth && v.endMonth < startMonth) return { ok: false, error: 'Tháng kết thúc phải sau tháng bắt đầu' };
  const bad = await checkRefs(v, existing?.categorySlug);
  if (bad) return { ok: false, error: bad };
  const name = cleanText(v.supplier, MAX_EXPENSE_SUPPLIER);
  return db.transaction(async (tx) => {
    const sid = name ? await findOrCreateSupplier(tx, name) : null;
    const values = { categorySlug: v.category, amount: v.amount, storeId: v.storeId, supplierId: sid, note: cleanText(v.note, MAX_EXPENSE_NOTE), dayOfMonth: v.day, endMonth: v.endMonth, active: v.active };
    if (existing) {
      // Bật lại sau khi tạm dừng: không ghi bù các tháng đã dừng
      const resume = !existing.active && v.active;
      await tx.update(R).set({ ...values, ...(resume ? { generatedThrough: lastDueMonth(v.day, today) } : {}) }).where(eq(R.id, existing.id));
      return { ok: true as const, id: existing.id };
    }
    const [row] = await tx.insert(R).values({ ...values, startMonth }).returning({ id: R.id });
    return { ok: true as const, id: row.id };
  });
}

/** Xóa khoản định kỳ: các khoản chi đã sinh vẫn giữ trong sổ (chỉ mất liên kết). */
export async function deleteRecurring(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await db.delete(R).where(eq(R.id, id)).returning({ id: R.id });
  return r.length ? { ok: true } : { ok: false, error: 'Không tìm thấy khoản định kỳ (có thể đã bị xóa)' };
}

/**
 * Ghi các khoản chi định kỳ đã đến hạn vào sổ (mỗi tháng một khoản, đúng ngày đã đặt). Chạy khi mở trang Chi phí / Báo cáo — không cần cron.
 * An toàn khi gọi nhiều lần / cùng lúc: dòng định kỳ bị khóa trong transaction + chỉ mục duy nhất (recurring_id, spent_on).
 * Khoản chi đã sinh mà bị xóa thì không sinh lại (chỉ ghi tiếp các tháng sau `generatedThrough`).
 */
export async function materializeRecurring() {
  const today = todayVN();
  const due = (r: { dayOfMonth: number; endMonth: string | null }) => {
    const through = lastDueMonth(r.dayOfMonth, today);
    return r.endMonth && r.endMonth < through ? r.endMonth : through;
  };
  const pending = (await db.select().from(R).where(eq(R.active, true))).filter((r) => (r.generatedThrough ? addMonths(r.generatedThrough, 1) : r.startMonth) <= due(r));
  for (const p of pending) {
    await db.transaction(async (tx) => {
      const [r] = await tx.select().from(R).where(eq(R.id, p.id)).for('update');
      if (!r?.active) return;
      const end = due(r);
      const rows: (typeof E.$inferInsert)[] = [];
      for (let m = r.generatedThrough ? addMonths(r.generatedThrough, 1) : r.startMonth; m <= end; m = addMonths(m, 1)) {
        rows.push({
          spentOn: `${m}-${String(r.dayOfMonth).padStart(2, '0')}`, categorySlug: r.categorySlug, amount: r.amount, storeId: r.storeId,
          supplierId: r.supplierId, note: r.note, recurringId: r.id, actor: 'Chi định kỳ',
        });
      }
      if (!rows.length) return;
      await tx.insert(E).values(rows).onConflictDoNothing();
      await tx.update(R).set({ generatedThrough: end }).where(eq(R.id, r.id));
    });
  }
}

// ---- Ảnh hóa đơn -----------------------------------------------------------------------------

/** Gắn ảnh hóa đơn cho khoản chi (thay ảnh cũ nếu có). */
export async function setExpensePhoto(expenseId: number, img: SavedImage): Promise<{ ok: true } | { ok: false; error: string }> {
  return db.transaction(async (tx) => {
    const [e] = await tx.select({ id: E.id }).from(E).where(eq(E.id, expenseId)).for('update');
    if (!e) return { ok: false as const, error: 'Không tìm thấy khoản chi' };
    await tx.delete(P).where(eq(P.expenseId, expenseId));
    await tx.insert(P).values({ expenseId, file: img.file, mime: img.mime, data: img.data });
    return { ok: true as const };
  });
}

export async function removeExpensePhoto(expenseId: number) {
  await db.delete(P).where(eq(P.expenseId, expenseId));
}

export const readExpensePhoto = async (file: string) =>
  (await db.select({ data: P.data, mime: P.mime }).from(P).where(eq(P.file, file)))[0] ?? null;
