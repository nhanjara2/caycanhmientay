import 'server-only';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { cache } from 'react';
import { db, schema } from './db';
import type { Role } from './db/schema';

const { users, sessions, otpCodes } = schema;

export const SESSION_COOKIE = 'ccmt_session';
const SESSION_DAYS = 30;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_PER_HOUR = 5;
const OTP_MAX_ATTEMPTS = 5;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('Thiếu biến môi trường AUTH_SECRET');
  return 'dev-only-secret-khong-dung-cho-production';
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const hmac = (s: string) => createHmac('sha256', secret()).update(s).digest('hex');

export const normalizePhone = (s: string) => s.replace(/[^\d+]/g, '').replace(/^\+?84/, '0');
export const isPhone = (s: string) => /^0(3|5|7|8|9)\d{8}$/.test(normalizePhone(s));
export const maskPhone = (p: string) => `${p.slice(0, 4)} xxx ${p.slice(-3)}`;

/** SĐT trong ADMIN_PHONES (cách nhau bằng dấu phẩy) được cấp quyền admin khi đăng nhập. */
const adminPhones = () => (process.env.ADMIN_PHONES ?? '').split(',').map((p) => normalizePhone(p.trim())).filter(Boolean);

// ---- OTP -------------------------------------------------------------------------------------

export type OtpRequestResult = { ok: true; devCode?: string } | { ok: false; error: string; retryAfter?: number };

export async function requestOtp(rawPhone: string): Promise<OtpRequestResult> {
  if (!isPhone(rawPhone)) return { ok: false, error: 'Số điện thoại chưa đúng' };
  const phone = normalizePhone(rawPhone);
  const now = Date.now();

  const recent = db.select().from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, new Date(now - 60 * 60 * 1000))))
    .all();
  const last = recent.reduce<number>((m, r) => Math.max(m, r.createdAt.getTime()), 0);
  if (now - last < OTP_RESEND_MS) {
    return { ok: false, error: 'Vui lòng đợi trước khi gửi lại mã', retryAfter: Math.ceil((OTP_RESEND_MS - (now - last)) / 1000) };
  }
  if (recent.length >= OTP_MAX_PER_HOUR) return { ok: false, error: 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 1 giờ.' };

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  // Mã mới thay mã cũ: mã cũ chưa dùng hết hiệu lực ngay.
  db.update(otpCodes).set({ consumedAt: new Date(now) }).where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt))).run();
  db.insert(otpCodes).values({ phone, codeHash: hmac(`${phone}:${code}`), expiresAt: new Date(now + OTP_TTL_MS) }).run();
  await sendOtp(phone, code);
  // Chỉ khi chạy dev: trả mã về để thử nghiệm không cần Zalo/SMS.
  return { ok: true, devCode: process.env.NODE_ENV === 'production' ? undefined : code };
}

/** Gửi OTP qua Zalo ZNS, SMS dự phòng. TODO: nối nhà cung cấp thật (ZNS template, SMS brandname). */
async function sendOtp(phone: string, code: string) {
  if (process.env.NODE_ENV === 'production' && !process.env.OTP_PROVIDER) {
    throw new Error('Chưa cấu hình nhà cung cấp OTP (OTP_PROVIDER)');
  }
  console.info(`[OTP] ${maskPhone(phone)}: ${code}`);
}

export type VerifyResult = { ok: true; user: SessionUser } | { ok: false; error: string };

export async function verifyOtp(rawPhone: string, code: string): Promise<VerifyResult> {
  const phone = normalizePhone(rawPhone);
  if (!isPhone(phone) || !/^\d{6}$/.test(code)) return { ok: false, error: 'Mã xác thực chưa đúng' };

  const otp = db.select().from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.expiresAt, new Date()), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.id))
    .get();
  if (!otp) return { ok: false, error: 'Mã đã hết hạn. Vui lòng gửi lại mã.' };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, error: 'Nhập sai quá nhiều lần. Vui lòng gửi lại mã.' };

  const a = Buffer.from(otp.codeHash, 'hex');
  const b = Buffer.from(hmac(`${phone}:${code}`), 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id)).run();
    return { ok: false, error: 'Mã xác thực chưa đúng' };
  }
  db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id)).run();

  // Tài khoản định danh bằng SĐT: chưa có thì tạo mới, có rồi thì đăng nhập vào tài khoản đó.
  let user = db.select().from(users).where(eq(users.phone, phone)).get();
  if (!user) user = db.insert(users).values({ phone }).returning().get();
  if (adminPhones().includes(phone) && user.role !== 'admin') {
    user = db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id)).returning().get();
  }
  await createSession(user.id);
  return { ok: true, user: { id: user.id, phone: user.phone, name: user.name, role: user.role, points: user.points } };
}

// ---- Phiên đăng nhập -------------------------------------------------------------------------

async function createSession(userId: number) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.insert(sessions).values({ id: sha256(token), userId, expiresAt }).run();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) db.delete(sessions).where(eq(sessions.id, sha256(token))).run();
  store.delete(SESSION_COOKIE);
}

export type SessionUser = { id: number; phone: string; name: string | null; role: Role; points: number };

/** Người dùng của request hiện tại (gọi nhiều lần trong một request chỉ truy vấn một lần). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db.select({ id: users.id, phone: users.phone, name: users.name, role: users.role, points: users.points, expiresAt: sessions.expiresAt })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sha256(token))).get();
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  const { expiresAt: _e, ...user } = row;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/?dang-nhap=1');
  return user;
}

/** Nhân viên & admin. Dùng trong trang/server action của khu quản trị. */
export async function requireStaff(minRole: 'staff' | 'admin' = 'staff') {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/dang-nhap');
  const ok = minRole === 'staff' ? user.role === 'staff' || user.role === 'admin' : user.role === 'admin';
  if (!ok) redirect('/admin/dang-nhap?khong-du-quyen=1');
  return user;
}

export const publicUser = (u: SessionUser) => ({
  name: u.name ?? 'Khách hàng',
  phoneMasked: maskPhone(u.phone),
  initials: (u.name ?? 'Khách hàng').split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase(),
  role: u.role,
  points: u.points,
});
export type PublicUser = ReturnType<typeof publicUser>;
