'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { requireStaff, staffName } from '@/server/auth';
import { deleteFaq, FaqSchema, moveFaq, saveFaq, setFaqActive } from '@/server/faqs';

/** Câu riêng → chỉ trang sản phẩm đó; câu chung → mọi trang sản phẩm. */
function refresh(slug: string | null) {
  revalidatePath(slug ? `/san-pham/${slug}` : '/san-pham/[slug]', 'page');
  revalidatePath('/admin/danh-gia');
}

const Id = z.number().int().positive();

/** Nhân viên và admin đều quản lý Câu hỏi thường gặp (cùng trang Hỏi đáp & đánh giá). */
export async function saveFaqAction(input: unknown) {
  const staff = await requireStaff();
  const p = FaqSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const r = await saveFaq(p.data, staffName(staff));
  if (r.ok) refresh(r.slug);
  return r.ok ? { ok: true as const, id: r.id } : r;
}

export async function moveFaqAction(id: unknown, dir: unknown) {
  await requireStaff();
  const p = z.object({ id: Id, dir: z.union([z.literal(-1), z.literal(1)]) }).safeParse({ id, dir });
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await moveFaq(p.data.id, p.data.dir);
  if (!r) return { ok: false as const, error: 'Không tìm thấy câu hỏi thường gặp' };
  refresh(r.slug);
  return { ok: true as const };
}

export async function setFaqActiveAction(id: unknown, active: unknown) {
  await requireStaff();
  const p = z.object({ id: Id, active: z.boolean() }).safeParse({ id, active });
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await setFaqActive(p.data.id, p.data.active);
  if (!r) return { ok: false as const, error: 'Không tìm thấy câu hỏi thường gặp' };
  refresh(r.slug);
  return { ok: true as const };
}

export async function deleteFaqAction(id: unknown) {
  await requireStaff();
  const p = Id.safeParse(id);
  if (!p.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  const r = await deleteFaq(p.data);
  if (!r) return { ok: false as const, error: 'Không tìm thấy câu hỏi thường gặp' };
  refresh(r.slug);
  return { ok: true as const };
}
