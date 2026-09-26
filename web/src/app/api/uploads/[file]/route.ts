import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/server/auth';
import { db, schema } from '@/server/db';
import { isSafeName, readUpload } from '@/server/uploads';

/** Ảnh bảo hành: chỉ chủ yêu cầu hoặc nhân viên xem được. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!isSafeName(file)) return new Response('Not found', { status: 404 });
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const [row] = await db.select({ mime: schema.warrantyPhotos.mime, owner: schema.warrantyRequests.userId })
    .from(schema.warrantyPhotos)
    .innerJoin(schema.warrantyRequests, eq(schema.warrantyRequests.id, schema.warrantyPhotos.requestId))
    .where(eq(schema.warrantyPhotos.file, file));
  if (!row) return new Response('Not found', { status: 404 });
  if (row.owner !== user.id && user.role === 'customer') return new Response('Forbidden', { status: 403 });

  const data = await readUpload(file);
  if (!data) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { 'content-type': row.mime, 'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff' },
  });
}
