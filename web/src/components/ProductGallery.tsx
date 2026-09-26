'use client';

import { useState } from 'react';
import type { Product } from '@/lib/catalog';
import { Art } from './Icon';

/** ProductGallery: ảnh lớn + dải ảnh nhỏ. Chưa có ảnh thật thì hiện biểu tượng. */
export function ProductGallery({ p }: { p: Product }) {
  const images = p.images ?? [];
  const [cur, setCur] = useState(0);
  return (
    <>
      <div className="vx-gal__main">
        {images.length ? <img src={images[cur]} alt={p.name} /> : <Art name={p.icon} />}
        <div className="vx-gal__stamp"><span>ẢNH<br />THẬT</span></div>
        {p.ship === 'plant' && <span className="vx-gal__tag vx-badge vx-badge--origin">Ảnh chụp tại vườn</span>}
      </div>
      {images.length > 1 && (
        <div className="vx-thumbs">
          {images.map((src, i) => (
            <button key={src} type="button" className="vx-thumb" aria-current={i === cur} aria-label={`Ảnh ${i + 1}`} onClick={() => setCur(i)}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
