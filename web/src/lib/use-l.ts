'use client';

import { useLocale } from 'next-intl';

/** Chữ hai ngôn ngữ viết ngay tại chỗ (component client): L('Tiếng Việt', 'English'). */
export function useL() {
  const en = useLocale() === 'en';
  return (vi: string, e: string) => (en ? e : vi);
}
