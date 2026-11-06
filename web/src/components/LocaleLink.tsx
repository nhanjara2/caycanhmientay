'use client';

import NextLink from 'next/link';
import { useLocale } from 'next-intl';
import { forwardRef, useCallback, useMemo, type ComponentProps } from 'react';
import { usePathname as useNextPathname, useRouter as useNextRouter } from 'next/navigation';
import { localePath, stripLang, type Lang } from '@/lib/i18n';

/**
 * Link của web khách: đang xem tiếng Anh thì tự thêm /en vào link nội bộ (lib/i18n.ts). Dùng y như next/link.
 * Đổi ngôn ngữ thì KHÔNG dùng link này mà dùng <a> thường (tải lại cả trang để layout gốc đổi <html lang> + chữ).
 */
const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function Link({ href, ...props }, ref) {
  const lang = useLocale() as Lang;
  const h = typeof href === 'string' ? localePath(href, lang)
    : href.pathname ? { ...href, pathname: localePath(href.pathname, lang) } : href;
  return <NextLink ref={ref} href={h} {...props} />;
});
export default Link;

/** Dùng thay `router.push(đường dẫn)` ở web khách. */
export function useLocalePath() {
  const lang = useLocale() as Lang;
  return useCallback((href: string) => localePath(href, lang), [lang]);
}

/** useRouter của web khách: push / replace / prefetch tự thêm /en khi đang xem tiếng Anh. */
export function useRouter() {
  const router = useNextRouter();
  const lp = useLocalePath();
  return useMemo(() => ({
    ...router,
    push: (href: string, o?: Parameters<typeof router.push>[1]) => router.push(lp(href), o),
    replace: (href: string, o?: Parameters<typeof router.replace>[1]) => router.replace(lp(href), o),
    prefetch: (href: string) => router.prefetch(lp(href)),
  }), [router, lp]);
}

/** usePathname của web khách: luôn trả đường dẫn KHÔNG có /en (so sánh mục đang chọn như bản tiếng Việt). */
export function usePathname() {
  return stripLang(useNextPathname());
}
