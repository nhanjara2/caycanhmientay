import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function SectionHeader({ icon, title, href }: { icon: IconName; title: ReactNode; href?: string }) {
  return (
    <div className="vx-sect">
      <h2>
        <span className="vx-sect__mark"><Icon name={icon} /></span>
        {title}
      </h2>
      {href && (
        <Link className="vx-link" href={href}>
          Xem tất cả <Icon name="chevron" size={16} />
        </Link>
      )}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="vx-crumb" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && '/'}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span>{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="es">
      <span className="es-art">
        <span className="bg" />
        <span className="leaf" style={{ left: 6, top: 18 }} />
        <span className="leaf" style={{ right: 4, top: 6, transform: 'scaleX(-1)' }} />
        <span className="ic"><Icon name={icon} /></span>
      </span>
      <b>{title}</b>
      <p>{text}</p>
      {action}
    </div>
  );
}
