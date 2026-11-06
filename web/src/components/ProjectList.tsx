'use client';

import Link from '@/components/LocaleLink';
import { useState } from 'react';
import { hasProjectDetail, projectPath, projectTypeOf, regionsOf, type Project } from '@/lib/projects';

/** Bảng công trình (dự án chưa có ảnh): lọc theo khu vực; điện thoại mỗi dòng thành một thẻ. Dòng có nội dung riêng mới bấm được. */
export function ProjectList({ projects }: { projects: Project[] }) {
  const [region, setRegion] = useState('');
  const regions = regionsOf(projects);
  const list = region ? projects.filter((p) => p.location === region) : projects;

  return (
    <>
      {regions.length > 1 && (
        <div className="dn-chips" role="group" aria-label="Lọc theo khu vực">
          <button type="button" className="vx-chip" aria-pressed={!region} onClick={() => setRegion('')}>Tất cả khu vực ({projects.length})</button>
          {regions.map((r) => (
            <button key={r.name} type="button" className="vx-chip" aria-pressed={region === r.name} onClick={() => setRegion(r.name)}>{r.name} ({r.n})</button>
          ))}
        </div>
      )}
      <div className="dn-tablewrap">
        <table className="dn-table">
          <thead>
            <tr><th className="n">STT</th><th>Công trình</th><th>Khu vực</th><th>Loại hình</th><th>Cây xanh, cảnh quan</th></tr>
          </thead>
          <tbody>
            {list.map((p, i) => (
              <tr key={p.id}>
                <td className="n">{String(i + 1).padStart(2, '0')}</td>
                <td className="t">
                  {hasProjectDetail(p) ? <Link href={projectPath(p.slug)}>{p.title}</Link> : <b>{p.title}</b>}
                  {(p.client || p.metrics[0] || p.year) && (
                    <small>{[p.client, p.metrics[0] && `${p.metrics[0].value} ${p.metrics[0].label}`, p.year].filter(Boolean).join(' · ')}</small>
                  )}
                </td>
                <td data-label="Khu vực">{p.location || '—'}</td>
                <td data-label="Loại hình">{projectTypeOf(p.type).name}</td>
                <td data-label="Cây xanh, cảnh quan">{p.plants.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
