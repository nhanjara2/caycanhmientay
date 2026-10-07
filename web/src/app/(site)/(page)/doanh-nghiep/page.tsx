import type { Metadata } from 'next';
import { BusinessPage } from '@/components/BusinessPage';

export const metadata: Metadata = {
  title: 'Khách doanh nghiệp',
  description: 'Cây cảnh công trình, cây văn phòng, cây giống và vật tư số lượng lớn cho doanh nghiệp. Kỹ sư khảo sát, báo giá chi tiết theo từng yêu cầu.',
};

export default function Page() {
  return <BusinessPage />;
}
