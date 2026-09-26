import type { Metadata } from 'next';
import { CareScheduleView } from '@/views/CareScheduleView';

export const metadata: Metadata = { title: 'Lịch chăm cây' };

export default function Page() {
  return <CareScheduleView />;
}
