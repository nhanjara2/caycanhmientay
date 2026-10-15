import { readProductImage } from '@/server/uploads';
import { publicImage } from '@/server/image-response';

/** Ảnh sản phẩm: công khai. Tên "<slug>-<mã>.jpg", "?w=" = bản thu nhỏ — xem lib/images.ts, server/image-response.ts. */
export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  return publicImage(req, (await ctx.params).file, readProductImage);
}
