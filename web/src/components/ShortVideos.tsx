'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { videoShareUrl, youtubePlayer, type ShortVideo } from '@/lib/posts';
import '@/styles/shorts.css';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Đổi `?v=` trên thanh địa chỉ (không tải lại trang) — nút Quay lại của điện thoại đóng khung xem thay vì rời trang. */
function setVideoParam(slug: string | null, push: boolean) {
  const u = new URL(window.location.href);
  if (slug) u.searchParams.set('v', slug);
  else u.searchParams.delete('v');
  if (push) window.history.pushState(null, '', u);
  else window.history.replaceState(null, '', u);
}

/**
 * Video ngắn (YouTube Shorts): thẻ dọc 9:16, bấm là xem ngay trên trang trong khung toàn màn hình.
 * Chuyển video: nút Trước / Sau, phím mũi tên, vuốt lên / xuống ngoài khung video. Đóng: nút Đóng, Esc, bấm ra ngoài, nút Quay lại.
 * `openSlug` (trang /video?v=…) mở sẵn video đó — link chia sẻ qua Zalo / Facebook.
 */
export function ShortVideos({ videos, layout, openSlug }: { videos: ShortVideo[]; layout: 'row' | 'grid'; openSlug?: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const pushed = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [cur, setCur] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const n = videos.length;
  const v = cur === null ? null : videos[cur];

  const open = (i: number, push = true) => {
    setCur(i);
    setCopied(false);
    if (!dlg.current?.open) dlg.current?.showModal();
    closeBtn.current?.focus();
    if (push) { setVideoParam(videos[i].slug, true); pushed.current = true; }
  };
  const go = (d: number) => {
    if (cur === null || cur + d < 0 || cur + d >= n) return;
    setCur(cur + d);
    setCopied(false);
    setVideoParam(videos[cur + d].slug, false);
  };

  useEffect(() => {
    const i = openSlug ? videos.findIndex((x) => x.slug === openSlug) : -1;
    if (i >= 0) open(i, false);
    // Chỉ mở một lần khi vào trang bằng link chia sẻ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    // Đóng bằng bất cứ cách nào: gỡ video (dừng tiếng), trả thanh địa chỉ về như trước khi mở.
    const onClose = () => {
      setCur(null);
      if (pushed.current) { pushed.current = false; window.history.back(); }
      else if (new URL(window.location.href).searchParams.has('v')) setVideoParam(null, false);
    };
    const onPop = () => {
      if (!d.open) return;
      pushed.current = false;
      d.close();
    };
    d.addEventListener('close', onClose);
    window.addEventListener('popstate', onPop);
    return () => { d.removeEventListener('close', onClose); window.removeEventListener('popstate', onPop); };
  }, []);

  const onCardClick = (e: MouseEvent, i: number) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // mở tab mới: vào trang chi tiết như link thường
    e.preventDefault();
    open(i);
  };

  const onKey = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); go(1); }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
  };
  const onDown = (e: PointerEvent) => { touch.current = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY }; };
  const onUp = (e: PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.clientX - t.x, dy = e.clientY - t.y;
    if (Math.abs(dy) < 50 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
    swiped.current = true;
    go(dy < 0 ? 1 : -1);
  };
  const onDialogClick = (e: MouseEvent) => {
    if (swiped.current) { swiped.current = false; return; }
    if (e.target === e.currentTarget) dlg.current?.close();
  };

  const share = async () => {
    if (!v) return;
    const url = new URL(videoShareUrl(v.slug), window.location.origin).toString();
    try {
      if (navigator.share) { await navigator.share({ title: v.title, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {}
  };

  return (
    <>
      <div className={layout === 'row' ? 'shv-row' : 'shv-grid'}>
        {videos.map((x, i) => (
          <Link key={x.id} href={x.href} prefetch={false} className="shv-card app-plain" onClick={(e) => onCardClick(e, i)}>
            <span className={x.zoomThumb ? 'shv-card__img shv-card__img--zoom' : 'shv-card__img'}>
              <img src={x.thumb} alt="" loading="lazy" />
              <span className="shv-card__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span>
              {x.seconds ? <small className="shv-card__time">{clock(x.seconds)}</small> : null}
            </span>
            <b>{x.title}</b>
          </Link>
        ))}
      </div>

      <dialog ref={dlg} className="shv-dlg" aria-labelledby={titleId} onClick={onDialogClick} onKeyDown={onKey}
        onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { touch.current = null; }}>
        <div className="shv-top">
          <span className="shv-count">{cur !== null && n > 1 ? `${cur + 1} / ${n}` : ''}</span>
          <button ref={closeBtn} type="button" className="shv-btn shv-close" onClick={() => dlg.current?.close()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>Đóng
          </button>
        </div>
        {v && (
          <>
            <div className={v.vertical ? 'shv-player' : 'shv-player shv-player--wide'}>
              <iframe key={v.youtubeId} src={youtubePlayer(v.youtubeId)} title={v.title} referrerPolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen" allowFullScreen />
            </div>
            <div className="shv-side">
              <h2 id={titleId}>{v.title}</h2>
              {v.categoryName && <span className="shv-meta">{v.categoryName}</span>}
              <div className="shv-acts">
                {n > 1 && (
                  <>
                    <button type="button" className="shv-btn" onClick={() => go(-1)} disabled={cur === 0} aria-label="Video trước">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>Trước
                    </button>
                    <button type="button" className="shv-btn" onClick={() => go(1)} disabled={cur === n - 1} aria-label="Video sau">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>Sau
                    </button>
                  </>
                )}
                <Link href={v.href} prefetch={false} className="shv-btn">Chi tiết</Link>
                <button type="button" className="shv-btn" onClick={share}>{copied ? 'Đã chép link' : 'Chia sẻ'}</button>
              </div>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
