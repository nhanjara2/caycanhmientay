'use server';

import { revalidatePath } from 'next/cache';
import { requireAccess } from '@/server/auth';
import { saveStore, StoreSchema } from '@/server/stores-admin';

/** Thêm / sửa cửa hàng — chỉ Quản lý (khu "Cài đặt"). */
export async function saveStoreAction(input: unknown) {
  await requireAccess('settings', 'full');
  const p = StoreSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message || 'Dữ liệu chưa hợp lệ' };
  const r = await saveStore(p.data);
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/', 'layout');
  }
  return r;
}
