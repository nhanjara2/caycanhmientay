'use client';

import { useEffect } from 'react';

/**
 * Ảnh hỏng (file bị xóa, mạng lỗi…) trên web khách: gắn `data-broken` để CSS giấu ảnh (khung giữ nền xám, không hiện
 * biểu tượng ảnh vỡ + chữ alt tràn khung). Không thay alt / tên sản phẩm. Ảnh hỏng trước khi script chạy cũng được bắt.
 */
export function ImageFallback() {
  useEffect(() => {
    const mark = (img: HTMLImageElement) => img.setAttribute('data-broken', '');
    const onError = (e: Event) => { if (e.target instanceof HTMLImageElement) mark(e.target); };
    document.addEventListener('error', onError, true);
    document.querySelectorAll<HTMLImageElement>('.app-site img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.currentSrc) mark(img);
    });
    return () => document.removeEventListener('error', onError, true);
  }, []);
  return null;
}
