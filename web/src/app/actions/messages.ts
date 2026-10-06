'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { eventOf, EVENT_KEYS, renderText, sampleVars, TEXT_MAX } from '@/lib/message-templates';
import { requireAccess, staffName } from '@/server/auth';
import { db } from '@/server/db';
import { resolveEvent, resetTemplate, saveTemplate } from '@/server/messages';
import { notify } from '@/server/notify';

// Mẫu tin nhắn: chỉ Quản lý (khu "Cài đặt").

const key = z.string().refine((k) => EVENT_KEYS.includes(k), 'Không tìm thấy mẫu');
const refresh = () => revalidatePath('/admin/mau-tin-nhan');

export async function saveTemplateAction(k: unknown, input: unknown) {
  const me = await requireAccess('settings', 'full');
  const p = z.object({ k: key, v: z.object({ text: z.string().max(TEXT_MAX + 50), inApp: z.boolean(), external: z.boolean() }) }).safeParse({ k, v: input });
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message || 'Dữ liệu chưa hợp lệ' };
  const r = await saveTemplate(p.data.k, p.data.v, staffName(me));
  if (r.ok) refresh();
  return r;
}

export async function resetTemplateAction(k: unknown) {
  await requireAccess('settings', 'full');
  const p = key.safeParse(k);
  if (!p.success) return { ok: false as const, error: 'Không tìm thấy mẫu' };
  await resetTemplate(p.data);
  refresh();
  return { ok: true as const };
}

/** Gửi thử: tin hiện trong chuông của chính bạn (dữ liệu mẫu) và thử gửi Zalo / email tới tài khoản của bạn — kết quả ở tab Nhật ký gửi. */
export async function sendTestTemplateAction(k: unknown) {
  const me = await requireAccess('settings', 'full');
  const p = key.safeParse(k);
  if (!p.success) return { ok: false as const, error: 'Không tìm thấy mẫu' };
  const r = await resolveEvent(p.data);
  const def = eventOf(p.data);
  if (!r || !def) return { ok: false as const, error: 'Không tìm thấy mẫu' };
  await notify(db, me.id, { kind: def.kind, text: `[Gửi thử] ${renderText(r.text, sampleVars())}`, href: '/tai-khoan', external: true });
  refresh();
  return { ok: true as const };
}
