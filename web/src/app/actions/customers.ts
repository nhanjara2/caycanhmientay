'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireStaff } from '@/server/auth';
import { updateCustomerNotes } from '@/server/customers';

/** Ghi chú nội bộ về khách — nhân viên/admin đều sửa được, khách không thấy. */
export async function updateCustomerNotesAction(input: unknown) {
  await requireStaff();
  const p = z.object({ id: z.number().int().positive(), notes: z.string().trim().max(2000) }).safeParse(input);
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  await updateCustomerNotes(p.data.id, p.data.notes);
  revalidatePath(`/admin/khach-hang/${p.data.id}`);
  return { ok: true as const };
}
