'use client';

import { useState } from 'react';
import { youtubeThumb } from '@/lib/posts';

/**
 * Video YouTube "nhẹ" (SEO mục 10 — tốc độ, 16/10/2026): lúc đầu chỉ là ảnh video + nút phát; bấm mới gắn trình phát.
 * Trình phát YouTube nhúng sẵn tải ~1MB JavaScript và chiếm luồng chính của trình duyệt (làm chậm cuộn / bấm — INP),
 * dù đa số khách không bấm xem. `eager`: video nằm đầu trang (bài video) → ảnh tải ngay, ưu tiên cao (thường là LCP).
 * Bản không có JavaScript / máy tìm kiếm vẫn có link xem trên YouTube (thẻ <a>), JSON-LD VideoObject vẫn ở trang.
 */
export function YouTubeLite({ id, title, src, vertical, eager }: { id: string; title: string; src: string; vertical?: boolean; eager?: boolean }) {
  const [on, setOn] = useState(false);
  const cls = vertical ? 'app-yt app-yt--v' : 'app-yt';
  if (on) {
    return (
      <div className={cls}>
        <iframe src={`${src}${src.includes('?') ? '&' : '?'}autoplay=1`} title={title} referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" />
      </div>
    );
  }
  return (
    <div className={cls}>
      <a
        className="app-yt__lite"
        href={`https://www.youtube.com/watch?v=${id}`}
        onClick={(e) => { e.preventDefault(); setOn(true); }}
        aria-label={`Phát video: ${title}`}
      >
        <img src={youtubeThumb(id)} alt="" width={480} height={360} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} />
        <span className="app-yt__play" aria-hidden="true">
          <svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.5 7.7A8.5 8.5 0 0 0 60.5 1.7C55.2.3 34 .3 34 .3S12.8.3 7.5 1.7a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#f00" /><path d="M45 24 27 14v20z" fill="#fff" /></svg>
        </span>
      </a>
    </div>
  );
}
