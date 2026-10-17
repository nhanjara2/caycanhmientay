import 'server-only';
import { connection } from 'next/server';
import { cache } from 'react';
import { and, desc, eq, inArray, isNull, lt, lte, ne, notInArray, or, sql, type SQL } from 'drizzle-orm';
import * as z from 'zod';
import { slugify } from '@/lib/slug';
import {
  blockingChecks, CATEGORY_KEYS, categoryOf, EXTERNAL_IMAGE_MAX, isExternalImage, MAX_BLOCK_PRODUCTS, NOTE_TITLE, postChecks, postImageUrl, postPath, PRODUCTS_TITLE,
  readMinutes, TITLE_MAX, youtubeThumb, type PostBlock, type PostStatus, type ShortVideo,
} from '@/lib/posts';
import { hasAccess } from '@/lib/permissions';
import { staffName, type SessionUser } from './auth';
import { db, schema } from './db';
import type { SavedImage } from './uploads';

const { posts: P, postImages: PI, products: PR } = schema;

/** Mỗi bài tối đa bấy nhiêu ảnh (bìa + trong bài). */
export const MAX_POST_IMAGES = 60;

// Cột cho thẻ bài / danh sách (không lấy nội dung bài — nhẹ để nạp cả danh sách).
const cardCols = {
  id: P.id, slug: P.slug, kind: P.kind, category: P.category, title: P.title, excerpt: P.excerpt,
  coverFile: P.coverFile, youtubeId: P.youtubeId, tiktokId: P.tiktokId, videoVertical: P.videoVertical, videoSeconds: P.videoSeconds,
  readMinutes: P.readMinutes, authorName: P.authorName, reviewerName: P.reviewerName, reviewerTitle: P.reviewerTitle,
  tags: P.tags, diseases: P.diseases, featured: P.featured, status: P.status, publishedAt: P.publishedAt,
  updatedAt: P.updatedAt, views: P.views, helpfulYes: P.helpfulYes, helpfulNo: P.helpfulNo, updatedBy: P.updatedBy,
};

const selectCards = () => db.select(cardCols).from(P);
type CardRow = Awaited<ReturnType<typeof selectCards>>[number];

/** Ảnh hiện trên thẻ bài: ảnh bìa, không có thì ảnh của video YouTube. */
export const thumbOf = (p: { coverFile: string | null; youtubeId: string | null; slug?: string }) =>
  p.coverFile ? postImageUrl(p.coverFile, p.slug) : p.youtubeId ? youtubeThumb(p.youtubeId) : null;

const toCard = (r: CardRow) => ({ ...r, thumb: thumbOf(r), publishedAt: r.publishedAt ?? r.updatedAt });
export type PostCard = ReturnType<typeof toCard>;

const live = () => and(eq(P.status, 'published'), lte(P.publishedAt, new Date()));

// ---- Trang khách ----------------------------------------------------------------------------

/** Mọi bài đang hiện (mới nhất trước); gọi nhiều lần trong một request chỉ truy vấn một lần. */
export const publishedPosts = cache(async () => {
  await connection();
  return (await selectCards().where(live()).orderBy(desc(P.publishedAt), desc(P.id))).map(toCard);
});

/** Video đang hiện (trang Video ngắn, trang chủ): video Nổi bật trước, sau đó mới nhất trước. */
export async function publishedVideos(): Promise<ShortVideo[]> {
  const videos = (await publishedPosts()).filter((p) => p.kind === 'video' && (p.youtubeId || p.tiktokId));
  return [...videos.filter((p) => p.featured), ...videos.filter((p) => !p.featured)].map((p) => ({
    id: p.id, slug: p.slug, href: postPath(p), category: p.category, categoryName: categoryOf(p.category)?.name ?? '', title: p.title,
    ...(p.tiktokId ? { source: 'tiktok' as const, videoId: p.tiktokId } : { source: 'youtube' as const, videoId: p.youtubeId! }),
    vertical: p.videoVertical, seconds: p.videoSeconds, thumb: p.thumb, zoomThumb: !p.coverFile && !p.tiktokId && !p.videoVertical,
  }));
}

