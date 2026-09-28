'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser, requireStaff, staffName } from '@/server/auth';
import {
  addServiceNote, createByStaff, createServiceRequest, NoteSchema, ServiceInputSchema, StaffCreateSchema, UpdateSchema, updateServiceRequest,
} from '@/server/service-requests';

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' && v.trim() ? v : undefined);

/** Khách gửi form Đặt lịch khảo sát — không bắt buộc đăng nhập (FormData, có ảnh). */
export async function createServiceRequestAction(fd: FormData) {
  // Ô ẩn chống bot: người thật không thấy nên không điền
  if (str(fd.get('website'))) return { ok: true as const, code: '' };
  const p = ServiceInputSchema.safeParse({
    service: str(fd.get('service')),
    space: str(fd.get('space')),
    area: str(fd.get('area')),
    sun: str(fd.get('sun')),
    styles: fd.getAll('styles'),
    budget: str(fd.get('budget')),
    slot: str(fd.get('slot')),
    name: fd.get('name') ?? '',
    phone: fd.get('phone') ?? '',
    address: fd.get('address') ?? '',
    note: str(fd.get('note')),
  });
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const files = fd.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  const r = await createServiceRequest(p.data, files, await getCurrentUser());
  if (r.ok) revalidatePath('/admin', 'layout');
  return r;
}

/** Nhân viên tạo yêu cầu từ hotline / Zalo / tại cửa hàng. */
export async function createServiceByStaffAction(input: unknown) {
  const staff = await requireStaff();
  const p = StaffCreateSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await createByStaff(p.data, staff, staffName(staff));
  revalidatePath('/admin', 'layout');
  return r;
}

/** Đổi giai đoạn (kéo thẻ Kanban), người phụ trách, lịch khảo sát, giá trị báo giá. */
export async function updateServiceRequestAction(input: unknown) {
  const staff = await requireStaff();
  const p = UpdateSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await updateServiceRequest(p.data, staffName(staff));
  if (r.ok) revalidatePath('/admin', 'layout');
  return r;
}

/** Ghi nhận cuộc gọi / ghi chú nội bộ vào lịch sử liên hệ. */
export async function addServiceNoteAction(input: unknown) {
  const staff = await requireStaff();
  const p = NoteSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await addServiceNote(p.data, staffName(staff));
  if (r.ok) revalidatePath('/admin', 'layout');
  return r;
}
