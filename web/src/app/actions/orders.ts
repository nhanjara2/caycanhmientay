'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getCurrentUser, requireAccess, requireStaff, staffName } from '@/server/auth';
import { hasAccess } from '@/lib/permissions';
import { getProducts } from '@/server/catalog';
import { optionOf } from '@/lib/catalog';
import { createOrder, LAST_ORDER_COOKIE, PlaceOrderSchema, setOrderPaid, setOrderStatus } from '@/server/orders';
import { ORDER_STATUSES } from '@/server/db/schema';
import { snapOf, type CartLine } from '@/lib/cart-snap';

export async function placeOrderAction(input: unknown) {
  const p = PlaceOrderSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const user = await getCurrentUser();
  const r = await createOrder(p.data, user);
  if (r.ok) {
    (await cookies()).set(LAST_ORDER_COOKIE, r.code, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24, secure: process.env.NODE_ENV === 'production' });
    revalidatePath('/admin', 'layout');
  }
  return r;
}

/** Giá và thông tin hiện tại của các dòng giỏ; dòng không còn bán bị bỏ. */
export async function refreshCartAction(input: unknown) {
  const lines = z.array(z.object({ slug: z.string().max(120), option: z.number().int().min(0), qty: z.number().int().min(1).max(99) })).max(50).safeParse(input);
  if (!lines.success) return { lines: [] as CartLine[], changed: true };
  const products = new Map((await getProducts(lines.data.map((l) => l.slug))).map((p) => [p.slug, p]));
  let changed = false;
  const out: CartLine[] = [];
  for (const l of lines.data) {
    const p = products.get(l.slug);
    if (!p || !optionOf(p, l.option)) { changed = true; continue; }
    out.push({ ...l, snap: snapOf(p, l.option) });
  }
  return { lines: out, changed };
}

export async function setOrderStatusAction(code: unknown, status: unknown, note?: unknown) {
  const p = z.object({ code: z.string().max(20), status: z.enum(ORDER_STATUSES), note: z.string().max(300).optional() }).safeParse({ code, status, note });
  if (!p.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  // Xác nhận / chuẩn bị / hủy: quyền Đơn hàng. "Giao cho tài xế" và "Đã giao xong" còn làm được bằng quyền Giao hàng (kho, tài xế).
  const me = await getCurrentUser();
  const viaDelivery = !!me && (p.data.status === 'shipping' || p.data.status === 'delivered') && hasAccess(me, 'delivery', 'full');
  const staff = viaDelivery && me ? me : await requireAccess('orders', 'full');
  const r = await setOrderStatus(p.data.code, p.data.status, staffName(staff), p.data.note);
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/tai-khoan', 'layout');
  }
  return r;
}

/** Xác nhận đã nhận tiền cho đơn thanh toán online (nhân viên); bỏ đánh dấu chỉ quản trị viên. */
export async function setOrderPaidAction(code: unknown, paid: unknown, ref?: unknown) {
  const p = z.object({ code: z.string().max(20), paid: z.boolean(), ref: z.string().trim().max(120).optional() }).safeParse({ code, paid, ref });
  if (!p.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  const staff = p.data.paid ? await requireAccess('orders', 'full') : await requireStaff('admin');
  const r = await setOrderPaid(p.data.code, p.data.paid, staffName(staff), p.data.ref || undefined);
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/tai-khoan', 'layout');
  }
  return r;
}
