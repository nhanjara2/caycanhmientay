'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { imageAlt, type Product } from '@/lib/catalog';
import { responsive, thumbUrl } from '@/lib/images';
import { Art } from './Icon';
import { ProductStickers } from './ProductStickers';

/** Độ phóng khi rê chuột lên ảnh lớn (kính lúp = 1/ZOOM khung phóng to). */
const ZOOM = 2.5;

type Lens = { x: number; y: number; w: number; h: number; size: string; pos: string };

/** Cột ảnh trang chi tiết: dính khi cuộn tới hết khối sản phẩm (CSS `.vx-pd > .vx-gal`).
 *  Ghi chiều cao cột vào `--gal-h` để cột cao hơn màn hình thì dính theo mép dưới thay vì bị che đáy. */
export function GalleryCol({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => el.style.setProperty('--gal-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div className="vx-gal" ref={ref}>{children}</div>;
}

/** ProductGallery: ảnh lớn + dải ảnh nhỏ. Chưa có ảnh thì hiện biểu tượng. Mọi ảnh đều do shop tự chụp / tải lên.
 *  Máy có chuột: rê lên ảnh lớn hiện kính lúp, khung phóng to phủ lên cột thông tin bên phải. */
export function ProductGallery({ p }: { p: Product }) {
  const images = p.images ?? [];
  const [cur, setCur] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [lens, setLens] = useState<Lens | null>(null);

  const move = (e: MouseEvent) => {
    const box = mainRef.current;
    const img = imgRef.current;
    if (!box || !img?.naturalWidth || !matchMedia('(hover: hover) and (pointer: fine) and (min-width: 48em)').matches) return;
    const r = box.getBoundingClientRect();
    // Khung phóng to = vuông, rộng bằng cả cột ảnh (ảnh lớn có thể hẹp hơn cột trên màn thấp)
    const pane = box.parentElement?.clientWidth || r.width;
    // Ảnh hiển thị kiểu object-fit: contain → tính khung ảnh thật (nằm giữa khung, có thể chừa viền hai bên / trên dưới)
    const s = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const iw = img.naturalWidth * s;
    const ih = img.naturalHeight * s;
    const ix = (r.width - iw) / 2;
    const iy = (r.height - ih) / 2;
    // Kính lúp chỉ chạy trong phần có ảnh, không trượt ra viền trống
    const w = Math.min(pane / ZOOM, iw);
    const h = Math.min(pane / ZOOM, ih);
    const x = Math.min(Math.max(e.clientX - r.left - w / 2, ix), ix + iw - w);
    const y = Math.min(Math.max(e.clientY - r.top - h / 2, iy), iy + ih - h);
    setLens({
      x, y, w, h,
      size: `${iw * ZOOM}px ${ih * ZOOM}px`,
      pos: `${(ix - x) * ZOOM}px ${(iy - y) * ZOOM}px`,
    });
  };

  return (
    <>
      <div
        className="vx-gal__main"
        ref={mainRef}
        data-zoom={images.length ? '' : undefined}
        onMouseMove={images.length ? move : undefined}
        onMouseLeave={() => setLens(null)}
      >
        {images.length ? <img ref={imgRef} {...responsive(images[cur], '(max-width: 47.9375em) 100vw, 600px')} alt={imageAlt(p, cur)} fetchPriority={cur === 0 ? 'high' : undefined} /> : <Art name={p.icon} />}
        {p.ship === 'plant' && images.length > 0 && <span className="vx-gal__tag vx-badge vx-badge--origin">Ảnh chụp tại vườn</span>}
        {/* Dấu "Ảnh thật 100%" nằm trong dải sticker; chưa có ảnh thì không có dấu này */}
        <ProductStickers p={p} size="lg" real={images.length > 0} />
        {lens && <span className="app-zoom-lens" style={{ left: lens.x, top: lens.y, width: lens.w, height: lens.h }} aria-hidden />}
      </div>
      {lens && (
        <div
          className="app-zoom-pane"
          style={{ backgroundImage: `url("${images[cur]}")`, backgroundSize: lens.size, backgroundPosition: lens.pos }}
          aria-hidden
        />
      )}
      {images.length > 1 && (
        <div className="vx-thumbs">
          {images.map((src, i) => (
            <button key={src} type="button" className="vx-thumb" aria-current={i === cur} aria-label={`Ảnh ${i + 1}`} onClick={() => setCur(i)} onMouseEnter={() => setCur(i)}>
              <img src={thumbUrl(src, 160)} alt="" width={160} height={160} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
