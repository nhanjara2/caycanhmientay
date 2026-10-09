import 'server-only';
import { connection } from 'next/server';
import { cache } from 'react';
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, notInArray, or, sql } from 'drizzle-orm';
import * as z from 'zod';
import { BANNER_IMAGE_FILE, BANNER_SLOT_KEYS, BG_COLOR, slotOf, type Banner } from '@/lib/home-banners';
import { staffName, type SessionUser } from './auth';
import { db, schema } from './db';
import type { SavedImage } from './uploads';

const { homeBanners: B, homeBannerImages: BI } = schema;

type Row = typeof B.$inferSelect;
const toBanner = ({ updatedAt: _u, createdAt: _c, updatedBy: _b, ...r }: Row): Banner => r as Banner;
const ORDER = [asc(B.slot), asc(B.sort), desc(B.id)];

// ---- Trang khách ----------------------------------------------------------------------------

/** Banner đang bật và trong thời gian hiện (bắt đầu ≤ bây giờ ≤ kết thúc). */
export const liveBanners = cache(async () => {
  await connection();
  const now = new Date();
  const rows = await db.select().from(B)
    .where(and(eq(B.active, true), or(isNull(B.startsAt), lte(B.startsAt, now)), or(isNull(B.endsAt), gte(B.endsAt, now))))
    .orderBy(...ORDER);
  return rows.map(toBanner);
});

export const readBannerImage = async (name: string) =>
  (await db.select({ data: BI.data, mime: BI.mime }).from(BI).where(eq(BI.file, name)))[0] ?? null;

// ---- Admin ----------------------------------------------------------------------------------

export async function listBannersAdmin() {
  return (await db.select().from(B).orderBy(...ORDER)).map((r) => ({ ...toBanner(r), updatedBy: r.updatedBy, updatedAt: r.updatedAt }));
}

