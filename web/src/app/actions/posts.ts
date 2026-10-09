'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { parseYoutubeId } from '@/lib/catalog';
import { CATEGORY_KEYS, cleanVideoTitle, isShortsUrl, MAX_QUICK_VIDEOS, postPath, SECTIONS, sectionOf, VIDEO_PAGE } from '@/lib/posts';
import { requireAccess, staffName } from '@/server/auth';
import { addPostImage, deletePost, INTENTS, PostInputSchema, postsByYoutubeId, savePost, votePost } from '@/server/posts';
import { saveImage } from '@/server/uploads';
import { youtubeInfo } from '@/server/youtube';

// Bài viết & video: nhân viên soạn nháp / gửi duyệt; chỉ quản trị viên đăng, gỡ, xóa và sửa bài đã đăng.

function refresh(p?: { slug: string; category: string }) {
  revalidatePath('/admin/noi-dung', 'layout');
  revalidatePath(SECTIONS.blog.path);
  revalidatePath(SECTIONS.news.path);
  revalidatePath(VIDEO_PAGE);
  if (p) revalidatePath(postPath(p));
}

export async function savePostAction(input: unknown, intent: unknown) {
  const user = await requireAccess('content', 'full');
  const i = z.enum(INTENTS).safeParse(intent);
  const p = PostInputSchema.safeParse(input);
  if (!i.success) return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message || 'Dữ liệu chưa hợp lệ' };
  const r = await savePost(p.data, i.data, user);
  if (r.ok) refresh({ slug: r.slug, category: p.data.category });
  return r;
}

export async function uploadPostImageAction(fd: FormData) {
  const user = await requireAccess('content', 'full');
  const id = z.coerce.number().int().positive().safeParse(fd.get('postId'));
  const f = fd.get('photo');
  if (!id.success || !(f instanceof File)) return { ok: false as const, error: 'Thiếu ảnh' };
  const img = await saveImage(f);
  if ('error' in img) return { ok: false as const, error: img.error };
  return addPostImage(id.data, img, user);
}

export async function deletePostAction(id: unknown) {
  await requireAccess('content', 'full');
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return { ok: false as const };
  const r = await deletePost(p.data);
  if (r) refresh(r);
  return { ok: !!r, section: r ? sectionOf(r.category) : undefined };
}

/**
 * Đọc các link YouTube dán vào (mỗi dòng một link): lấy tiêu đề + tên kênh từ YouTube, đánh dấu video đã có trên web.
 * Dùng cho "Thêm nhanh video ngắn" và tự điền tiêu đề khi dán link trong trình soạn video.
 */
export async function lookupVideosAction(text: unknown) {
  await requireAccess('content', 'full');
  if (typeof text !== 'string') return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  // Chỉ nhận chữ có dạng link YouTube — parseYoutubeId nhận cả mã 11 ký tự trần, dễ bắt nhầm một từ bất kỳ.
  const found = new Map<string, boolean>(); // mã video → link dạng /shorts/
  for (const token of text.slice(0, 20_000).split(/[\s,]+/)) {
    const id = /youtu\.?be/i.test(token) ? parseYoutubeId(token) : null;
    if (id && !found.has(id)) found.set(id, isShortsUrl(token));
  }
  if (!found.size) return { ok: false as const, error: 'Không thấy link YouTube nào — dán link dạng https://youtube.com/shorts/… hoặc https://youtu.be/…' };
  if (found.size > MAX_QUICK_VIDEOS) return { ok: false as const, error: `Mỗi lần tối đa ${MAX_QUICK_VIDEOS} video (đang có ${found.size} link)` };

  const ids = [...found.keys()];
  const [infos, used] = await Promise.all([Promise.all(ids.map(youtubeInfo)), postsByYoutubeId(ids)]);
  return {
    ok: true as const,
    items: ids.map((youtubeId, i) => {
      const info = infos[i];
      const post = used.find((u) => u.youtubeId === youtubeId);
      return {
        youtubeId, vertical: (info.ok ? info.short : null) ?? found.get(youtubeId)!,
        title: info.ok ? cleanVideoTitle(info.title) : '', channel: info.ok ? info.channel : '',
        error: info.ok ? null : info.error,
        existing: post ? { id: post.id, title: post.title, published: post.status === 'published' } : null,
      };
    }),
  };
}

const QuickVideosSchema = z.array(z.object({
  youtubeId: z.string().regex(/^[\w-]{11}$/),
  title: z.string().max(300),
  vertical: z.boolean(),
  category: z.enum(CATEGORY_KEYS),
  featured: z.boolean(),
  channel: z.string().max(200),
})).min(1, 'Chưa chọn video nào').max(MAX_QUICK_VIDEOS);

/** Đăng ngay nhiều video ngắn một lượt — mỗi video thành một bài loại "video" như thêm bằng tay. */
export async function quickAddVideosAction(input: unknown) {
  const user = await requireAccess('content', 'full');
  const p = QuickVideosSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message || 'Dữ liệu chưa hợp lệ' };
  const used = new Set((await postsByYoutubeId(p.data.map((v) => v.youtubeId))).map((u) => u.youtubeId));

  const results: { youtubeId: string; ok: boolean; error?: string; id?: number }[] = [];
  for (const v of p.data) {
    if (used.has(v.youtubeId)) { results.push({ youtubeId: v.youtubeId, ok: false, error: 'Video này đã có trên web' }); continue; }
    const input = PostInputSchema.safeParse({
      kind: 'video', category: v.category, title: v.title, excerpt: '', body: [], coverFile: null, youtubeId: v.youtubeId,
      videoVertical: v.vertical, videoSeconds: null, authorName: (v.channel.trim() || staffName(user)).slice(0, 60),
      reviewerName: '', reviewerTitle: '', diseases: [], tags: [], seoDescription: '', featured: v.featured, publishAt: null,
    });
    if (!input.success) { results.push({ youtubeId: v.youtubeId, ok: false, error: input.error.issues[0].message }); continue; }
    const r = await savePost(input.data, 'publish', user);
    if (r.ok) used.add(v.youtubeId);
    results.push(r.ok ? { youtubeId: v.youtubeId, ok: true, id: r.id } : { youtubeId: v.youtubeId, ok: false, error: r.error });
  }
  refresh();
  return { ok: true as const, results };
}

/** Khách bấm "Bài viết có hữu ích? Có / Không". */
export async function votePostAction(id: unknown, helpful: unknown) {
  const p = z.object({ id: z.number().int().positive(), helpful: z.boolean() }).safeParse({ id, helpful });
  if (!p.success) return { ok: false };
  return { ok: await votePost(p.data.id, p.data.helpful) };
}
