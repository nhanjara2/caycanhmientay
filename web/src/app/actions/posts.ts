'use server';

import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { parseYoutubeId } from '@/lib/catalog';
import {
  CATEGORY_KEYS, cleanVideoTitle, isShortsUrl, isTiktokShortLink, MAX_QUICK_VIDEOS, parseTiktokId, postPath, SECTIONS, sectionOf,
  tiktokOembed, VIDEO_PAGE, youtubeThumb, type VideoSource,
} from '@/lib/posts';
import { requireAccess, staffName } from '@/server/auth';
import { addPostImage, attachAutoCover, deletePost, INTENTS, PostInputSchema, postsByVideo, savePost, votePost } from '@/server/posts';
import { downloadTiktokThumb, resolveTiktokShortLink } from '@/server/tiktok';
import { saveImage } from '@/server/uploads';
import { youtubeInfo } from '@/server/youtube';
import { logSeo } from '@/server/seo-cms';
import { pingIndexNow } from '@/server/indexnow';

// Bài viết & video: nhân viên soạn nháp / gửi duyệt; chỉ quản trị viên đăng, gỡ, xóa và sửa bài đã đăng.

function refresh(p?: { slug: string; category: string }) {
  revalidatePath('/admin/noi-dung', 'layout');
  revalidatePath(SECTIONS.blog.path);
  revalidatePath(SECTIONS.news.path);
  revalidatePath(VIDEO_PAGE);
  if (p) revalidatePath(postPath(p));
  pingIndexNow([p && postPath(p), SECTIONS[sectionOf(p?.category ?? '')].path]);
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
  const user = await requireAccess('content', 'full');
  const p = z.number().int().positive().safeParse(id);
  if (!p.success) return { ok: false as const };
  const r = await deletePost(p.data);
  if (r) {
    await logSeo({ path: postPath(r), action: 'delete', user });
    refresh(r);
  }
  return { ok: !!r, section: r ? sectionOf(r.category) : undefined };
}

type Link = { source: VideoSource; id: string; url: string; shorts: boolean };

/**
 * Đọc các link YouTube / TikTok dán vào (mỗi dòng một link): lấy tiêu đề, tên kênh, ảnh; đánh dấu video đã có trên web.
 * Dùng cho "Thêm nhanh video ngắn" và tự điền tiêu đề khi dán link trong trình soạn video.
 * TikTok: máy chủ đặt ở Ấn Độ (TikTok bị cấm) nên có thể không lấy được tên / ảnh — khi đó `title` trống, trình duyệt admin thử lại.
 */
export async function lookupVideosAction(text: unknown) {
  await requireAccess('content', 'full');
  if (typeof text !== 'string') return { ok: false as const, error: 'Yêu cầu không hợp lệ' };
  // Chỉ nhận chữ có dạng link — parseYoutubeId nhận cả mã 11 ký tự trần, dễ bắt nhầm một từ bất kỳ.
  const links = new Map<string, Link>();
  const shortLinks: string[] = [];
  for (const token of text.slice(0, 20_000).split(/[\s,]+/)) {
    if (/youtu\.?be/i.test(token)) {
      const id = parseYoutubeId(token);
      if (id && !links.has(`youtube:${id}`)) links.set(`youtube:${id}`, { source: 'youtube', id, url: token, shorts: isShortsUrl(token) });
    } else if (/tiktok\.com/i.test(token)) {
      const id = parseTiktokId(token);
      if (id && !links.has(`tiktok:${id}`)) links.set(`tiktok:${id}`, { source: 'tiktok', id, url: token, shorts: true });
      else if (!id && isTiktokShortLink(token) && !shortLinks.includes(token)) shortLinks.push(token);
    }
  }
  const total = links.size + shortLinks.length;
  if (!total) return { ok: false as const, error: 'Không thấy link YouTube / TikTok nào — dán link dạng https://youtube.com/shorts/… hoặc https://vt.tiktok.com/…' };
  if (total > MAX_QUICK_VIDEOS) return { ok: false as const, error: `Mỗi lần tối đa ${MAX_QUICK_VIDEOS} video (đang có ${total} link)` };

  const unresolved: string[] = [];
  for (const [i, r] of (await Promise.all(shortLinks.map(resolveTiktokShortLink))).entries()) {
    if (!r) unresolved.push(shortLinks[i]);
    else if (!links.has(`tiktok:${r.id}`)) links.set(`tiktok:${r.id}`, { source: 'tiktok', id: r.id, url: r.url, shorts: true });
  }
  const list = [...links.values()];
  const [infos, used] = await Promise.all([
    Promise.all(list.map(async (l) => {
      if (l.source === 'tiktok') {
        const t = await tiktokOembed(l.url);
        return { title: t?.title ?? '', channel: t?.channel ?? '', thumb: t?.thumb ?? null, vertical: true, error: null };
      }
      const y = await youtubeInfo(l.id);
      return y.ok
        ? { title: y.title, channel: y.channel, thumb: youtubeThumb(l.id), vertical: y.short ?? l.shorts, error: null }
        : { title: '', channel: '', thumb: youtubeThumb(l.id), vertical: l.shorts, error: y.error };
    })),
    postsByVideo(list.filter((l) => l.source === 'youtube').map((l) => l.id), list.filter((l) => l.source === 'tiktok').map((l) => l.id)),
  ]);
  return {
    ok: true as const,
    items: [
      ...list.map((l, i) => {
        const info = infos[i];
        const post = used.find((u) => (l.source === 'tiktok' ? u.tiktokId : u.youtubeId) === l.id);
        return {
          key: `${l.source}:${l.id}`, source: l.source, videoId: l.id, url: l.url, vertical: info.vertical,
          title: cleanVideoTitle(info.title), channel: info.channel, thumb: info.thumb, error: info.error,
          existing: post ? { id: post.id, title: post.title, published: post.status === 'published' } : null,
        };
      }),
      ...unresolved.map((url) => ({
        key: `link:${url}`, source: 'tiktok' as const, videoId: '', url, vertical: true, title: '', channel: '', thumb: null, existing: null,
        error: 'Chưa mở được link rút gọn này — mở link trên trình duyệt, chép link đầy đủ (có /video/…) rồi dán lại',
      })),
    ],
  };
}

