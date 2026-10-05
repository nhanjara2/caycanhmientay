'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireStaff } from '@/server/auth';
import {
  CategorySchema, deleteCategory, deleteSubcategory, moveCategory, moveSubcategory, saveCategory, saveSubcategory,
  setCategoryActive, setSubcategoryActive, SubcategorySchema,
} from '@/server/categories';

// Chỉ role admin sửa danh mục (giống sửa sản phẩm); nhân viên chỉ xem.

/** Danh mục hiện ở menu trái, trang chủ, chân trang, trang sản phẩm → làm mới cả web. */
function refresh() {
  revalidatePath('/', 'layout');
  revalidatePath('/admin', 'layout');
}

const Slug = z.string().min(1).max(60);
const Dir = z.union([z.literal(-1), z.literal(1)]);
const bad = { ok: false as const, error: 'Yêu cầu không hợp lệ' };

export async function saveCategoryAction(input: unknown) {
  await requireStaff('admin');
  const p = CategorySchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await saveCategory(p.data);
  if (r.ok) refresh();
  return r;
}

export async function saveSubcategoryAction(input: unknown) {
  await requireStaff('admin');
  const p = SubcategorySchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await saveSubcategory(p.data);
  if (r.ok) refresh();
  return r;
}

export async function moveCategoryAction(slug: unknown, dir: unknown) {
  await requireStaff('admin');
  const p = z.object({ slug: Slug, dir: Dir }).safeParse({ slug, dir });
  if (!p.success) return bad;
  const ok = await moveCategory(p.data.slug, p.data.dir);
  if (ok) refresh();
  return ok ? { ok: true as const } : { ok: false as const, error: 'Không đổi được thứ tự' };
}

export async function moveSubcategoryAction(category: unknown, slug: unknown, dir: unknown) {
  await requireStaff('admin');
  const p = z.object({ category: Slug, slug: Slug, dir: Dir }).safeParse({ category, slug, dir });
  if (!p.success) return bad;
  const ok = await moveSubcategory(p.data.category, p.data.slug, p.data.dir);
  if (ok) refresh();
  return ok ? { ok: true as const } : { ok: false as const, error: 'Không đổi được thứ tự' };
}

export async function setCategoryActiveAction(slug: unknown, active: unknown) {
  await requireStaff('admin');
  const p = z.object({ slug: Slug, active: z.boolean() }).safeParse({ slug, active });
  if (!p.success) return bad;
  const ok = await setCategoryActive(p.data.slug, p.data.active);
  if (ok) refresh();
  return ok ? { ok: true as const } : { ok: false as const, error: 'Không tìm thấy danh mục' };
}

export async function setSubcategoryActiveAction(category: unknown, slug: unknown, active: unknown) {
  await requireStaff('admin');
  const p = z.object({ category: Slug, slug: Slug, active: z.boolean() }).safeParse({ category, slug, active });
  if (!p.success) return bad;
  const ok = await setSubcategoryActive(p.data.category, p.data.slug, p.data.active);
  if (ok) refresh();
  return ok ? { ok: true as const } : { ok: false as const, error: 'Không tìm thấy nhóm con' };
}

export async function deleteCategoryAction(slug: unknown) {
  await requireStaff('admin');
  const p = Slug.safeParse(slug);
  if (!p.success) return bad;
  const r = await deleteCategory(p.data);
  if (r.ok) refresh();
  return r;
}

export async function deleteSubcategoryAction(category: unknown, slug: unknown, moveTo: unknown) {
  await requireStaff('admin');
  const p = z.object({ category: Slug, slug: Slug, moveTo: Slug.optional() }).safeParse({ category, slug, moveTo: moveTo || undefined });
  if (!p.success) return bad;
  const r = await deleteSubcategory(p.data.category, p.data.slug, p.data.moveTo);
  if (r.ok) refresh();
  return r;
}
