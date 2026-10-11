// Chạy ở trình duyệt trước khi React khởi động (quy ước file của Next 16 — node_modules/next/dist/docs/…/instrumentation-client.md).
// Báo cho thanh tiến trình đầu trang (components/NavProgress.tsx) biết một lần chuyển trang vừa bắt đầu.
const NAV_START_EVENT = 'ccmt:nav-start';

export function onRouterTransitionStart(url: string) {
  window.dispatchEvent(new CustomEvent(NAV_START_EVENT, { detail: url }));
}
