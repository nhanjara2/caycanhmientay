import type { Metadata } from 'next';
import { OfficePlants } from '@/components/OfficePlants';

export const metadata: Metadata = {
  title: 'Cho thuê cây văn phòng — gói thuê và giá theo số cây',
  description: 'Thuê cây văn phòng theo gói hoặc theo số lượng cây, đã gồm chậu và chăm sóc định kỳ. Tính chi phí ngay trên trang, kỹ sư khảo sát miễn phí và báo giá chính thức.',
};

export default function Page() {
  return <OfficePlants />;
}
