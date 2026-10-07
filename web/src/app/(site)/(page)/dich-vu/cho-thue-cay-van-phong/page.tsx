import type { Metadata } from 'next';
import { OfficePlants } from '@/components/OfficePlants';

export const metadata: Metadata = {
  title: 'Cây văn phòng: thuê hoặc mua',
  description: 'Thuê cây văn phòng có người chăm hoặc mua cây về tự chăm. Kỹ sư khảo sát miễn phí, tư vấn loại cây hợp ánh sáng và báo giá theo từng văn phòng.',
};

export default function Page() {
  return <OfficePlants />;
}
