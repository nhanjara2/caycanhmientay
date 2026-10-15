'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Crop } from '@/lib/compress-image';
import { Icon } from '@/components/Icon';

/** Một khung cắt để chọn: `ratio` = rộng / cao, `null` = giữ đúng khung ảnh gốc. */
export type CropAspect = { label: string; ratio: number | null };
export type CropOptions = {
  aspects: CropAspect[];
  /** "Ảnh 2/5" khi chọn nhiều ảnh một lần. */
  step?: string;
  /** Cạnh dài ảnh sau khi nén (để báo cỡ ảnh ra). */
  max?: number;
  /** Ảnh ra nhỏ hơn số này (cạnh ngắn) thì nhắc có thể bị mờ. */
  minSide?: number;
  /** Chữ nút xác nhận. */
  okLabel?: string;
};
/** `skip` = bỏ ảnh này (đi tiếp ảnh sau), `cancel` = đóng hộp, dừng cả lượt tải. */
export type CropResult = Crop | 'skip' | 'cancel';

export const ORIGINAL: CropAspect = { label: 'Nguyên ảnh', ratio: null };
export const PRODUCT_ASPECTS: CropAspect[] = [{ label: 'Vuông 1:1', ratio: 1 }, { label: 'Ngang 4:3', ratio: 4 / 3 }, { label: 'Dọc 3:4', ratio: 3 / 4 }, ORIGINAL];
export const LANDSCAPE_ASPECTS: CropAspect[] = [{ label: 'Ngang 4:3', ratio: 4 / 3 }, { label: 'Vuông 1:1', ratio: 1 }, ORIGINAL];
export const ARTICLE_ASPECTS: CropAspect[] = [ORIGINAL, { label: 'Ngang 16:9', ratio: 16 / 9 }, { label: 'Ngang 4:3', ratio: 4 / 3 }, { label: 'Vuông 1:1', ratio: 1 }, { label: 'Dọc 3:4', ratio: 3 / 4 }];
export const COVER_ASPECTS: CropAspect[] = [{ label: 'Ngang 16:9', ratio: 16 / 9 }, { label: 'Ngang 4:3', ratio: 4 / 3 }, ORIGINAL];

const MAX_ZOOM = 5;
const PAD = 16;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Job = { id: number; file: Blob; opts: CropOptions; aspect: number; done: (r: CropResult) => void };

/**
 * Hộp Cắt ảnh dùng chung cho các chỗ tải ảnh trong admin.
 * `const { crop, cropDialog } = useImageCrop()` → `const r = await crop(file, { aspects })` → `compressImage(file, max, wm, r)`.
 * Gắn `{cropDialog}` vào JSX. Khung chọn lần trước được nhớ cho ảnh sau (cùng bộ khung).
 */
export function useImageCrop() {
  const [job, setJob] = useState<Job | null>(null);
  const seq = useRef(0);
  const last = useRef(new Map<string, number>());

  const crop = useCallback((file: Blob, opts: CropOptions) => new Promise<CropResult>((resolve) => {
    const key = opts.aspects.map((a) => a.label).join('|');
    const aspect = Math.min(last.current.get(key) ?? 0, opts.aspects.length - 1);
    setJob({
      id: ++seq.current, file, opts, aspect,
      done: (r) => { setJob(null); resolve(r); },
    });
  }), []);

  const remember = useCallback((opts: CropOptions, i: number) => {
    last.current.set(opts.aspects.map((a) => a.label).join('|'), i);
  }, []);

  const cropDialog = job ? <CropDialog key={job.id} job={job} onAspect={(i) => remember(job.opts, i)} /> : null;
  return { crop, cropDialog };
}

