'use client';

import { useRef, useState } from 'react';

/** Ảnh trong bài viết: bấm để xem toàn màn hình; trong khung xem bấm ảnh để phóng to cỡ thật (kéo / vuốt để xem), Esc hoặc ✕ để đóng. */
export function ZoomImage({ src, srcSet, sizes, alt, caption }: { src: string; srcSet?: string; sizes?: string; alt: string; caption?: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [big, setBig] = useState(false);
  const close = () => { dlg.current?.close(); };
  return (
    <>
      <button type="button" className="ar-zoom" onClick={() => { setBig(false); dlg.current?.showModal(); }} aria-label={`Phóng to ảnh: ${alt}`}>
        <img src={src} srcSet={srcSet} sizes={sizes} alt={alt} loading="lazy" />
        <span className="ar-zoom__hint" aria-hidden="true">⤢</span>
      </button>
      <dialog ref={dlg} className="dn-lightbox ar-lightbox" aria-label={alt} onClose={() => setBig(false)}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div className={`ar-lightbox__view${big ? ' is-big' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <img src={src} alt={alt} onClick={() => setBig((b) => !b)} />
        </div>
        <div className="dn-lightbox__bar">
          <span>{caption || alt}</span>
          <button type="button" onClick={() => setBig((b) => !b)} aria-label={big ? 'Thu nhỏ' : 'Phóng to'}>{big ? '−' : '+'}</button>
          <button type="button" onClick={close} aria-label="Đóng">✕</button>
        </div>
      </dialog>
    </>
  );
}
