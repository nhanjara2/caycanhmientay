'use client';

import { usePathname as useNextPathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { localePath, stripLang, type Lang } from '@/lib/i18n';

/** Cờ vẽ bằng SVG (emoji cờ không hiện trên Windows). */
function Flag({ lang }: { lang: Lang }) {
  return lang === 'vi' ? (
    <svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#da251d" /><path fill="#ff0" d="m15 4 1.76 5.41h5.69l-4.6 3.35 1.76 5.41L15 14.82l-4.61 3.35 1.76-5.41-4.6-3.35h5.69z" /></svg>
  ) : (
    <svg viewBox="0 0 60 30" aria-hidden="true">
      <clipPath id="lsw-uk"><path d="M30 15h30v15zv15H0zH0V0zV0h30z" /></clipPath>
      <path fill="#012169" d="M0 0v30h60V0z" />
      <path stroke="#fff" strokeWidth="6" d="m0 0 60 30m0-30L0 30" />
      <path stroke="#c8102e" strokeWidth="4" d="m0 0 60 30m0-30L0 30" clipPath="url(#lsw-uk)" />
      <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
      <path stroke="#c8102e" strokeWidth="6" d="M30 0v30M0 15h60" />
    </svg>
  );
}

/**
 * Công tắc VI ⇄ EN có lá cờ: ngôn ngữ đang xem nổi lên, bấm cả công tắc là sang đúng trang đang xem ở ngôn ngữ kia
 * (giữ ?tham số, #mục). Là <a> thường (tải lại cả trang) — layout gốc phải dựng lại để đổi <html lang> và bộ chữ.
 */
export function LangSwitch({ className = '' }: { className?: string }) {
  const lang = useLocale() as Lang;
  const t = useTranslations('header');
  const other: Lang = lang === 'en' ? 'vi' : 'en';
  const path = stripLang(useNextPathname());
  const [tail, setTail] = useState('');
  useEffect(() => setTail(location.search + location.hash), [path]);
  return (
    <a className={`app-lang ${className}`} data-lang={lang} href={localePath(path, other) + tail} hrefLang={other} title={t('langTitle')}
      aria-label={t('langTitle')}
      onClick={(e) => { e.currentTarget.href = localePath(path, other) + location.search + location.hash; }}>
      {(['vi', 'en'] as Lang[]).map((l) => (
        <span key={l} className="app-lang__opt" data-on={l === lang || undefined}>
          <Flag lang={l} />
          <span>{l.toUpperCase()}</span>
        </span>
      ))}
    </a>
  );
}