async function fullPost(where: SQL | undefined) {
  const [r] = await db.select({ ...cardCols, body: P.body, seoDescription: P.seoDescription, createdAt: P.createdAt }).from(P).where(where);
  return r ? { ...toCard(r), body: r.body, seoDescription: r.seoDescription, createdAt: r.createdAt } : undefined;
}

/** Bài đang hiện theo slug. `preview` (nhân viên bấm Xem trước) thì lấy cả bài nháp / chờ duyệt / lên lịch. */
export const getPost = cache(async (slug: string, preview = false) => {
  await connection();
  return fullPost(preview ? eq(P.slug, slug) : and(eq(P.slug, slug), live()));
});
export type PostFull = NonNullable<Awaited<ReturnType<typeof getPost>>>;

/** +1 lượt xem (gọi sau khi trả trang, không làm chậm trang). */
export async function addPostView(id: number) {
  await db.update(P).set({ views: sql`${P.views} + 1` }).where(eq(P.id, id));
}

/** "Bài viết có hữu ích?" — chỉ đếm, không cần đăng nhập (trình duyệt tự nhớ đã bấm). */
export async function votePost(id: number, helpful: boolean) {
  const col = helpful ? P.helpfulYes : P.helpfulNo;
  const r = await db.update(P).set(helpful ? { helpfulYes: sql`${col} + 1` } : { helpfulNo: sql`${col} + 1` })
    .where(and(eq(P.id, id), live())).returning({ id: P.id });
  return r.length > 0;
}

/** Bài viết gắn với một bài bệnh (trang /benh-cay/<slug>). */
export async function postsForDisease(slug: string) {
  return (await publishedPosts()).filter((p) => p.diseases.includes(slug));
}

// ---- Admin ----------------------------------------------------------------------------------

export async function listPostsAdmin() {
  return (await selectCards().orderBy(desc(P.updatedAt))).map((r) => ({ ...toCard(r), publishedAt: r.publishedAt }));
}

export async function countPostsInReview() {
  const [r] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(P).where(eq(P.status, 'review'));
  return r?.n ?? 0;
}

/** Bài đã dùng các video này (mọi trạng thái) — thêm nhanh video không tạo trùng. */
export async function postsByVideo(youtube: string[], tiktok: string[]) {
  if (!youtube.length && !tiktok.length) return [];
  return db.select({ id: P.id, youtubeId: P.youtubeId, tiktokId: P.tiktokId, title: P.title, status: P.status }).from(P)
    .where(or(youtube.length ? inArray(P.youtubeId, youtube) : undefined, tiktok.length ? inArray(P.tiktokId, tiktok) : undefined));
}

export async function getPostAdmin(id: number) {
  const [r] = await db.select().from(P).where(eq(P.id, id));
  return r;
}
export type PostRow = typeof P.$inferSelect;

/** Tên kỹ sư / tác giả đã dùng ở các bài trước — gợi ý khi gõ. */
export async function peopleSuggestions() {
  const rows = await db.selectDistinct({ authorName: P.authorName, reviewerName: P.reviewerName, reviewerTitle: P.reviewerTitle }).from(P);
  const uniq = (a: string[]) => [...new Set(a.map((s) => s.trim()).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'vi'));
  return {
    authors: uniq(rows.map((r) => r.authorName)),
    reviewers: uniq(rows.map((r) => r.reviewerName)),
    titles: uniq(rows.map((r) => r.reviewerTitle)),
  };
}

export async function pesticideSlugs() {
  return new Set((await db.select({ slug: PR.slug }).from(PR).where(eq(PR.pesticide, true))).map((r) => r.slug));
}

