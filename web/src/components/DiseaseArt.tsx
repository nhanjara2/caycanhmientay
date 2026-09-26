// Hình minh họa thư viện bệnh cây — nét vẽ lấy từ design-system/components/DiseaseLibraryLayout + DiseaseDetailLayout.
import type { ReactNode } from 'react';
import type { CauseKey, PartKey } from '@/lib/diseases';

const PART: Record<PartKey, ReactNode> = {
  hoa: <><circle cx="12" cy="9" r="2" /><path d="M12 5a2 2 0 1 1 0-.1M16 9a2 2 0 1 1 .1 0M12 13a2 2 0 1 1 0 .1M8 9a2 2 0 1 1-.1 0" /><path d="M12 13v8M12 17c-2 0-3-1-4-2" /></>,
  la: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 13 11" /></>,
  qua: <><circle cx="12" cy="14" r="6" /><path d="M12 8V4M12 6c1-2 3-2 4-1" /></>,
  than: <path d="M12 21V3M12 9l-4-3M12 14l4-3" />,
  goc: <path d="M12 3v10M4 13h16M8 13l-2 7M16 13l2 7M12 13v7" />,
  re: <path d="M12 3v8M12 11l-5 8M12 11l5 8M12 11v9M9 15l-3 1M15 15l3 1" />,
  'toan-cay': <><path d="M12 21V9" /><path d="M12 9c-5 0-7-3-7-6 4 0 7 2 7 6zM12 12c4 0 7-2 7-6-4 0-7 2-7 6z" /></>,
};

const CAUSE: Record<CauseKey, ReactNode> = {
  nam: <><path d="M4 12a8 6 0 0 1 16 0z" /><path d="M10 12v7h4v-7" /><circle cx="9" cy="9" r=".8" /><circle cx="14" cy="8" r=".8" /></>,
  'vi-khuan': <><rect x="5" y="8" width="14" height="8" rx="4" /><path d="M3 10l2 1M3 14l2-1M21 10l-2 1M21 14l-2-1" /></>,
  virus: <><circle cx="12" cy="12" r="5" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></>,
  'sau-hai': <><rect x="8" y="7" width="8" height="12" rx="4" /><path d="M12 7V4M8 11H4M16 11h4M8 16H5M16 16h3M9 4l1 2M15 4l-1 2" /></>,
  'nhen-rep': <><circle cx="12" cy="13" r="5" /><path d="M7 11 3 9M7 14l-4 1M7 16l-3 3M17 11l4-2M17 14l4 1M17 16l3 3" /></>,
  'tuyen-trung': <path d="M5 18c3 0 3-12 7-12s4 12 7 12" />,
  'oc-sen': <><path d="M3 18h13a5 5 0 1 0-5-5v5" /><circle cx="11" cy="13" r="2" /><path d="M16 18l3-5M19 13l1-3M17 13l0-3" /></>,
  'dinh-duong': <><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" /><path d="M9 14h6" /></>,
  'sinh-ly': <path d="M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0z" />,
  'ngo-doc': <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
};

/** `plain`: nét mảnh, không có lớp vx-ico (ảnh minh họa triệu chứng ở trang chi tiết). */
export const PartIcon = ({ part, plain }: { part: PartKey; plain?: boolean }) =>
  plain ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PART[part]}</svg>
  ) : (
    <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true">{PART[part]}</svg>
  );

export const CauseIcon = ({ cause }: { cause: CauseKey }) => (
  <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true">{CAUSE[cause]}</svg>
);

/** Điểm chỉ của từng bộ phận trên hình cây (x, y trong khung 200×400). */
const DOTS: Partial<Record<PartKey, [number, number]>> = {
  hoa: [112, 42], la: [156, 104], qua: [150, 176], than: [104, 232], goc: [104, 300], re: [126, 352],
};

/** Hình cây trong khung "Bộ phận của cây": tô đậm bộ phận đang chọn. */
export function PlantMap({ active }: { active?: PartKey }) {
  const leafOn = active === 'la' || active === 'toan-cay';
  const leaf = (i: number) => `pl-leaf${leafOn || (!active && i < 2) ? ' on' : ''}`;
  const dot = active ? DOTS[active] : undefined;
  return (
    <svg viewBox="0 0 200 400" role="img" aria-label="Hình minh họa các bộ phận của cây">
      <rect className="pl-soil" x="0" y="300" width="200" height="100" rx="12" />
      <path className={`pl-root${active === 're' || active === 'goc' ? ' app-pl-on' : ''}`} d="M100 300 V360 M100 318 L70 350 M100 318 L130 352 M100 336 L82 378 M100 336 L120 380 M70 350 L58 362 M130 352 L146 360" />
      <path className="pl-stem" d="M100 300 V70" />
      <path className="pl-stem" style={{ strokeWidth: 3 }} d="M100 190 L132 160 M100 150 L70 128" />
      <ellipse className={leaf(0)} cx="128" cy="108" rx="30" ry="12" transform="rotate(-30 128 108)" />
      <ellipse className={leaf(1)} cx="70" cy="98" rx="30" ry="12" transform="rotate(30 70 98)" />
      <ellipse className={leaf(2)} cx="132" cy="212" rx="30" ry="12" transform="rotate(-25 132 212)" />
      <ellipse className={leaf(3)} cx="66" cy="236" rx="30" ry="12" transform="rotate(25 66 236)" />
      <ellipse className={leaf(4)} cx="52" cy="122" rx="30" ry="12" transform="rotate(20 52 122)" />
      <ellipse className={leaf(5)} cx="142" cy="258" rx="30" ry="12" transform="rotate(-20 142 258)" />
      <circle className="pl-fruit" cx="138" cy="176" r="12" />
      <g>
        <circle className="pl-flower" cx="100" cy="42" r="12" />
        <circle className="pl-flower" cx="86" cy="54" r="12" />
        <circle className="pl-flower" cx="114" cy="54" r="12" />
        <circle className="pl-flower" cx="92" cy="68" r="10" />
        <circle className="pl-flower" cx="108" cy="68" r="10" />
        <circle className="pl-center" cx="100" cy="56" r="8" />
      </g>
      <path className="pl-line" d="M112 42 L200 26 M156 104 L200 80 M150 176 L200 134 M104 232 L200 188 M104 300 L200 242 M126 352 L200 296" />
      {Object.values(DOTS).map(([x, y]) => <circle key={`${x}-${y}`} className="pl-dot" cx={x} cy={y} r="3" />)}
      {dot && <circle className="app-pl-ring" cx={dot[0]} cy={dot[1]} r="10" />}
    </svg>
  );
}
