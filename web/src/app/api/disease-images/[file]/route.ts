import { readDiseaseImage } from '@/server/diseases';
import { publicImage } from '@/server/image-response';

/** Ảnh minh họa triệu chứng bệnh cây: công khai. Tên "<slug>-<mã>.jpg", "?w=" = bản thu nhỏ — xem lib/images.ts, server/image-response.ts. */
export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  return publicImage(req, (await ctx.params).file, readDiseaseImage);
}
