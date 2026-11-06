import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Đọc/ghi file Excel (nhập hàng): để Node tự nạp, không gộp vào bundle.
  serverExternalPackages: ['exceljs'],
  // SEO mục 11 (16/10/2026): Next mặc định "stream" metadata cho Googlebot (và mọi máy không có trong danh sách của Next,
  // như Zalo): trang chậm (máy chủ khởi động lạnh) thì <title>, description, canonical, og:* bị đẩy xuống cuối <body>.
  // seo:mobile bắt được 3 / 112 trang như vậy trên web thật. Máy đọc trang (tìm kiếm, xem trước link) luôn nhận metadata
  // trong <head>; người xem thường vẫn stream (không chậm thêm). Thêm máy đọc mới thì thêm tên vào đây.
  htmlLimitedBots: /bot|crawl|spider|slurp|Google|Lighthouse|Zalo|facebookexternalhit|facebookcatalog|WhatsApp|Telegram|preview|Discord|Skype|LinkedIn|Slack|Twitter|applebot|yandex|baidu|sogou|vkShare|quora|ia_archiver|Yeti|tumblr|Pinterest|embedly/i,
  // 09/10/2026 shop thôi làm dịch vụ, chỉ bán sỉ: trang dịch vụ cũ chuyển về trang Đối tác sỉ / Báo giá sỉ;
  // trang Khách doanh nghiệp + dự án chuyển hẳn sang /doi-tac.
  // SEO (15/10/2026): trang đã gỡ hẳn và có trang thay thế → chuyển vĩnh viễn (308), một bước tới đích cuối.
  async redirects() {
    return [
      { source: '/dich-vu/dat-lich-khao-sat', destination: '/bao-gia-si', permanent: true },
      { source: '/dich-vu/:path*', destination: '/doi-tac', permanent: true },
      { source: '/doanh-nghiep/du-an/:slug', destination: '/doi-tac/cong-trinh/:slug', permanent: true },
      { source: '/doanh-nghiep', destination: '/doi-tac', permanent: true },
    ];
  },
  // Tốc độ (SEO mục 10, 16/10/2026): file tĩnh trong public/ mặc định "max-age=0" → mỗi lần xem trang trình duyệt lại hỏi
  // máy chủ từng ảnh banner / logo. Tên file không có mã băm (chủ shop thay ảnh cùng tên) nên trình duyệt chỉ giữ 1 ngày,
  // quá hạn vẫn dùng bản cũ trong 7 ngày trong lúc tải bản mới; CDN Vercel giữ lâu hơn và tự xóa mỗi lần deploy.
  // (/_next/static đã có mã băm trong tên → Next tự đặt cache 1 năm "immutable"; ảnh /api/*-images tự đặt cache riêng.)
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800' }];
    return [
      ...['/images/:path*', '/icons/:path*', '/videos/:path*'].map((source) => ({ source, headers: cache })),
      // Bảo mật (SEO mục 13, 16/10/2026) — mọi đường dẫn. HSTS do Vercel tự gắn cho tên miền riêng (max-age 2 năm, không
      // includeSubDomains / preload — chưa rõ các tên miền con khác của shop nên không ép). CSP chỉ gồm phần không làm
      // vỡ gì: tự nâng http:// lên https:// (chống mixed content), cấm web khác nhúng trang (chống clickjacking), cấm
      // <base> / plugin lạ; chưa giới hạn nguồn script vì GA, YouTube, TikTok, bản đồ cần nạp từ nhiều tên miền.
      // Permissions-Policy: chỉ chính web được hỏi vị trí (chọn địa chỉ trên bản đồ); camera, micro, thanh toán tắt hẳn.
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self), browsing-topics=()' },
          { key: 'Content-Security-Policy', value: "upgrade-insecure-requests; frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
        ],
      },
    ];
  },
  experimental: {
    // Yêu cầu bảo hành gửi tối đa 3 ảnh (đã nén ở trình duyệt, mỗi ảnh ≤ 2MB).
    serverActions: { bodySizeLimit: '7mb' },
  },
};

export default createNextIntlPlugin('./src/i18n/request.ts')(nextConfig);
