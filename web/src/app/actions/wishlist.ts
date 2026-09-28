'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getCurrentUser } from '@/server/auth';
import { toggleWishlist } from '@/server/wishlist';

export async function toggleWishlistAction(slug: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = z.string().min(1).max(120).safeParse(slug);
  if (!p.success) return { ok: false as const, error: 'Sản phẩm không hợp lệ' };
  const r = await toggleWishlist(user.id, p.data);
  revalidatePath('/tai-khoan/yeu-thich');
  return { ok: true as const, ...r };
}
