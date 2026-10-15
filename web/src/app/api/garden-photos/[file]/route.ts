import { getCurrentUser } from '@/server/auth';
import { gardenPhotoOwner } from '@/server/garden';
import { isSafeName, readGardenPhoto } from '@/server/uploads';

/** Ảnh vườn của tôi: chỉ chủ cây hoặc nhân viên xem được. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!isSafeName(file)) return new Response('Not found', { status: 404 });
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const ownerId = await gardenPhotoOwner(file);
  if (ownerId === null) return new Response('Not found', { status: 404 });
  if (ownerId !== user.id && user.role === 'customer') return new Response('Forbidden', { status: 403 });

  const row = await readGardenPhoto(file);
  if (!row?.data) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { 'content-type': row.mime, 'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow' },
  });
}
