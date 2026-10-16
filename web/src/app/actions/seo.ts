'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { hasAccess } from '@/lib/permissions';
import { seoKindOf, sitePath } from '@/lib/seo-cms';
import { requireAccess, requireStaff } from '@/server/auth';
import {
  changePostSlug, changeProjectSlug, deleteRedirect, saveRedirect, saveSeoOverride, SeoOverrideSchema, SlugSchema,
} from '@/server/seo-cms';

// SEO trong admin (mục 14 checklist). Tiêu đề / mô tả / ảnh chia sẻ: ai sửa được nội dung đó (sản phẩm, danh mục, trang
// chung = Quản lý; bài viết, bệnh cây, công trình = Quản lý + Kỹ sư). Ẩn khỏi Google, đường dẫn chuẩn, chuyển hướng: chỉ Quản lý.

export async function saveSeoAction(input: unknown) {
  const user = await requireStaff();
  const p = SeoOverrideSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const path = sitePath(p.data.path);
  if (!path) return { ok: false as const, error: 'Đường dẫn không hợp lệ' };
  const { area } = seoKindOf(path);
  if (!hasAccess(user, area, 'full')) return { ok: false as const, error: 'Bạn không có quyền sửa SEO trang này' };
  const r = await saveSeoOverride(p.data, user, user.role === 'admin');
  if (r.ok && r.changed) {
    revalidatePath(path);
    revalidatePath('/admin/seo');
  }
  return r;
}

const RedirectSchema = z.object({ from: z.string().max(300), to: z.string().max(300), note: z.string().max(200).optional() });

export async function saveRedirectAction(input: unknown) {
  const user = await requireStaff('admin');
  const p = RedirectSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  const r = await saveRedirect({ ...p.data, reason: 'manual' }, user);
  if (r.ok) revalidatePath('/admin/seo');
  return r;
}

/** Tối đa bấy nhiêu dòng một lần ở ô "Thêm nhiều chuyển hướng". */
const BULK_MAX = 300;

/**
 * Thêm nhiều chuyển hướng một lần (bảng đối chiếu link cũ → link mới khi đổi cấu trúc web, mục 16 checklist SEO).
 * Mỗi dòng: đường dẫn cũ rồi đường dẫn mới, cách nhau bằng Tab (dán từ Excel), dấu cách, "→", "->" hoặc ",".
 * Dòng lỗi không chặn các dòng khác; trả kết quả từng dòng.
 */
export async function saveRedirectsBulkAction(text: unknown) {
  const user = await requireStaff('admin');
  const t = z.string().max(BULK_MAX * 650).safeParse(text);
  if (!t.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  const lines = t.data.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  if (!lines.length) return { ok: false as const, error: 'Chưa có dòng nào' };
  if (lines.length > BULK_MAX) return { ok: false as const, error: `Tối đa ${BULK_MAX} dòng một lần` };
  const results: { line: string; ok: boolean; text: string }[] = [];
  for (const line of lines) {
    const [from, to, ...rest] = line.split(/\s*(?:\t|→|->|,)\s*|\s+/).filter(Boolean);
    if (!from || !to || rest.length) {
      results.push({ line, ok: false, text: 'Cần đúng 2 đường dẫn: cũ rồi mới' });
      continue;
    }
    const r = await saveRedirect({ from, to, reason: 'manual', note: 'Thêm nhiều một lần' }, user);
    results.push(r.ok ? { line, ok: true, text: [`${r.from} → ${r.to}`, ...r.warnings].join(' ') } : { line, ok: false, text: r.error });
  }
  revalidatePath('/admin/seo');
  return { ok: true as const, results };
}

export async function deleteRedirectAction(from: unknown) {
  const user = await requireStaff('admin');
  const p = z.string().max(300).safeParse(from);
  if (!p.success) return { ok: false as const };
  const r = await deleteRedirect(p.data, user);
  if (r.ok) revalidatePath('/admin/seo');
  return r;
}

/** Đổi đường dẫn bài viết / công trình (đã lên web thì tự chuyển hướng đường dẫn cũ). */
export async function changeSlugAction(kind: unknown, id: unknown, slug: unknown) {
  const user = await requireAccess('content', 'full');
  const k = z.enum(['post', 'project']).safeParse(kind);
  const i = z.number().int().positive().safeParse(id);
  const s = SlugSchema.safeParse(slug);
  if (!k.success || !i.success) return { ok: false as const, error: 'Dữ liệu không hợp lệ' };
  if (!s.success) return { ok: false as const, error: s.error.issues[0].message };
  try {
    const r = k.data === 'post' ? await changePostSlug(i.data, s.data, user) : await changeProjectSlug(i.data, s.data, user);
    if (r.ok) {
      revalidatePath(r.path);
      revalidatePath('/admin/seo');
    }
    return r;
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Không đổi được đường dẫn' };
  }
}
