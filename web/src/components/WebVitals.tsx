'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Đo tốc độ trên máy khách thật (Core Web Vitals: LCP, INP, CLS, FCP, TTFB) — SEO mục 10 (16/10/2026).
 * Dùng Vercel Speed Insights: số liệu gom theo mẫu trang (route "/san-pham/[slug]"…) và theo điện thoại / máy tính,
 * xem ở Vercel → dự án → Speed Insights (phải bật một lần trong bảng điều khiển; chưa bật thì script không gửi gì).
 * Chỉ gắn ở web khách (SiteChrome) — admin / POS / app nhân viên không đo.
 * Bỏ tham số ?… khỏi địa chỉ gửi đi (mã đơn, từ khóa tìm, mã chia sẻ video… không cần cho việc đo tốc độ).
 */
export function WebVitals() {
  return <SpeedInsights beforeSend={(e) => ({ ...e, url: e.url.split(/[?#]/)[0] })} />;
}
