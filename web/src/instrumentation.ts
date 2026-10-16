import type { Instrumentation } from 'next';

/**
 * Lỗi máy chủ (dựng trang, API, server action, proxy) → một dòng JSON trong Vercel Logs + bảng error_events (tab "Theo dõi"
 * ở /admin/seo, giám sát SEO mục 19). Quy ước file của Next 16 — node_modules/next/dist/docs/…/instrumentation.md.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const message = err instanceof Error ? err.message : String(err);
  const digest = typeof err === 'object' && err !== null && 'digest' in err ? String((err as { digest: unknown }).digest) : null;
  if (/NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR_FALLBACK)/.test(`${message} ${digest}`)) return;
  const kind = context.routeType === 'render' ? 'ssr' : context.routeType;
  const ua = request.headers['user-agent'];
  console.error(JSON.stringify({ type: 'server_error', kind, path: request.path, route: context.routePath, digest, message: message.slice(0, 500), ua: Array.isArray(ua) ? ua[0] : ua }));
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { recordError } = await import('./server/monitor-store');
  await recordError({ kind, path: request.path, message, digest });
};
