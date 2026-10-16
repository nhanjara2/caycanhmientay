'use client';

import { useSyncExternalStore } from 'react';

/** Bảng danh mục trượt trái (< 1024px) mở = thuộc tính `data-sidebar-open` trên <body> (CSS đọc thẳng thuộc tính này). */
const ATTR = 'data-sidebar-open';

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.body, { attributes: true, attributeFilter: [ATTR] });
  return () => mo.disconnect();
}

/** Bảng danh mục đang mở? (cho nút ☰ ghi aria-expanded, cho bảng giữ focus). Máy chủ luôn coi như đóng. */
export function useSidebarOpen() {
  return useSyncExternalStore(subscribe, () => document.body.hasAttribute(ATTR), () => false);
}

export const openSidebar = () => document.body.setAttribute(ATTR, '');
export const closeSidebar = () => document.body.removeAttribute(ATTR);
export const toggleSidebar = () => document.body.toggleAttribute(ATTR);
