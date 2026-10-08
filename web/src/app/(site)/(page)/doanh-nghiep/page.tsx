import type { Metadata } from 'next';
import { BusinessPage } from '@/components/BusinessPage';
import { publishedProjects } from '@/server/projects';

export const metadata: Metadata = {
  title: 'Khách doanh nghiệp',
  description: 'Cây xanh cho dự án, văn phòng, công trình: cung ứng số lượng lớn từ gần 200 nhà vườn miền Nam, kỹ sư khảo sát miễn phí, báo giá rõ từng khoản. Xem các dự án đã triển khai.',
};

export default async function Page() {
  return <BusinessPage projects={await publishedProjects()} />;
}
