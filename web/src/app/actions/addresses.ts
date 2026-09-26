'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { AddressSchema, deleteAddress, listAddresses, saveAddress } from '@/server/addresses';
import { getCurrentUser } from '@/server/auth';
import { listStores } from '@/server/inventory';

// Chỉ thao tác trên địa chỉ của chính người đang đăng nhập.

export async function listAddressesAction() {
  const user = await getCurrentUser();
  return user ? (await listAddresses(user.id)).map(({ createdAt: _c, userId: _u, ...a }) => a) : [];
}

export async function saveAddressAction(input: unknown, id?: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = AddressSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const idp = z.number().int().positive().optional().safeParse(id);
  if (!idp.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  const r = await saveAddress(user.id, p.data, idp.data);
  if (r.ok) revalidatePath('/tai-khoan/so-dia-chi');
  return r;
}

export async function deleteAddressAction(id: unknown) {
  const user = await getCurrentUser();
  const p = z.number().int().positive().safeParse(id);
  if (!user || !p.success) return { ok: false as const };
  const ok = await deleteAddress(user.id, p.data);
  if (ok) revalidatePath('/tai-khoan/so-dia-chi');
  return { ok };
}

/** Tọa độ cửa hàng (công khai) — để MapPicker báo vùng giao cây sống. */
export async function deliveryStoresAction() {
  return (await listStores()).map(({ id, code, name, lat, lng }) => ({ id, code, name, lat, lng }));
}
