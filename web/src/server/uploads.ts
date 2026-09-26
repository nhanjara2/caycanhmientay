import 'server-only';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'data/uploads');
const MAX_BYTES = 2 * 1024 * 1024; // ảnh đã nén ở trình duyệt ~300–600KB

/** Nhận diện ảnh bằng byte đầu file (không tin phần mở rộng hay content-type do trình duyệt gửi). */
function sniff(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

export type SavedImage = { file: string; mime: string };

export async function saveImage(f: File): Promise<SavedImage | { error: string }> {
  if (f.size > MAX_BYTES) return { error: 'Ảnh quá lớn (tối đa 2MB)' };
  const buf = Buffer.from(await f.arrayBuffer());
  const t = sniff(buf);
  if (!t) return { error: 'Chỉ nhận ảnh JPG, PNG hoặc WebP' };
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const file = `${randomBytes(16).toString('hex')}.${t.ext}`;
  writeFileSync(join(UPLOAD_DIR, file), buf);
  return { file, mime: t.mime };
}

/** Tên file chỉ gồm hex + đuôi — chặn đường dẫn kiểu "../". */
export const isSafeName = (name: string) => /^[a-f0-9]{32}\.(jpg|png|webp)$/.test(name);

export const readUpload = (name: string) => readFileSync(join(UPLOAD_DIR, name));
