'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { SITE_ORIGIN } from '@/lib/site';
import { CONSENT_EVENT, hasConsent } from './CookieConsent';

/** Mã luồng dữ liệu web của Google Analytics 4 (analytics.google.com → Quản trị → Luồng dữ liệu). */
const GA_ID = 'G-XWBHXGVSS4';

/**
 * Google Analytics 4 — chỉ web khách (SiteChrome), chỉ trên tên miền chính (máy dev / *.vercel.app không gửi số liệu),
 * và chỉ khi khách đã cho phép nhóm "Phân tích" ở hộp cookie (Chính sách bảo mật hứa vậy): chưa chọn / "Chỉ cần thiết"
 * thì không tải mã của Google. Bấm đồng ý xong là tải ngay, không cần tải lại trang.
 * Lượt xem khi chuyển trang trong web: GA4 tự đếm theo lịch sử trình duyệt ("Đo lường nâng cao", bật sẵn) — không gửi tay
 * page_view kẻo đếm đôi.
 */
export function Analytics() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (location.hostname !== new URL(SITE_ORIGIN).hostname) return;
    const check = () => setOn(hasConsent('analytics'));
    check();
    window.addEventListener(CONSENT_EVENT, check);
    return () => window.removeEventListener(CONSENT_EVENT, check);
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
