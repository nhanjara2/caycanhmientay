'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getCurrentUser, requireAccess, requireStaff, staffName } from '@/server/auth';
import {
  confirmRefund, createWarranty, createWarrantyFromReview, DecideSchema, decideWarranty, RefundSchema, reviewWarrantyOptions,
  ReviewWarrantySchema, WarrantyInputSchema,
} from '@/server/warranty';

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
  const staff = await requireAccess('warranty', 'full');
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

/** Cây của khách để tạo yêu cầu bảo hành từ đánh giá (nhân viên + admin). */
export async function reviewWarrantyOptionsAction(reviewId: unknown) {
  await requireAccess('warranty', 'full');
  const p = z.number().int().positive().safeParse(reviewId);
  if (!p.success) return { ok: false as const, error: 'Đánh giá không hợp lệ' };
  const r = await reviewWarrantyOptions(p.data);
  return r ? { ok: true as const, ...r } : { ok: false as const, error: 'Không tìm thấy đánh giá' };
}

/** Nhân viên tạo yêu cầu bảo hành thay khách từ đánh giá xấu. */
export async function createWarrantyFromReviewAction(input: unknown) {
  const staff = await requireAccess('warranty', 'full');
  const p = ReviewWarrantySchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await createWarrantyFromReview(p.data, staffName(staff));
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/tai-khoan/bao-hanh');
  }
  return r;
}
