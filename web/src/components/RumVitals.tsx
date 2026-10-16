'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { SITE_ORIGIN } from '@/lib/site';

/**
 * Đo Core Web Vitals trên máy khách thật, lưu vào database để xem ở /admin/seo tab "Theo dõi" (giám sát SEO mục 19; song song Vercel Speed Insights ở WebVitals.tsx): gom các chỉ số của lần xem trang, gửi một lần khi khách
 * rời / ẩn trang (sendBeacon). Chỉ trên tên miền chính, chỉ trang khách (gắn trong SiteChrome). Không cookie, không mã khách.
 */
const queue: { name: string; value: number }[] = [];
let bound = false;

function flush() {
  if (!queue.length) return;
  const body = JSON.stringify({ path: location.pathname, device: matchMedia('(max-width: 47.9375em)').matches ? 'mobile' : 'desktop', metrics: queue.splice(0) });
  navigator.sendBeacon?.('/api/giam-sat/hieu-nang', body);
}

export function RumVitals() {
  useReportWebVitals((m) => {
    if (location.origin !== SITE_ORIGIN) return;
    queue.push({ name: m.name, value: m.value });
    if (!bound) {
      bound = true;
      addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
      addEventListener('pagehide', flush);
    }
  });
  return null;
}
