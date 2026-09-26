import type { Metadata } from 'next';
import { AdminMessagesView } from '@/views/AdminMessagesView';

export const metadata: Metadata = { title: 'Mẫu tin nhắn' };

export default function Page() {
  return <AdminMessagesView />;
}
