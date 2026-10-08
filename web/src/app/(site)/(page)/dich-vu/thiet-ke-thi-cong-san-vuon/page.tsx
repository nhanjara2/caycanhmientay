import type { Metadata } from 'next';
import { ServiceDetail } from '@/components/ServiceDetail';
import { GARDEN, GardenExtras } from '@/components/service-content';
import { productsIn } from '@/server/catalog';
import { publishedProjects } from '@/server/projects';

export const metadata: Metadata = {
  title: 'Thiết kế & thi công sân vườn',
  description: 'Thiết kế, thi công sân vườn nhà phố, biệt thự, ban công, sân thượng, tiểu cảnh. Kỹ sư khảo sát miễn phí, chọn cây hợp nắng gió, báo giá rõ từng khoản.',
};

export default async function Page() {
  const [plants, projects] = await Promise.all([productsIn('cay-canh', 'cay-san-vuon'), publishedProjects()]);
  return (
    <ServiceDetail
      c={GARDEN}
      projects={projects.filter((p) => p.roles.includes('thi-cong') || p.type === 'san-vuon')}
      products={{ title: 'Cây sân vườn shop đang có', href: '/danh-muc/cay-canh/cay-san-vuon', more: 'Xem tất cả', list: plants.slice(0, 8) }}
    >
      <GardenExtras />
    </ServiceDetail>
  );
}
