'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireAccess } from '@/server/auth';
import { previewVoucher } from '@/server/orders';
import { createPosOrder, PosOrderSchema, posCustomer } from '@/server/pos';

// Bán tại quầy: nhân viên có quyền "Bán tại quầy" toàn quyền (Quản lý, CSKH).

export async function posCustomerAction(phone: unknown) {
  await requireAccess('pos', 'full');
  const p = z.string().max(20).safeParse(phone);
  return p.success ? posCustomer(p.data) : null;
}

export async function posVoucherAction(code: unknown, items: unknown, phone: unknown) {
  await requireAccess('pos', 'full');
  const p = z.object({
    code: z.string().trim().min(1).max(30),
    items: z.array(z.object({ slug: z.string().max(120), option: z.number().int().min(0).max(20), qty: z.number().int().min(1).max(99) })).min(1).max(60),
    phone: z.string().max(20),
  }).safeParse({ code, items, phone });
  if (!p.success) return { ok: false as const, error: 'Nhập mã và chọn sản phẩm trước' };
  if (!p.data.phone) return { ok: false as const, error: 'Nhập số điện thoại khách để dùng mã giảm giá' };
  return previewVoucher(p.data.code, p.data.items, null, p.data.phone);
}

export async function createPosOrderAction(input: unknown) {
  const staff = await requireAccess('pos', 'full');
  const p = PosOrderSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message || 'Dữ liệu chưa hợp lệ' };
  const r = await createPosOrder(p.data, staff);
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/', 'layout');
  }
  return r;
}
