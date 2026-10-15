'use client';

import { useState } from 'react';
import { PROJECT_TYPES, type Project } from '@/lib/projects';
import { ProjectCard } from './ProjectParts';

const PAGE = 6;

/** Lưới công trình trên trang Đối tác sỉ: lọc theo loại công trình (chỉ hiện loại đang có dự án) + "Xem thêm". */
export function ProjectShowcase({ projects }: { projects: Project[] }) {
  const [type, setType] = useState('');
  const [shown, setShown] = useState(PAGE);
  const types = PROJECT_TYPES.map((t) => ({ ...t, n: projects.filter((p) => p.type === t.key).length })).filter((t) => t.n > 0);
  const list = type ? projects.filter((p) => p.type === type) : projects;
  // Dự án nổi bật đầu tiên nằm khung ngang lớn khi xem "Tất cả".
  const wide = !type && list[0]?.featured ? list[0] : undefined;
  const rest = wide ? list.slice(1) : list;
  const pick = (k: string) => { setType(k); setShown(PAGE); };

  return (
    <>
      {types.length > 1 && (
        <div className="dn-chips" role="group" aria-label="Lọc theo loại công trình">
          <button type="button" className="vx-chip" aria-pressed={!type} onClick={() => pick('')}>Tất cả ({projects.length})</button>
          {types.map((t) => (
            <button key={t.key} type="button" className="vx-chip" aria-pressed={type === t.key} onClick={() => pick(t.key)}>{t.name} ({t.n})</button>
          ))}
        </div>
      )}
      {wide && <ProjectCard p={wide} wide />}
      {rest.length > 0 && (
        <div className="dn-grid">
          {/* Đủ mọi thẻ trong HTML (thẻ chưa "Xem thêm" chỉ bị ẩn) để Google lần được tới từng trang công trình. */}
          {rest.map((p, i) => <ProjectCard key={p.id} p={p} hidden={i >= shown} />)}
        </div>
      )}
      {rest.length > shown && (
        <button type="button" className="vx-btn vx-btn--outline dn-more" onClick={() => setShown((n) => n + PAGE)}>
          Xem thêm {Math.min(PAGE, rest.length - shown)} dự án
        </button>
      )}
    </>
  );
}
