import 'server-only';
import { eq } from 'drizzle-orm';
import { cache } from 'react';
import { normalizeRental, parseRental, RENTAL_KEY, RentalConfigSchema, type RentalConfig } from '@/lib/office-rental';
import { db, schema } from './db';

const { appSettings } = schema;

/** Bảng giá + gói thuê cây văn phòng (chưa lưu / hỏng → mặc định). */
export const getRentalConfig = cache(async (): Promise<RentalConfig> => {
  const [r] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, RENTAL_KEY));
  return parseRental(r?.value);
});

export async function saveRentalConfig(raw: unknown, actor: string): Promise<{ ok: true; config: RentalConfig } | { ok: false; error: string }> {
  const p = RentalConfigSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message || 'Cài đặt chưa hợp lệ' };
  const value = normalizeRental(p.data);
  await db.insert(appSettings).values({ key: RENTAL_KEY, value, updatedBy: actor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: actor, updatedAt: new Date() } });
  return { ok: true, config: value };
}

export async function rentalMeta() {
  const [r] = await db.select({ by: appSettings.updatedBy, at: appSettings.updatedAt }).from(appSettings).where(eq(appSettings.key, RENTAL_KEY));
  return r ?? null;
}
