import 'server-only';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import * as z from 'zod';
import { CASH_KINDS, MAX_CASH_NOTE } from '@/lib/cash-labels';
import { EXPENSE_MAX, isRealYmd } from '@/lib/expense-labels';
import { todayVN } from '@/lib/stock';
import { db, schema } from './db';
import { periodFinance, ymdStartMs, type Finance } from './expenses';
import { cleanText } from './receipts';

const { cashEntries: K } = schema;

// Sổ Thu chi: gom mọi dòng tiền vô / ra của shop vào một chỗ.
//   Tiền vô  = tiền bán hàng ĐÃ THU (orders.paid_at) + thu khác + vốn bỏ vào (hai khoản sau ghi tay ở bảng cash_entries)
//   Tiền ra  = tiền mua hàng + chi phí khác (server/expenses.ts) + hoàn tiền bảo hành đã chuyển + rút vốn (ghi tay)
//   Còn lại  = tiền vô − tiền ra, cộng dồn từ trước tới cuối kỳ (web chỉ ghi sổ, không nối ngân hàng nên phải đối chiếu tay)
//   Lãi      = doanh thu − tiền vốn hàng đã bán (order_items.cost × số lượng) − chi phí khác − hoàn tiền

const rows = async <T extends Record<string, unknown>>(q: ReturnType<typeof sql>) => (await db.execute<T>(q)).rows;
/** Mốc đầu của sổ (trước mọi dữ liệu). */
const EPOCH_YMD = '2000-01-01';

// ---- Khoản ghi tay ---------------------------------------------------------------------------

export const CashEntrySchema = z.object({
  /** Có = sửa khoản này. */
  id: z.number().int().positive().optional(),
  kind: z.enum(CASH_KINDS, 'Chọn loại khoản tiền'),
  entryOn: z.string().refine(isRealYmd, { message: 'Chọn ngày hợp lệ' }).refine((d) => d >= EPOCH_YMD, { message: 'Ngày quá xa' }),
  amount: z.number('Nhập số tiền').int('Số tiền phải là số nguyên').min(1, 'Nhập số tiền lớn hơn 0').max(EXPENSE_MAX, 'Số tiền tối đa 1 tỷ đồng cho mỗi khoản'),
  note: z.string().trim().max(MAX_CASH_NOTE, `Nội dung tối đa ${MAX_CASH_NOTE} ký tự`).optional(),
});
export type CashEntryInput = z.infer<typeof CashEntrySchema>;
export type CashResult = { ok: true; id: number } | { ok: false; error: string };

export async function saveCashEntry(v: CashEntryInput, actor: string): Promise<CashResult> {
  if (v.entryOn > todayVN()) return { ok: false, error: 'Ngày không được ở tương lai' };
  const values = { kind: v.kind, entryOn: v.entryOn, amount: v.amount, note: cleanText(v.note, MAX_CASH_NOTE) };
  if (v.id) {
    const r = await db.update(K).set(values).where(eq(K.id, v.id)).returning({ id: K.id });
    return r.length ? { ok: true, id: v.id } : { ok: false, error: 'Không tìm thấy khoản này (có thể đã bị xóa)' };
  }
  const [row] = await db.insert(K).values({ ...values, actor }).returning({ id: K.id });
  return { ok: true, id: row.id };
}

export async function deleteCashEntry(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await db.delete(K).where(eq(K.id, id)).returning({ id: K.id });
  return r.length ? { ok: true } : { ok: false, error: 'Không tìm thấy khoản này (có thể đã bị xóa)' };
}

export const CASH_LIST_LIMIT = 200;

/** Các khoản ghi tay trong [from, to) (YYYY-MM-DD), mới nhất trước. */
export const listCashEntries = (from: string, to: string) =>
  db.select().from(K).where(and(gte(K.entryOn, from), lt(K.entryOn, to))).orderBy(desc(K.entryOn), desc(K.id)).limit(CASH_LIST_LIMIT);
export type CashEntryRow = Awaited<ReturnType<typeof listCashEntries>>[number];

// ---- Tổng hợp --------------------------------------------------------------------------------

export type CashMoves = {
  in: { sales: number; salesCount: number; other: number; capital: number; total: number };
  out: { goods: number; expenses: number; refunds: number; capital: number; total: number };
  net: number;
};

/** Hoàn tiền bảo hành đã chuyển cho khách trong [fromMs, toMs). */
async function refundsPaid(fromMs: number, toMs: number) {
  const [r] = await rows<{ total: number }>(sql`
    select coalesce(sum(refund_amount), 0)::float8 as total from warranty_requests
    where refund_status = 'done' and refunded_at >= ${new Date(fromMs)} and refunded_at < ${new Date(toMs)}`);
  return r?.total ?? 0;
}

