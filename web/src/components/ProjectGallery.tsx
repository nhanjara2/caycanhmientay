'use client';

import { useEffect, useRef, useState } from 'react';
import { projectImageUrl, type ProjectImage } from '@/lib/projects';
import { responsive, thumbUrl } from '@/lib/images';

/** Ảnh công trình: ảnh lớn + dải ảnh nhỏ; bấm ảnh lớn xem toàn màn hình (← → để chuyển, Esc để đóng). */
export function ProjectGallery({ images, title, slug }: { images: ProjectImage[]; title: string; slug?: string }) {
  const [i, setI] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);
  const n = images.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    d.addEventListener('keydown', onKey);
    return () => d.removeEventListener('keydown', onKey);
  });

  if (!n) return null;
  const cur = images[i];
  const alt = (im: ProjectImage, k: number) => im.caption || `${title} — ảnh ${k + 1}`;

  return (
    <div className="dn-gal">
      <figure className="dn-gal__main">
        <button type="button" className="dn-gal__open" onClick={() => dlg.current?.showModal()} aria-label="Xem ảnh lớn">
          <img {...responsive(projectImageUrl(cur.file, slug), '(max-width: 47.9375em) 100vw, 800px')} alt={alt(cur, i)} fetchPriority={i === 0 ? 'high' : undefined} />
        </button>
        {n > 1 && (
          <>
            <button type="button" className="dn-gal__nav dn-gal__nav--prev" onClick={() => go(-1)} aria-label="Ảnh trước">‹</button>
            <button type="button" className="dn-gal__nav dn-gal__nav--next" onClick={() => go(1)} aria-label="Ảnh sau">›</button>
            <span className="dn-gal__count">{i + 1} / {n}</span>
          </>
        )}
        {cur.caption && <figcaption>{cur.caption}</figcaption>}
      </figure>
      {n > 1 && (
        <div className="dn-gal__thumbs">
          {images.map((im, k) => (
            <button key={im.file} type="button" aria-current={k === i ? 'true' : undefined} aria-label={`Ảnh ${k + 1}`} onClick={() => setI(k)}>
              <img src={thumbUrl(projectImageUrl(im.file, slug), 160)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <dialog ref={dlg} className="dn-lightbox" aria-label={`Ảnh công trình: ${title}`} onClick={(e) => { if (e.target === e.currentTarget) dlg.current?.close(); }}>
        <img src={projectImageUrl(cur.file, slug)} alt={alt(cur, i)} />
        <div className="dn-lightbox__bar">
          <span>{cur.caption || title}{n > 1 && ` · ${i + 1}/${n}`}</span>
          {n > 1 && <button type="button" onClick={() => go(-1)} aria-label="Ảnh trước">‹</button>}
          {n > 1 && <button type="button" onClick={() => go(1)} aria-label="Ảnh sau">›</button>}
          <button type="button" onClick={() => dlg.current?.close()} aria-label="Đóng">✕</button>
        </div>
      </dialog>
    </div>
  );
}
