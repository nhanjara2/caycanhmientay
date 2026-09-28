// Bộ icon nét 1.8px lấy từ design-system/components/*/preview.html.
// Dùng class .vx-ico của components.css (stroke currentColor, không fill).
import type { CSSProperties } from 'react';

const PATHS = {
  leaf: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 13 11" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  pin: <><path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  cart: <><path d="M3 4h2l2.4 11h10.8L20 7H6" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></>,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  plant: <><path d="M6 12h12l-1.5 8h-9z" /><path d="M12 12V7" /><path d="M12 9c-2-3-5-3-6-2 1 2 4 3 6 2z" /><path d="M12 8c1.5-3 4.5-3.5 6-2.5-1 2-4 3.5-6 2.5z" /></>,
  sprout: <><path d="M12 21v-7" /><path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3-2-5-5-5 0 3 2 5 5 5z" /></>,
  flask: <path d="M9 3h6M10 3v6L5 19a1 1 0 0 0 1 2h12a1 1 0 0 0 1-1l-5-11V3" />,
  drop: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  pot: <><path d="M6 7h12l1 13H5z" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /></>,
  box: <><path d="M3 7 12 3l9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></>,
  tool: <path d="M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3z" />,
  gauge: <><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 18 4-5" /></>,
  bottle: <><path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z" /><path d="M8 13h8" /></>,
  flower: <><circle cx="12" cy="9" r="2" /><path d="M12 5a2 2 0 1 1 0-.1M16 9a2 2 0 1 1 .1 0M12 13a2 2 0 1 1 0 .1M8 9a2 2 0 1 1-.1 0" /><path d="M12 13v8M12 17c-2 0-3-1-4-2" /></>,
  rain: <><path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A4 4 0 0 1 17 17z" /><path d="M9 20l1-2M13 20l1-2" /></>,
  home: <><path d="M4 11 12 4l8 7v9H4z" /><path d="M10 20v-5h4v5" /></>,
  gift: <><rect x="4" y="9" width="16" height="11" /><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  shield: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  check: <path d="m5 12 5 5 9-10" />,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></>,
  card: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /></>,
  cash: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  qr: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2" /></>,
  wallet: <><path d="M4 7h15a1 1 0 0 1 1 1v11H5a1 1 0 0 1-1-1z" /><path d="M4 7l11-3v3M16 13h2" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  bug: <><rect x="8" y="7" width="8" height="12" rx="4" /><path d="M12 7V4M5 11h3M16 11h3M5 16h3M16 16h3M9 4l1 2M15 4l-1 2" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  heart: <path d="M12 20s-6.5-4.1-9-8.2C1.1 8.8 2.4 5 6 5c2 0 3.6 1.2 4.5 2.8C11.4 6.2 13 5 15 5c3.6 0 4.9 3.8 3 6.8C18.5 15.9 12 20 12 20z" />,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  const s = size ? { width: size, height: size, ...style } : style;
  return (
    <svg className={className ? `vx-ico ${className}` : 'vx-ico'} viewBox="0 0 24 24" style={s} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

// Ảnh minh họa sản phẩm: icon nét mảnh, dùng trong .vx-pcard__media / .vx-gal__main.
export function Art({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/** Ảnh chính của sản phẩm nếu có, chưa có thì hiện icon — đặt trong .vx-item__img / .ad-thumb. */
export function Thumb({ src, icon, alt = '' }: { src?: string | null; icon: string; alt?: string }) {
  return src ? <img src={src} alt={alt} loading="lazy" /> : <Art name={icon as IconName} />;
}
