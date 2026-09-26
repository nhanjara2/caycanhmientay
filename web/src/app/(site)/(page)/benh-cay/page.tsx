import type { Metadata } from 'next';
import { DiseaseLibraryView } from '@/views/DiseaseLibraryView';

export const metadata: Metadata = { title: 'Tìm hiểu bệnh cây trồng' };

export default function Page() {
  return <DiseaseLibraryView />;
}
