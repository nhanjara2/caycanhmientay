import 'server-only';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cache } from 'react';
import { cleanGoogleAvatar } from '@/lib/avatar';
import { hasAccess, homeFor, type Area } from '@/lib/permissions';
import { MAX_PARTNER_DISCOUNT } from '@/lib/partners';
import { db, schema } from './db';
import type { Role } from './db/schema';
import { announceWelcome } from './vouchers';

const { users, sessions } = schema;

/** Lần đăng nhập đầu tiên (vừa tạo tài khoản khách): tặng quà tài khoản mới. Lỗi ở đây không được chặn đăng nhập. */
const welcomeNewCustomer = (user: { id: number; role: Role }) =>
  user.role === 'customer' ? announceWelcome(user.id).catch((e) => { console.error('[welcome]', e); return null; }) : Promise.resolve(null);

export const SESSION_COOKIE = 'ccmt_session';
const SESSION_DAYS = 30;

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
export const maskPhone = (p: string) => (p ? `${p.slice(0, 4)} xxx ${p.slice(-3)}` : '');

/** Email Google trong ADMIN_EMAILS (cách nhau bằng dấu phẩy) được cấp quyền admin khi đăng nhập. */
const envList = (name: string) => (process.env[name] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const adminEmails = () => envList('ADMIN_EMAILS').map((e) => e.toLowerCase());
/** Tài khoản được cấp quyền quản trị bằng biến môi trường (đăng nhập lại là tự lên admin) — không hạ quyền / gỡ được trên giao diện. */
export const isConfigAdmin = (u: { email: string | null }) => !!u.email && adminEmails().includes(u.email.toLowerCase());

// ---- Đăng nhập Google (OAuth 2.0 + PKCE) ----------------------------------------------------
// Cách đăng nhập DUY NHẤT (11/10/2026 bỏ đăng nhập SĐT + OTP: shop không đăng ký dịch vụ gửi mã).
// Google đã gắn → vào tài khoản đó; còn phiên của tài khoản SĐT cũ → gắn Google vào tài khoản đó;
// email được Quản lý mời làm nhân viên → nhận quyền (pendingInvite); còn lại tạo tài khoản mới không có SĐT
// (SĐT nhập lúc đặt hàng). Không tự gắn theo email trong hồ sơ (khách tự sửa được, chưa xác thực).

/**
 * Lời mời nhân viên đang chờ (inviteStaff trong server/staff.ts): dòng `users` chỉ có email + vai trò, chưa có Google
 * lẫn SĐT nên chưa ai đăng nhập được vào — tức email ở dòng này do Quản lý gõ, không phải khách tự sửa trong hồ sơ.
 */
export const pendingInvite = (email: string) =>
  and(isNull(users.googleSub), isNull(users.phone), ne(users.role, 'customer'), sql`lower(${users.email}) = ${email.toLowerCase()}`);

const GOOGLE_FLOW_COOKIE = 'ccmt_google_flow';
const GOOGLE_TTL_MS = 10 * 60 * 1000;

export type GoogleProfile = { sub: string; email: string; name: string | null; picture: string | null };

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

export type GoogleResult = { ok: true; next: string } | { ok: false; next: string; error: string };

/** Bước 2: Google trả về `code` → đổi lấy id_token → đăng nhập. */
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
    iss: string; aud: string; exp: number; sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string;
  };
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) || claims.aud !== process.env.GOOGLE_CLIENT_ID
    || claims.exp * 1000 < Date.now() || !claims.email || !claims.email_verified) {
    return { ok: false, next, error: 'google' };
  }
  const g: GoogleProfile = { sub: claims.sub, email: claims.email.toLowerCase(), name: claims.name?.trim() || null, picture: cleanGoogleAvatar(claims.picture) };

  const { user, isNew } = await signInGoogleProfile(g, await getCurrentUser());
  await createSession(user.id);
  // Google chuyển trang về `next` nên không hiện được hộp chào: quà chỉ báo qua chuông thông báo.
  if (isNew) await welcomeNewCustomer(user);
  return { ok: true, next };
}

/**
 * Tìm / tạo tài khoản cho một hồ sơ Google đã được Google xác thực (tách khỏi phần OAuth + cookie để kiểm thử được).
 * `current` = tài khoản đang đăng nhập trên trình duyệt này (null nếu chưa).
 */
