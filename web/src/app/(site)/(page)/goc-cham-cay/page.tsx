import type { Metadata } from 'next';
import { BlogView } from '@/views/BlogView';

export const metadata: Metadata = { title: 'Góc chăm cây' };

export default function Page() {
  return <BlogView />;
}
