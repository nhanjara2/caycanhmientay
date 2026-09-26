import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import * as z from 'zod';
import { isPhone, normalizePhone } from './auth';
import { db, schema } from './db';
import { ADDRESS_KINDS, DELIVERY_CONDITIONS } from './db/schema';

const { addresses } = schema;

export const AddressSchema = z.object({
  name: z.string().trim().min(2, 'Nhập họ tên người nhận').max(80),
  phone: z.string().trim().refine(isPhone, 'Số điện thoại chưa đúng'),
  street: z.string().trim().min(3, 'Nhập số nhà, tên đường').max(200),
  area: z.string().trim().min(3, 'Nhập Phường, Tỉnh/Thành').max(120),
  kind: z.enum(ADDRESS_KINDS),
  conditions: z.array(z.enum(DELIVERY_CONDITIONS)).max(4),
  isDefault: z.boolean(),
  // Ghim bản đồ (tùy chọn) — giới hạn trong lãnh thổ Việt Nam.
  lat: z.number().min(8).max(24).nullable().default(null),
  lng: z.number().min(102).max(110).nullable().default(null),
});
export type AddressInput = z.infer<typeof AddressSchema>;
export type Address = typeof addresses.$inferSelect;

export const listAddresses = (userId: number) =>
  db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault), desc(addresses.id)).all();

/** Tạo hoặc sửa (id có = sửa). Địa chỉ đầu tiên luôn là mặc định; chỉ một địa chỉ mặc định. */
export function saveAddress(userId: number, input: AddressInput, id?: number) {
  return db.transaction((tx) => {
    const own = id ? tx.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).get() : undefined;
    if (id && !own) return { ok: false as const, error: 'Không tìm thấy địa chỉ' };
    const count = tx.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId)).all().length;
    const isDefault = input.isDefault || count === 0 || (own?.isDefault ?? false);
    if (isDefault) tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId)).run();
    const values = { ...input, phone: normalizePhone(input.phone), isDefault };
    if (own) tx.update(addresses).set(values).where(eq(addresses.id, own.id)).run();
    else {
      if (count >= 20) return { ok: false as const, error: 'Sổ địa chỉ tối đa 20 địa chỉ' };
      tx.insert(addresses).values({ ...values, userId }).run();
    }
    return { ok: true as const };
  });
}

export function deleteAddress(userId: number, id: number) {
  return db.transaction((tx) => {
    const own = tx.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).get();
    if (!own) return false;
    tx.delete(addresses).where(eq(addresses.id, id)).run();
    // Xóa địa chỉ mặc định thì địa chỉ mới nhất còn lại thành mặc định.
    if (own.isDefault) {
      const next = tx.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.id)).get();
      if (next) tx.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id)).run();
    }
    return true;
  });
}

/** Địa chỉ của chính khách (dùng khi đặt hàng để kiểm tra vùng giao). */
export const getAddress = (userId: number, id: number) =>
  db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).get();
