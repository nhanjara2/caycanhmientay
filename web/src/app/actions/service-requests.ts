'use server';

import { revalidatePath } from 'next/cache';
import { SERVICE_INFO } from '@/lib/service-labels';
import { alertShop } from '@/server/shop-alert';
import { getCurrentUser, requireAccess, staffName } from '@/server/auth';
import {
  addServiceNote, createByStaff, createForeignInquiry, createServiceRequest, ForeignInquirySchema, NoteSchema, ServiceInputSchema, StaffCreateSchema, UpdateSchema, updateServiceRequest,
} from '@/server/service-requests';

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' && v.trim() ? v : undefined);
const jsonOf = (v: FormDataEntryValue | null) => {
  if (typeof v !== 'string' || !v || v.length > 50_000) return undefined;
  try { return JSON.parse(v) as unknown; } catch { return undefined; }
};

/** Khách gửi form Yêu cầu báo giá sỉ (/bao-gia-si) — không bắt buộc đăng nhập (FormData, có ảnh). */
export async function createServiceRequestAction(fd: FormData) {
  // Ô ẩn chống bot: người thật không thấy nên không điền
  if (str(fd.get('website'))) return { ok: true as const, code: '' };
  const p = ServiceInputSchema.safeParse({
    service: str(fd.get('service')),
    company: str(fd.get('company')),
    needBy: str(fd.get('needBy')),
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
    plan: jsonOf(fd.get('plan')),
  });
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const files = fd.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  const r = await createServiceRequest(p.data, files, await getCurrentUser());
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    const d = p.data;
    alertShop(`📋 Yêu cầu báo giá sỉ ${r.code}`, [
      `${SERVICE_INFO[d.service].label}${d.company ? ` · ${d.company}` : ''}`,
      `Liên hệ: ${d.name} · ${d.phone}`,
      `Giao tới: ${d.address}`,
      ...(d.needBy ? [`Cần hàng: ${d.needBy}`] : []),
      ...(d.note ? [`Danh sách: ${d.note.slice(0, 600)}`] : []),
      ...(files.length ? [`Kèm ${files.length} ảnh`] : []),
    ], '/admin/dich-vu');
  }
  return r;
}

/** Nhân viên tạo yêu cầu từ hotline / Zalo / tại cửa hàng. */
export async function createServiceByStaffAction(input: unknown) {
  const staff = await requireAccess('services', 'full');
  const p = StaffCreateSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await createByStaff(p.data, staff, staffName(staff));
  revalidatePath('/admin', 'layout');
  return r;
}

/** Đổi giai đoạn (kéo thẻ Kanban), người phụ trách, lịch khảo sát, giá trị báo giá. */
export async function updateServiceRequestAction(input: unknown) {
  const staff = await requireAccess('services', 'full');
  const p = UpdateSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await updateServiceRequest(p.data, staffName(staff));
  if (r.ok) revalidatePath('/admin', 'layout');
  return r;
}

/** Ghi nhận cuộc gọi / ghi chú nội bộ vào lịch sử liên hệ. */
export async function addServiceNoteAction(input: unknown) {
  const staff = await requireAccess('services', 'full');
  const p = NoteSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await addServiceNote(p.data, staffName(staff));
  if (r.ok) revalidatePath('/admin', 'layout');
  return r;
}

/** Form báo giá của bản tiếng Anh (/en/wholesale) — lỗi trả bằng tiếng Anh. */
export async function createForeignInquiryAction(fd: FormData) {
  if (str(fd.get('website'))) return { ok: true as const, code: '' };
  const p = ForeignInquirySchema.safeParse({
    service: str(fd.get('service')), name: fd.get('name') ?? '', email: str(fd.get('email')) ?? '',
    phone: str(fd.get('phone')) ?? '', company: str(fd.get('company')), country: fd.get('country') ?? '', message: fd.get('message') ?? '',
  });
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await createForeignInquiry(p.data, await getCurrentUser());
  if (r.ok) {
    revalidatePath('/admin', 'layout');
    const d = p.data;
    alertShop(`🌐 Yêu cầu báo giá tiếng Anh ${r.code}`, [
      `${SERVICE_INFO[d.service].label}${d.company ? ` · ${d.company}` : ''} · ${d.country}`,
      `Liên hệ: ${d.name} · ${d.email}${d.phone ? ` · ${d.phone}` : ''}`,
      `Nội dung: ${d.message.slice(0, 600)}`,
    ], '/admin/dich-vu');
  }
  return r;
}
