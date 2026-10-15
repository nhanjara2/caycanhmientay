import type { NextConfig } from 'next';

/** Tên miền chính (trùng với SITE_ORIGIN trong src/lib/site.ts). Giá trị là biểu thức chính quy nên dấu chấm được thoát. */
const CANONICAL_HOST = 'www\\.caycanhmientay\\.com';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Đọc/ghi file Excel (nhập hàng): để Node tự nạp, không gộp vào bundle.
  serverExternalPackages: ['exceljs'],
  // 09/10/2026 shop thôi làm dịch vụ, chỉ bán sỉ: trang dịch vụ cũ chuyển về trang Đối tác sỉ / Báo giá sỉ;
  // trang Khách doanh nghiệp + dự án chuyển hẳn sang /doi-tac.
  async redirects() {
    return [
      { source: '/dich-vu/dat-lich-khao-sat', destination: '/bao-gia-si', permanent: false },
      { source: '/dich-vu/:path*', destination: '/doi-tac', permanent: false },
      { source: '/doanh-nghiep/du-an/:slug', destination: '/doi-tac/cong-trinh/:slug', permanent: true },
      { source: '/doanh-nghiep', destination: '/doi-tac', permanent: true },
    ];
  },
  // SEO: chỉ tên miền chính được Google lập chỉ mục. Bản *.vercel.app (production + preview) trả cùng nội dung →
  // gắn noindex để không thành trang trùng (canonical trong trang vẫn trỏ về tên miền chính — src/lib/site.ts).
  async headers() {
    return [
      {
        source: '/:path*',
        missing: [{ type: 'host', value: CANONICAL_HOST }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  experimental: {
    // Yêu cầu bảo hành gửi tối đa 3 ảnh (đã nén ở trình duyệt, mỗi ảnh ≤ 2MB).
    serverActions: { bodySizeLimit: '7mb' },
  },
};

export default nextConfig;
