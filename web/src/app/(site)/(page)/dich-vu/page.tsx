import type { Metadata } from 'next';
import { ServicesHub } from '@/components/ServicesHub';

export const metadata: Metadata = {
  title: 'Dịch vụ sân vườn',
  description: 'Thiết kế và thi công sân vườn, cây văn phòng, chăm sóc định kỳ, chữa cây tại nhà. Khảo sát miễn phí, kỹ sư gọi lại trong 2 giờ làm việc.',
};

export default function Page() {
  return <ServicesHub />;
}
