'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser, requireStaff, staffName } from '@/server/auth';
import { confirmRefund, createWarranty, DecideSchema, decideWarranty, RefundSchema, WarrantyInputSchema } from '@/server/warranty';

/** Khách gửi yêu cầu bảo hành (FormData: orderItemId, symptoms[], description, placement, watering, photos[]). */
export async function createWarrantyAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = WarrantyInputSchema.safeParse({
    orderItemId: fd.get('orderItemId'),
    symptoms: fd.getAll('symptoms'),
    description: fd.get('description') ?? undefined,
    placement: fd.get('placement') ?? undefined,
    watering: fd.get('watering') ?? undefined,
  });
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const files = fd.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  const r = await createWarranty(user, p.data, files);
  if (r.ok) {
    revalidatePath('/tai-khoan/bao-hanh');
    revalidatePath('/admin', 'layout');
  }
  return r;
}

export async function decideWarrantyAction(input: unknown) {
  const staff = await requireStaff();
  const p = DecideSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await decideWarranty(p.data, staffName(staff));
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/tai-khoan', 'layout');
    revalidatePath('/', 'layout'); // tồn kho thay đổi khi tạo đơn đổi / tặng
  }
  return r;
}

/** Xác nhận đã chuyển tiền hoàn cho khách — chỉ admin (liên quan tiền). */
export async function confirmRefundAction(input: unknown) {
  const staff = await requireStaff('admin');
  const p = RefundSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await confirmRefund(p.data, staffName(staff));
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/tai-khoan/bao-hanh');
  }
  return r;
}
