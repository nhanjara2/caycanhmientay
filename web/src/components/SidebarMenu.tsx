'use client';

import Link from '@/components/LocaleLink';
import { usePathname } from '@/components/LocaleLink';
import { useEffect, useRef, useState } from 'react';
import type { Category } from '@/lib/catalog';
import { closeSidebar, useSidebarOpen } from '@/lib/sidebar';
import { useModalFocus } from '@/lib/use-modal';
import { DeliverToButton } from './DeliverTo';
import { Icon } from './Icon';
import { LangSwitch } from './LangSwitch';
import { useTranslations } from 'next-intl';

/** Menu danh mục cố định bên trái (desktop), bảng trượt trái trên tablet/mobile. */
export function SidebarMenu({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const pathname = usePathname();
  const t = useTranslations('side');
  const [, , catSlug, subSlug] = pathname.split('/');
  const current = pathname.startsWith('/danh-muc/') ? catSlug : undefined;
  const [open, setOpen] = useState<string | undefined>(current);

  useEffect(() => {
    if (current) setOpen(current);
    closeSidebar();
  }, [pathname, current]);

  // < 1024px bảng là hộp trượt: mở thì focus vào trong, Tab không lọt ra trang phía sau, Esc đóng, đóng xong về nút ☰.
  // (≥ 1024px bảng luôn hiện cạnh nội dung — thuộc tính mở không có tác dụng.)
  const drawer = useSidebarOpen();
  const aside = useRef<HTMLElement>(null);
  useModalFocus(aside, closeSidebar, drawer);

  return (
    <>
      <div className="app-scrim" onClick={closeSidebar} />
      <aside ref={aside} id="app-side" tabIndex={-1} className="vx-side app-side" aria-label={t('aria')}>
        <button type="button" className="app-side__close" onClick={closeSidebar}>
          <Icon name="close" size={22} />{t('close')}
        </button>
        <DeliverToButton variant="side" />
        <LangSwitch />
        <div className="vx-side__title">{t('title')}</div>
        <div className="vx-side__promo">
          <Link href="/danh-muc" className="plain" aria-current={pathname === '/danh-muc' ? 'page' : undefined}>
            <Icon name="leaf" />
            {t('all')}
          </Link>
          <Link href="/doi-tac" className="plain">
            <Icon name="box" />
            {t('partner')}
          </Link>
          <Link href="/khuyen-mai">
            <Icon name="tag" />
            {t('promo')}
          </Link>
          <Link href="/flash-sale">
            <Icon name="bolt" />
            {t('flash')}
          </Link>
          <Link href="/tim-kiem?q=bán chạy" className="plain">
            <Icon name="star" />
            {t('best')}
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
                  {t('allIn')}<small>{counts[c.slug] ?? 0}</small>
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
