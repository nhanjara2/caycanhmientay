import Link from 'next/link';
import { projectImageUrl, projectPath, projectTypeOf, roleName, type Project } from '@/lib/projects';
import { Icon } from './Icon';
import { responsive } from '@/lib/images';

/** Thẻ dự án: ảnh bìa, loại công trình, địa điểm · năm, tên, tóm tắt, tối đa 3 con số. Cả thẻ bấm được (link trải lên thẻ). */
export function ProjectCard({ p, wide, headingLevel = 3, hidden }: { p: Project; wide?: boolean; headingLevel?: 2 | 3; hidden?: boolean }) {
  const cover = p.images[0];
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const where = [p.location, p.year].filter(Boolean).join(' · ');
  return (
    <article className={wide ? 'dn-card dn-card--wide' : 'dn-card'} hidden={hidden}>
      <div className="dn-card__media">
        {cover
          ? <img {...responsive(projectImageUrl(cover.file, p.slug), '(max-width: 47.9375em) 100vw, 560px', 960)} alt={cover.caption || p.title} loading="lazy" />
          : <span className="dn-card__noimg"><Icon name="trees" /></span>}
        <span className="dn-card__type">{projectTypeOf(p.type).name}</span>
        {wide && <span className="dn-card__flag">Dự án tiêu biểu</span>}
      </div>
      <div className="dn-card__body">
        {where && <span className="dn-card__meta"><Icon name="pin" size={14} />{where}</span>}
        <H className="dn-card__title"><Link href={projectPath(p.slug)}>{p.title}</Link></H>
        {p.client && <span className="dn-card__client">{p.client}</span>}
        <p className="dn-card__sum">{p.summary}</p>
        {p.metrics.length > 0 && (
          <dl className="dn-card__nums">
            {p.metrics.slice(0, 3).map((m) => <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}
          </dl>
        )}
        <span className="dn-card__roles">{p.roles.map(roleName).join(' · ')}</span>
        <span className="dn-card__more" aria-hidden="true">Xem dự án <Icon name="chevron" size={14} /></span>
      </div>
    </article>
  );
}
