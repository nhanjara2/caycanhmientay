import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { cache } from 'react';
import { eventOf, EVENT_KEYS, renderText, sampleVars, TEXT_MAX, unknownVars } from '@/lib/message-templates';
import { db, schema } from './db';

const { messageTemplates: MT, outboundMessages: OUT } = schema;

export type TemplateRow = { key: string; text: string; inApp: boolean; external: boolean; updatedBy: string | null; updatedAt: Date };

/** Mẫu đã chỉnh trong database (key → mẫu); sự kiện chưa chỉnh dùng nội dung mặc định. Một request chỉ đọc một lần. */
export const customTemplates = cache(async () => new Map((await db.select().from(MT)).map((r) => [r.key, r as TemplateRow])));

/** Nội dung + cờ gửi của một sự kiện (mẫu đã chỉnh, không có thì mặc định). */
export async function resolveEvent(key: string) {
  const def = eventOf(key);
  if (!def) return null;
  const c = (await customTemplates()).get(key);
  return { def, text: c?.text ?? def.text, inApp: c?.inApp ?? true, external: c?.external ?? def.external, custom: !!c };
}

export async function renderEvent(key: string, vars: Record<string, string | number | undefined>) {
  const r = await resolveEvent(key);
  return r ? { ...r, rendered: renderText(r.text, vars) } : null;
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveTemplate(key: string, v: { text: string; inApp: boolean; external: boolean }, actor: string): Promise<SaveResult> {
  const def = eventOf(key);
  if (!def) return { ok: false, error: 'Không tìm thấy mẫu' };
  const text = v.text.trim();
  if (text.length < 5) return { ok: false, error: 'Nội dung tin quá ngắn' };
  if (text.length > TEXT_MAX) return { ok: false, error: `Nội dung tối đa ${TEXT_MAX} ký tự` };
  const bad = unknownVars(text, def.vars);
  if (bad.length) return { ok: false, error: `Biến không dùng được trong mẫu này: ${bad.map((b) => `{${b}}`).join(', ')}` };
  await db.insert(MT).values({ key, text, inApp: v.inApp, external: v.external, updatedBy: actor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: MT.key, set: { text, inApp: v.inApp, external: v.external, updatedBy: actor, updatedAt: new Date() } });
  return { ok: true };
}

/** Khôi phục nội dung mặc định (xóa mẫu đã chỉnh). */
export async function resetTemplate(key: string) {
  if (!EVENT_KEYS.includes(key)) return false;
  await db.delete(MT).where(eq(MT.key, key));
  return true;
}

export const previewText = (text: string) => renderText(text, sampleVars());

export const recentOutboundLog = (limit = 60) => db.select().from(OUT).orderBy(desc(OUT.id)).limit(limit);

/** Đã cấu hình kênh gửi ngoài chưa (xem notify.ts). */
export const channelStatus = () => ({
  zalo: Boolean(process.env.ZALO_ZNS_ACCESS_TOKEN && process.env.ZALO_ZNS_TEMPLATE_ID),
  email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
});
