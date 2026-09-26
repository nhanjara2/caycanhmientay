'use server';

import { eq } from 'drizzle-orm';
import * as z from 'zod';
import * as auth from '@/server/auth';
import { db, schema } from '@/server/db';

// Server action = endpoint công khai: luôn kiểm tra đầu vào và quyền ngay trong hàm.

export async function requestOtpAction(phone: unknown) {
  const p = z.string().max(20).safeParse(phone);
  if (!p.success) return { ok: false as const, error: 'Số điện thoại chưa đúng' };
  return auth.requestOtp(p.data);
}

export async function verifyOtpAction(phone: unknown, code: unknown) {
  const p = z.object({ phone: z.string().max(20), code: z.string().max(6) }).safeParse({ phone, code });
  if (!p.success) return { ok: false as const, error: 'Mã xác thực chưa đúng' };
  const r = await auth.verifyOtp(p.data.phone, p.data.code);
  if (!r.ok) return r;
  return { ok: true as const, user: auth.publicUser(r.user) };
}

export async function meAction() {
  const u = await auth.getCurrentUser();
  return u ? auth.publicUser(u) : null;
}

export async function logoutAction() {
  await auth.destroySession();
}

const ProfileSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự').max(80),
  email: z.union([z.literal(''), z.email('Email chưa đúng')]).optional(),
});

export async function updateProfileAction(input: unknown) {
  const user = await auth.getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = ProfileSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const [u] = await db.update(schema.users).set({ name: p.data.name, email: p.data.email || null }).where(eq(schema.users.id, user.id)).returning();
  return { ok: true as const, user: auth.publicUser(u) };
}
