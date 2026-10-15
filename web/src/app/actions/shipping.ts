'use server';

import { revalidatePath } from 'next/cache';
import { requireAccess, staffName } from '@/server/auth';
import { getShippingConfig, saveShippingConfig, slotOptions } from '@/server/shipping';

/** Phí giao + giới hạn vùng cây sống + có hẹn khung giờ không, cho giỏ hàng / thanh toán (công khai, không có dữ liệu nhạy cảm). */
export async function shippingRulesAction() {
  const c = await getShippingConfig();
  return { rules: { plant: c.plant, supply: c.supply }, regionProvinces: c.regionProvinces, plantZoneKm: c.plantZoneKm, plantZoneEnabled: c.plantZoneEnabled, slotsEnabled: c.slotsEnabled, minOrder: c.minOrder };
}

/** Khung giờ giao còn chọn được (trang thanh toán). */
export async function slotOptionsAction() {
  return slotOptions();
}

/** Lưu Cài đặt giao hàng — chỉ Quản lý. */
export async function saveShippingAction(input: unknown) {
  const staff = await requireAccess('settings', 'full');
  const r = await saveShippingConfig(input, staffName(staff));
  if (r.ok) {
    revalidatePath('/admin/cai-dat-giao-hang');
    revalidatePath('/', 'layout');
  }
  return r;
}
