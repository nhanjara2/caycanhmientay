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
  db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault), desc(addresses.id));

/** Tạo hoặc sửa (id có = sửa). Địa chỉ đầu tiên luôn là mặc định; chỉ một địa chỉ mặc định. */
export async function saveAddress(userId: number, input: AddressInput, id?: number) {
  return db.transaction(async (tx) => {
    // Khóa sổ địa chỉ của khách trong lúc sửa (giữ đúng một địa chỉ mặc định).
    const mine = await tx.select().from(addresses).where(eq(addresses.userId, userId)).for('update');
    const own = id ? mine.find((a) => a.id === id) : undefined;
    if (id && !own) return { ok: false as const, error: 'Không tìm thấy địa chỉ' };
    const count = mine.length;
    const isDefault = input.isDefault || count === 0 || (own?.isDefault ?? false);
    if (count >= 20 && !own) return { ok: false as const, error: 'Sổ địa chỉ tối đa 20 địa chỉ' };
    if (isDefault) await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    const values = { ...input, phone: normalizePhone(input.phone), isDefault };
    if (own) await tx.update(addresses).set(values).where(eq(addresses.id, own.id));
    else await tx.insert(addresses).values({ ...values, userId });
    return { ok: true as const };
  });
}

export async function deleteAddress(userId: number, id: number) {
  return db.transaction(async (tx) => {
    const mine = await tx.select().from(addresses).where(eq(addresses.userId, userId)).for('update');
    const own = mine.find((a) => a.id === id);
    if (!own) return false;
    await tx.delete(addresses).where(eq(addresses.id, id));
    // Xóa địa chỉ mặc định thì địa chỉ mới nhất còn lại thành mặc định.
    if (own.isDefault) {
      const next = mine.filter((a) => a.id !== id).sort((a, b) => b.id - a.id)[0];
      if (next) await tx.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
    }
    return true;
  });
}

/** Địa chỉ của chính khách (dùng khi đặt hàng để kiểm tra vùng giao). */
export const getAddress = async (userId: number, id: number) =>
  (await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))))[0];
