import 'server-only';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
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

  const recent = await db.select().from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, new Date(now - 60 * 60 * 1000))));
  const last = recent.reduce<number>((m, r) => Math.max(m, r.createdAt.getTime()), 0);
  if (now - last < OTP_RESEND_MS) {
    return { ok: false, error: 'Vui lòng đợi trước khi gửi lại mã', retryAfter: Math.ceil((OTP_RESEND_MS - (now - last)) / 1000) };
  }
  if (recent.length >= OTP_MAX_PER_HOUR) return { ok: false, error: 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 1 giờ.' };

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  // Mã mới thay mã cũ: mã cũ chưa dùng hết hiệu lực ngay.
  await db.update(otpCodes).set({ consumedAt: new Date(now) }).where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt)));
  await db.insert(otpCodes).values({ phone, codeHash: hmac(`${phone}:${code}`), expiresAt: new Date(now + OTP_TTL_MS) });
  await sendOtp(phone, code);
  // Chạy dev, hoặc OTP_DEMO=1 khi chưa có nhà cung cấp OTP: trả mã về để thử nghiệm không cần Zalo/SMS.
  return { ok: true, devCode: showCode() ? code : undefined };
}

/**
 * OTP_DEMO=1: hiện mã ngay trong hộp đăng nhập (chỉ để chạy thử trên Vercel khi chưa nối Zalo/SMS).
 * Ai biết SĐT cũng đăng nhập được — TẮT trước khi mở bán thật.
 */
const showCode = () => process.env.NODE_ENV !== 'production' || process.env.OTP_DEMO === '1';

/** Gửi OTP qua Zalo ZNS, SMS dự phòng. TODO: nối nhà cung cấp thật (ZNS template, SMS brandname). */
async function sendOtp(phone: string, code: string) {
  if (!showCode() && !process.env.OTP_PROVIDER) {
    throw new Error('Chưa cấu hình nhà cung cấp OTP (OTP_PROVIDER)');
  }
  console.info(`[OTP] ${maskPhone(phone)}: ${code}`);
}

export type VerifyResult = { ok: true; user: SessionUser } | { ok: false; error: string };

export async function verifyOtp(rawPhone: string, code: string): Promise<VerifyResult> {
  const phone = normalizePhone(rawPhone);
  if (!isPhone(phone) || !/^\d{6}$/.test(code)) return { ok: false, error: 'Mã xác thực chưa đúng' };

  const [otp] = await db.select().from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.expiresAt, new Date()), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.id))
    .limit(1);
  if (!otp) return { ok: false, error: 'Mã đã hết hạn. Vui lòng gửi lại mã.' };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, error: 'Nhập sai quá nhiều lần. Vui lòng gửi lại mã.' };

  const a = Buffer.from(otp.codeHash, 'hex');
  const b = Buffer.from(hmac(`${phone}:${code}`), 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await db.update(otpCodes).set({ attempts: sql`${otpCodes.attempts} + 1` }).where(eq(otpCodes.id, otp.id));
    return { ok: false, error: 'Mã xác thực chưa đúng' };
  }
  // Chỉ một request dùng được mã (hai lần bấm cùng lúc không tạo hai phiên).
  const used = await db.update(otpCodes).set({ consumedAt: new Date() })
    .where(and(eq(otpCodes.id, otp.id), isNull(otpCodes.consumedAt))).returning({ id: otpCodes.id });
  if (!used.length) return { ok: false, error: 'Mã đã được sử dụng. Vui lòng gửi lại mã.' };

  // Tài khoản định danh bằng SĐT: chưa có thì tạo mới, có rồi thì đăng nhập vào tài khoản đó.
  await db.insert(users).values({ phone }).onConflictDoNothing({ target: users.phone });
  let [user] = await db.select().from(users).where(eq(users.phone, phone));
  if (adminPhones().includes(phone) && user.role !== 'admin') {
    [user] = await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id)).returning();
  }
  // Vừa đăng nhập Google mà chưa gắn tài khoản: SĐT vừa xác thực chính là tài khoản để gắn.
  const google = await takePendingGoogle();
  if (google) user = await linkGoogle(user, google);
  await createSession(user.id);
  return { ok: true, user: { id: user.id, phone: user.phone, name: user.name, role: user.role, points: user.points } };
}

// ---- Đăng nhập Google (OAuth 2.0 + PKCE) ----------------------------------------------------
// Tài khoản vẫn định danh bằng SĐT: lần đầu đăng nhập Google phải xác thực SĐT một lần để gắn;
// các lần sau Google đăng nhập thẳng. Không tự gắn theo email (email trong hồ sơ chưa được xác thực).

const GOOGLE_FLOW_COOKIE = 'ccmt_google_flow';
const GOOGLE_LINK_COOKIE = 'ccmt_google_link';
const GOOGLE_TTL_MS = 10 * 60 * 1000;

type GoogleProfile = { sub: string; email: string; name: string | null };

export const googleEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const googleRedirectUri = (origin: string) => `${origin}/api/auth/google/callback`;

