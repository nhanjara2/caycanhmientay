import type { Metadata } from 'next';
import { AdminShell } from '@/components/AdminShell';
import { publicUser, requireStaff } from '@/server/auth';
import { inventorySummary } from '@/server/inventory';
import { countOrdersByStatus } from '@/server/orders';
import { countPostsInReview } from '@/server/posts';
import { countQuestions } from '@/server/questions';
import { countReviewsByStatus } from '@/server/reviews';
import { countPendingPartners } from '@/server/partners';
import { countNewServiceRequests } from '@/server/service-requests';
import { countWarrantyByStatus } from '@/server/warranty';

export const metadata: Metadata = {
  title: { default: 'Quản trị', template: '%s · Admin | Cây Cảnh Miền Tây' },
  robots: { index: false },
};

/** Chỉ nhân viên/admin. Mỗi trang và server action của admin vẫn tự kiểm tra lại quyền. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  // Số việc cần làm trên menu trái
  const badges = {
    '/admin/don-hang': (await countOrdersByStatus()).pending ?? 0,
    '/admin/bao-hanh': (await countWarrantyByStatus()).pending,
    // Yêu cầu báo giá sỉ mới chưa gọi lại
    '/admin/dich-vu': await countNewServiceRequests(),
    // Khách đăng ký đối tác sỉ chờ duyệt
    '/admin/khach-hang': await countPendingPartners(),
    '/admin/kho': (await inventorySummary()).low,
    // Bài viết nhân viên gửi duyệt
    '/admin/noi-dung': await countPostsInReview(),
    // Đánh giá 1–2★ chờ duyệt + câu hỏi chưa trả lời + câu trả lời của khách chờ duyệt
    '/admin/danh-gia': await (async () => {
      const qc = await countQuestions();
      return (await countReviewsByStatus()).pending + qc.unanswered + qc.pendingAnswers;
    })(),
  };
  return <AdminShell me={publicUser(staff)} badges={badges}>{children}</AdminShell>;
}
