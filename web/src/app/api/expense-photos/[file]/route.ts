import { hasAccess } from '@/lib/permissions';
import { getCurrentUser } from '@/server/auth';
import { readExpensePhoto } from '@/server/expenses';
import { isSafeName } from '@/server/uploads';

/** Ảnh hóa đơn chi phí: chỉ nhân viên có quyền Chi phí xem được. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!isSafeName(file)) return new Response('Not found', { status: 404 });
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  if (user.role === 'customer' || !hasAccess(user, 'expenses')) return new Response('Forbidden', { status: 403 });

  const img = await readExpensePhoto(file);
  if (!img) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: { 'content-type': img.mime, 'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff' },
  });
}
