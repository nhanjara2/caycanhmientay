'use client';

import { useEffect } from 'react';

/**
 * Báo một lượt "không tìm thấy trang" (tab Theo dõi ở /admin/seo). Chỉ chạy khi trang 404 thật sự hiện ra — component
 * khách chỉ gắn vào trang khi khung 404 được dùng, khác server component của not-found (Next dựng sẵn kèm mọi trang).
 */
export function NotFoundBeacon() {
  useEffect(() => {
    fetch('/api/giam-sat/404', {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: location.pathname, referrer: document.referrer }),
    }).catch(() => {});
  }, []);
  return null;
}
