import type { Metadata } from 'next';
import { MyGardenView } from '@/views/MyGardenView';

export const metadata: Metadata = { title: 'Vườn của tôi' };

export default function Page() {
  return <MyGardenView />;
}
