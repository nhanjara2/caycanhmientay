import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

/** Ảnh công khai phục vụ qua /api — phải cho máy tìm kiếm tải (ảnh sản phẩm, bài viết, bệnh cây, công trình, banner, đánh giá đang hiện). */
const PUBLIC_IMAGES = ['product-images', 'post-images', 'disease-images', 'project-images', 'banner-images', 'review-photos'].map((d) => `/api/${d}/`);

/**
 * robots.txt — chỉ điều khiển việc máy tìm kiếm CÓ ĐƯỢC TẢI trang hay không, không phải cách giấu trang khỏi Google:
 * trang riêng tư vẫn tự có noindex + cần đăng nhập. Không chặn /_next (JS, CSS, phông chữ) và /images vì Google cần để dựng trang.
 * Cùng một nội dung cho mọi tên miền: bản *.vercel.app KHÔNG chặn ở đây mà được src/proxy.ts gắn X-Robots-Tag noindex
 * (chặn tải thì Google không đọc được noindex). Sitemap: file chỉ mục /sitemap.xml (server/sitemap.ts), luôn ghi tên miền chính.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', ...PUBLIC_IMAGES],
      disallow: [
        '/admin', '/nhan-vien', // quản trị, app nhân viên
        '/api/', // đăng nhập Google, dữ liệu menu, ảnh riêng tư (trừ ảnh công khai ở trên)
        '/tai-khoan', '/gio-hang', '/thanh-toan', '/dat-hang-thanh-cong', // tài khoản, giỏ, đặt hàng
        '/tim-kiem', // kết quả tìm kiếm nội bộ
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
