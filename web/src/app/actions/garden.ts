'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getCurrentUser } from '@/server/auth';
import { addGardenPhoto, GardenEditSchema, markCareDone, updateGardenPlant } from '@/server/garden';

function refresh() {
  revalidatePath('/tai-khoan/vuon-cua-toi');
  revalidatePath('/tai-khoan/lich-cham-cay');
}

export async function updateGardenPlantAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = GardenEditSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await updateGardenPlant(user.id, p.data);
  if (r.ok) refresh();
  return r;
}

export async function markCareDoneAction(id: unknown, kind: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = z.object({ id: z.number().int().positive(), kind: z.enum(['water', 'fertilize']) }).safeParse({ id, kind });
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await markCareDone(user.id, p.data.id, p.data.kind);
  if (r.ok) refresh();
  return r;
}

/** FormData: id, photo. */
export async function uploadGardenPhotoAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const id = z.coerce.number().int().positive().safeParse(fd.get('id'));
  const f = fd.get('photo');
  if (!id.success || !(f instanceof File)) return { ok: false as const, error: 'Thiếu ảnh' };
  const r = await addGardenPhoto(user.id, id.data, f);
  if (r.ok) refresh();
  return r;
}
