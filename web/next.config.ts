import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Đọc/ghi file Excel (nhập hàng): để Node tự nạp, không gộp vào bundle.
  serverExternalPackages: ['exceljs'],
  experimental: {
    // Yêu cầu bảo hành gửi tối đa 3 ảnh (đã nén ở trình duyệt, mỗi ảnh ≤ 2MB).
    serverActions: { bodySizeLimit: '7mb' },
  },
};

export default nextConfig;
