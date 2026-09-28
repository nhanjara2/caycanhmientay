import { getCurrentUser } from '@/server/auth';
import { reviewPhotoAccess } from '@/server/reviews';
import { isSafeName } from '@/server/uploads';

/** Ảnh đánh giá: đánh giá đang hiện thì ai cũng xem được; còn lại chỉ người viết hoặc nhân viên. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!isSafeName(file)) return new Response('Not found', { status: 404 });
  const row = await reviewPhotoAccess(file);
  if (!row?.data) return new Response('Not found', { status: 404 });

  const open = row.status === 'published';
  if (!open) {
    const user = await getCurrentUser();
    if (!user || (user.id !== row.userId && user.role === 'customer')) return new Response('Not found', { status: 404 });
  }
  return new Response(new Uint8Array(row.data), {
    headers: {
      'content-type': row.mime,
      // Đánh giá có thể bị ẩn sau đó → không cache lâu ở trình duyệt/CDN.
      'cache-control': open ? 'public, max-age=3600' : 'private, max-age=3600',
      'x-content-type-options': 'nosniff',
    },
  });
}