export async function signInGoogleProfile(g: GoogleProfile, current: SessionUser | null) {
  let [user] = await db.select().from(users).where(eq(users.googleSub, g.sub));
  if (!user && current && !current.googleSub) {
    // Còn phiên của tài khoản SĐT cũ (tạo trước khi bỏ OTP): gắn Google vào tài khoản đó để giữ đơn hàng, điểm.
    [user] = await db.update(users)
      .set({ googleSub: g.sub, name: current.name ?? g.name, email: current.email ?? g.email, avatarUrl: g.picture })
      .where(and(eq(users.id, current.id), isNull(users.googleSub)))
      .returning();
  }
  // Email Google (đã được Google xác thực) trùng lời mời nhân viên: chưa có tài khoản thì lời mời thành tài khoản;
  // có rồi thì chuyển vai trò sang tài khoản đó rồi xóa lời mời (Quản lý giữ nguyên quyền).
  const [invite] = await db.select().from(users).where(pendingInvite(g.email));
  if (invite && !user) {
    [user] = await db.update(users)
      .set({ googleSub: g.sub, name: invite.name ?? g.name, avatarUrl: g.picture })
      .where(and(eq(users.id, invite.id), pendingInvite(g.email)))
      .returning();
  } else if (invite && user) {
    const target = user;
    [user] = await db.transaction(async (tx) => {
      const gone = await tx.delete(users).where(and(eq(users.id, invite.id), pendingInvite(g.email))).returning({ id: users.id });
      if (!gone.length || target.role === 'admin') return [target];
      return tx.update(users).set({ role: invite.role, staffRole: invite.staffRole, name: target.name ?? invite.name })
        .where(eq(users.id, target.id)).returning();
    });
  }
  let isNew = false;
  if (!user) {
    const created = await db.insert(users).values({ googleSub: g.sub, email: g.email, name: g.name, avatarUrl: g.picture }).onConflictDoNothing({ target: users.googleSub }).returning({ id: users.id });
    isNew = created.length > 0;
    [user] = await db.select().from(users).where(eq(users.googleSub, g.sub));
  }
  // Ảnh Google đổi được: cập nhật mỗi lần đăng nhập (Google không gửi ảnh thì giữ ảnh cũ).
  if (g.picture && user.avatarUrl !== g.picture) {
    [user] = await db.update(users).set({ avatarUrl: g.picture }).where(eq(users.id, user.id)).returning();
  }
  if (adminEmails().includes(g.email) && user.role !== 'admin') {
    [user] = await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id)).returning();
  }
  return { user, isNew };
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

export type SessionUser = Pick<typeof users.$inferSelect,
  'id' | 'phone' | 'contactPhone' | 'email' | 'googleSub' | 'avatarUrl' | 'name' | 'role' | 'staffRole' | 'points' | 'partnerType' | 'partnerStatus' | 'partnerDiscount'>;
const toSessionUser = ({ id, phone, contactPhone, email, googleSub, avatarUrl, name, role, staffRole, points, partnerType, partnerStatus, partnerDiscount }: typeof users.$inferSelect): SessionUser =>
  ({ id, phone, contactPhone, email, googleSub, avatarUrl, name, role, staffRole, points, partnerType, partnerStatus, partnerDiscount });

/** % chiết khấu đối tác đang áp dụng cho tài khoản (0 khi chưa được duyệt). */
export const partnerPct = (u: Pick<SessionUser, 'partnerStatus' | 'partnerDiscount'> | null) =>
  u?.partnerStatus === 'approved' ? Math.max(0, Math.min(MAX_PARTNER_DISCOUNT, u.partnerDiscount)) : 0;

/** SĐT để liên lạc: SĐT đã xác thực OTP (tài khoản cũ, trước 11/10/2026), không có thì SĐT khách tự khai. */
export const accountPhone = (u: Pick<SessionUser, 'phone' | 'contactPhone'>) => u.phone ?? u.contactPhone ?? null;

/** Người dùng của request hiện tại (gọi nhiều lần trong một request chỉ truy vấn một lần). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db.select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sha256(token)));
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return toSessionUser(row.user);
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

/**
 * Cửa vào từng chức năng của khu quản trị theo vai trò (lib/permissions.ts): `need = 'view'` cho trang xem,
 * `'full'` cho thao tác ghi. Không đủ quyền → về trang đầu tiên được phép (không phải trang đăng nhập).
 */
export async function requireAccess(area: Area, need: 'view' | 'full' = 'view') {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/dang-nhap');
  if (user.role === 'customer') redirect('/admin/dang-nhap?khong-du-quyen=1');
  if (!hasAccess(user, area, need)) redirect(`${homeFor(user)}?khong-du-quyen=1`);
  return user;
}

/** Tên ghi vào lịch sử khi nhân viên thao tác. */
export const staffName = (u: SessionUser) => {
  const phone = accountPhone(u);
  return u.name ?? (phone ? `NV ${phone.slice(-3)}` : u.email ?? 'Nhân viên');
};

/** Bản hiển thị gửi về trình duyệt của chính người đó. */
export const publicUser = (u: SessionUser) => ({
  name: u.name ?? 'Khách hàng',
  /** SĐT che bớt, hoặc email khi tài khoản Google chưa khai SĐT. */
  phoneMasked: accountPhone(u) ? maskPhone(accountPhone(u)!) : u.email ?? '',
  /** SĐT đầy đủ (điền sẵn ở thanh toán, sổ địa chỉ); '' = chưa có → phải khai trước khi đặt hàng. */
  phone: accountPhone(u) ?? '',
  /** SĐT đã xác thực OTP thì khóa, không cho sửa. */
  phoneVerified: Boolean(u.phone),
  initials: (u.name ?? 'Khách hàng').split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase(),
  /** Ảnh Google của chính người đó; null = hiện chữ cái đầu (initials). */
  avatarUrl: u.avatarUrl ?? null,
  role: u.role,
  staffRole: u.staffRole ?? null,
  points: u.points,
  /** Đối tác sỉ: loại + trạng thái duyệt; `discount` = % đang áp dụng (0 khi chưa duyệt). */
  partner: u.partnerType ? { type: u.partnerType, status: u.partnerStatus ?? 'pending', discount: partnerPct(u) } : null,
});
export type PublicUser = ReturnType<typeof publicUser>;
