'use server';

import { revalidatePath } from 'next/cache';
import { activeStickerDay } from '@/lib/sticker-days';
import { vnDate } from '@/lib/shipping';
import { requireAccess, staffName } from '@/server/auth';
import { getStickerDays, saveStickerDays } from '@/server/sticker-days';

/** Ngày đặc biệt hôm nay (giờ Việt Nam) cho sticker ngày trên ảnh sản phẩm; null = hôm nay không có. Công khai. */
export async function stickerDayAction() {
  return activeStickerDay(await getStickerDays(), vnDate());
}

/** Lưu danh sách ngày đặc biệt — chỉ Quản lý. */
export async function saveStickerDaysAction(input: unknown) {
  const staff = await requireAccess('promotions', 'full');
  const r = await saveStickerDays(input, staffName(staff));
  if (r.ok) revalidatePath('/admin/ngay-su-kien');
  return r;
}
