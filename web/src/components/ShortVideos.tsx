'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { TIKTOK_NAME, YOUTUBE_NAME } from '@/lib/contact';
import { videoPlayer, videoShareUrl, type ShortVideo } from '@/lib/posts';
import '@/styles/shorts.css';
import { responsive } from '@/lib/images';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Đổi `?v=` trên thanh địa chỉ (không tải lại trang) — nút Quay lại của điện thoại đóng khung xem thay vì rời trang. */
function setVideoParam(slug: string | null, push: boolean) {
  const u = new URL(window.location.href);
  if (slug) u.searchParams.set('v', slug);
  else u.searchParams.delete('v');
  if (push) window.history.pushState(null, '', u);
  else window.history.replaceState(null, '', u);
}

const TIKTOK_NOTE = 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';
const YOUTUBE_MARK = 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.930-.502-5.814z';

/** Logo nguồn video + tên kênh của shop ở góc thẻ: TikTok (nền đen, chữ trắng) hoặc YouTube (nền trắng, chữ đen). */
function SourceLogo({ source }: { source: ShortVideo['source'] }) {
  return source === 'tiktok' ? (
    <span className="shv-card__src shv-card__src--tiktok" role="img" aria-label={`TikTok ${TIKTOK_NAME}`}>
      <svg viewBox="-2 -2 28 28" aria-hidden="true">
        <path d={TIKTOK_NOTE} fill="#25f4ee" transform="translate(-0.9 -0.9)" />
        <path d={TIKTOK_NOTE} fill="#fe2c55" transform="translate(0.9 0.9)" />
        <path d={TIKTOK_NOTE} fill="#fff" />
      </svg>
      <span>{TIKTOK_NAME}</span>
    </span>
  ) : (
    <span className="shv-card__src shv-card__src--youtube" role="img" aria-label={`YouTube ${YOUTUBE_NAME}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={YOUTUBE_MARK} fill="#f00" />
        <path d="M9.545 15.568V8.432L15.818 12z" fill="#fff" />
      </svg>
      <span>{YOUTUBE_NAME}</span>
    </span>
  );
}

/**
 * Video ngắn (YouTube Shorts, TikTok): thẻ dọc 9:16, bấm là xem ngay trên trang trong khung toàn màn hình.
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
              {x.thumb ? <img {...responsive(x.thumb, '(max-width: 47.9375em) 46vw, 220px', 640)} alt="" loading="lazy" /> : <span className="shv-card__blank" aria-hidden="true" />}
              <SourceLogo source={x.source} />
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
              <iframe key={`${v.source}:${v.videoId}`} src={videoPlayer(v.source, v.videoId)} title={v.title} referrerPolicy="strict-origin-when-cross-origin"
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
                <Link href={v.href} prefetch={false} className="shv-btn" aria-label={`Chi tiết: ${v.title}`}>Chi tiết</Link>
                <button type="button" className="shv-btn" onClick={share}>{copied ? 'Đã chép link' : 'Chia sẻ'}</button>
              </div>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