const line = (max: number) => z.string().trim().max(max);
const text = (max: number) => z.string().trim().max(max).transform((s) => s.replace(/\r\n?/g, '\n'));

const BlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('h2'), text: line(150) }),
  z.object({ type: z.literal('h3'), text: line(150) }),
  z.object({ type: z.literal('p'), text: text(5000) }),
  z.object({ type: z.literal('list'), items: z.array(line(500)).max(30), ordered: z.boolean() }),
  z.object({ type: z.literal('image'), file: z.string().trim().max(EXTERNAL_IMAGE_MAX), caption: line(200) }),
  z.object({ type: z.literal('video'), youtubeId: z.string().max(20), caption: line(200) }),
  z.object({ type: z.literal('table'), rows: z.array(z.array(line(300)).max(8)).max(30) }),
  z.object({ type: z.literal('note'), title: line(60), text: text(1000) }),
  z.object({ type: z.literal('products'), title: line(60), slugs: z.array(z.string().max(120)).max(MAX_BLOCK_PRODUCTS) }),
]);

export const PostInputSchema = z.object({
  id: z.number().int().positive().optional(),
  kind: z.enum(['article', 'video']),
  category: z.enum(CATEGORY_KEYS, 'Chọn chuyên mục'),
  title: z.string().trim().min(3, 'Nhập tiêu đề (ít nhất 3 ký tự)').max(TITLE_MAX, `Tiêu đề tối đa ${TITLE_MAX} ký tự`),
  excerpt: text(400),
  body: z.array(BlockSchema).max(300, 'Bài quá dài (tối đa 300 khối)'),
  coverFile: z.string().trim().max(EXTERNAL_IMAGE_MAX).nullable(),
  youtubeId: z.string().regex(/^[\w-]{11}$/, 'Link YouTube chưa đúng').nullable(),
  tiktokId: z.string().regex(/^\d{8,25}$/, 'Link TikTok chưa đúng').nullable(),
  videoVertical: z.boolean(),
  videoSeconds: z.number().int().min(1).max(36_000).nullable(),
  authorName: line(60),
  reviewerName: line(60),
  reviewerTitle: line(60),
  diseases: z.array(z.string().max(120)).max(10),
  tags: z.array(line(30)).max(10).transform((a) => [...new Set(a.filter(Boolean))]),
  seoDescription: line(300),
  slug: z.string().trim().min(3, 'Đường dẫn cần ít nhất 3 ký tự').max(90, 'Đường dẫn tối đa 90 ký tự')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang').optional(),
  featured: z.boolean(),
  publishAt: z.iso.datetime({ offset: true }).nullable(),
});
export type PostInput = z.infer<typeof PostInputSchema>;

export const INTENTS = ['save', 'review', 'publish', 'unpublish'] as const;
export type Intent = (typeof INTENTS)[number];


/** Bỏ khối trống, ảnh không thuộc bài này, link video sai; chuẩn hóa bảng. */
function cleanBody(body: PostBlock[], files: ReadonlySet<string>): PostBlock[] {
  const out: PostBlock[] = [];
  for (const b of body) {
    switch (b.type) {
      case 'h2': case 'h3': case 'p':
        if (b.text) out.push(b);
        break;
      case 'list': {
        const items = b.items.filter(Boolean);
        if (items.length) out.push({ ...b, items });
        break;
      }
      case 'image':
        if (files.has(b.file) || isExternalImage(b.file)) out.push(b);
        break;
      case 'video':
        if (/^[\w-]{11}$/.test(b.youtubeId)) out.push(b);
        break;
      case 'table': {
        const rows = b.rows.filter((r) => r.some(Boolean));
        const cols = Math.max(0, ...rows.map((r) => r.length));
        if (rows.length && cols) out.push({ type: 'table', rows: rows.map((r) => Array.from({ length: cols }, (_, i) => r[i] ?? '')) });
        break;
      }
      case 'note':
        if (b.text) out.push({ ...b, title: b.title || NOTE_TITLE });
        break;
      case 'products': {
        const slugs = [...new Set(b.slugs)];
        if (slugs.length) out.push({ ...b, title: b.title || PRODUCTS_TITLE, slugs });
        break;
      }
    }
  }
  return out;
}

