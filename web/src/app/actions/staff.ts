'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { INVITE_ROLES, inviteStaff, removeStaff, setStaffRole } from '@/server/staff';
import { requireStaff } from '@/server/auth';

// Phân quyền: chỉ Quản lý (role admin). Kiểm tra quyền trước, rồi mới kiểm tra đầu vào.

const role = z.enum(INVITE_ROLES, 'Chọn vai trò');
const refresh = () => revalidatePath('/admin/phan-quyen');

export async function inviteStaffAction(input: unknown) {
  await requireStaff('admin');
  const p = z.object({
    email: z.email('Email chưa đúng').max(120),
    name: z.string().trim().min(2, 'Nhập tên nhân viên').max(60),
    role,
  }).safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await inviteStaff(p.data);
  if (r.ok) refresh();
  return r;
}

export async function setStaffRoleAction(id: unknown, newRole: unknown) {
  const me = await requireStaff('admin');
  const p = z.object({ id: z.number().int().positive(), role }).safeParse({ id, role: newRole });
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await setStaffRole(p.data.id, p.data.role, me.id);
  if (r.ok) refresh();
  return r;
}

export async function removeStaffAction(id: unknown) {
  const me = await requireStaff('admin');
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await removeStaff(p.data, me.id);
  if (r.ok) refresh();
  return r;
}
