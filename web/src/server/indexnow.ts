import 'server-only';
import { after } from 'next/server';
import { absoluteUrl, SITE_ORIGIN } from '@/lib/site';

/**
 * IndexNow: báo ngay cho Bing (máy tìm kiếm của ChatGPT Search, Copilot), Yandex, Seznam, Naver… khi trang được
 * thêm / sửa / ẩn / xóa, thay vì chờ máy tự đọc lại sitemap. Khóa nằm ở file public/<khóa>.txt — đừng xóa / đổi file đó.
 * Chỉ gửi trên bản production thật (Vercel) — máy dev, bản xem trước không gửi. Gửi sau khi trả lời admin (after), lỗi bỏ qua.
 */
export const INDEXNOW_KEY = '948610ca7993a8b34f62ed921e423001';

export function pingIndexNow(paths: (string | null | undefined)[]) {
  const urls = [...new Set(paths.filter((p): p is string => !!p).map((p) => absoluteUrl(p)))];
  if (!urls.length || process.env.VERCEL_ENV !== 'production') return;
  after(async () => {
    try {
      await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host: new URL(SITE_ORIGIN).host, key: INDEXNOW_KEY, keyLocation: absoluteUrl(`/${INDEXNOW_KEY}.txt`), urlList: urls }),
        signal: AbortSignal.timeout(8000),
      });
    } catch { /* không chặn việc lưu */ }
  });
}
