'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireStaff } from '@/server/auth';
import { DiseaseInputSchema, saveDisease, setDiseaseActive } from '@/server/diseases';

// Chỉ quản trị viên được sửa thư viện bệnh cây: kiểm tra quyền trước, rồi mới kiểm tra đầu vào.

function refresh(slug?: string) {
  revalidatePath('/admin/benh-cay', 'layout');
  revalidatePath('/benh-cay');
  if (slug) revalidatePath(`/benh-cay/${slug}`);
}

export async function saveDiseaseAction(input: unknown) {
  await requireStaff('admin');
  const p = DiseaseInputSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await saveDisease(p.data);
  if (r.ok) refresh(r.slug);
  return r;
}

export async function setDiseaseActiveAction(slug: unknown, active: unknown) {
  await requireStaff('admin');
  const p = z.object({ slug: z.string().max(120), active: z.boolean() }).safeParse({ slug, active });
  if (!p.success) return { ok: false as const };
  const ok = await setDiseaseActive(p.data.slug, p.data.active);
  if (ok) refresh(p.data.slug);
  return { ok };
}
