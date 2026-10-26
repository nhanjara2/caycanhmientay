'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { isExternal } from '@/lib/home-banners';
import { Icon } from '../Icon';
import { responsive, thumbUrl } from '@/lib/images';

/** Một ảnh banner trang chủ — ảnh chủ shop tải lên hoặc ảnh dựng sẵn từ dữ liệu thật (sản phẩm, đối tác). */
export type Slide = {
  key: string;
  title: string;
  subtitle?: string;
  cta?: string;
  href?: string;
  /** Hiện chữ đè lên ảnh (ảnh chưa có chữ). */
  showText: boolean;
  image: string;
  imageMobile?: string | null;
  /** Nhãn nhỏ trên tiêu đề ("Sự kiện", "Giá sỉ"…). */
  badge?: string;
  /** Màu lớp phủ khi hiện chữ. */
  tone?: 'green' | 'sale' | 'sun';
  /** Ảnh đặt trong khung không cắt (ảnh sản phẩm vuông) thay vì phủ kín. */
  contain?: string[];
  /** Nền phủ kín phía sau khung đầu trang khi ảnh này đang hiện (băng ảnh rộng trên cùng). */
  bg?: { image?: string; imageMobile?: string; color?: string };
};

/** Bề rộng ảnh banner: khung hẹp thì phủ cả màn hình, máy tính tối đa băng rộng 1240px. */
const BANNER_SIZES = '(max-width: 63.9375em) 100vw, 1240px';

/** Ảnh + chữ (nếu có) của một banner; cả ô là link khi có `href`. */
export function SlideBody({ s, eager }: { s: Slide; eager?: boolean }) {
  const inner = (
    <>
      {s.contain?.length ? (
        <span className={`hm-collage hm-tone--${s.tone ?? 'green'}`} aria-hidden="true">
          {s.contain.slice(0, 3).map((src) => <img key={src} src={thumbUrl(src, 640)} alt="" loading={eager ? 'eager' : 'lazy'} />)}
        </span>
      ) : (
        <>
          {/* Ảnh đã có sẵn chữ, không có ảnh riêng điện thoại: khung điện thoại cao hơn thì đặt vừa ảnh (không cắt chữ) trên nền chính ảnh đó làm mờ */}
          {!s.showText && !s.imageMobile && <img className="hm-slide__fill" src={thumbUrl(s.image, 320)} alt="" aria-hidden="true" loading="lazy" />}
          <picture>
            {s.imageMobile && <source media="(max-width: 47.9375em)" srcSet={responsive(s.imageMobile, '100vw').srcSet ?? s.imageMobile} sizes="100vw" />}
            <img {...responsive(s.image, BANNER_SIZES, 1920)} alt={s.showText ? '' : s.title} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} />
          </picture>
        </>
      )}
      {s.showText && (
        <span className={`hm-slide__txt hm-tone--${s.tone ?? 'green'}`}>
          {s.badge && <span className="hm-slide__badge">{s.badge}</span>}
          <b className="hm-slide__title">{s.title}</b>
          {s.subtitle && <span className="hm-slide__sub">{s.subtitle}</span>}
          {s.cta && <span className="hm-slide__cta">{s.cta}<Icon name="chevron" size={18} /></span>}
        </span>
      )}
    </>
  );
  if (!s.href) return <span className="hm-slide__a">{inner}</span>;
  return isExternal(s.href)
    ? <a href={s.href} className="hm-slide__a app-plain" target="_blank" rel="noreferrer">{inner}</a>
    : <Link href={s.href} className="hm-slide__a app-plain">{inner}</Link>;
}

const AUTO_MS = 6000;

/**
 * Băng ảnh chạy vòng: vuốt ngang được (scroll-snap), tự chuyển 6 giây / ảnh.
 * Tự dừng khi rê chuột / bấm phím vào trong, khi tab ẩn hoặc máy bật giảm chuyển động; có nút Tạm dừng.
 * `onIndex` báo ảnh đang hiện (nền mờ phía sau khung đầu trang đổi theo).
 */
