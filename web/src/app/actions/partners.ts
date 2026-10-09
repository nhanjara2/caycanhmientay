'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser, publicUser, requireAccess } from '@/server/auth';
import { AdminPartnerSchema, applyPartner, ApplySchema, setPartner } from '@/server/partners';

/** Khách đăng ký làm đối tác sỉ (trang /doi-tac) — phải đăng nhập. Trả về bản người dùng mới để cập nhật đầu trang / giỏ hàng. */
export async function applyPartnerAction(input: unknown) {
  const me = await getCurrentUser();
  if (!me) return { ok: false as const, error: 'Vui lòng đăng nhập để đăng ký đối tác' };
  const p = ApplySchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await applyPartner(me, p.data);
  revalidatePath('/admin', 'layout');
  revalidatePath('/doi-tac');
  const next = r.approved ? me : { ...me, partnerType: p.data.type, partnerStatus: 'pending' as const };
  return { ok: true as const, user: publicUser(next) };
}

/** Admin duyệt / sửa / gỡ đối tác ở trang chi tiết khách hàng. */
export async function setPartnerAction(input: unknown) {
  await requireAccess('customers', 'full');
  const p = AdminPartnerSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await setPartner(p.data);
  if (r.ok) {
    revalidatePath(`/admin/khach-hang/${p.data.userId}`);
    revalidatePath('/admin', 'layout');
  }
  return r;
}
