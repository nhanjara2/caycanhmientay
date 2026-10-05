/**
 * Ảnh đại diện Google (claim `picture` của id_token). Chỉ nhận https://*.googleusercontent.com — không lưu URL lạ
 * vào database rồi nhúng vào trang. Google trả cỡ 96px (`=s96-c`); màn Retina hiển thị ô 32–96px cần gấp đôi → đổi sang 256.
 */
export function cleanGoogleAvatar(url: unknown): string | null {
  if (typeof url !== 'string' || url.length > 500) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'https:' || !/(^|\.)googleusercontent\.com$/.test(u.hostname)) return null;
  return u.toString().replace(/=s\d+-c$/, '=s256-c');
}
