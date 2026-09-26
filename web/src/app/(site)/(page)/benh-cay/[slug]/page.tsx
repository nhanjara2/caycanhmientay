import type { Metadata } from 'next';
import { DiseaseDetailView } from '@/views/DiseaseDetailView';

export const metadata: Metadata = { title: 'Thối rễ (úng rễ do nấm)' };

// TODO: nạp bệnh theo slug từ thư viện bệnh cây; hiện hiển thị trang mẫu.
export default function Page() {
  return <DiseaseDetailView />;
}
