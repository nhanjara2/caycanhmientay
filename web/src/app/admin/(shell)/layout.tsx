import type { Metadata } from 'next';
import { AdminShell } from '@/components/AdminShell';
import { publicUser, requireStaff } from '@/server/auth';
import { inventorySummary } from '@/server/inventory';
import { countOrdersByStatus } from '@/server/orders';
import { countQuestions } from '@/server/questions';
import { countReviewsByStatus } from '@/server/reviews';
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
    '/admin/kho': (await inventorySummary()).low,
    // Đánh giá 1–2★ chờ duyệt + câu hỏi chưa trả lời
    '/admin/danh-gia': (await countReviewsByStatus()).pending + (await countQuestions()).unanswered,
  };
  return <AdminShell me={publicUser(staff)} badges={badges}>{children}</AdminShell>;
}
