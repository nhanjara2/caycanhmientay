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

/** Tải ảnh từ link admin dán vào (https://…) về để đưa qua khung cắt / chỉnh như ảnh chọn từ máy. */
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[|::)/i;
export async function fetchBannerImageUrlAction(url: unknown) {
  await requireAccess('content', 'full');
  let u: URL;
  try { u = new URL(String(url)); } catch { return { ok: false as const, error: 'Link ảnh không hợp lệ' }; }
  if (u.protocol !== 'https:' || PRIVATE_HOST.test(u.hostname)) return { ok: false as const, error: 'Link ảnh phải bắt đầu bằng https://' };
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(15_000), redirect: 'follow', headers: { Accept: 'image/*' } });
    const type = (r.headers.get('content-type') ?? '').split(';')[0].trim();
    if (!r.ok) return { ok: false as const, error: `Không tải được ảnh (mã ${r.status})` };
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return { ok: false as const, error: 'Link này không phải file ảnh — cần link mở ra chỉ thấy mỗi tấm ảnh' };
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 15 * 1024 * 1024) return { ok: false as const, error: 'Ảnh quá lớn (trên 15 MB)' };
    return { ok: true as const, type, data: buf.toString('base64') };
  } catch {
    return { ok: false as const, error: 'Không tải được ảnh từ link này' };
  }
}
