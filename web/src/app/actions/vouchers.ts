'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getCurrentUser, requireStaff } from '@/server/auth';
import { previewVoucher } from '@/server/orders';
import { createVoucher, setVoucherActive, updateVoucher, VoucherInputSchema } from '@/server/vouchers';

const ItemsSchema = z.array(z.object({ slug: z.string().max(120), option: z.number().int().min(0).max(20), qty: z.number().int().min(1).max(99) })).min(1).max(50);

/** Khách nhập mã ở trang thanh toán — chưa chốt lượt dùng, chỉ xem trước số tiền giảm. */
export async function applyVoucherAction(code: unknown, items: unknown, phone: unknown) {
  const user = await getCurrentUser();
  const pCode = z.string().trim().min(1, 'Nhập mã giảm giá').max(30).safeParse(code);
  const pItems = ItemsSchema.safeParse(items);
  if (!pCode.success) return { ok: false as const, error: pCode.error.issues[0].message };
  if (!pItems.success) return { ok: false as const, error: 'Giỏ hàng không hợp lệ' };
  const pPhone = typeof phone === 'string' ? phone : '';
  return previewVoucher(pCode.data, pItems.data, user, pPhone || user?.phone || '');
}

// ---- Admin -------------------------------------------------------------------------------

function refresh() {
  revalidatePath('/admin/khuyen-mai');
  revalidatePath('/khuyen-mai');
}

export async function saveVoucherAction(input: unknown) {
  await requireStaff('admin');
  const p = VoucherInputSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = p.data.id ? await updateVoucher(p.data.id, p.data) : await createVoucher(p.data);
  if (r.ok) refresh();
  return r;
}

export async function setVoucherActiveAction(id: unknown, active: unknown) {
  await requireStaff('admin');
  const p = z.object({ id: z.number().int().positive(), active: z.boolean() }).safeParse({ id, active });
  if (!p.success) return { ok: false as const };
  await setVoucherActive(p.data.id, p.data.active);
  refresh();
  return { ok: true as const };
}
