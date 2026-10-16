/**
 * Tạo bản thu nhỏ cho ảnh tĩnh lớn trong public/images (banner trang chủ, ảnh nhóm hàng, ảnh nhóm đối tác) — SEO mục 10.
 * Ảnh database đã có "?w=" do máy chủ thu nhỏ; ảnh tĩnh thì thu nhỏ sẵn một lần bằng lệnh này:
 *
 *   npm run images:static
 *
 * Mỗi ảnh "x.webp" / "x.jpg" rộng hơn một mốc trong WIDTHS → thêm "x-w640.webp"… cạnh ảnh gốc (WebP, chất lượng 78),
 * rồi ghi danh sách vào src/lib/static-images.ts để `responsive()` / `thumbUrl()` (lib/images.ts) dựng srcSet.
 * Điện thoại chỉ hiện banner rộng ~360–430px nên tải bản 640 / 960 (40–90KB) thay vì ảnh gốc 1680px (200–300KB).
 *
 * **Thay / thêm ảnh trong các thư mục dưới thì chạy lại lệnh này** rồi commit cả file ảnh mới lẫn static-images.ts
 * (bản thu nhỏ cũ của ảnh đã thay sẽ được ghi đè; ảnh gốc không đổi). Không chạy trong build (Vercel không cần sharp ở bước build).
 */
import { readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIRS = ['images/banner', 'images/danh-muc', 'images/doi-tac'];
const WIDTHS = [320, 640, 960, 1280];
const VARIANT = /-w\d+\.webp$/;

const manifest: Record<string, number[]> = {};
for (const dir of DIRS) {
  const abs = path.join(ROOT, 'public', dir);
  const files = await readdir(abs);
  // Xóa bản thu nhỏ cũ trước (ảnh gốc có thể đã đổi cỡ / bị xóa).
  for (const f of files.filter((f) => VARIANT.test(f))) await unlink(path.join(abs, f));
  for (const f of files.filter((f) => /\.(webp|jpe?g|png)$/i.test(f) && !VARIANT.test(f)).sort()) {
    const src = path.join(abs, f);
    const { width = 0 } = await sharp(src).metadata();
    const ws = WIDTHS.filter((w) => w < width * 0.9);
    if (!ws.length) continue;
    const base = f.replace(/\.[^.]+$/, '');
    for (const w of ws) await sharp(src).resize({ width: w }).webp({ quality: 78 }).toFile(path.join(abs, `${base}-w${w}.webp`));
    manifest[`/${dir}/${f}`] = [...ws, width];
    console.log(`${dir}/${f} (${width}px) → ${ws.join(', ')}`);
  }
}

const out = `// Sinh tự động bởi \`npm run images:static\` (scripts/resize-static-images.mts) — đừng sửa tay.
// Ảnh tĩnh có bản thu nhỏ "<tên>-w<bề rộng>.webp"; số cuối mỗi dòng là bề rộng ảnh gốc.
export const STATIC_IMAGE_WIDTHS: Record<string, readonly number[]> = ${JSON.stringify(manifest, null, 2)};
`;
await writeFile(path.join(ROOT, 'src/lib/static-images.ts'), out);
console.log(`Đã ghi src/lib/static-images.ts (${Object.keys(manifest).length} ảnh).`);
