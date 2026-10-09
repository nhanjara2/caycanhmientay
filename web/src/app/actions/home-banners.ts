'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireAccess } from '@/server/auth';
import { addBannerImage, BannerInputSchema, deleteBanner, moveBanner, saveBanner, setBannerActive } from '@/server/home-banners';
import { saveImage } from '@/server/uploads';

// Banner trang chủ: ai có quyền Bài viết toàn quyền (Quản lý, Kỹ sư) được sửa.

function refresh() {
  revalidatePath('/admin/trang-chu');
  revalidatePath('/');
}

const id = z.number().int().positive();

export async function saveBannerAction(input: unknown) {
  const user = await requireAccess('content', 'full');
  const p = BannerInputSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await saveBanner(p.data, user);
  if (r.ok) refresh();
  return r;
}

export async function setBannerActiveAction(bannerId: unknown, active: unknown) {
  await requireAccess('content', 'full');
  const p = z.object({ id, active: z.boolean() }).safeParse({ id: bannerId, active });
  if (!p.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  if (!(await setBannerActive(p.data.id, p.data.active))) return { ok: false as const, error: 'Không tìm thấy banner' };
  refresh();
  return { ok: true as const };
}

export async function moveBannerAction(bannerId: unknown, dir: unknown) {
  await requireAccess('content', 'full');
  const p = z.object({ id, dir: z.union([z.literal(-1), z.literal(1)]) }).safeParse({ id: bannerId, dir });
  if (!p.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  if (!(await moveBanner(p.data.id, p.data.dir))) return { ok: false as const, error: 'Không tìm thấy banner' };
  refresh();
  return { ok: true as const };
}

export async function deleteBannerAction(bannerId: unknown) {
  await requireAccess('content', 'full');
  const p = id.safeParse(bannerId);
  if (!p.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  if (!(await deleteBanner(p.data))) return { ok: false as const, error: 'Không tìm thấy banner' };
  refresh();
  return { ok: true as const };
}

/** Tải một ảnh banner (đã nén ở trình duyệt). Ảnh gắn vào banner khi bấm Lưu. */
export async function uploadBannerImageAction(fd: FormData) {
  await requireAccess('content', 'full');
  const f = fd.get('photo');
  if (!(f instanceof File)) return { ok: false as const, error: 'Thiếu ảnh' };
  const img = await saveImage(f);
  if ('error' in img) return { ok: false as const, error: img.error };
  return addBannerImage(img);
}
