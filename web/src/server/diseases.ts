import 'server-only';
import { connection } from 'next/server';
import { cache } from 'react';
import { and, asc, desc, eq, lt, notInArray, sql } from 'drizzle-orm';
import * as z from 'zod';
import { normalize } from '@/lib/catalog';
import { CAUSES, DISEASE_IMAGE_FILE, PARTS, PLANTS, type Disease } from '@/lib/diseases';
import { db, schema } from './db';
import type { SavedImage } from './uploads';

const { diseases: D, diseaseImages: DI } = schema;

/** Tổng số ảnh một bài được giữ (kể cả ảnh đã bỏ khỏi bài nhưng chưa dọn) — chặn tải ảnh vô hạn. */
const MAX_DISEASE_IMAGES = 30;

type Row = typeof D.$inferSelect;
const toDisease = ({ updatedAt: _u, createdAt: _c, ...r }: Row): Disease => r;

// ---- Trang khách ----------------------------------------------------------------------------

/** Bài bệnh đang hiện, xếp theo tên; gọi nhiều lần trong một request chỉ truy vấn một lần. */
export const allDiseases = cache(async () => {
  await connection();
  return (await db.select().from(D).where(eq(D.active, true)).orderBy(asc(D.name))).map(toDisease);
});

export const getDisease = cache(async (slug: string) => (await allDiseases()).find((d) => d.slug === slug));

// ---- Admin ----------------------------------------------------------------------------------

export async function listDiseasesAdmin() {
  return (await db.select().from(D).orderBy(desc(D.active), asc(D.name))).map((r) => ({ ...toDisease(r), updatedAt: r.updatedAt }));
}

export async function getDiseaseAdmin(slug: string) {
  const [r] = await db.select().from(D).where(eq(D.slug, slug));
  return r ? toDisease(r) : undefined;
}

const keys = <T extends readonly { key: string }[]>(list: T) => list.map((x) => x.key) as [T[number]['key'], ...T[number]['key'][]];
const line = (max: number) => z.string().trim().max(max);

export const DiseaseInputSchema = z.object({
  slug: z.string().max(120).optional(), // có = sửa, không có = tạo mới
  name: z.string().trim().min(3, 'Tên bệnh cần ít nhất 3 ký tự').max(100, 'Tên tối đa 100 ký tự'),
  aliases: z.array(line(40)).max(10).transform((a) => a.filter(Boolean)),
  cause: z.enum(keys(CAUSES), 'Chọn nhóm nguyên nhân'),
  parts: z.array(z.enum(keys(PARTS))).min(1, 'Chọn ít nhất 1 bộ phận bị bệnh').max(PARTS.length),
  plants: z.array(z.enum(keys(PLANTS))).max(PLANTS.length),
  severity: z.number().int().min(1).max(5),
  spread: line(60),
  season: line(60),
  summary: z.string().trim().min(20, 'Mô tả ngắn cần ít nhất 20 ký tự').max(800),
  symptoms: z.array(z.object({ part: z.enum(keys(PARTS)), text: line(200).min(1), image: z.string().regex(DISEASE_IMAGE_FILE).optional() })).min(1, 'Nhập ít nhất 1 triệu chứng').max(8),
  confusions: z.array(z.object({ name: line(60).min(1, 'Nhập tên bệnh dễ nhầm'), text: line(300).min(1, 'Nhập cách phân biệt'), slug: z.string().max(120).optional() })).max(4),
  steps: z.array(z.object({ title: line(120).min(1, 'Nhập tên bước xử lý'), detail: line(300) })).min(1, 'Nhập ít nhất 1 bước xử lý').max(8),
  prevention: z.array(line(200)).max(8).transform((a) => a.filter(Boolean)),
  safety: line(600),
  products: z.array(z.string().max(120)).max(8),
  active: z.boolean(),
});
export type DiseaseInput = z.infer<typeof DiseaseInputSchema>;

const slugify = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

/** Tạo mới (slug sinh từ tên, không đổi về sau để link cũ không chết) hoặc cập nhật. */
export async function saveDisease(v: DiseaseInput) {
  const { slug: editSlug, ...data } = v;
  data.confusions = data.confusions.map(({ slug, ...c }) => (slug && slug !== editSlug ? { ...c, slug } : c));
  // Chỉ giữ ảnh đã tải lên cho chính bài này (bài mới chưa có ảnh nào).
  const mine = new Set(editSlug ? (await db.select({ file: DI.file }).from(DI).where(eq(DI.diseaseSlug, editSlug))).map((r) => r.file) : []);
  data.symptoms = data.symptoms.map(({ image, ...s }) => (image && mine.has(image) ? { ...s, image } : s));
  if (editSlug) {
    const r = await db.update(D).set({ ...data, updatedAt: new Date() }).where(eq(D.slug, editSlug)).returning({ slug: D.slug });
    if (!r.length) return { ok: false as const, error: 'Không tìm thấy bài bệnh' };
    // Ảnh đã bỏ khỏi bài quá 1 ngày → xóa cho nhẹ database (ảnh mới tải chưa lưu bài thì giữ).
    const used = data.symptoms.flatMap((s) => (s.image ? [s.image] : []));
    await db.delete(DI).where(and(
      eq(DI.diseaseSlug, editSlug), lt(DI.createdAt, new Date(Date.now() - 86_400_000)), used.length ? notInArray(DI.file, used) : undefined,
    ));
    return { ok: true as const, slug: editSlug };
  }
  const base = slugify(v.name) || 'benh';
  for (let i = 0; i < 20; i++) {
    const slug = i ? `${base}-${i + 1}` : base;
    const r = await db.insert(D).values({ ...data, slug }).onConflictDoNothing().returning({ slug: D.slug });
    if (r.length) return { ok: true as const, slug };
  }
  return { ok: false as const, error: 'Trùng tên bài bệnh, hãy đổi tên' };
}

export async function setDiseaseActive(slug: string, active: boolean) {
  const r = await db.update(D).set({ active, updatedAt: new Date() }).where(eq(D.slug, slug)).returning({ slug: D.slug });
  return r.length > 0;
}

// ---- Ảnh minh họa triệu chứng ----------------------------------------------------------------

/** Thêm ảnh vào bài bệnh — lưu ngay; ảnh gắn vào triệu chứng khi bấm Lưu bài bệnh. Bài mới phải lưu trước. */
export async function addDiseaseImage(slug: string, img: SavedImage) {
  const [d] = await db.select({ slug: D.slug }).from(D).where(eq(D.slug, slug));
  if (!d) return { ok: false as const, error: 'Không tìm thấy bài bệnh — hãy lưu bài bệnh trước' };
  const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(DI).where(eq(DI.diseaseSlug, slug));
  if (n >= MAX_DISEASE_IMAGES) return { ok: false as const, error: 'Bài này đã có quá nhiều ảnh chưa dùng — bấm Lưu bài bệnh, ảnh không dùng sẽ tự dọn sau 1 ngày' };
  await db.insert(DI).values({ diseaseSlug: slug, file: img.file, mime: img.mime, data: img.data });
  return { ok: true as const, file: img.file };
}

export const readDiseaseImage = async (name: string) =>
  (await db.select({ data: DI.data, mime: DI.mime }).from(DI).where(eq(DI.file, name)))[0] ?? null;
