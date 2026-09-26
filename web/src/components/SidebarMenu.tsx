'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { categories } from '@/lib/catalog';
import { Icon } from './Icon';

/** Menu danh mục cố định bên trái (desktop), bảng trượt trái trên tablet/mobile. */
export function SidebarMenu({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();
  const [, , catSlug, subSlug] = pathname.split('/');
  const current = pathname.startsWith('/danh-muc/') ? catSlug : undefined;
  const [open, setOpen] = useState<string | undefined>(current);

  useEffect(() => {
    if (current) setOpen(current);
    document.body.removeAttribute('data-sidebar-open');
  }, [pathname, current]);

  return (
    <>
      <div className="app-scrim" onClick={() => document.body.removeAttribute('data-sidebar-open')} />
      <aside className="vx-side app-side" aria-label="Danh mục sản phẩm">
        <div className="vx-side__title">DANH MỤC SẢN PHẨM</div>
        <div className="vx-side__promo">
          <Link href="/khuyen-mai">
            <Icon name="tag" />
            Khuyến mãi hot
          </Link>
          <Link href="/flash-sale">
            <Icon name="bolt" />
            Flash sale giờ vàng
          </Link>
          <Link href="/tim-kiem?q=bán chạy" className="plain">
            <Icon name="star" />
            Bán chạy nhất
          </Link>
        </div>
        {categories.map((c) => {
          const isOpen = open === c.slug;
          return (
            <div key={c.slug} className="vx-acc" {...(isOpen ? { open: true } : {})}>
              <button type="button" className="vx-acc__head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? undefined : c.slug)}>
                <Icon name={c.icon} />
                {c.name}
                <Icon name="chevron" className="chev" />
              </button>
              <div className="vx-acc__list">
                <Link href={`/danh-muc/${c.slug}`} aria-current={current === c.slug && !subSlug ? 'true' : undefined}>
                  Tất cả<small>{counts[c.slug] ?? 0}</small>
                </Link>
                {c.subs.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/danh-muc/${c.slug}/${s.slug}`}
                    aria-current={current === c.slug && subSlug === s.slug ? 'true' : undefined}
                  >
                    {s.name}
                    <small>{counts[`${c.slug}/${s.slug}`] ?? 0}</small>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </aside>
    </>
  );
}
