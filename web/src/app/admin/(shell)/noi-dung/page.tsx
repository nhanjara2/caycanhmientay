import type { Metadata } from 'next';
import { AdminContentView } from '@/views/AdminContentView';

export const metadata: Metadata = { title: 'Bài viết & video' };

export default function Page() {
  return <AdminContentView />;
}
