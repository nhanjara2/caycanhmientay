import 'server-only';

export type YoutubeInfo =
  | { ok: true; title: string; channel: string; short: boolean | null }
  | { ok: false; error: string };

/**
 * Video dọc (YouTube Shorts)? youtube.com/shorts/<mã> trả 200 cho Shorts, chuyển sang /watch (303) cho video thường.
 * null = không rõ (mạng lỗi) — khi đó dựa vào dạng link.
 */
async function isShort(id: string): Promise<boolean | null> {
  try {
    const r = await fetch(`https://www.youtube.com/shorts/${id}`, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(8000), cache: 'no-store' });
    return r.status === 200 ? true : r.status >= 300 && r.status < 400 ? false : null;
  } catch {
    return null;
  }
}

/**
 * Tiêu đề, tên kênh và kiểu dọc / ngang của một video YouTube — oEmbed công khai, không cần API key.
 * 401 = chủ video tắt nhúng (không xem được trên web khác), 404 = video riêng tư / đã xóa / sai mã.
 */
export async function youtubeInfo(id: string): Promise<YoutubeInfo> {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
  try {
    const [r, short] = await Promise.all([fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' }), isShort(id)]);
    if (r.status === 401 || r.status === 403) return { ok: false, error: 'Chủ video không cho phát trên web khác' };
    if (r.status === 400 || r.status === 404) return { ok: false, error: 'Không tìm thấy video (riêng tư, đã xóa hoặc link sai)' };
    if (!r.ok) return { ok: false, error: `YouTube trả lỗi ${r.status}, thử lại sau` };
    const j = (await r.json()) as { title?: unknown; author_name?: unknown };
    return { ok: true, title: typeof j.title === 'string' ? j.title : '', channel: typeof j.author_name === 'string' ? j.author_name : '', short };
  } catch {
    return { ok: false, error: 'Không kết nối được YouTube, thử lại sau' };
  }
}
