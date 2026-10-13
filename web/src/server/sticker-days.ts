import 'server-only';
import { eq } from 'drizzle-orm';
import { DEFAULT_STICKER_DAYS, parseStickerDays, StickerDayConfigSchema, type StickerDayConfig } from '@/lib/sticker-days';
import { db, schema } from './db';

const { appSettings } = schema;
const KEY = 'sticker-days';

/** Cấu hình ngày đặc biệt hiện hành (thiếu / hỏng → mặc định: ngày đôi mỗi tháng). */
export async function getStickerDays(): Promise<StickerDayConfig> {
  const [r] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, KEY));
  return r ? parseStickerDays(r.value) : DEFAULT_STICKER_DAYS;
}

export async function stickerDaysMeta() {
  const [r] = await db.select({ by: appSettings.updatedBy, at: appSettings.updatedAt }).from(appSettings).where(eq(appSettings.key, KEY));
  return r ?? null;
}

export async function saveStickerDays(raw: unknown, actor: string): Promise<{ ok: true; config: StickerDayConfig } | { ok: false; error: string }> {
  const p = StickerDayConfigSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message || 'Danh sách ngày chưa hợp lệ' };
  const value = parseStickerDays(p.data);
  await db.insert(appSettings).values({ key: KEY, value, updatedBy: actor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: actor, updatedAt: new Date() } });
  return { ok: true, config: value };
}
