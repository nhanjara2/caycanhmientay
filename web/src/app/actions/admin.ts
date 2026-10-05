'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireStaff, staffName } from '@/server/auth';
import { applyStock, countLot, recentMoves, transferStock } from '@/server/inventory';
import { todayVN, tracksLots } from '@/lib/stock';
import { addProductImage, deleteProduct, deleteProductImage, listProductImages, moveProductImage, ProductInputSchema, saveProduct, setProductActive } from '@/server/products-admin';
import { applyStockImport, MAX_IMPORT_BYTES, parseStockImport } from '@/server/stock-import';
import { saveImage } from '@/server/uploads';
import { db, schema } from '@/server/db';

// Mọi action trong file này: kiểm tra quyền nhân viên trước, rồi mới kiểm tra đầu vào.

const actorName = staffName;

function refreshCatalog(slug?: string) {
  revalidatePath('/admin', 'layout');
  revalidatePath('/', 'layout');
  if (slug) revalidatePath(`/san-pham/${slug}`);
}

export async function saveProductAction(input: unknown) {
  const staff = await requireStaff('admin');
  const p = ProductInputSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await saveProduct(p.data, actorName(staff));
  if (r.ok) refreshCatalog(r.slug);
  return r;
}

export async function setProductActiveAction(slug: unknown, active: unknown) {
  await requireStaff('admin');
  const p = z.object({ slug: z.string().max(120), active: z.boolean() }).safeParse({ slug, active });
  if (!p.success) return { ok: false as const };
  const ok = await setProductActive(p.data.slug, p.data.active);
  if (ok) refreshCatalog(p.data.slug);
  return { ok };
}

export async function deleteProductAction(slug: unknown) {
  await requireStaff('admin');
  const p = z.string().min(1).max(120).safeParse(slug);
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await deleteProduct(p.data);
  if (r.ok) refreshCatalog();
  return r;
}

const slugSchema = z.string().min(1).max(120);

/** Tải một ảnh sản phẩm (đã nén ở trình duyệt). FormData: slug, photo. */
export async function uploadProductImageAction(fd: FormData) {
  await requireStaff('admin');
  const slug = slugSchema.safeParse(fd.get('slug'));
  const f = fd.get('photo');
  if (!slug.success || !(f instanceof File)) return { ok: false as const, error: 'Thiếu ảnh' };
  const img = await saveImage(f);
  if ('error' in img) return { ok: false as const, error: img.error };
  const r = await addProductImage(slug.data, img);
  if (!r.ok) return r;
  refreshCatalog(slug.data);
  return { ok: true as const, images: await listProductImages(slug.data) };
}

const ImageOp = z.object({ slug: slugSchema, id: z.number().int().positive(), op: z.enum(['delete', 'first', 'left', 'right']) });

export async function editProductImageAction(input: unknown) {
  await requireStaff('admin');
  const p = ImageOp.safeParse(input);
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const { slug, id, op } = p.data;
  const ok = op === 'delete' ? await deleteProductImage(slug, id) : await moveProductImage(slug, id, op);
  if (!ok) return { ok: false as const, error: 'Không tìm thấy ảnh' };
  refreshCatalog(slug);
  return { ok: true as const, images: await listProductImages(slug) };
}

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hạn dùng chưa đúng');
const note = z.string().trim().max(200).optional();
const AdjustSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('import'), slug: z.string().max(120), idx: z.number().int().min(0), storeId: z.number().int().positive(),
    qty: z.number().int().min(1, 'Số lượng nhập phải lớn hơn 0').max(100_000),
    lotCode: z.string().trim().max(40).optional(), expiry: ymd.optional(), note,
  }),
  z.object({ mode: z.literal('count'), lotId: z.number().int().positive(), qty: z.number().int().min(0).max(100_000), note }),
  z.object({
    mode: z.literal('transfer'), slug: z.string().max(120), idx: z.number().int().min(0),
    from: z.number().int().positive(), to: z.number().int().positive(), qty: z.number().int().min(1, 'Số lượng chuyển phải lớn hơn 0').max(100_000), note,
  }),
]);