type SaveResult =
  | { ok: true; id: number; slug: string; status: PostStatus; publishedAt: string | null }
  | { ok: false; error: string };

/**
 * Lưu bài. `save` giữ nguyên trạng thái (bài mới = nháp), `review` gửi duyệt, `publish` đăng / lên lịch,
 * `unpublish` gỡ về nháp. Nhân viên chỉ sửa bài chưa đăng và không đăng/gỡ được; quyền kiểm tra cả ở đây lẫn action.
 */
export async function savePost(v: PostInput, intent: Intent, user: SessionUser): Promise<SaveResult> {
  // Đăng / gỡ / sửa bài đã đăng: Quản lý và Kỹ sư (quyền "Bài viết & bệnh cây" toàn quyền); người khác chỉ gửi duyệt.
  const isAdmin = hasAccess(user, 'content', 'full');
  if (!isAdmin && (intent === 'publish' || intent === 'unpublish')) return { ok: false, error: 'Chỉ Quản lý hoặc Kỹ sư được đăng hoặc gỡ bài' };
  const pesticides = await pesticideSlugs();

  return db.transaction(async (tx): Promise<SaveResult> => {
    const [cur] = v.id ? await tx.select({ id: P.id, slug: P.slug, status: P.status, publishedAt: P.publishedAt }).from(P).where(eq(P.id, v.id)).for('update') : [];
    if (v.id && !cur) return { ok: false, error: 'Không tìm thấy bài (có thể đã bị xóa)' };
    if (cur?.status === 'published' && !isAdmin) return { ok: false, error: 'Bài đã đăng: chỉ Quản lý hoặc Kỹ sư được sửa' };

    const files = new Set(cur ? (await tx.select({ file: PI.file }).from(PI).where(eq(PI.postId, cur.id))).map((r) => r.file) : []);
    const body = cleanBody(v.body, files);
    const coverFile = v.coverFile && (files.has(v.coverFile) || isExternalImage(v.coverFile)) ? v.coverFile : null;
    // Một video chỉ một nguồn: có TikTok thì bỏ YouTube.
    const tiktokId = v.kind === 'video' ? v.tiktokId : null;
    const youtubeId = v.kind === 'video' && !tiktokId ? v.youtubeId : null;

    const status: PostStatus =
      intent === 'publish' ? 'published' : intent === 'unpublish' ? 'draft' : intent === 'review' ? 'review' : (cur?.status ?? 'draft');
    if (status === 'published') {
      const bad = blockingChecks(postChecks({ ...v, body, coverFile, youtubeId, tiktokId }, pesticides));
      if (bad.length) return { ok: false, error: `Chưa đăng được: ${bad.map((c) => c.label.toLowerCase()).join('; ')}` };
    }
    // Đăng mà để trống lịch đăng = đăng ngay.
    const publishedAt = v.publishAt ? new Date(v.publishAt) : intent === 'publish' ? new Date() : null;

    const data = {
      kind: v.kind, category: v.category, title: v.title, excerpt: v.excerpt, body, coverFile, youtubeId, tiktokId,
      videoVertical: v.kind === 'video' && v.videoVertical, videoSeconds: v.kind === 'video' ? v.videoSeconds : null,
      readMinutes: readMinutes(v.title, v.excerpt, body), authorName: v.authorName, reviewerName: v.reviewerName,
      reviewerTitle: v.reviewerName ? v.reviewerTitle : '', diseases: [...new Set(v.diseases)], tags: v.tags,
      seoDescription: v.seoDescription, featured: v.featured, status, publishedAt, updatedBy: staffName(user), updatedAt: new Date(),
    };

    if (cur) {
      // Bài đang hiện trên web giữ nguyên đường dẫn — đổi là link cũ (Zalo, Facebook, Google) chết.
      let slug = cur.slug;
      if (cur.status !== 'published' && v.slug && v.slug !== cur.slug) {
        const [clash] = await tx.select({ id: P.id }).from(P).where(and(eq(P.slug, v.slug), ne(P.id, cur.id)));
        if (clash) return { ok: false, error: 'Đường dẫn này đã có bài khác dùng, hãy đổi đường dẫn' };
        slug = v.slug;
      }
      await tx.update(P).set({ ...data, slug }).where(eq(P.id, cur.id));
      // Ảnh đã bỏ khỏi bài quá 1 ngày → xóa cho nhẹ database (ảnh mới tải chưa lưu bài thì giữ).
      const used = [coverFile, ...body.flatMap((b) => (b.type === 'image' ? [b.file] : []))].filter((f): f is string => !!f);
      await tx.delete(PI).where(and(
        eq(PI.postId, cur.id), lt(PI.createdAt, new Date(Date.now() - 86_400_000)), used.length ? notInArray(PI.file, used) : undefined,
      ));
      return { ok: true, id: cur.id, slug, status, publishedAt: publishedAt?.toISOString() ?? null };
    }

    const base = v.slug ?? (slugify(v.title) || 'bai-viet');
    for (let i = 0; i < 20; i++) {
      const slug = i ? `${base}-${i + 1}` : base;
      const [r] = await tx.insert(P).values({ ...data, slug, createdBy: user.id }).onConflictDoNothing({ target: P.slug }).returning({ id: P.id });
      if (r) return { ok: true, id: r.id, slug, status, publishedAt: publishedAt?.toISOString() ?? null };
      if (v.slug) return { ok: false, error: 'Đường dẫn này đã có bài khác dùng, hãy đổi đường dẫn' };
    }
    return { ok: false, error: 'Trùng tiêu đề với bài khác, hãy đổi tiêu đề' };
  });
}

