import { getCurrentUser } from '@/server/auth';
import { readServicePhoto } from '@/server/service-requests';
import { isSafeName } from '@/server/uploads';

/** Ảnh hiện trạng của yêu cầu dịch vụ: nhân viên, hoặc tài khoản đã gửi yêu cầu. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!isSafeName(file)) return new Response('Not found', { status: 404 });
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const row = await readServicePhoto(file);
  if (!row?.data) return new Response('Not found', { status: 404 });
  if (user.role === 'customer' && row.owner !== user.id) return new Response('Forbidden', { status: 403 });
  return new Response(new Uint8Array(row.data), {
    headers: { 'content-type': row.mime, 'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow' },
  });
}
