'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { effectiveRole } from '@/lib/permissions';
import { requireAccess, staffName } from '@/server/auth';
import { assignOrder, createTrip, deleteTrip, driverOwns, failDelivery, markArrived, moveStop, updateTrip } from '@/server/delivery';
import { VEHICLES } from '@/server/db/schema';
import { setOrderStatus } from '@/server/orders';

// Xếp chuyến: Quản lý, Kho (quyền Giao hàng toàn quyền, không phải tài xế). App tài xế: chỉ chuyến của chính mình.

async function planner() {
  const me = await requireAccess('delivery', 'full');
  if (effectiveRole(me) === 'delivery') return null;
  return me;
}
const refresh = () => {
  revalidatePath('/admin/giao-hang');
  revalidatePath('/nhan-vien/giao-hang');
  revalidatePath('/admin', 'layout');
};
const NO = { ok: false as const, error: 'Chỉ Quản lý hoặc Kho được xếp chuyến' };

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const id = z.number().int().positive();
const vehicle = z.enum(VEHICLES);
const cap = z.number().int().min(1).max(999);

export async function createTripAction(input: unknown) {
  const me = await planner();
  if (!me) return NO;
  const p = z.object({
    date: ymd, slotKey: z.string().max(20), vehicle, name: z.string().trim().max(40).optional(),
    driverId: id.nullable(), helper: z.string().trim().max(60).optional(), capacity: cap.optional(),
  }).safeParse(input);
  if (!p.success) return { ok: false as const, error: 'Dữ liệu chuyến chưa hợp lệ' };
  const r = await createTrip(p.data, me);
  if (r.ok) refresh();
  return r;
}

export async function updateTripAction(tripId: unknown, input: unknown) {
  if (!(await planner())) return NO;
  const p = z.object({
    tripId: id,
    v: z.object({ name: z.string().trim().max(40).optional(), vehicle: vehicle.optional(), driverId: id.nullable().optional(), helper: z.string().trim().max(60).optional(), capacity: cap.optional() }),
  }).safeParse({ tripId, v: input });
  if (!p.success) return { ok: false as const, error: 'Dữ liệu chuyến chưa hợp lệ' };
  const r = await updateTrip(p.data.tripId, p.data.v);
  if (r.ok) refresh();
  return r;
}

export async function deleteTripAction(tripId: unknown) {
  if (!(await planner())) return NO;
  const p = id.safeParse(tripId);
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await deleteTrip(p.data);
  if (r.ok) refresh();
  return r;
}

export async function assignOrderAction(orderId: unknown, tripId: unknown) {
  if (!(await planner())) return NO;
  const p = z.object({ orderId: id, tripId: id.nullable() }).safeParse({ orderId, tripId });
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await assignOrder(p.data.orderId, p.data.tripId);
  if (r.ok) refresh();
  return r;
}

export async function moveStopAction(orderId: unknown, dir: unknown) {
  if (!(await planner())) return NO;
  const p = z.object({ orderId: id, dir: z.enum(['up', 'down']) }).safeParse({ orderId, dir });
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await moveStop(p.data.orderId, p.data.dir);
  if (r.ok) refresh();
  return r;
}

// ---- App tài xế --------------------------------------------------------------------------------

export async function arrivedAction(orderId: unknown) {
  const me = await requireAccess('delivery', 'full');
  const p = id.safeParse(orderId);
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await markArrived(p.data, me);
  if (r.ok) refresh();
  return r;
}

/** "Hoàn tất giao hàng": đơn sang Đã giao (đơn tiền mặt tự tính đã thu, khách được cộng điểm). */
export async function completeDeliveryAction(orderId: unknown, code: unknown) {
  const me = await requireAccess('delivery', 'full');
  const p = z.object({ orderId: id, code: z.string().max(20) }).safeParse({ orderId, code });
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  // Chỉ chuyến của chính tài xế (admin thao tác thay cũng được)
  if (!(await driverOwns(p.data.orderId, me))) return { ok: false as const, error: 'Đơn này không thuộc chuyến của bạn' };
  const r = await setOrderStatus(p.data.code, 'delivered', staffName(me), 'Giao qua app tài xế');
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    revalidatePath('/tai-khoan', 'layout');
    refresh();
  }
  return r;
}

export async function failDeliveryAction(orderId: unknown, reason: unknown) {
  const me = await requireAccess('delivery', 'full');
  const p = z.object({ orderId: id, reason: z.string().trim().min(3, 'Nhập lý do không giao được').max(200) }).safeParse({ orderId, reason });
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await failDelivery(p.data.orderId, p.data.reason, me);
  if (r.ok) refresh();
  return r;
}