function CropDialog({ job, onAspect }: { job: Job; onAspect: (i: number) => void }) {
  const { file, opts, done } = job;
  const [src, setSrc] = useState('');
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [broken, setBroken] = useState(false);
  const [aspect, setAspect] = useState(job.aspect);
  const [rot, setRot] = useState<Crop['rotate']>(0);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [box, setBox] = useState({ w: 0, h: 0 });
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setSrc(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // khóa cuộn trang phía sau khi hộp mở; Esc đóng hộp (nghe ở window: lúc mở, ô đang chọn có thể còn nằm ngoài hộp)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    stage.current?.focus({ preventScroll: true });
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); done('cancel'); } };
    window.addEventListener('keydown', onKey, true);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey, true); };
  }, [done]);

  // ---- hình học: khung cắt nằm giữa vùng xem, ảnh phủ kín khung, kéo ảnh để chọn phần giữ lại ----
  const side = rot % 180 !== 0;
  const iw = nat ? (side ? nat.h : nat.w) : 1, ih = nat ? (side ? nat.w : nat.h) : 1;
  const ratio = opts.aspects[aspect]?.ratio ?? iw / ih;
  const aw = Math.max(1, box.w - PAD * 2), ah = Math.max(1, box.h - PAD * 2);
  let fw = aw, fh = aw / ratio;
  if (fh > ah) { fh = ah; fw = ah * ratio; }
  const k = Math.max(fw / iw, fh / ih) * zoom; // pixel màn hình trên 1 pixel ảnh
  const dw = iw * k, dh = ih * k;
  const cx = clamp(center.x, fw / 2 / dw, 1 - fw / 2 / dw), cy = clamp(center.y, fh / 2 / dh, 1 - fh / 2 / dh);
  const out: Crop = { rotate: rot, w: fw / k, h: fh / k, x: cx * iw - fw / k / 2, y: cy * ih - fh / k / 2 };
  const outScale = Math.min(1, (opts.max ?? Infinity) / Math.max(out.w, out.h));
  const outW = Math.round(out.w * outScale), outH = Math.round(out.h * outScale);

  const geo = useRef({ dw, dh, cx, cy, zoom });
  geo.current = { dw, dh, cx, cy, zoom };

  const setZoomKeep = useCallback((z: number) => setZoom(clamp(z, 1, MAX_ZOOM)), []);

  // lăn chuột để phóng to / thu nhỏ (cần passive: false mới chặn được trang cuộn)
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomKeep(geo.current.zoom * Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setZoomKeep]);

  // kéo một ngón / chuột = dời ảnh, hai ngón = phóng to
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const dist = () => {
    const [a, b] = [...ptrs.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!nat) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 2) pinch.current = { d: dist(), z: geo.current.zoom };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = ptrs.current.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size >= 2 && pinch.current) {
      setZoomKeep(pinch.current.z * (dist() / pinch.current.d));
      return;
    }
    const g = geo.current;
    setCenter({ x: g.cx - dx / g.dw, y: g.cy - dy / g.dh });
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) pinch.current = null;
  };

  const onStageKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (move[e.key]) {
      e.preventDefault();
      setCenter({ x: cx + move[e.key][0] * (fw / dw), y: cy + move[e.key][1] * (fh / dh) });
    } else if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoomKeep(zoom * 1.1); }
    else if (e.key === '-') { e.preventDefault(); setZoomKeep(zoom / 1.1); }
  };

  const rotate = (dir: 1 | -1) => {
    setRot((r) => (((r + dir * 90) % 360 + 360) % 360) as Crop['rotate']);
    setCenter({ x: 0.5, y: 0.5 });
    setZoom(1);
  };
  const reset = () => { setRot(0); setZoom(1); setCenter({ x: 0.5, y: 0.5 }); };
  const pickAspect = (i: number) => { setAspect(i); onAspect(i); };

  const multi = !!opts.step;
  const small = !!opts.minSide && Math.min(outW, outH) < opts.minSide;

  return createPortal(
    <div className="app-modal app-modal--top app-crop" role="dialog" aria-modal="true" aria-label="Cắt ảnh">
      <div className="vx-modal app-crop__box">
        <div className="vx-modal__head">
          Cắt ảnh{opts.step && <span className="app-crop__step">{opts.step}</span>}
          <button type="button" aria-label={multi ? 'Dừng tải các ảnh còn lại' : 'Đóng'} onClick={() => done('cancel')}><Icon name="close" /></button>
        </div>

        <div
          ref={stage} className="app-crop__stage" tabIndex={0} aria-label="Kéo để chọn phần ảnh giữ lại, lăn chuột hoặc chụm 2 ngón để phóng to"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onStageKey}
        >
          {src && !broken && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src} alt="" draggable={false}
              onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              onError={() => setBroken(true)}
              style={nat ? {
                width: nat.w * k, height: nat.h * k,
                left: box.w / 2 + (0.5 - cx) * dw, top: box.h / 2 + (0.5 - cy) * dh,
                transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              } : { visibility: 'hidden' }}
            />
          )}
          {nat && <span className="app-crop__frame" style={{ width: fw, height: fh }} aria-hidden="true" />}
          {broken && <span className="app-crop__msg">Không đọc được ảnh này (chọn ảnh JPG, PNG, WebP)</span>}
        </div>

        <div className="vx-modal__body app-crop__tools">
          <div className="app-crop__aspects" role="radiogroup" aria-label="Khung cắt">
            {opts.aspects.map((a, i) => (
              <button key={a.label} type="button" role="radio" aria-checked={i === aspect} className={i === aspect ? 'is-on' : undefined} onClick={() => pickAspect(i)}>
                {a.label}
              </button>
            ))}
          </div>
          <div className="app-crop__row">
            <span className="app-crop__zoom">
              <button type="button" className="app-crop__ic" onClick={() => setZoomKeep(zoom / 1.2)} aria-label="Thu nhỏ" disabled={zoom <= 1}>−</button>
              <input
                type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} aria-label="Phóng to"
                onChange={(e) => setZoomKeep(Number(e.target.value))}
              />
              <button type="button" className="app-crop__ic" onClick={() => setZoomKeep(zoom * 1.2)} aria-label="Phóng to" disabled={zoom >= MAX_ZOOM}>+</button>
            </span>
            <span className="app-crop__zoom app-crop__zoom--fit">
              <button type="button" className="app-crop__ic" onClick={() => rotate(-1)} aria-label="Xoay trái" title="Xoay trái"><RotateIcon /></button>
              <button type="button" className="app-crop__ic" onClick={() => rotate(1)} aria-label="Xoay phải" title="Xoay phải"><RotateIcon cw /></button>
              <button type="button" className="vx-btn vx-btn--ghost vx-btn--sm" onClick={reset}>Đặt lại</button>
            </span>
          </div>
          {nat && <span className={small ? 'app-crop__size is-small' : 'app-crop__size'}>{outW} × {outH} px{small && ' · ảnh nhỏ, có thể bị mờ'}</span>}
        </div>

        <div className="vx-modal__foot app-crop__foot">
          <button type="button" className="vx-btn vx-btn--outline" onClick={() => done(multi ? 'skip' : 'cancel')}>{multi ? 'Bỏ ảnh này' : 'Hủy'}</button>
          <button type="button" className="vx-btn vx-btn--primary" disabled={!nat} onClick={() => done(out)}>{opts.okLabel ?? 'Tải ảnh lên'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Mũi tên xoay (nét kiểu Lucide rotate-ccw; `cw` lật gương thành xoay phải). */
function RotateIcon({ cw }: { cw?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={cw ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