const QuickVideosSchema = z.array(z.object({
  source: z.enum(['youtube', 'tiktok']),
  videoId: z.string().regex(/^[\w-]{8,25}$/),
  title: z.string().max(300),
  vertical: z.boolean(),
  category: z.enum(CATEGORY_KEYS),
  featured: z.boolean(),
  channel: z.string().max(200),
  /** Thông tin bài viết về video: đoạn dẫn + nội dung (đoạn văn cách nhau bằng dòng trống). */
  excerpt: z.string().max(400).default(''),
  content: z.string().max(8000).default(''),
  /** Ảnh video TikTok (link tạm) — lưu thành ảnh bìa; chỉ nhận máy chủ ảnh của TikTok (isThumbUrl). */
  thumb: z.string().max(2000).nullable(),
})).min(1, 'Chưa chọn video nào').max(MAX_QUICK_VIDEOS);

/** Đăng ngay nhiều video ngắn một lượt — mỗi video thành một bài loại "video" như thêm bằng tay. */
export async function quickAddVideosAction(input: unknown) {
  const user = await requireAccess('content', 'full');
  const p = QuickVideosSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message || 'Dữ liệu chưa hợp lệ' };
  const key = (source: string, id: string | null) => `${source}:${id}`;
  const used = new Set((await postsByVideo(
    p.data.filter((v) => v.source === 'youtube').map((v) => v.videoId), p.data.filter((v) => v.source === 'tiktok').map((v) => v.videoId),
  )).flatMap((u) => [key('youtube', u.youtubeId), key('tiktok', u.tiktokId)]));

  const results: { key: string; ok: boolean; error?: string; id?: number; noCover?: boolean }[] = [];
  for (const v of p.data) {
    const k = key(v.source, v.videoId);
    if (used.has(k)) { results.push({ key: k, ok: false, error: 'Video này đã có trên web' }); continue; }
    const input = PostInputSchema.safeParse({
      kind: 'video', category: v.category, title: v.title, excerpt: v.excerpt.trim(),
      body: v.content.split(/\n\s*\n/).map((t) => t.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).map((text) => ({ type: 'p' as const, text })),
      coverFile: null,
      youtubeId: v.source === 'youtube' ? v.videoId : null, tiktokId: v.source === 'tiktok' ? v.videoId : null,
      videoVertical: v.vertical, videoSeconds: null, authorName: (v.channel.trim() || staffName(user)).slice(0, 60),
      reviewerName: '', reviewerTitle: '', diseases: [], tags: [], seoDescription: '', featured: v.featured, publishAt: null,
    });
    if (!input.success) { results.push({ key: k, ok: false, error: input.error.issues[0].message }); continue; }
    const r = await savePost(input.data, 'publish', user);
    if (!r.ok) { results.push({ key: k, ok: false, error: r.error }); continue; }
    used.add(k);
    // TikTok không có link ảnh cố định: tải ảnh về làm ảnh bìa; không được thì báo để admin tải tay.
    let noCover = false;
    if (v.source === 'tiktok') {
      const img = v.thumb ? await downloadTiktokThumb(v.thumb) : null;
      if (img) await attachAutoCover(r.id, img);
      else noCover = true;
    }
    results.push({ key: k, ok: true, id: r.id, noCover });
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
