'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { SITE_ORIGIN } from '@/lib/site';

/** Mã luồng dữ liệu web của Google Analytics 4 (analytics.google.com → Quản trị → Luồng dữ liệu). */
const GA_ID = 'G-XWBHXGVSS4';

/**
 * Google Analytics 4 — chỉ web khách (SiteChrome), chỉ trên tên miền chính (máy dev / *.vercel.app không gửi số liệu).
 * Từ 17/11/2026 bỏ hộp hỏi cookie (chủ shop: "tự động thu nạp cookie, không cần hiện bảng hỏi") → tải luôn khi vào web;
 * Chính sách bảo mật mục Cookie đã sửa theo.
 * Lượt xem khi chuyển trang trong web: GA4 tự đếm theo lịch sử trình duyệt ("Đo lường nâng cao", bật sẵn) — không gửi tay
 * page_view kẻo đếm đôi.
 */
export function Analytics() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (location.hostname === new URL(SITE_ORIGIN).hostname) setOn(true);
  }, []);

  if (!on) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
