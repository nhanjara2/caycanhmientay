import { headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import type { Lang } from '@/lib/i18n';

/** Ngôn ngữ của lượt tải trang: src/proxy.ts gắn x-ccmt-lang = en cho /en/…; còn lại tiếng Việt. */
export async function currentLang(): Promise<Lang> {
  return (await headers()).get('x-ccmt-lang') === 'en' ? 'en' : 'vi';
}

/** Như currentLang nhưng không lỗi ngoài request (script, build) — trả 'vi'. */
export async function safeLang(): Promise<Lang> {
  try { return await currentLang(); } catch { return 'vi'; }
}

export default getRequestConfig(async () => {
  const locale = await currentLang();
  return { locale, timeZone: 'Asia/Ho_Chi_Minh', messages: (await import(`../../messages/${locale}.json`)).default };
});