/** Dòng tiền trong [from, to) (YYYY-MM-DD, giờ Việt Nam). `fin` = periodFinance của cùng khoảng. */
async function cashMoves(from: string, to: string, fin: Finance): Promise<CashMoves> {
  const [F, T] = [ymdStartMs(from), ymdStartMs(to)];
  const [[sales], manual, refunds] = await Promise.all([
    // Đơn hủy sau khi đã thu tiền không tính (tiền đó phải trả lại khách).
    rows<{ total: number; n: number }>(sql`
      select coalesce(sum(total), 0)::float8 as total, count(*)::int as n from orders
      where kind = 'sale' and status <> 'cancelled' and paid and total > 0 and paid_at >= ${new Date(F)} and paid_at < ${new Date(T)}`),
    db.select({ kind: K.kind, total: sql`coalesce(sum(${K.amount}::bigint), 0)`.mapWith(Number) }).from(K)
      .where(and(gte(K.entryOn, from), lt(K.entryOn, to))).groupBy(K.kind),
    refundsPaid(F, T),
  ]);
  const of = (kind: (typeof CASH_KINDS)[number]) => manual.find((m) => m.kind === kind)?.total ?? 0;
  const inn = { sales: sales?.total ?? 0, salesCount: sales?.n ?? 0, other: of('income'), capital: of('capital_in'), total: 0 };
  const out = { goods: fin.purchases, expenses: fin.expenses, refunds, capital: of('capital_out'), total: 0 };
  inn.total = inn.sales + inn.other + inn.capital;
  out.total = out.goods + out.expenses + out.refunds + out.capital;
  return { in: inn, out, net: inn.total - out.total };
}

export type SalesProfit = {
  /** Doanh thu: đơn bán chưa hủy đặt trong kỳ (kể cả chưa thu tiền) — cùng cách tính với trang Báo cáo. */
  revenue: number;
  orders: number;
  /** Tiền vốn của hàng trong các đơn đó + hàng đổi / tặng bảo hành (đơn 0đ) trong kỳ. */
  cogs: number;
  /** Số dòng hàng chưa có tiền vốn (quy cách chưa khai giá gốc) — không cộng vào `cogs`. */
  uncosted: number;
  /** Hoàn tiền bảo hành đã chuyển trong kỳ. */
  refunds: number;
};

/** Doanh thu và tiền vốn hàng đã bán trong [fromMs, toMs). Lãi = revenue − cogs − chi phí khác − refunds. */
export async function salesProfit(fromMs: number, toMs: number): Promise<SalesProfit> {
  const [F, T] = [new Date(fromMs), new Date(toMs)];
  const [[rev], [cost], refunds] = await Promise.all([
    rows<{ revenue: number; n: number }>(sql`
      select coalesce(sum(total), 0)::float8 as revenue, count(*)::int as n from orders
      where kind = 'sale' and status <> 'cancelled' and created_at >= ${F} and created_at < ${T}`),
    rows<{ cogs: number; uncosted: number }>(sql`
      select coalesce(sum(oi.cost::bigint * oi.qty), 0)::float8 as cogs, (count(*) filter (where oi.cost is null))::int as uncosted
      from order_items oi join orders o on o.id = oi.order_id
      where o.status <> 'cancelled' and o.created_at >= ${F} and o.created_at < ${T}`),
    refundsPaid(fromMs, toMs),
  ]);
  return { revenue: rev?.revenue ?? 0, orders: rev?.n ?? 0, cogs: cost?.cogs ?? 0, uncosted: cost?.uncosted ?? 0, refunds };
}

export type CashFlow = CashMoves & {
  fin: Finance;
  /** Tiền còn lại theo sổ ở đầu kỳ / cuối kỳ (cộng dồn mọi khoản từ trước). */
  opening: number;
  closing: number;
  /** Đơn bán chưa hủy, chưa thu tiền (tính tới lúc này, không theo kỳ). */
  receivable: { total: number; n: number };
  sales: SalesProfit;
  /** Lãi của kỳ = doanh thu − tiền vốn − chi phí khác − hoàn tiền. */
  profit: number;
};

/** Toàn bộ số liệu trang Thu chi cho kỳ [from, to) (YYYY-MM-DD). */
export async function cashFlow(from: string, to: string): Promise<CashFlow> {
  const [F, T] = [ymdStartMs(from), ymdStartMs(to)];
  const before = async () => (from > EPOCH_YMD ? (await cashMoves(EPOCH_YMD, from, await periodFinance(ymdStartMs(EPOCH_YMD), F))).net : 0);
  const [fin, opening, sales, [recv]] = await Promise.all([
    periodFinance(F, T),
    before(),
    salesProfit(F, T),
    rows<{ total: number; n: number }>(sql`
      select coalesce(sum(total), 0)::float8 as total, count(*)::int as n from orders
      where kind = 'sale' and status <> 'cancelled' and not paid and total > 0`),
  ]);
  const cur = await cashMoves(from, to, fin);
  return {
    ...cur, fin, opening, closing: opening + cur.net,
    receivable: { total: recv?.total ?? 0, n: recv?.n ?? 0 },
    sales, profit: sales.revenue - sales.cogs - fin.expenses - sales.refunds,
  };
}