export function HomeCarousel({ slides, label, className = '', onIndex }: {
  slides: Slide[]; label: string; className?: string; onIndex?: (i: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const n = slides.length;
  // Số ảnh có thể giảm khi đổi cỡ màn hình (ô ảnh nhỏ tách khỏi băng ảnh lớn) — không để ảnh đang hiện vượt quá ảnh cuối.
  const i = Math.min(pos, Math.max(0, n - 1));

  const go = useCallback((to: number) => {
    const el = track.current;
    if (!el || !n) return;
    const k = (to + n) % n;
    el.scrollTo({ left: k * el.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [n]);

  // Ảnh đang hiện = vị trí cuộn (cả khi khách tự vuốt).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPos(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => { onIndex?.(i); }, [i, onIndex]);

  useEffect(() => {
    if (n < 2 || paused || hold || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => { if (!document.hidden) go(i + 1); }, AUTO_MS);
    return () => clearInterval(t);
  }, [n, i, paused, hold, go]);

  if (!n) return null;
  return (
    <div
      className={`hm-car ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      data-tall={slides.some((s) => s.showText || s.imageMobile) || undefined}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
    >
      <div className="hm-car__track" ref={track}>
        {slides.map((s, k) => (
          <div key={s.key} className="hm-slide" role="group" aria-roledescription="slide" aria-label={`${k + 1} / ${n}: ${s.title}`} aria-hidden={k !== i || undefined} inert={k !== i || undefined}>
            <SlideBody s={s} eager={k === 0} />
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <button type="button" className="hm-car__nav hm-car__nav--prev" aria-label="Ảnh trước" onClick={() => go(i - 1)}><Icon name="chevron" /></button>
          <button type="button" className="hm-car__nav hm-car__nav--next" aria-label="Ảnh sau" onClick={() => go(i + 1)}><Icon name="chevron" /></button>
          <div className="hm-car__dots">
            {slides.map((s, k) => (
              <button key={s.key} type="button" aria-label={`Xem ảnh ${k + 1}`} aria-current={k === i || undefined} onClick={() => go(k)} />
            ))}
            <button type="button" className="hm-car__pause" aria-label={paused ? 'Chạy tiếp' : 'Tạm dừng chạy ảnh'} onClick={() => setPaused((p) => !p)}>
              {paused
                ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Hẹp hơn máy tính (< 1024px) — khớp điểm chuyển 63.9375em trong home.css. Máy chủ + lúc mới tải coi như máy tính. */
const COMPACT = '(max-width: 63.9375em)';
function useCompact() {
  return useSyncExternalStore(
    (onChange) => {
      const m = matchMedia(COMPACT);
      m.addEventListener('change', onChange);
      return () => m.removeEventListener('change', onChange);
    },
    () => matchMedia(COMPACT).matches,
    () => false,
  );
}

/**
 * Khung đầu trang chủ (kiểu Long Châu): nền phủ kín bề ngang, băng ảnh rộng trên cùng, rồi ảnh lớn + tối đa 2 ảnh nhỏ bên phải.
 * Tablet / điện thoại (< 1024px) không đủ chỗ đặt ảnh nhỏ bên cạnh: các ảnh nhỏ nhập vào băng ảnh lớn thành MỘT băng chạy chung
 * (ô ảnh nhỏ riêng ẩn bằng CSS) thay vì xếp thành hàng bên dưới.
 * Nền đổi theo băng ảnh rộng: mỗi ảnh một lớp nền (nền riêng chủ shop tải; không có thì ảnh nền sự kiện chung;
 * chưa có nữa thì chính ảnh đó phóng to, làm mờ) — qua ảnh mới thì lớp nền của nó hiện dần
 * lên trên lớp cũ (lớp cũ giữ nguyên tới khi lớp mới rõ hẳn, không lộ nền xanh giữa chừng), cả khoảng trên trang đổi theo.
 * Không có băng ảnh rộng thì nền đổi theo ảnh lớn.
 */
export function HomeHero({ tops, slides, sides, backdrop }: {
  tops: Slide[]; slides: Slide[]; sides: Slide[]; backdrop: { image: string; imageMobile: string | null } | null;
}) {
  const compact = useCompact();
  const heroSlides = useMemo(() => (compact ? [...slides, ...sides] : slides), [compact, slides, sides]);
  const [{ i, prev }, setAt] = useState({ i: 0, prev: -1 });
  // Chỉ tải ảnh nền của ảnh đang hiện, ảnh kế tiếp và ảnh đã xem (khỏi tải hết 8 ảnh nền ngay khi vào trang).
  const [seen, setSeen] = useState(() => new Set([0, 1]));
  const onIndex = useCallback((k: number) => {
    setAt((a) => (a.i === k ? a : { i: k, prev: a.i }));
    setSeen((s) => (s.has(k) && s.has(k + 1) ? s : new Set([...s, k, k + 1])));
  }, []);
  // Lớp mới đã rõ hẳn (hiện dần .9s) thì thả lớp cũ — để lần sau quay lại ảnh đó nền vẫn hiện dần, không bật phắt lên.
  useEffect(() => {
    if (prev < 0) return;
    const t = setTimeout(() => setAt((a) => ({ ...a, prev: -1 })), 1000);
    return () => clearTimeout(t);
  }, [i, prev]);
  // Nền tràn lên sau đầu trang (kiểu Long Châu): đo khoảng từ đỉnh trang tới khung này làm --hm-hdr; đầu trang trong suốt
  // khi còn ở đỉnh trang (html[data-hm-top]), cuộn xuống thì đầu trang (dính trên cùng) trả lại nền đặc.
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hero = stage.current?.closest<HTMLElement>('.hm-hero');
    const header = document.querySelector('.app-header');
    if (!hero) return;
    const root = document.documentElement;
    const measure = () => hero.style.setProperty('--hm-hdr', `${Math.max(0, hero.getBoundingClientRect().top + scrollY)}px`);
    const onScroll = () => { if (scrollY < 8) root.dataset.hmTop = ''; else delete root.dataset.hmTop; };
    measure();
    onScroll();
    const ro = new ResizeObserver(measure);
    if (header) ro.observe(header);
    addEventListener('scroll', onScroll, { passive: true });
    return () => { ro.disconnect(); removeEventListener('scroll', onScroll); delete root.dataset.hmTop; };
  }, []);
  const lead = tops.length ? tops : heroSlides;
  const style = { '--hm-sides': sides.length } as CSSProperties;
  return (
    <div ref={stage} className="hm-hero__stage" data-sides={sides.length || undefined} style={style}>
      <div className="hm-hero__bg" aria-hidden="true">
        {backdrop && (
          <picture>
            {backdrop.imageMobile && <source media="(max-width: 47.9375em)" srcSet={backdrop.imageMobile} />}
            <img src={backdrop.image} alt="" />
          </picture>
        )}
        {lead.map((s, k) => {
          // Có Ảnh nền sự kiện chung (vẽ ở trên) thì ảnh không có nền riêng dùng nền chung đó, không cần lớp riêng.
          if (!s.bg && backdrop) return null;
          // Không có nền nào: lấy chính ảnh của banner (bản điện thoại nếu có) làm mờ.
          const own: NonNullable<Slide['bg']> = s.bg ?? { image: s.image, imageMobile: s.imageMobile ?? undefined };
          return (
            <div
              key={s.key}
              className="hm-hero__layer"
              data-on={k === i || undefined}
              data-prev={k === prev || undefined}
              // Có màu nền: ảnh nền giữ nguyên tỉ lệ, đặt sát trên, phần dưới là màu (như Long Châu); không màu thì ảnh phủ kín.
              data-fit={(own.image && own.color) || undefined}
              data-blur={!s.bg || undefined}
              style={own.color ? { background: own.color } : undefined}
            >
              {seen.has(k) && own.image && (
                // Nền làm mờ chỉ cần bản thu nhỏ (mờ thì không thấy chi tiết) — khỏi tải lại ảnh gốc 1800px làm nền.
                <picture>
                  {own.imageMobile && <source media="(max-width: 47.9375em)" srcSet={s.bg ? own.imageMobile : thumbUrl(own.imageMobile, 320)} />}
                  <img src={s.bg ? own.image : thumbUrl(own.image, 640)} alt="" />
                </picture>
              )}
            </div>
          );
        })}
      </div>
      {tops.length > 0 && <HomeCarousel slides={tops} label="Chương trình nổi bật" className="hm-car--top" onIndex={onIndex} />}
      <div className="hm-hero__grid">
        <HomeCarousel slides={heroSlides} label="Sự kiện & ưu đãi nổi bật" className="hm-car--hero" onIndex={tops.length ? undefined : onIndex} />
        {!compact && sides.length > 0 && (
          <div className="hm-sides">
            {sides.map((s) => <div key={s.key} className={s.showText ? 'hm-side hm-side--text' : 'hm-side'}><SlideBody s={s} /></div>)}
          </div>
        )}
      </div>
    </div>
  );
}
