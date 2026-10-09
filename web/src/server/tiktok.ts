import 'server-only';
import { parseTiktokId } from '@/lib/posts';
import { saveImage, type SavedImage } from './uploads';

// Video TikTok cho "Thêm nhanh video ngắn". Máy chủ web đặt ở Mumbai (bom1) mà TikTok bị cấm ở Ấn Độ, nên mọi lần gọi
// TikTok ở đây đều là "được thì tốt": hỏng thì admin gõ tiêu đề / tải ảnh bìa tay; tên + ảnh thì trình duyệt admin
// (ở Việt Nam) hỏi thêm qua tiktokOembed (lib/posts.ts).

const isTiktokHost = (host: string) => /(^|\.)tiktok\.com$/i.test(host);

/**
 * Mở link rút gọn (vt.tiktok.com/…) để lấy link đầy đủ có mã video — chỉ đọc địa chỉ chuyển hướng, không tải trang,
 * và chỉ đi theo địa chỉ thuộc tiktok.com.
 */
export async function resolveTiktokShortLink(link: string): Promise<{ id: string; url: string } | null> {
  let cur = /^https?:\/\//i.test(link) ? link : `https://${link}`;
  for (let hop = 0; hop < 4; hop++) {
    const id = parseTiktokId(cur);
    if (id) return { id, url: cur };
    try {
      if (!isTiktokHost(new URL(cur).hostname)) return null;
      const r = await fetch(cur, { redirect: 'manual', signal: AbortSignal.timeout(8000), cache: 'no-store' });
      await r.body?.cancel();
      const loc = r.headers.get('location');
      if (!loc) return null;
      cur = new URL(loc, cur).toString();
    } catch {
      return null;
    }
  }
  return null;
}

/** Link ảnh do trình duyệt admin gửi lên: chỉ nhận https trên máy chủ ảnh của TikTok (chặn dùng máy chủ web đi tải link lạ). */
function isThumbUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && /(^|\.)(tiktokcdn(-[a-z]+)?\.com|ibyteimg\.com|byteimg\.com)$/i.test(u.hostname);
  } catch {
    return false;
  }
}

/** Tải ảnh video TikTok về để lưu thành ảnh bìa bài (JPG / PNG / WebP ≤ 2MB như ảnh tải tay). */
export async function downloadTiktokThumb(url: string): Promise<SavedImage | null> {
  if (!isThumbUrl(url)) return null;
  try {
    const r = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10_000), cache: 'no-store' });
    if (!r.ok) return null;
    const img = await saveImage(new File([await r.arrayBuffer()], 'tiktok'));
    return 'error' in img ? null : img;
  } catch {
    return null;
  }
}
