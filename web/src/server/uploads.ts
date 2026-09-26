import 'server-only';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, schema } from './db';

// Ảnh lưu ngay trong database (warranty_photos.data) — máy chủ Vercel không giữ file ghi ra ổ đĩa.
const MAX_BYTES = 2 * 1024 * 1024; // ảnh đã nén ở trình duyệt ~300–600KB

/** Nhận diện ảnh bằng byte đầu file (không tin phần mở rộng hay content-type do trình duyệt gửi). */
function sniff(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

export type SavedImage = { file: string; mime: string; data: Buffer };

export async function saveImage(f: File): Promise<SavedImage | { error: string }> {
  if (f.size > MAX_BYTES) return { error: 'Ảnh quá lớn (tối đa 2MB)' };
  const buf = Buffer.from(await f.arrayBuffer());
  const t = sniff(buf);
  if (!t) return { error: 'Chỉ nhận ảnh JPG, PNG hoặc WebP' };
  const file = `${randomBytes(16).toString('hex')}.${t.ext}`;
  return { file, mime: t.mime, data: buf };
}

/** Tên file chỉ gồm hex + đuôi — chặn đường dẫn kiểu "../". */
export const isSafeName = (name: string) => /^[a-f0-9]{32}\.(jpg|png|webp)$/.test(name);

export const readUpload = async (name: string) =>
  (await db.select({ data: schema.warrantyPhotos.data }).from(schema.warrantyPhotos).where(eq(schema.warrantyPhotos.file, name)))[0]?.data ?? null;
