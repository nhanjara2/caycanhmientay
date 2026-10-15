import 'server-only';
import { IMAGE_WIDTHS, imageFileOf } from '@/lib/images';

/**
 * Trả ảnh công khai lưu trong database (sản phẩm, bài viết, bệnh cây, dự án, banner) — quy ước URL ở lib/images.ts.
 * `?w=` hợp lệ → thu nhỏ bằng sharp, WebP khi trình duyệt nhận (`Vary: Accept`), không thì JPEG; sharp lỗi thì trả ảnh gốc.
 * Tên file không đổi nội dung (đổi ảnh = đổi tên) → trình duyệt + CDN giữ 1 năm (`s-maxage` để CDN Vercel cũng giữ).
 */
const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

type Img = { data: Buffer | Uint8Array; mime: string };

export async function publicImage(req: Request, name: string, read: (file: string) => Promise<Img | null>): Promise<Response> {
  const file = imageFileOf(name);
  if (!file) return new Response('Not found', { status: 404 });
  const url = new URL(req.url);
  const w = url.searchParams.get('w');
  const width = w === null ? 0 : Number(w);
  if (w !== null && !(IMAGE_WIDTHS as readonly number[]).includes(width)) return new Response('Not found', { status: 404 });

  const img = await read(file);
  if (!img) return new Response('Not found', { status: 404 });

  const headers: Record<string, string> = { 'cache-control': CACHE, 'x-content-type-options': 'nosniff' };
  // Bản *.vercel.app không được index (proxy gắn noindex cho trang, nhưng proxy không chạy cho /api/)
  if (url.hostname.endsWith('.vercel.app')) headers['x-robots-tag'] = 'noindex';

  if (width) {
    headers.vary = 'Accept';
    const webp = (req.headers.get('accept') ?? '').includes('image/webp');
    try {
      const out = await resize(img.data, width, webp);
      return new Response(new Uint8Array(out), { headers: { ...headers, 'content-type': webp ? 'image/webp' : 'image/jpeg' } });
    } catch (e) {
      console.error('Không thu nhỏ được ảnh', file, e);
      // giữ ảnh gốc nhưng không để CDN nhớ bản lỗi cả năm
      headers['cache-control'] = 'public, max-age=300';
    }
  }
  return new Response(new Uint8Array(img.data), { headers: { ...headers, 'content-type': img.mime } });
}

async function resize(data: Buffer | Uint8Array, width: number, webp: boolean) {
  const sharp = (await import('sharp')).default;
  const pipe = sharp(data, { failOn: 'none' }).rotate().resize({ width, withoutEnlargement: true });
  return (webp ? pipe.webp({ quality: 76 }) : pipe.flatten({ background: '#ffffff' }).jpeg({ quality: 78, mozjpeg: true })).toBuffer();
}
