import 'server-only';
import { randomUUID } from 'node:crypto';
import { desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { db, schema, type DB } from './db';
import { applyStock, type Tx } from './inventory';

const { products, productOptions, stores, suppliers, purchaseReceipts: R, purchaseReceiptLines: RL } = schema;

/** Phiếu nhập hàng: mỗi lần tải file Excel hoặc nhập tay ở trang Kho là một phiếu (PN-00001…), ghi nhà cung cấp, số chứng từ, giá nhập. */

export const receiptCode = (id: number) => `PN-${String(id).padStart(5, '0')}`;

export const MAX_SUPPLIER = 80;
export const MAX_DOC_NO = 60;
export const MAX_RECEIPT_NOTE = 200;

/** Gọn khoảng trắng; rỗng thì null. */
export const cleanText = (s: string | null | undefined, max: number) => s?.replace(/\s+/g, ' ').trim().slice(0, max) || null;

export type ReceiptLineIn = {
  slug: string;
  idx: number;
  storeId: number;
  qty: number;
  /** Giá nhập 1 đơn vị (đồng). */
  unitCost: number | null;
  lotCode: string | null;
  expiry: string | null;
  note: string | null;
  /** Dùng trong thông báo lỗi, ví dụ "Dòng 5". */
  ref?: string;
};
export type ReceiptMeta = {
  supplier: string | null;
  docNo: string | null;
  note: string | null;
  source: (typeof schema.RECEIPT_SOURCES)[number];
  linesHash?: string | null;
  fileName?: string | null;
};

async function supplierId(tx: Tx | DB, name: string) {
  await tx.insert(suppliers).values({ name }).onConflictDoNothing();
  const [s] = await tx.select({ id: suppliers.id }).from(suppliers).where(sql`lower(${suppliers.name}) = lower(${name})`);
  return s.id;
}

/**
 * Ghi một phiếu nhập và cộng tồn cho từng dòng (qua applyStock — cùng lô thì cộng dồn, khác lô thì tạo lô mới). Gọi trong transaction:
 * lỗi ở bất kỳ dòng nào thì cả phiếu không được ghi.
 */
export async function receiveGoods(tx: Tx, lines: ReceiptLineIn[], meta: ReceiptMeta, actor: string) {
  if (!lines.length) throw new Error('Phiếu nhập không có dòng nào');
  const slugs = [...new Set(lines.map((l) => l.slug))];
  const info = await tx.select({ slug: products.slug, sku: products.sku, name: products.name, unit: products.unit, idx: productOptions.idx, label: productOptions.label })
    .from(productOptions).innerJoin(products, eq(products.slug, productOptions.productSlug)).where(inArray(products.slug, slugs));
  const infoOf = new Map(info.map((i) => [`${i.slug}#${i.idx}`, i]));
  for (const l of lines) if (!infoOf.has(`${l.slug}#${l.idx}`)) throw new Error(`${l.ref ?? 'Dòng'}: không tìm thấy quy cách`);

  const sid = meta.supplier ? await supplierId(tx, meta.supplier) : null;
  // Mã phiếu theo số thứ tự (id): chèn bằng mã tạm rồi đặt mã thật — hai phiếu cùng lúc không thể trùng mã.
  const [rc] = await tx.insert(R).values({
    code: `tmp-${randomUUID()}`, supplierId: sid, docNo: meta.docNo, note: meta.note, source: meta.source,
    linesHash: meta.linesHash ?? null, fileName: meta.fileName ?? null, actor,
  }).returning({ id: R.id });
  const code = receiptCode(rc.id);
  await tx.update(R).set({ code }).where(eq(R.id, rc.id));

  await tx.insert(RL).values(lines.map((l) => {
    const i = infoOf.get(`${l.slug}#${l.idx}`)!;
    return {
      receiptId: rc.id, productSlug: l.slug, optionIdx: l.idx, sku: i.sku, name: i.name, label: i.label, unit: i.unit,
      storeId: l.storeId, qty: l.qty, unitCost: l.unitCost, lotCode: l.lotCode, expiry: l.expiry, note: l.note,
    };
  }));

  // Khóa quy cách theo thứ tự cố định để hai lượt nhập cùng lúc không bế tắc
  const sorted = lines.toSorted((a, b) => a.slug.localeCompare(b.slug) || a.idx - b.idx);
  for (const l of sorted) {
    const note = meta.source === 'excel' ? (l.note ? `Excel · ${l.note}` : 'Nhập từ Excel') : (l.note ?? undefined);
    const after = await applyStock(tx, l.slug, l.idx, l.qty, 'import', actor, note, { storeId: l.storeId, lotCode: l.lotCode, expiry: l.expiry, receiptId: rc.id });
    if (after === null) throw new Error(`${l.ref ?? 'Dòng'}: không tìm thấy quy cách`);
  }
  return { id: rc.id, code, lines: lines.length, units: lines.reduce((s, l) => s + l.qty, 0) };
}

/** Phiếu gần nhất đã nhập đúng bộ dòng này (null = chưa có). */
export async function findReceiptByHash(hash: string, conn: Tx | DB = db) {
  const [r] = await conn.select({ code: R.code, createdAt: R.createdAt, actor: R.actor }).from(R).where(eq(R.linesHash, hash)).orderBy(desc(R.id)).limit(1);
  return r ?? null;
}

/** Khóa theo nội dung trong transaction: hai lượt nhập cùng bộ dòng cùng lúc thì lượt sau phải chờ rồi mới kiểm tra trùng. */
export const lockHash = (tx: Tx, hash: string) => tx.execute(sql`select pg_advisory_xact_lock(hashtext(${hash}))`);

export const listSupplierNames = async () => (await db.select({ name: suppliers.name }).from(suppliers).orderBy(suppliers.name).limit(500)).map((s) => s.name);

/** Giá nhập gần nhất của từng quy cách (khóa `slug#idx`) — hiện trong file mẫu để tham khảo. */
export async function lastCosts() {
  const rows = await db.selectDistinctOn([RL.productSlug, RL.optionIdx], { slug: RL.productSlug, idx: RL.optionIdx, cost: RL.unitCost })
    .from(RL).where(isNotNull(RL.unitCost)).orderBy(RL.productSlug, RL.optionIdx, desc(RL.id));
  return new Map(rows.map((r) => [`${r.slug}#${r.idx}`, r.cost!]));
}

/** Danh sách phiếu mới nhất kèm tổng số dòng, số lượng, tiền hàng (chỉ cộng các dòng đã ghi giá nhập). */
export async function listReceipts(limit = 20) {
  return db.select({
    id: R.id, code: R.code, createdAt: R.createdAt, actor: R.actor, source: R.source, docNo: R.docNo, supplier: suppliers.name,
    lines: sql`count(${RL.id})`.mapWith(Number),
    units: sql`coalesce(sum(${RL.qty}), 0)`.mapWith(Number),
    costed: sql`count(${RL.unitCost})`.mapWith(Number),
    total: sql`coalesce(sum(${RL.qty}::bigint * ${RL.unitCost}), 0)`.mapWith(Number),
  }).from(R).leftJoin(suppliers, eq(suppliers.id, R.supplierId)).leftJoin(RL, eq(RL.receiptId, R.id))
    .groupBy(R.id, suppliers.name).orderBy(desc(R.id)).limit(limit);
}

export async function getReceipt(code: string) {
  const [r] = await db.select({
    id: R.id, code: R.code, createdAt: R.createdAt, actor: R.actor, source: R.source, docNo: R.docNo, note: R.note, fileName: R.fileName, supplier: suppliers.name,
  }).from(R).leftJoin(suppliers, eq(suppliers.id, R.supplierId)).where(eq(R.code, code));
  if (!r) return null;
  const lines = await db.select({
    id: RL.id, slug: RL.productSlug, sku: RL.sku, optionIdx: RL.optionIdx, name: RL.name, label: RL.label, unit: RL.unit, store: stores.code,
    qty: RL.qty, unitCost: RL.unitCost, lotCode: RL.lotCode, expiry: RL.expiry, note: RL.note,
  }).from(RL).innerJoin(stores, eq(stores.id, RL.storeId)).where(eq(RL.receiptId, r.id)).orderBy(RL.id);
  return { ...r, lines };
}
