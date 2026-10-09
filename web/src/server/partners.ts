import 'server-only';
import { and, count, eq } from 'drizzle-orm';
import * as z from 'zod';
import { MAX_PARTNER_DISCOUNT, PARTNER_INFO, PARTNER_STATUSES, PARTNER_TYPES } from '@/lib/partners';
import type { SessionUser } from './auth';
import { db, schema } from './db';

const { users } = schema;

/** Hồ sơ đối tác của một tài khoản (trang /doi-tac, form báo giá, admin Khách hàng). */
export async function getPartnerProfile(userId: number) {
  const [u] = await db.select({
    type: users.partnerType, status: users.partnerStatus, discount: users.partnerDiscount,
    company: users.company, taxCode: users.taxCode, area: users.partnerArea, at: users.partnerAt,
  }).from(users).where(eq(users.id, userId));
  return u ?? null;
}
export type PartnerProfile = NonNullable<Awaited<ReturnType<typeof getPartnerProfile>>>;

export const ApplySchema = z.object({
  type: z.enum(PARTNER_TYPES, 'Chọn bạn là đối tác nào'),
  company: z.string().trim().max(120).optional(),
  taxCode: z.string().trim().regex(/^[0-9-]{10,14}$/, 'Mã số thuế gồm 10 hoặc 13 số').optional().or(z.literal('')),
  area: z.string().trim().min(2, 'Nhập khu vực hoạt động').max(120),
});

/**
 * Khách tự đăng ký làm đối tác: lưu loại + thông tin đơn vị, trạng thái "Chờ duyệt".
 * Đã được duyệt thì chỉ cập nhật thông tin, không đổi loại / chiết khấu (việc đó admin làm).
 */
export async function applyPartner(user: SessionUser, input: z.infer<typeof ApplySchema>) {
  const approved = user.partnerStatus === 'approved';
  await db.update(users).set({
    ...(approved ? {} : { partnerType: input.type, partnerStatus: 'pending' as const, partnerAt: new Date() }),
    company: input.company || null, taxCode: input.taxCode || null, partnerArea: input.area,
  }).where(eq(users.id, user.id));
  return { ok: true as const, approved };
}

export const AdminPartnerSchema = z.object({
  userId: z.number().int().positive(),
  /** null = gỡ khỏi danh sách đối tác (về khách thường). */
  type: z.enum(PARTNER_TYPES).nullable(),
  status: z.enum(PARTNER_STATUSES),
  discount: z.number().int().min(0, 'Chiết khấu không được âm').max(MAX_PARTNER_DISCOUNT, `Chiết khấu tối đa ${MAX_PARTNER_DISCOUNT}%`),
  company: z.string().trim().max(120),
  taxCode: z.string().trim().max(14),
  area: z.string().trim().max(120),
});

/** Admin duyệt / sửa đối tác. Gỡ loại đối tác thì xóa trạng thái + chiết khấu (giữ tên đơn vị để tra cứu). */
export async function setPartner(input: z.infer<typeof AdminPartnerSchema>) {
  const [cur] = await db.select({ type: users.partnerType, status: users.partnerStatus }).from(users).where(eq(users.id, input.userId));
  if (!cur) return { ok: false as const, error: 'Không tìm thấy khách hàng' };
  await db.update(users).set(input.type
    ? {
      partnerType: input.type, partnerStatus: input.status, partnerDiscount: input.discount,
      company: input.company || null, taxCode: input.taxCode || null, partnerArea: input.area || null,
      ...(cur.status !== input.status || cur.type !== input.type ? { partnerAt: new Date() } : {}),
    }
    : { partnerType: null, partnerStatus: null, partnerDiscount: 0, partnerAt: null, company: input.company || null, taxCode: input.taxCode || null, partnerArea: input.area || null },
  ).where(eq(users.id, input.userId));
  return { ok: true as const, label: input.type ? PARTNER_INFO[input.type].label : null };
}

/** Số đối tác đang chờ duyệt (số trên menu admin Khách hàng). */
export async function countPendingPartners() {
  const [r] = await db.select({ n: count() }).from(users).where(and(eq(users.partnerStatus, 'pending'), eq(users.role, 'customer')));
  return r?.n ?? 0;
}
