import 'server-only';
import { connection } from 'next/server';
import { cache } from 'react';
import { and, desc, eq, lt, notInArray, sql } from 'drizzle-orm';
import * as z from 'zod';
import { normalize } from '@/lib/catalog';
import {
  MAX_PROJECT_IMAGES, MAX_PROJECT_METRICS, MAX_PROJECT_PLANTS, MAX_PROJECT_SCOPE, PROJECT_IMAGE_FILE, PROJECT_ROLES, PROJECT_TYPES, type Project, type ProjectRole, type ProjectType,
} from '@/lib/projects';
import { staffName, type SessionUser } from './auth';
import { db, schema } from './db';
import type { SavedImage } from './uploads';

const { projects: PJ, projectImages: PI } = schema;

/** Tổng số ảnh một dự án được giữ (kể cả ảnh đã bỏ nhưng chưa dọn) — chặn tải ảnh vô hạn. */
const MAX_STORED_IMAGES = 40;

type Row = typeof PJ.$inferSelect;
const toProject = ({ updatedAt: _u, createdAt: _c, updatedBy: _b, ...r }: Row): Project => r as Project;

// Dự án nổi bật lên trước, rồi năm mới nhất.
const ORDER = [desc(PJ.featured), desc(PJ.year), desc(PJ.id)];

// ---- Trang khách ----------------------------------------------------------------------------

export const publishedProjects = cache(async () => {
  await connection();
  return (await db.select().from(PJ).where(eq(PJ.published, true)).orderBy(...ORDER)).map(toProject);
});

/** Dự án đang hiện theo slug. `preview` (nhân viên bấm Xem trước) thì lấy cả dự án đang ẩn. */
export const getProject = cache(async (slug: string, preview = false) => {
  await connection();
  const [r] = await db.select().from(PJ).where(preview ? eq(PJ.slug, slug) : and(eq(PJ.slug, slug), eq(PJ.published, true)));
  return r ? toProject(r) : undefined;
});

export const readProjectImage = async (name: string) =>
  (await db.select({ data: PI.data, mime: PI.mime }).from(PI).where(eq(PI.file, name)))[0] ?? null;

// ---- Admin ----------------------------------------------------------------------------------

export async function listProjectsAdmin() {
  return db.select().from(PJ).orderBy(...ORDER);
}

export async function getProjectAdmin(id: number) {
  const [r] = await db.select().from(PJ).where(eq(PJ.id, id));
  return r;
}

