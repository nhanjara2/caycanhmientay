'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { projectPath } from '@/lib/projects';
import { requireAccess } from '@/server/auth';
import { addProjectImage, deleteProject, ProjectInputSchema, saveProject, setProjectPublished } from '@/server/projects';
import { saveImage } from '@/server/uploads';

// Công trình đã cung cấp cây (trang Đối tác sỉ /doi-tac): ai có quyền Bài viết toàn quyền (Quản lý, Kỹ sư) được sửa.

function refresh(slug?: string) {
  revalidatePath('/admin/du-an', 'layout');
  revalidatePath('/doi-tac');
  if (slug) revalidatePath(projectPath(slug));
}

export async function saveProjectAction(input: unknown) {
  const user = await requireAccess('content', 'full');
  const p = ProjectInputSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await saveProject(p.data, user);
  if (r.ok) refresh(r.slug);
  return r;
}

export async function setProjectPublishedAction(id: unknown, published: unknown) {
  await requireAccess('content', 'full');
  const p = z.object({ id: z.number().int().positive(), published: z.boolean() }).safeParse({ id, published });
  if (!p.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  const r = await setProjectPublished(p.data.id, p.data.published);
  if (r.ok) refresh(r.slug);
  return r;
}

export async function deleteProjectAction(id: unknown) {
  await requireAccess('content', 'full');
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  const slug = await deleteProject(p.data);
  if (!slug) return { ok: false as const, error: 'Không tìm thấy dự án' };
  refresh(slug);
  return { ok: true as const };
}

/** Tải một ảnh công trình / logo khách (đã nén ở trình duyệt). */
export async function uploadProjectImageAction(fd: FormData) {
  await requireAccess('content', 'full');
  const id = z.coerce.number().int().positive().safeParse(fd.get('id'));
  const f = fd.get('photo');
  if (!id.success || !(f instanceof File)) return { ok: false as const, error: 'Thiếu ảnh' };
  const img = await saveImage(f);
  if ('error' in img) return { ok: false as const, error: img.error };
  return addProjectImage(id.data, img);
}
