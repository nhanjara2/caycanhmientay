import 'server-only';
import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm';
import { ASSIGNABLE_ROLES, effectiveRole, type StaffRole } from '@/lib/permissions';
import { isConfigAdmin, pendingInvite } from './auth';
import { db, schema } from './db';

const { users } = schema;

/** Tài khoản nhân viên + quản lý (admin Phân quyền). `users.id` viết thẳng vì truy vấn một bảng của Drizzle bỏ tên bảng → subquery hiểu nhầm cột. */
export async function listStaff() {
  const rows = await db.select({
    id: users.id, phone: users.phone, contactPhone: users.contactPhone, name: users.name, email: users.email,
    role: users.role, staffRole: users.staffRole, createdAt: users.createdAt, googleSub: users.googleSub,
    lastLogin: sql<Date | null>`(select max(s.created_at) from sessions s where s.user_id = users.id)`.mapWith((v) => (v ? new Date(v) : null)),
  }).from(users).where(inArray(users.role, ['staff', 'admin'])).orderBy(asc(users.role), asc(users.name), asc(users.id));
  /** login: 'google' đăng nhập được · 'invited' đã mời, chờ đăng nhập Google lần đầu · 'phone' tài khoản SĐT cũ (hết đăng nhập được từ khi bỏ OTP). */
  return rows.map(({ googleSub, ...r }) => ({
    ...r, effective: effectiveRole(r) as StaffRole, locked: isConfigAdmin(r),
    login: googleSub ? 'google' as const : r.phone ? 'phone' as const : 'invited' as const,
  }));
}
export type StaffRow = Awaited<ReturnType<typeof listStaff>>[number];

export type StaffResult = { ok: true } | { ok: false; error: string };

/** role: 'manager' = quản trị viên (role admin); còn lại = staff + vai trò. */
const grant = (role: StaffRole) => (role === 'manager' ? { role: 'admin' as const, staffRole: null } : { role: 'staff' as const, staffRole: role });

/**
 * Mời nhân viên bằng email Google: tạo sẵn một dòng `users` chỉ có email + vai trò (pendingInvite trong server/auth.ts).
 * Người đó đăng nhập Google đúng email này thì nhận quyền (finishGoogleLogin) — kể cả khi đã có tài khoản khách từ trước.
 * Không nâng quyền theo email trong hồ sơ của tài khoản sẵn có: email đó khách tự sửa được.
 * Chỉ gọi từ action của Quản lý.
 */
export async function inviteStaff(v: { email: string; name: string; role: StaffRole }): Promise<StaffResult> {
  const email = v.email.trim().toLowerCase();
  return db.transaction(async (tx): Promise<StaffResult> => {
    // Hai lần bấm cùng lúc không tạo hai lời mời cho một email.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`staff-invite:${email}`}))`);
    const [invited] = await tx.select({ id: users.id }).from(users).where(pendingInvite(email));
    if (invited) return { ok: false, error: 'Email này đã được mời — đổi vai trò ngay trong danh sách' };
    const [member] = await tx.select({ id: users.id }).from(users)
      .where(and(ne(users.role, 'customer'), sql`lower(${users.email}) = ${email}`));
    if (member) return { ok: false, error: 'Email này đã là nhân viên — đổi vai trò ngay trong danh sách' };
    await tx.insert(users).values({ email, name: v.name, ...grant(v.role) });
    return { ok: true };
  });
}

/** Đổi vai trò. Không đổi được của chính mình và của tài khoản quản trị cấu hình bằng ADMIN_EMAILS. */
export async function setStaffRole(id: number, role: StaffRole, actorId: number): Promise<StaffResult> {
  if (id === actorId) return { ok: false, error: 'Bạn không thể tự đổi vai trò của mình' };
  return db.transaction(async (tx): Promise<StaffResult> => {
    const [t] = await tx.select().from(users).where(eq(users.id, id)).for('update');
    if (!t || t.role === 'customer') return { ok: false, error: 'Không tìm thấy nhân viên' };
    if (isConfigAdmin(t)) return { ok: false, error: 'Tài khoản này được cấp quyền quản trị trong cấu hình hệ thống nên không đổi được ở đây' };
    await tx.update(users).set(grant(role)).where(eq(users.id, id));
    return { ok: true };
  });
}

/** Gỡ quyền nhân viên: tài khoản trở lại là khách bình thường (đơn hàng, điểm… giữ nguyên). Lời mời chưa ai nhận thì xóa hẳn. */
export async function removeStaff(id: number, actorId: number): Promise<StaffResult> {
  if (id === actorId) return { ok: false, error: 'Bạn không thể tự gỡ quyền của mình' };
  return db.transaction(async (tx): Promise<StaffResult> => {
    const [t] = await tx.select().from(users).where(eq(users.id, id)).for('update');
    if (!t || t.role === 'customer') return { ok: false, error: 'Không tìm thấy nhân viên' };
    if (isConfigAdmin(t)) return { ok: false, error: 'Tài khoản này được cấp quyền quản trị trong cấu hình hệ thống nên không gỡ được ở đây' };
    const [{ n }] = await tx.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(users).where(and(eq(users.role, 'admin'), ne(users.id, id)));
    if (t.role === 'admin' && n < 1) return { ok: false, error: 'Phải còn ít nhất một Quản lý' };
    if (!t.googleSub && !t.phone) await tx.delete(users).where(eq(users.id, id));
    else await tx.update(users).set({ role: 'customer', staffRole: null }).where(eq(users.id, id));
    return { ok: true };
  });
}

export const INVITE_ROLES = ['manager', ...ASSIGNABLE_ROLES] as const;
