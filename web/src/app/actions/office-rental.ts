'use server';

import { revalidatePath } from 'next/cache';
import { RENTAL_URL } from '@/lib/office-rental';
import { requireAccess, staffName } from '@/server/auth';
import { saveRentalConfig } from '@/server/office-rental';

/** Lưu bảng giá + gói thuê cây văn phòng — chỉ Quản lý. */
export async function saveRentalAction(input: unknown) {
  const staff = await requireAccess('settings', 'full');
  const r = await saveRentalConfig(input, staffName(staff));
  if (r.ok) {
    revalidatePath('/admin/thue-cay');
    revalidatePath(RENTAL_URL);
  }
  return r;
}
