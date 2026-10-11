'use server';

import { eq } from 'drizzle-orm';
import * as z from 'zod';
import * as auth from '@/server/auth';
import { db, schema } from '@/server/db';
import { welcomeProgram } from '@/server/vouchers';

// Server action = endpoint công khai: luôn kiểm tra đầu vào và quyền ngay trong hàm.

export async function meAction() {
  const u = await auth.getCurrentUser();
  return u ? auth.publicUser(u) : null;
}

/**
 * Đăng nhập Google đã bật chưa (có GOOGLE_CLIENT_ID/SECRET) + quà tài khoản mới đang chạy (null = không có)
 * để hộp đăng nhập ghi đúng số tiền / điều kiện.
 */
export async function loginOptionsAction() {
  const welcome = await welcomeProgram().catch(() => null);
  return { google: auth.googleEnabled(), welcome };
}

export async function logoutAction() {
  await auth.destroySession();
}

const PhoneSchema = z.string().trim().max(20).refine(auth.isPhone, 'Số điện thoại chưa đúng').transform(auth.normalizePhone);

const ProfileSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự').max(80),
  email: z.union([z.literal(''), z.email('Email chưa đúng')]).optional(),
  phone: z.string().optional(),
});

export async function updateProfileAction(input: unknown) {
  const user = await auth.getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  const p = ProfileSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  // SĐT đã xác thực OTP (tài khoản cũ) thì giữ nguyên; tài khoản Google phải khai SĐT liên hệ (không cần xác thực).
  let contactPhone = user.contactPhone;
  if (!user.phone) {
    const ph = PhoneSchema.safeParse(p.data.phone ?? '');
    if (!ph.success) return { ok: false as const, error: p.data.phone?.trim() ? ph.error.issues[0].message : 'Vui lòng nhập số điện thoại' };
    contactPhone = ph.data;
  }
  const [u] = await db.update(schema.users)
    .set({ name: p.data.name, email: p.data.email || null, contactPhone })
    .where(eq(schema.users.id, user.id)).returning();
  return { ok: true as const, user: auth.publicUser(u) };
}

/** Khai SĐT liên hệ (hộp nhắc sau khi đăng nhập Google) — không gửi OTP. */
export async function setContactPhoneAction(phone: unknown) {
  const user = await auth.getCurrentUser();
  if (!user) return { ok: false as const, error: 'Vui lòng đăng nhập' };
  if (user.phone) return { ok: true as const, user: auth.publicUser(user) };
  const p = PhoneSchema.safeParse(phone);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const [u] = await db.update(schema.users).set({ contactPhone: p.data }).where(eq(schema.users.id, user.id)).returning();
  return { ok: true as const, user: auth.publicUser(u) };
}
