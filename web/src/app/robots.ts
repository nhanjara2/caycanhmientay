import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

/** Ảnh công khai phục vụ qua /api — phải cho máy tìm kiếm tải (ảnh sản phẩm, bài viết, bệnh cây, công trình, banner, đánh giá đang hiện). */
const PUBLIC_IMAGES = ['product-images', 'post-images', 'disease-images', 'project-images', 'banner-images', 'review-photos'].map((d) => `/api/${d}/`);

/** Máy đọc của các trợ lý AI / máy trả lời (ChatGPT, Claude, Gemini, Perplexity, Copilot, Apple…). Thêm tên mới vào đây. */
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai',
  'Google-Extended', 'PerplexityBot', 'Perplexity-User', 'Applebot-Extended', 'Bingbot', 'CCBot', 'meta-externalagent', 'DuckAssistBot',
];

/**
 * robots.txt — chỉ điều khiển việc máy tìm kiếm CÓ ĐƯỢC TẢI trang hay không, không phải cách giấu trang khỏi Google:
 * trang riêng tư vẫn tự có noindex + cần đăng nhập. Không chặn /_next (JS, CSS, phông chữ) và /images vì Google cần để dựng trang.
 * Cùng một nội dung cho mọi tên miền: bản *.vercel.app KHÔNG chặn ở đây mà được src/proxy.ts gắn X-Robots-Tag noindex
 * (chặn tải thì Google không đọc được noindex). Sitemap: file chỉ mục /sitemap.xml (server/sitemap.ts), luôn ghi tên miền chính.
 */
export default function robots(): MetadataRoute.Robots {
  const allow = ['/', ...PUBLIC_IMAGES];
  const disallow = [
    '/admin', '/nhan-vien', // quản trị, app nhân viên
    '/api/', // đăng nhập Google, dữ liệu menu, ảnh riêng tư (trừ ảnh công khai ở trên)
    '/tai-khoan', '/gio-hang', '/thanh-toan', '/dat-hang-thanh-cong', // tài khoản, giỏ, đặt hàng
    '/tim-kiem', // kết quả tìm kiếm nội bộ
  ];
  return {
    rules: [
      { userAgent: '*', allow, disallow },
      // Máy AI (GEO): mời đích danh — cùng luật như mọi máy đọc, để trợ lý AI trích dẫn và dẫn khách về web.
      { userAgent: AI_BOTS, allow: [...allow, '/llms.txt', '/llms-full.txt'], disallow },
    ],
    // rss.xml cũng là sitemap hợp lệ (Google, Bing nhận) — báo nhanh bài mới.
    sitemap: [absoluteUrl('/sitemap.xml'), absoluteUrl('/rss.xml')],
  };
}