/** Thêm ảnh vào bài (ảnh bìa hoặc ảnh trong bài) — lưu ngay, khối ảnh trong bài lưu khi bấm Lưu. */
export async function addPostImage(postId: number, img: SavedImage, user: SessionUser) {
  const [p] = await db.select({ status: P.status }).from(P).where(eq(P.id, postId));
  if (!p) return { ok: false as const, error: 'Không tìm thấy bài — hãy lưu bài trước' };
  if (p.status === 'published' && !hasAccess(user, 'content', 'full')) return { ok: false as const, error: 'Bài đã đăng: chỉ Quản lý hoặc Kỹ sư được sửa' };
  const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(PI).where(eq(PI.postId, postId));
  if (n >= MAX_POST_IMAGES) return { ok: false as const, error: `Mỗi bài tối đa ${MAX_POST_IMAGES} ảnh` };
  await db.insert(PI).values({ postId, file: img.file, mime: img.mime, data: img.data });
  return { ok: true as const, file: img.file, url: postImageUrl(img.file) };
}

/** Ảnh bìa tự lấy (ảnh video TikTok khi thêm nhanh): chỉ gắn khi bài chưa có ảnh bìa. */
export async function attachAutoCover(postId: number, img: SavedImage) {
  await db.transaction(async (tx) => {
    await tx.insert(PI).values({ postId, file: img.file, mime: img.mime, data: img.data });
    await tx.update(P).set({ coverFile: img.file }).where(and(eq(P.id, postId), isNull(P.coverFile)));
  });
}

export const readPostImage = async (name: string) =>
  (await db.select({ data: PI.data, mime: PI.mime }).from(PI).where(eq(PI.file, name)))[0] ?? null;

export async function deletePost(id: number) {
  const r = await db.delete(P).where(eq(P.id, id)).returning({ slug: P.slug, category: P.category });
  return r[0];
}
