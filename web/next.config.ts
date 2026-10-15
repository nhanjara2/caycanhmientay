import type { NextConfig } from 'next';

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
  experimental: {
    // Yêu cầu bảo hành gửi tối đa 3 ảnh (đã nén ở trình duyệt, mỗi ảnh ≤ 2MB).
    serverActions: { bodySizeLimit: '7mb' },
  },
};

export default nextConfig;
