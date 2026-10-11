'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireAccess, staffName } from '@/server/auth';
import { CashEntrySchema, deleteCashEntry, saveCashEntry } from '@/server/cashflow';

// Sổ Thu chi: chỉ Quản lý (khu "Chi phí & lãi lỗ"). Kiểm tra quyền trước, rồi mới kiểm tra đầu vào.

const FAIL = { ok: false as const, error: 'Dữ liệu chưa hợp lệ' };

export async function saveCashEntryAction(input: unknown) {
  const staff = await requireAccess('expenses', 'full');
  const p = CashEntrySchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0]?.message || FAIL.error };
  const r = await saveCashEntry(p.data, staffName(staff));
  if (r.ok) revalidatePath('/admin/thu-chi');
  return r;
}

export async function deleteCashEntryAction(id: unknown) {
  await requireAccess('expenses', 'full');
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return FAIL;
  const r = await deleteCashEntry(p.data);
  if (r.ok) revalidatePath('/admin/thu-chi');
  return r;
}