/** Nhập hàng vào một cửa hàng (theo lô nếu là hàng có hạn dùng), kiểm kê một lô, hoặc chuyển kho. */
export async function adjustStockAction(input: unknown) {
  const staff = await requireStaff();
  const p = AdjustSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const v = p.data;
  const actor = actorName(staff);
  let slug: string | undefined;

  if (v.mode === 'import') {
    const [prod] = await db.select().from(schema.products).where(eq(schema.products.slug, v.slug));
    if (!prod) return { ok: false as const, error: 'Không tìm thấy sản phẩm' };
    if (tracksLots(prod) && (!v.lotCode || !v.expiry)) return { ok: false as const, error: 'Hàng có hạn dùng: nhập Số lô và Hạn dùng (in trên bao bì)' };
    if (v.expiry && v.expiry < todayVN()) return { ok: false as const, error: 'Lô này đã hết hạn, không nhập kho' };
    const after = await db.transaction((tx) => applyStock(tx, v.slug, v.idx, v.qty, 'import', actor, v.note, { storeId: v.storeId, lotCode: v.lotCode, expiry: v.expiry }));
    if (after === null) return { ok: false as const, error: 'Không tìm thấy quy cách' };
    slug = v.slug;
  } else if (v.mode === 'count') {
    const [lot] = await db.select().from(schema.stockLots).where(eq(schema.stockLots.id, v.lotId));
    if (!lot) return { ok: false as const, error: 'Không tìm thấy lô' };
    await db.transaction((tx) => countLot(tx, v.lotId, v.qty, actor, v.note));
    slug = lot.productSlug;
  } else {
    if (v.from === v.to) return { ok: false as const, error: 'Chọn hai cửa hàng khác nhau' };
    const ok = await db.transaction((tx) => transferStock(tx, v.slug, v.idx, v.from, v.to, v.qty, actor, v.note));
    if (!ok) return { ok: false as const, error: 'Cửa hàng chuyển đi không đủ hàng còn hạn' };
    slug = v.slug;
  }
  refreshCatalog(slug);
  return { ok: true as const };
}

export async function stockHistoryAction(slug: unknown, idx: unknown) {
  await requireStaff();
  const p = z.object({ slug: z.string().max(120), idx: z.number().int().min(0) }).safeParse({ slug, idx });
  if (!p.success) return [];
  return (await recentMoves(p.data.slug, p.data.idx)).map(({ m, store, lotCode, expiry }) => ({
    id: m.id, reason: m.reason, delta: m.delta, after: m.after, actor: m.actor, note: m.note,
    store, lotCode, expiry, createdAt: m.createdAt.getTime(),
  }));
}

/**
 * Nhập hàng bằng Excel. FormData: file (.xlsx), mode = 'preview' (chỉ kiểm tra) | 'commit' (kiểm tra lại rồi ghi kho).
 * Có dòng lỗi thì không ghi dòng nào; client luôn gửi lại đúng file vừa xem trước nên server tự kiểm tra lại từ đầu.
 */
export async function importStockAction(fd: FormData) {
  const staff = await requireStaff();
  const f = fd.get('file');
  if (!(f instanceof File) || !f.size) return { ok: false as const, error: 'Chưa chọn file' };
  if (!/\.xlsx$/i.test(f.name)) return { ok: false as const, error: 'Chỉ nhận file Excel .xlsx (tải file mẫu ở bước 1)' };
  if (f.size > MAX_IMPORT_BYTES) return { ok: false as const, error: 'File quá lớn (tối đa 2MB)' };

  const parsed = await parseStockImport(Buffer.from(await f.arrayBuffer()));
  if (!parsed.ok) return { ok: false as const, error: parsed.error };
  const { rows, skipped } = parsed;
  const view = rows.map(({ slug: _slug, idx: _idx, storeId: _storeId, ...r }) => r);
  const preview = { ok: true as const, committed: false as const, rows: view, skipped };

  if (fd.get('mode') !== 'commit') return preview;
  if (!rows.length) return { ok: false as const, error: 'Không có dòng nào có Số lượng nhập. Điền số lượng rồi tải lại.' };
  if (rows.some((r) => r.errors.length)) return preview;

  try {
    const done = await applyStockImport(rows, actorName(staff));
    refreshCatalog();
    return { ok: true as const, committed: true as const, rows: view, skipped, ...done };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Có lỗi, chưa nhập dòng nào. Vui lòng thử lại.' };
  }
}
