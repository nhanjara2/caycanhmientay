import type { Metadata } from 'next';
import { QuickVideos } from '@/components/admin/QuickVideos';
import { requireAccess } from '@/server/auth';

export const metadata: Metadata = { title: 'Thêm nhanh video ngắn' };

/** Dán nhiều link YouTube Shorts → đăng một lượt (mỗi video thành một bài loại "video"). Đăng ngay nên cần toàn quyền Bài viết. */
export default async function QuickVideosPage() {
  await requireAccess('content', 'full');
  return <QuickVideos />;
}