/** Cookie có chữ ký HMAC + hạn dùng (client đọc được nhưng không sửa được). */
function seal(data: object) {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + GOOGLE_TTL_MS })).toString('base64url');
  return `${body}.${hmac(body)}`;
}
function unseal<T>(value: string | undefined): T | null {
  const [body, sig] = value?.split('.') ?? [];
  if (!body || !sig) return null;
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(hmac(body), 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const data = JSON.parse(Buffer.from(body, 'base64url').toString()) as T & { exp: number };
  return data.exp > Date.now() ? data : null;
}
const shortCookie = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: GOOGLE_TTL_MS / 1000 };

/** Chỉ cho quay về đường dẫn trong site (chặn open redirect). */
export const safeNext = (next: string | null | undefined) => (next && /^\/(?![/\\])/.test(next) ? next : '/');

/** Bước 1: tạo state + PKCE, trả về URL trang đồng ý của Google. */
export async function startGoogleLogin(origin: string, next: string) {
  const state = randomBytes(16).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  (await cookies()).set(GOOGLE_FLOW_COOKIE, seal({ state, verifier, next: safeNext(next) }), shortCookie);
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(origin),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return url.toString();
}

export type GoogleResult =
  | { ok: true; next: string; linked: boolean } // linked=false: cần xác thực SĐT để gắn
  | { ok: false; next: string; error: string };

/** Bước 2: Google trả về `code` → đổi lấy id_token → đăng nhập hoặc chờ gắn SĐT. */
export async function finishGoogleLogin(origin: string, params: URLSearchParams): Promise<GoogleResult> {
  const store = await cookies();
  const flow = unseal<{ state: string; verifier: string; next: string }>(store.get(GOOGLE_FLOW_COOKIE)?.value);
  store.delete(GOOGLE_FLOW_COOKIE);
  const next = flow?.next ?? '/';
  const code = params.get('code');
  if (params.get('error')) return { ok: false, next, error: 'huy' }; // người dùng bấm Hủy
  if (!flow || !code || params.get('state') !== flow.state) return { ok: false, next, error: 'phien' };

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(origin),
      grant_type: 'authorization_code',
      code_verifier: flow.verifier,
    }),
  });
  const tok = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string };
  if (!res.ok || !tok.id_token) {
    console.error('[google] đổi code thất bại', res.status, tok.error);
    return { ok: false, next, error: 'google' };
  }
  // id_token nhận trực tiếp từ Google qua HTTPS nên không cần kiểm chữ ký; vẫn kiểm tra người nhận + hạn.
  const claims = JSON.parse(Buffer.from(tok.id_token.split('.')[1], 'base64url').toString()) as {
    iss: string; aud: string; exp: number; sub: string; email?: string; email_verified?: boolean; name?: string;
  };
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) || claims.aud !== process.env.GOOGLE_CLIENT_ID
    || claims.exp * 1000 < Date.now() || !claims.email || !claims.email_verified) {
    return { ok: false, next, error: 'google' };
  }
  const profile: GoogleProfile = { sub: claims.sub, email: claims.email, name: claims.name?.trim() || null };

  const [owner] = await db.select().from(users).where(eq(users.googleSub, profile.sub));
  if (owner) {
    await createSession(owner.id);
    return { ok: true, next, linked: true };
  }
  // Đang đăng nhập bằng SĐT rồi thì gắn luôn vào tài khoản hiện tại.
  const current = await getCurrentUser();
  if (current) {
    const [u] = await db.select().from(users).where(eq(users.id, current.id));
    await linkGoogle(u, profile);
    return { ok: true, next, linked: true };
  }
  store.set(GOOGLE_LINK_COOKIE, seal(profile), shortCookie);
  return { ok: true, next, linked: false };
}

/** Email Google đang chờ gắn (để hộp đăng nhập nhắc "xác thực SĐT để hoàn tất"). */
export async function pendingGoogleEmail() {
  return unseal<GoogleProfile>((await cookies()).get(GOOGLE_LINK_COOKIE)?.value)?.email ?? null;
}

async function takePendingGoogle() {
  const store = await cookies();
  const p = unseal<GoogleProfile>(store.get(GOOGLE_LINK_COOKIE)?.value);
  if (p) store.delete(GOOGLE_LINK_COOKIE);
  return p;
}

async function linkGoogle(user: typeof users.$inferSelect, g: GoogleProfile) {
  if (user.googleSub) return user; // đã gắn tài khoản Google khác: giữ nguyên
  const [u] = await db.update(users)
    .set({ googleSub: g.sub, name: user.name ?? g.name, email: user.email ?? g.email })
    .where(and(eq(users.id, user.id), isNull(users.googleSub)))
    .returning();
  return u ?? user;
}

// ---- Phiên đăng nhập -------------------------------------------------------------------------

async function createSession(userId: number) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
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
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  store.delete(SESSION_COOKIE);
}

export type SessionUser = { id: number; phone: string; name: string | null; role: Role; points: number };

/** Người dùng của request hiện tại (gọi nhiều lần trong một request chỉ truy vấn một lần). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db.select({ id: users.id, phone: users.phone, name: users.name, role: users.role, points: users.points, expiresAt: sessions.expiresAt })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sha256(token)));
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
