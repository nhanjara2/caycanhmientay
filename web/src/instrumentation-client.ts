// Chạy ở trình duyệt trước khi React khởi động (quy ước file của Next 16 — node_modules/next/dist/docs/…/instrumentation-client.md).
// Báo cho thanh tiến trình đầu trang (components/NavProgress.tsx) biết một lần chuyển trang vừa bắt đầu.
const NAV_START_EVENT = 'ccmt:nav-start';

export function onRouterTransitionStart(url: string) {
  window.dispatchEvent(new CustomEvent(NAV_START_EVENT, { detail: url }));
}

// Giám sát SEO (mục 19): lỗi script + lỗi hydration ở trang khách → /api/giam-sat/loi (tối đa 5 lỗi / lần tải trang).
// React 19 báo lỗi hydration qua reportError → sự kiện "error" của window. Bỏ lỗi từ tiện ích trình duyệt / script web khác.
if (typeof window !== 'undefined') {
  let sent = 0;
  const report = (message: string, filename = '') => {
    const path = location.pathname;
    if (sent >= 5 || /^\/(admin|nhan-vien)(\/|$)/.test(path) || /bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) return;
    if (!message || message === 'Script error.' || /^(chrome|moz|safari)-extension:/.test(filename) || (filename && !filename.startsWith(location.origin))) return;
    sent++;
    const kind = /hydrat|#418|#419|#423|#425/i.test(message) ? 'hydration' : 'client';
    navigator.sendBeacon?.('/api/giam-sat/loi', JSON.stringify({ path, errors: [{ kind, message: message.slice(0, 500) }] }));
  };
  window.addEventListener('error', (e) => report(e.error instanceof Error ? e.error.message : e.message, e.filename));
  window.addEventListener('unhandledrejection', (e) => report(e.reason instanceof Error ? e.reason.message : String(e.reason)));
}