const line = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`);
const TYPE_KEYS = PROJECT_TYPES.map((t) => t.key) as [ProjectType, ...ProjectType[]];
const ROLE_KEYS = PROJECT_ROLES.map((r) => r.key) as [ProjectRole, ...ProjectRole[]];
const thisYear = () => new Date().getFullYear();

export const ProjectInputSchema = z.object({
  id: z.number().int().positive().optional(),
  title: line(150).min(5, 'Tên dự án cần ít nhất 5 ký tự'),
  type: z.enum(TYPE_KEYS, { error: 'Chọn loại công trình' }),
  roles: z.array(z.enum(ROLE_KEYS)).min(1, 'Chọn ít nhất một phần việc shop đã làm').max(PROJECT_ROLES.length),
  client: line(120),
  clientLogo: z.string().regex(PROJECT_IMAGE_FILE).nullable(),
  location: line(120),
  year: z.number({ error: 'Nhập năm thực hiện' }).int().min(1990, 'Năm không hợp lệ').refine((y) => y <= thisYear() + 1, 'Năm không hợp lệ'),
  duration: line(60),
  summary: line(400).min(20, 'Tóm tắt cần ít nhất 20 ký tự (hiện trên thẻ dự án)'),
  body: line(6000),
  scope: z.array(line(200).min(1)).max(MAX_PROJECT_SCOPE, `Tối đa ${MAX_PROJECT_SCOPE} hạng mục`),
  plants: z.array(line(60).min(1)).max(MAX_PROJECT_PLANTS, `Tối đa ${MAX_PROJECT_PLANTS} loại cây`),
  metrics: z.array(z.object({ value: line(30).min(1, 'Nhập con số'), label: line(60).min(1, 'Nhập ý nghĩa con số') })).max(MAX_PROJECT_METRICS),
  quote: z.object({ quote: line(600).min(10, 'Ý kiến khách hàng cần ít nhất 10 ký tự'), name: line(80).min(1, 'Nhập tên người nhận xét'), title: line(120) }).nullable(),
  images: z.array(z.object({ file: z.string().regex(PROJECT_IMAGE_FILE), caption: line(160) })).max(MAX_PROJECT_IMAGES, `Tối đa ${MAX_PROJECT_IMAGES} ảnh`),
  featured: z.boolean(),
  published: z.boolean(),
});
export type ProjectInput = z.infer<typeof ProjectInputSchema>;

const slugify = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80).replace(/-$/, '');

/** Lưu dự án. Trả `ok: false` + lời nhắc dễ hiểu khi chưa đủ điều kiện hiện trên web. */
export async function saveProject(v: ProjectInput, user: SessionUser) {
  const { id, ...data } = v;
  // Bỏ tên cây gõ trùng (không phân biệt dấu, hoa / thường).
  data.plants = [...new Map(data.plants.map((p) => [normalize(p), p])).values()];
  if (data.published && !data.images.length) return { ok: false as const, error: 'Cần ít nhất 1 ảnh công trình trước khi hiện trên web' };
  if (data.featured && !data.published) data.featured = false;

  if (id) {
    // Chỉ giữ ảnh đã tải lên cho chính dự án này.
    const mine = new Set((await db.select({ file: PI.file }).from(PI).where(eq(PI.projectId, id))).map((r) => r.file));
    data.images = data.images.filter((im) => mine.has(im.file));
    if (data.clientLogo && !mine.has(data.clientLogo)) data.clientLogo = null;
    if (data.published && !data.images.length) return { ok: false as const, error: 'Cần ít nhất 1 ảnh công trình trước khi hiện trên web' };
    const r = await db.update(PJ).set({ ...data, updatedBy: staffName(user), updatedAt: new Date() }).where(eq(PJ.id, id)).returning({ id: PJ.id, slug: PJ.slug });
    if (!r.length) return { ok: false as const, error: 'Không tìm thấy dự án' };
    // Ảnh đã bỏ khỏi dự án quá 1 ngày → xóa cho nhẹ database (ảnh mới tải chưa lưu thì giữ).
    const used = [...data.images.map((im) => im.file), ...(data.clientLogo ? [data.clientLogo] : [])];
    await db.delete(PI).where(and(eq(PI.projectId, id), lt(PI.createdAt, new Date(Date.now() - 86_400_000)), used.length ? notInArray(PI.file, used) : undefined));
    return { ok: true as const, id, slug: r[0].slug };
  }
  // Dự án mới: chưa có ảnh nào (phải lưu trước rồi mới tải ảnh) → luôn lưu ở trạng thái ẩn.
  const base = slugify(v.title) || 'du-an';
  for (let i = 0; i < 20; i++) {
    const slug = i ? `${base}-${i + 1}` : base;
    const r = await db.insert(PJ).values({ ...data, images: [], clientLogo: null, published: false, featured: false, slug, updatedBy: staffName(user) })
      .onConflictDoNothing().returning({ id: PJ.id, slug: PJ.slug });
    if (r.length) return { ok: true as const, id: r[0].id, slug };
  }
  return { ok: false as const, error: 'Trùng tên dự án, hãy đổi tên' };
}

export async function setProjectPublished(id: number, published: boolean) {
  const [p] = await db.select({ images: PJ.images, slug: PJ.slug }).from(PJ).where(eq(PJ.id, id));
  if (!p) return { ok: false as const, error: 'Không tìm thấy dự án' };
  if (published && !p.images.length) return { ok: false as const, error: 'Thêm ít nhất 1 ảnh công trình trước khi hiện trên web' };
  await db.update(PJ).set({ published, ...(published ? {} : { featured: false }), updatedAt: new Date() }).where(eq(PJ.id, id));
  return { ok: true as const, slug: p.slug };
}

export async function deleteProject(id: number) {
  const r = await db.delete(PJ).where(eq(PJ.id, id)).returning({ slug: PJ.slug });
  return r[0]?.slug;
}

/** Thêm ảnh vào dự án — lưu ngay; ảnh gắn vào dự án khi bấm Lưu. Dự án mới phải lưu trước. */
export async function addProjectImage(id: number, img: SavedImage) {
  const [p] = await db.select({ id: PJ.id }).from(PJ).where(eq(PJ.id, id));
  if (!p) return { ok: false as const, error: 'Không tìm thấy dự án — hãy lưu dự án trước' };
  const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(PI).where(eq(PI.projectId, id));
  if (n >= MAX_STORED_IMAGES) return { ok: false as const, error: 'Dự án này đã có quá nhiều ảnh chưa dùng — bấm Lưu dự án, ảnh không dùng sẽ tự dọn sau 1 ngày' };
  await db.insert(PI).values({ projectId: id, file: img.file, mime: img.mime, data: img.data });
  return { ok: true as const, file: img.file };
}
