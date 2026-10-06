'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { postPath, SECTIONS, sectionOf } from '@/lib/posts';
import { requireAccess } from '@/server/auth';
import { addPostImage, deletePost, INTENTS, PostInputSchema, savePost, votePost } from '@/server/posts';
import { saveImage } from '@/server/uploads';

// Bài viết & video: nhân viên soạn nháp / gửi duyệt; chỉ quản trị viên đăng, gỡ, xóa và sửa bài đã đăng.

function refresh(p?: { slug: string; category: string }) {
  revalidatePath('/admin/noi-dung', 'layout');
  revalidatePath(SECTIONS.blog.path);
  revalidatePath(SECTIONS.news.path);
  if (p) revalidatePath(postPath(p));
}

export async function savePostAction(input: unknown, intent: unknown) {
  const user = await requireAccess('content', 'full');
  const i = z.enum(INTENTS).safeParse(intent);
  const p = PostInputSchema.safeParse(input);
  if (!i.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message || 'Dữ liệu chưa hợp lệ' };
  const r = await savePost(p.data, i.data, user);
  if (r.ok) refresh({ slug: r.slug, category: p.data.category });
  return r;
}

export async function uploadPostImageAction(fd: FormData) {
  const user = await requireAccess('content', 'full');
  const id = z.coerce.number().int().positive().safeParse(fd.get('postId'));
  const f = fd.get('photo');
  if (!id.success || !(f instanceof File)) return { ok: false as const, error: 'Thiếu ảnh' };
  const img = await saveImage(f);
  if ('error' in img) return { ok: false as const, error: img.error };
  return addPostImage(id.data, img, user);
}

export async function deletePostAction(id: unknown) {
  await requireAccess('content', 'full');
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return { ok: false as const };
  const r = await deletePost(p.data);
  if (r) refresh(r);
  return { ok: !!r, section: r ? sectionOf(r.category) : undefined };
}

/** Khách bấm "Bài viết có hữu ích? Có / Không". */
export async function votePostAction(id: unknown, helpful: unknown) {
  const p = z.object({ id: z.number().int().positive(), helpful: z.boolean() }).safeParse({ id, helpful });
  if (!p.success) return { ok: false };
  return { ok: await votePost(p.data.id, p.data.helpful) };
}
