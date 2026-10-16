import Link from 'next/link';
import type { ReactNode } from 'react';
import { breadcrumbLd, normalizeCrumbs, type Crumb } from '@/lib/jsonld';
import { Icon, type IconName } from './Icon';
import { JsonLd } from './JsonLd';

export function SectionHeader({ icon, title, href }: { icon: IconName; title: ReactNode; href?: string }) {
  return (
    <div className="vx-sect">
      <h2>
        <span className="vx-sect__mark"><Icon name={icon} /></span>
        {title}
      </h2>
      {href && (
        <Link className="vx-link" href={href} aria-label={typeof title === 'string' ? `Xem tất cả ${title}` : undefined}>
          Xem tất cả <Icon name="chevron" size={16} />
        </Link>
      )}
    </div>
  );
}

/**
 * Breadcrumb hiện trên trang + schema BreadcrumbList cùng nội dung (mục 5 + 7 checklist SEO) — trang khách dùng component
 * này, đừng tự viết `.vx-crumb`. Luật (tự thêm "Trang chủ", bỏ #mục / mục trùng URL, mục cuối không link) ở
 * `normalizeCrumbs`; truyền các tầng theo kiến trúc web (danh mục → nhóm con chính → trang), không theo đường người dùng đi.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const list = normalizeCrumbs(items);
  if (list.length < 2) return null;
  return (
    <>
      <nav className="vx-crumb" aria-label="Breadcrumb">
        {list.map((it, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && '/'}
            {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
          </span>
        ))}
      </nav>
      <JsonLd data={breadcrumbLd(list)} />
    </>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="es">
      <span className="es-art">
        <span className="bg" />
        <span className="leaf" style={{ left: 6, top: 18 }} />
        <span className="leaf" style={{ right: 4, top: 6, transform: 'scaleX(-1)' }} />
        <span className="ic"><Icon name={icon} /></span>
      </span>
      <b>{title}</b>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
