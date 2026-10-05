'use client';

import { useEffect, useRef } from 'react';

// Nền khung đầu trang Cây Tết (/cay-tet): video mai vàng chạy lặp, không tiếng (CSS khối "Cây Tết" trong globals.css).
// Video gốc: Lê Hoàng Khanh Lê trên Pexels (giấy phép Pexels — miễn phí, kể cả thương mại):
// https://www.pexels.com/video/close-up-on-yellow-flowers-11142501/ — đã cắt 13 giây, nối mờ cuối → đầu để lặp liền.
// Ảnh tĩnh hiện trước khi video tải, và thay hẳn video khi máy chọn giảm chuyển động / tiết kiệm dữ liệu.
const VIDEO = '/videos/mai-vang.mp4';
const POSTER = '/videos/mai-vang.jpg';

export function TetHeroMedia() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.muted = true;
    v.src = VIDEO;
    // Cuộn khỏi khung đầu trang thì dừng video cho đỡ tốn pin.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <video ref={ref} className="app-tet-bg" poster={POSTER} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
      <div className="cp-art app-tet-art">
        <em>Giảm 15% đặt sớm</em>
      </div>
    </>
  );
}
