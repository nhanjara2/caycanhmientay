import { isSafeName, readProductImage } from '@/server/uploads';

/** Ảnh sản phẩm: công khai. Tên file ngẫu nhiên và không bao giờ đổi nội dung → cache lâu dài. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!isSafeName(file)) return new Response('Not found', { status: 404 });
  const img = await readProductImage(file);
  if (!img) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: { 'content-type': img.mime, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' },
  });
}
