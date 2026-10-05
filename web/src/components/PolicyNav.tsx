'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { POLICY_GROUPS, policies } from '@/lib/policies';
import { Icon } from './Icon';

/** Menu trái trang thông tin; tablet/mobile thu thành ô "Bài viết trong danh mục ▾" (globals.css, .vx-pnav). */
export function PolicyNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <nav className="vx-pnav" data-open={open ? '' : undefined}>
      <button type="button" className="vx-pnav__head" aria-expanded={open} aria-controls="vx-pnav-list" onClick={() => setOpen((o) => !o)}>
        <Icon name="menu" />
        Bài viết trong danh mục
        <Icon name="chevron" className="chev" />
      </button>
      <div id="vx-pnav-list" className="vx-pnav__list">
        {POLICY_GROUPS.map((g) => (
          <div key={g} style={{ display: 'contents' }}>
            <div className="vx-pnav__group">{g}</div>
            {policies.filter((p) => p.group === g).map((p) => (
              <Link key={p.slug} href={`/chinh-sach/${p.slug}`} aria-current={pathname === `/chinh-sach/${p.slug}` ? 'true' : undefined} onClick={() => setOpen(false)}>
                {p.title}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
