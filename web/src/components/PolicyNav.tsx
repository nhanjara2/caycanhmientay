'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { POLICY_GROUPS, policies } from '@/lib/policies';
import { Icon } from './Icon';

export function PolicyNav() {
  const pathname = usePathname();
  return (
    <nav className="vx-pnav">
      <div className="vx-pnav__head"><Icon name="menu" />Bài viết trong danh mục</div>
      {POLICY_GROUPS.map((g) => (
        <div key={g} style={{ display: 'contents' }}>
          <div className="vx-pnav__group">{g}</div>
          {policies.filter((p) => p.group === g).map((p) => (
            <Link key={p.slug} href={`/chinh-sach/${p.slug}`} aria-current={pathname === `/chinh-sach/${p.slug}` ? 'true' : undefined}>
              {p.title}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