const line = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`);
const file = z.string().regex(BANNER_IMAGE_FILE, 'Ảnh không hợp lệ');
// Ngày nhập ở admin (yyyy-mm-dd, giờ Việt Nam): "từ" = đầu ngày, "đến" = hết ngày.
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const vnDate = (d: string, end: boolean) => new Date(`${d}T${end ? '23:59:59.999' : '00:00:00'}+07:00`);

export const BannerInputSchema = z.object({
  id: z.number().int().positive().optional(),
  slot: z.enum(BANNER_SLOT_KEYS),
  title: line(120).min(3, 'Nhập tiêu đề (ít nhất 3 ký tự) — dùng làm chữ mô tả ảnh'),
  subtitle: line(200),
  cta: line(30),
  href: line(300).refine((h) => !h || h.startsWith('/') || /^https?:\/\/\S+$/.test(h), 'Link phải bắt đầu bằng / (trang trong web) hoặc https://'),
  showText: z.boolean(),
  image: file,
  imageMobile: file.nullable(),
  bgImage: file.nullable(),
  bgImageMobile: file.nullable(),
  bgColor: z.string().regex(BG_COLOR, 'Màu nền không hợp lệ').nullable(),
  startsAt: day,
  endsAt: day,
  active: z.boolean(),
}).refine((v) => !v.startsAt || !v.endsAt || v.startsAt <= v.endsAt, { message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['endsAt'] });
export type BannerInput = z.infer<typeof BannerInputSchema>;

/** Dọn ảnh đã tải hơn 1 ngày mà không banner nào dùng (ảnh vừa tải chưa kịp lưu thì giữ). */
async function cleanImages() {
  const used = await db.select({ a: B.image, b: B.imageMobile, c: B.bgImage, d: B.bgImageMobile }).from(B);
  const keep = used.flatMap((u) => [u.a, u.b, u.c, u.d]).filter((f): f is string => !!f);
  await db.delete(BI).where(and(lt(BI.createdAt, new Date(Date.now() - 86_400_000)), keep.length ? notInArray(BI.file, keep) : undefined));
}

export async function saveBanner(v: BannerInput, user: SessionUser) {
  const { id, startsAt, endsAt, ...rest } = v;
  // Nền riêng chỉ có ở băng ảnh rộng trên cùng.
  if (rest.slot !== 'top') Object.assign(rest, { bgImage: null, bgImageMobile: null, bgColor: null });
  const files = [rest.image, rest.imageMobile, rest.bgImage, rest.bgImageMobile].filter((f): f is string => !!f);
  const found = await db.select({ file: BI.file }).from(BI).where(inArray(BI.file, files));
  if (found.length !== new Set(files).size) return { ok: false as const, error: 'Ảnh đã bị xóa — hãy tải ảnh lại' };
  const data = {
    ...rest,
    startsAt: startsAt ? vnDate(startsAt, false) : null,
    endsAt: endsAt ? vnDate(endsAt, true) : null,
    updatedBy: staffName(user),
    updatedAt: new Date(),
  };
  if (id) {
    const r = await db.update(B).set(data).where(eq(B.id, id)).returning({ id: B.id });
    if (!r.length) return { ok: false as const, error: 'Không tìm thấy banner' };
  } else {
    const slot = slotOf(rest.slot);
    const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(B).where(eq(B.slot, rest.slot));
    if (n >= slot.max * 3) return { ok: false as const, error: `Mục “${slot.name}” đã có quá nhiều ảnh — xóa bớt ảnh cũ không dùng nữa` };
    // Banner mới lên đầu nhóm.
    const [{ min }] = await db.select({ min: sql<number>`coalesce(min(${B.sort}), 0)`.mapWith(Number) }).from(B).where(eq(B.slot, rest.slot));
    await db.insert(B).values({ ...data, sort: min - 1 });
  }
  await cleanImages();
  return { ok: true as const };
}

export async function setBannerActive(id: number, active: boolean) {
  const r = await db.update(B).set({ active, updatedAt: new Date() }).where(eq(B.id, id)).returning({ id: B.id });
  return r.length > 0;
}

export async function deleteBanner(id: number) {
  const r = await db.delete(B).where(eq(B.id, id))
    .returning({ image: B.image, imageMobile: B.imageMobile, bgImage: B.bgImage, bgImageMobile: B.bgImageMobile });
  if (!r.length) return false;
  // Ảnh của banner vừa xóa: xóa luôn nếu không banner khác dùng chung.
  const mine = [r[0].image, r[0].imageMobile, r[0].bgImage, r[0].bgImageMobile].filter((f): f is string => !!f);
  const still = await db.select({ a: B.image, b: B.imageMobile, c: B.bgImage, d: B.bgImageMobile }).from(B)
    .where(or(inArray(B.image, mine), inArray(B.imageMobile, mine), inArray(B.bgImage, mine), inArray(B.bgImageMobile, mine)));
  const used = new Set(still.flatMap((s) => [s.a, s.b, s.c, s.d]));
  const drop = mine.filter((f) => !used.has(f));
  if (drop.length) await db.delete(BI).where(inArray(BI.file, drop));
  return true;
}

/** Đổi chỗ banner với banner kề trên / dưới trong cùng vị trí. */
export async function moveBanner(id: number, dir: -1 | 1) {
  const [me] = await db.select({ slot: B.slot }).from(B).where(eq(B.id, id));
  if (!me) return false;
  const list = await db.select({ id: B.id }).from(B).where(eq(B.slot, me.slot)).orderBy(asc(B.sort), desc(B.id));
  const i = list.findIndex((b) => b.id === id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return true;
  [list[i], list[j]] = [list[j], list[i]];
  await db.transaction(async (tx) => {
    for (const [k, b] of list.entries()) await tx.update(B).set({ sort: k }).where(eq(B.id, b.id));
  });
  return true;
}

export async function addBannerImage(img: SavedImage) {
  // Chặn tải ảnh vô hạn: ảnh chưa dùng trong 1 ngày qua.
  const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(BI).where(gte(BI.createdAt, new Date(Date.now() - 86_400_000)));
  if (n >= 120) return { ok: false as const, error: 'Đã tải quá nhiều ảnh trong hôm nay — thử lại ngày mai' };
  await db.insert(BI).values({ file: img.file, mime: img.mime, data: img.data });
  return { ok: true as const, file: img.file };
}
