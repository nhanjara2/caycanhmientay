'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireAccess } from '@/server/auth';
import { deleteStore, saveStore, StoreSchema } from '@/server/stores-admin';

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

/** Xóa cửa hàng chưa từng phát sinh gì — chỉ Quản lý. Đã có lịch sử thì chỉ ngừng hoạt động được. */
export async function deleteStoreAction(id: unknown) {
  await requireAccess('settings', 'full');
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await deleteStore(p.data);
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/', 'layout');
  }
  return r;
}
