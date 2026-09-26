'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getCurrentUser, requireStaff } from '@/server/auth';
import { getProducts } from '@/server/catalog';
import { createOrder, LAST_ORDER_COOKIE, PlaceOrderSchema, setOrderStatus } from '@/server/orders';
import { ORDER_STATUSES } from '@/server/db/schema';
import { snapOf, type CartLine } from '@/lib/cart-snap';

export async function placeOrderAction(input: unknown) {
  const p = PlaceOrderSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const user = await getCurrentUser();
  const r = createOrder(p.data, user);
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
  const products = new Map(getProducts(lines.data.map((l) => l.slug)).map((p) => [p.slug, p]));
  let changed = false;
  const out: CartLine[] = [];
  for (const l of lines.data) {
    const p = products.get(l.slug);
    if (!p || !p.options[l.option]) { changed = true; continue; }
    out.push({ ...l, snap: snapOf(p, l.option) });
  }
  return { lines: out, changed };
}

export async function setOrderStatusAction(code: unknown, status: unknown, note?: unknown) {
  const staff = await requireStaff();
  const p = z.object({ code: z.string().max(20), status: z.enum(ORDER_STATUSES), note: z.string().max(300).optional() }).safeParse({ code, status, note });
  if (!p.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  const r = setOrderStatus(p.data.code, p.data.status, staff.name ?? `NV ${staff.phone.slice(-3)}`, p.data.note);
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/tai-khoan', 'layout');
  }
  return r;
}
