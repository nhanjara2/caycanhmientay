'use server';

import { revalidatePath } from 'next/cache';
import { requireAccess, staffName } from '@/server/auth';
import { ConsignPaySchema, payConsign } from '@/server/consign';

/** Ghi trả tiền cây ký gửi cho nhà vườn (chỉ Quản lý — khu Thu chi, chi phí & lãi lỗ). */
export async function payConsignAction(input: unknown) {
  const staff = await requireAccess('expenses', 'full');
  const p = ConsignPaySchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ' };
  const r = await payConsign(p.data, staffName(staff));
  if (r.ok) {
    revalidatePath('/admin/doi-soat');
    revalidatePath('/admin/chi-phi');
    revalidatePath('/admin/thu-chi');
    revalidatePath('/admin/bao-cao');
  }
  return r;
}
