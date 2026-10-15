import { readPostImage } from '@/server/posts';
import { publicImage } from '@/server/image-response';

/** Ảnh bài viết: công khai (cả bài nháp — tên file ngẫu nhiên, không đoán được). Tên "<slug>-<mã>.jpg", "?w=" = bản thu nhỏ — xem lib/images.ts, server/image-response.ts. */
export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  return publicImage(req, (await ctx.params).file, readPostImage);
}
