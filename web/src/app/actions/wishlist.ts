'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getCurrentUser } from '@/server/auth';
import { toggleWishlist } from '@/server/wishlist';

/** Lưu / bỏ yêu thích. addOnly: chỉ lưu (lưu tiếp sau khi đăng nhập). */
export async function toggleWishlistAction(slug: unknown, addOnly?: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = z.object({ slug: z.string().min(1).max(120), addOnly: z.boolean().optional() }).safeParse({ slug, addOnly });
  if (!p.success) return { ok: false as const, error: 'Sản phẩm không hợp lệ' };
  const r = await toggleWishlist(user.id, p.data.slug, p.data.addOnly);
  revalidatePath('/tai-khoan/yeu-thich');
  return { ok: true as const, ...r };
}
