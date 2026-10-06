import 'server-only';
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import * as z from 'zod';
import { db, schema } from './db';

const { stores, stockLots, orders, purchaseReceiptLines, stockMoves, expenses, recurringExpenses } = schema;

/** Tất cả cửa hàng (kể cả đã ngừng) kèm tổng tồn đang giữ. */
export async function listStoresAdmin() {
  return db.select({
    id: stores.id, code: stores.code, name: stores.name, address: stores.address, lat: stores.lat, lng: stores.lng,
    isDefault: stores.isDefault, active: stores.active,
    stock: sql<number>`coalesce((select sum(l.qty) from stock_lots l where l.store_id = stores.id), 0)`.mapWith(Number),
  }).from(stores).orderBy(desc(stores.isDefault), desc(stores.active), asc(stores.id));
}
export type StoreRow = Awaited<ReturnType<typeof listStoresAdmin>>[number];

export const StoreSchema = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,10}$/, 'Mã cửa hàng 2–10 ký tự chữ / số (VD: Q7)'),
  name: z.string().trim().min(3, 'Nhập tên cửa hàng').max(80),
  address: z.string().trim().min(5, 'Nhập địa chỉ').max(200),
  // Tọa độ trong lãnh thổ Việt Nam (đã gồm hải đảo gần bờ) — chặn nhầm lẫn lat/lng.
  lat: z.number().min(8, 'Vĩ độ (lat) không nằm trong Việt Nam').max(23.5, 'Vĩ độ (lat) không nằm trong Việt Nam'),
  lng: z.number().min(102, 'Kinh độ (lng) không nằm trong Việt Nam').max(110, 'Kinh độ (lng) không nằm trong Việt Nam'),
  active: z.boolean(),
  isDefault: z.boolean(),
});
export type StoreInput = z.infer<typeof StoreSchema>;

type R = { ok: true } | { ok: false; error: string };

/**
 * Thêm / sửa cửa hàng. Cửa hàng mặc định (nhận hàng nhập, xuất đơn online trước) chỉ có một; không ngừng được cửa hàng mặc định
 * hoặc cửa hàng còn tồn kho. Mã không đổi được sau khi tạo (tồn kho / đơn tham chiếu theo id, nhưng nhân viên quen gọi theo mã).
 */
export async function saveStore(v: StoreInput): Promise<R> {
  return db.transaction(async (tx): Promise<R> => {
    const [clash] = await tx.select({ id: stores.id }).from(stores).where(v.id ? and(eq(stores.code, v.code), ne(stores.id, v.id)) : eq(stores.code, v.code));
    if (clash) return { ok: false, error: 'Mã cửa hàng này đã có' };
    if (v.id) {
      const [cur] = await tx.select().from(stores).where(eq(stores.id, v.id)).for('update');
      if (!cur) return { ok: false, error: 'Không tìm thấy cửa hàng' };
      if (v.code !== cur.code) return { ok: false, error: 'Mã cửa hàng không đổi được sau khi tạo' };
      if (cur.isDefault && !v.isDefault) return { ok: false, error: 'Phải có một cửa hàng mặc định — hãy chọn cửa hàng khác làm mặc định' };
      if (!v.active && cur.active) {
        if (cur.isDefault || v.isDefault) return { ok: false, error: 'Không ngừng được cửa hàng mặc định' };
        const [{ n }] = await tx.select({ n: sql<number>`coalesce(sum(${stockLots.qty}), 0)`.mapWith(Number) }).from(stockLots).where(eq(stockLots.storeId, v.id));
        if (n > 0) return { ok: false, error: `Cửa hàng còn ${n} sản phẩm trong kho — chuyển kho hoặc kiểm kê về 0 trước khi ngừng` };
      }
      if (v.isDefault && !v.active) return { ok: false, error: 'Cửa hàng mặc định phải đang hoạt động' };
      if (v.isDefault) await tx.update(stores).set({ isDefault: false }).where(ne(stores.id, v.id));
      await tx.update(stores).set({ name: v.name, address: v.address, lat: v.lat, lng: v.lng, active: v.active, isDefault: v.isDefault }).where(eq(stores.id, v.id));
      return { ok: true };
    }
    if (v.isDefault) await tx.update(stores).set({ isDefault: false });
    const [{ n }] = await tx.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(stores);
    await tx.insert(stores).values({ code: v.code, name: v.name, address: v.address, lat: v.lat, lng: v.lng, active: v.active, isDefault: v.isDefault || n === 0 });
    return { ok: true };
  });
}

/**
 * Xóa hẳn một cửa hàng — chỉ khi chưa từng phát sinh gì: không phải cửa hàng mặc định, không còn tồn, chưa có đơn / phiếu nhập /
 * biến động kho / khoản chi nào ghi theo cửa hàng này (xóa sẽ làm sổ sách mất nơi tham chiếu). Đã có lịch sử thì chuyển sang "Ngừng hoạt động".
 */
export async function deleteStore(id: number): Promise<R> {
  return db.transaction(async (tx): Promise<R> => {
    const [cur] = await tx.select().from(stores).where(eq(stores.id, id)).for('update');
    if (!cur) return { ok: false, error: 'Không tìm thấy cửa hàng' };
    if (cur.isDefault) return { ok: false, error: 'Không xóa được cửa hàng mặc định — hãy chọn cửa hàng khác làm mặc định trước' };
    const [u] = await tx.select({
      stock: sql<number>`coalesce((select sum(${stockLots.qty}) from ${stockLots} where ${stockLots.storeId} = ${id}), 0)`.mapWith(Number),
      history: sql<number>`(select count(*) from ${orders} where ${orders.storeId} = ${id})
        + (select count(*) from ${purchaseReceiptLines} where ${purchaseReceiptLines.storeId} = ${id})
        + (select count(*) from ${stockMoves} where ${stockMoves.storeId} = ${id})
        + (select count(*) from ${expenses} where ${expenses.storeId} = ${id})
        + (select count(*) from ${recurringExpenses} where ${recurringExpenses.storeId} = ${id})`.mapWith(Number),
    }).from(stores).where(eq(stores.id, id));
    if (u.stock > 0) return { ok: false, error: `Cửa hàng còn ${u.stock} sản phẩm trong kho — chuyển kho hoặc kiểm kê về 0 trước khi xóa` };
    if (u.history > 0) return { ok: false, error: 'Cửa hàng này đã có lịch sử (nhập / xuất kho, đơn hàng hoặc chi phí) nên không xóa được. Hãy bấm Sửa rồi bỏ chọn “Đang hoạt động” để ngừng.' };
    await tx.delete(stockLots).where(eq(stockLots.storeId, id)); // dòng lô tồn 0 (nếu có), không còn gì tham chiếu
    await tx.delete(stores).where(eq(stores.id, id));
    return { ok: true };
  });
}
