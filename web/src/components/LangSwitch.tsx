'use client';

import { usePathname as useNextPathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { localePath, stripLang, type Lang } from '@/lib/i18n';

/**
 * Nút đổi VI ↔ EN: sang đúng trang đang xem ở ngôn ngữ kia (giữ ?tham số, #mục).
 * Dùng <a> thường (tải lại cả trang) — layout gốc phải dựng lại để đổi <html lang> và bộ chữ.
 */
export function LangSwitch({ className = 'app-lang' }: { className?: string }) {
  const lang = useLocale() as Lang;
  const t = useTranslations('header');
  const other: Lang = lang === 'en' ? 'vi' : 'en';
  const path = stripLang(useNextPathname());
  const [tail, setTail] = useState('');
  useEffect(() => setTail(location.search + location.hash), [path]);
  return (
    <a className={className} href={localePath(path, other) + tail} hrefLang={other} lang={other} title={t('langTitle')}
      onClick={(e) => { e.currentTarget.href = localePath(path, other) + location.search + location.hash; }}>
      <span aria-hidden="true">🌐</span>
      <span className="app-lang__t">{other === 'en' ? 'EN' : 'VI'}</span>
      <span className="app-sr">{t('lang')}</span>
    </a>
  );
}
