'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireAccess } from '@/server/auth';
import { addDiseaseImage, DiseaseInputSchema, saveDisease, setDiseaseActive } from '@/server/diseases';
import { saveImage } from '@/server/uploads';
import { pingIndexNow } from '@/server/indexnow';

// Chỉ quản trị viên được sửa thư viện bệnh cây: kiểm tra quyền trước, rồi mới kiểm tra đầu vào.

function refresh(slug?: string) {
  revalidatePath('/admin/benh-cay', 'layout');
  revalidatePath('/benh-cay');
  if (slug) revalidatePath(`/benh-cay/${slug}`);
  pingIndexNow([slug && `/benh-cay/${slug}`, '/benh-cay']);
}

export async function saveDiseaseAction(input: unknown) {
  await requireAccess('content', 'full');
  const p = DiseaseInputSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await saveDisease(p.data);
  if (r.ok) refresh(r.slug);
  return r;
}

export async function setDiseaseActiveAction(slug: unknown, active: unknown) {
  await requireAccess('content', 'full');
  const p = z.object({ slug: z.string().max(120), active: z.boolean() }).safeParse({ slug, active });
  if (!p.success) return { ok: false as const };
  const ok = await setDiseaseActive(p.data.slug, p.data.active);
  if (ok) refresh(p.data.slug);
  return { ok };
}

/** Tải ảnh minh họa cho một triệu chứng (ảnh đã nén ở trình duyệt). */
export async function uploadDiseaseImageAction(fd: FormData) {
  await requireAccess('content', 'full');
  const slug = z.string().min(1).max(120).safeParse(fd.get('slug'));
  const f = fd.get('photo');
  if (!slug.success || !(f instanceof File)) return { ok: false as const, error: 'Thiếu ảnh' };
  const img = await saveImage(f);
  if ('error' in img) return { ok: false as const, error: img.error };
  return addDiseaseImage(slug.data, img);
}
