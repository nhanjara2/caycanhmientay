'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getCurrentUser, requireStaff } from '@/server/auth';
import { previewVouchers } from '@/server/orders';
import { WELCOME_CODE, type PublicVoucher } from '@/lib/voucher-labels';
import { createVoucher, listActiveVouchers, setVoucherActive, updateVoucher, VoucherInputSchema, welcomeOffer } from '@/server/vouchers';

const ItemsSchema = z.array(z.object({ slug: z.string().max(120), option: z.number().int().min(0).max(20), qty: z.number().int().min(1).max(99) })).min(1).max(50);

/** Khách chọn / nhập mã ở trang thanh toán (tối đa một mã giảm tiền hàng + một mã miễn phí giao) — chưa chốt lượt dùng, chỉ xem trước số tiền giảm. */
export async function applyVouchersAction(codes: unknown, items: unknown, phone: unknown, delivery: unknown) {
  const user = await getCurrentUser();
  const pCodes = z.array(z.string().trim().min(1).max(30)).min(1, 'Chọn hoặc nhập mã giảm giá').max(4).safeParse(codes);
  const pItems = ItemsSchema.safeParse(items);
  if (!pCodes.success) return { ok: false as const, error: 'Chọn hoặc nhập mã giảm giá' };
  if (!pItems.success) return { ok: false as const, error: 'Giỏ hàng không hợp lệ' };
  const pPhone = typeof phone === 'string' ? phone : '';
  return { ok: true as const, ...(await previewVouchers(pCodes.data, pItems.data, user, pPhone || user?.phone || '', delivery === 'pickup' ? 'pickup' : 'ship')) };
}

/** Mã giảm giá + mã miễn phí giao đang áp dụng (trừ quà tài khoản mới), đơn tối thiểu thấp trước — giỏ / thanh toán / trang sản phẩm gợi ý mã. Công khai như trang /khuyen-mai. */
export async function publicVouchersAction(): Promise<PublicVoucher[]> {
  return (await listActiveVouchers())
    .filter((v) => v.code !== WELCOME_CODE)
    .map(({ code, label, kind, discountType, discountValue, maxDiscount, minOrder }) => ({ code, label, kind, discountType, discountValue, maxDiscount, minOrder }))
    .sort((a, b) => a.minOrder - b.minOrder);
}

/** Quà tài khoản mới của khách đang đăng nhập — trang thanh toán gợi ý nút "Dùng". null = chưa đăng nhập / không có quà. */
export async function welcomeOfferAction() {
  const user = await getCurrentUser();
  return user ? welcomeOffer(user.id) : null;
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
