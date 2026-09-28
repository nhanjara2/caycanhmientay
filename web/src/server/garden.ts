import 'server-only';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import * as z from 'zod';
import { mainImageOf } from './catalog';
import { db, schema } from './db';
import type { SessionUser } from './auth';
import { saveImage } from './uploads';
import { FERTILIZE_INTERVAL_DAYS, GARDEN_STATUS_LABEL, nextDue, WATER_INTERVAL_DAYS } from '@/lib/garden-labels';

const { gardenPlants, gardenPhotos, orders, orderItems, orderEvents } = schema;

type Owner = Pick<SessionUser, 'id' | 'phone'>;
/** Giống ownedBy trong server/orders.ts — đơn đặt vãng lai cùng SĐT trước khi có tài khoản cũng tính vào vườn. */
const ownedBy = (u: Owner) => (u.phone ? or(eq(orders.userId, u.id), eq(orders.phone, u.phone)) : eq(orders.userId, u.id));

/** Mỗi dòng hàng cây sống của đơn đã giao mà chưa có trong vườn thì thêm vào — chạy mỗi lần khách mở trang Vườn của tôi. */
async function syncGarden(u: Owner) {
  const rows = await db.select({ itemId: orderItems.id, orderId: orders.id })
    .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(ownedBy(u), eq(orders.status, 'delivered'), eq(orderItems.ship, 'plant')));
  if (!rows.length) return;

  const existing = new Set(
    (await db.select({ itemId: gardenPlants.orderItemId }).from(gardenPlants)
      .where(inArray(gardenPlants.orderItemId, rows.map((r) => r.itemId)))).map((r) => r.itemId),
  );
  const missing = rows.filter((r) => !existing.has(r.itemId));
  if (!missing.length) return;

  const delivered = new Map(
    (await db.select({ orderId: orderEvents.orderId, at: orderEvents.createdAt }).from(orderEvents)
      .where(and(inArray(orderEvents.orderId, missing.map((r) => r.orderId)), eq(orderEvents.status, 'delivered'))))
      .map((e) => [e.orderId, e.at]),
  );
  await db.insert(gardenPlants)
    .values(missing.map((r) => ({ userId: u.id, orderItemId: r.itemId, plantedAt: delivered.get(r.orderId) ?? new Date() })))
    .onConflictDoNothing({ target: gardenPlants.orderItemId });
}

export type GardenPlant = Awaited<ReturnType<typeof listGarden>>[number];

export async function listGarden(u: Owner) {
  await syncGarden(u);
  const rows = await db.select({
    g: gardenPlants, itemName: orderItems.name, itemIcon: orderItems.icon, itemImage: mainImageOf(orderItems.productSlug), itemLabel: orderItems.label, orderCode: orders.code,
  }).from(gardenPlants)
    .innerJoin(orderItems, eq(orderItems.id, gardenPlants.orderItemId))
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(gardenPlants.userId, u.id))
    .orderBy(desc(gardenPlants.id));
  if (!rows.length) return [];

  const photos = await db.select({ plantId: gardenPhotos.plantId, file: gardenPhotos.file }).from(gardenPhotos)
    .where(inArray(gardenPhotos.plantId, rows.map((r) => r.g.id))).orderBy(gardenPhotos.id);
  const latestPhoto = new Map<number, string>();
  for (const p of photos) latestPhoto.set(p.plantId, p.file); // ghi đè dần theo id tăng dần -> cuối cùng là ảnh mới nhất

  const now = Date.now();
  return rows.map((r) => ({
    id: r.g.id,
    name: r.itemName,
    icon: r.itemIcon,
    image: r.itemImage,
    label: r.itemLabel,
    orderCode: r.orderCode,
    nickname: r.g.nickname,
    location: r.g.location,
    status: r.g.status,
    plantedAt: r.g.plantedAt,
    photo: latestPhoto.get(r.g.id) ?? null,
    water: nextDue(r.g.lastWateredAt, WATER_INTERVAL_DAYS, now),
    fertilize: nextDue(r.g.lastFertilizedAt, FERTILIZE_INTERVAL_DAYS, now),
  }));
}

const own = (userId: number, id: number) => and(eq(gardenPlants.id, id), eq(gardenPlants.userId, userId));

export const GardenEditSchema = z.object({
  id: z.number().int().positive(),
  nickname: z.string().trim().max(60).optional(),
  location: z.string().trim().max(120).optional(),
  status: z.enum(Object.keys(GARDEN_STATUS_LABEL) as [keyof typeof GARDEN_STATUS_LABEL]),
});

export async function updateGardenPlant(userId: number, input: z.infer<typeof GardenEditSchema>) {
  const r = await db.update(gardenPlants)
    .set({ nickname: input.nickname || null, location: input.location || null, status: input.status })
    .where(own(userId, input.id)).returning({ id: gardenPlants.id });
  return { ok: r.length > 0 };
}

export async function markCareDone(userId: number, id: number, kind: 'water' | 'fertilize') {
  const now = new Date();
  const r = await db.update(gardenPlants)
    .set(kind === 'water' ? { lastWateredAt: now } : { lastFertilizedAt: now })
    .where(own(userId, id)).returning({ id: gardenPlants.id });
  return { ok: r.length > 0 };
}

export async function addGardenPhoto(userId: number, id: number, file: File) {
  const [plant] = await db.select({ id: gardenPlants.id }).from(gardenPlants).where(own(userId, id));
  if (!plant) return { ok: false as const, error: 'Không tìm thấy cây' };
  const img = await saveImage(file);
  if ('error' in img) return { ok: false as const, error: img.error };
  await db.insert(gardenPhotos).values({ plantId: id, file: img.file, mime: img.mime, data: img.data });
  return { ok: true as const, file: img.file };
}

export const gardenPhotoOwner = async (file: string) =>
  (await db.select({ userId: gardenPlants.userId }).from(gardenPhotos)
    .innerJoin(gardenPlants, eq(gardenPlants.id, gardenPhotos.plantId))
    .where(eq(gardenPhotos.file, file)))[0]?.userId ?? null;
