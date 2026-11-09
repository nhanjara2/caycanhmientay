'use client';

import Link from '@/components/LocaleLink';
import { usePathname } from '@/components/LocaleLink';
import { useState } from 'react';
import { useLocale } from 'next-intl';
import { POLICY_GROUPS, policies, policyGroup, policyTitle } from '@/lib/policies';
import { Icon } from './Icon';

export type NavGroup = { group: string; items: { href: string; title: string }[] };

const policyNav = (lang: string): NavGroup[] => POLICY_GROUPS.map((g) => ({
  group: policyGroup(g, lang),
  items: policies.filter((p) => p.group === g).map((p) => ({ href: `/chinh-sach/${p.slug}`, title: policyTitle(p, lang) })),
}));

/** Menu trái trang thông tin; tablet/mobile thu thành ô "Bài viết trong danh mục ▾" (globals.css, .vx-pnav). */
export function PolicyNav({ groups: custom }: { groups?: NavGroup[] }) {
  const lang = useLocale();
  const groups = custom ?? policyNav(lang);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <nav className="vx-pnav" data-open={open ? '' : undefined}>
      <button type="button" className="vx-pnav__head" aria-expanded={open} aria-controls="vx-pnav-list" onClick={() => setOpen((o) => !o)}>
        <Icon name="menu" />
        {lang === 'en' ? 'Pages in this section' : 'Bài viết trong danh mục'}
        <Icon name="chevron" className="chev" />
      </button>
      <div id="vx-pnav-list" className="vx-pnav__list">
        {groups.map((g) => (
          <div key={g.group} style={{ display: 'contents' }}>
            <div className="vx-pnav__group">{g.group}</div>
            {g.items.map((p) => (
              <Link key={p.href} href={p.href} aria-current={pathname === p.href ? 'true' : undefined} onClick={() => setOpen(false)}>
                {p.title}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
