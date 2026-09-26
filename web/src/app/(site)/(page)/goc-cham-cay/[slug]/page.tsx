import type { Metadata } from 'next';
import { ArticleView } from '@/views/ArticleView';

export const metadata: Metadata = { title: '5 dấu hiệu cây kiểng lá bị thối rễ mùa mưa và cách cứu kịp' };

// TODO: nạp bài viết theo slug từ CMS (AdminContent); hiện hiển thị bài mẫu.
export default function Page() {
  return <ArticleView />;
}
