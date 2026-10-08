import type { Metadata } from 'next';
import { ServiceDetail } from '@/components/ServiceDetail';
import { CARE, CareExtras } from '@/components/service-content';
import { productsIn } from '@/server/catalog';
import { publishedProjects } from '@/server/projects';

export const metadata: Metadata = {
  title: 'Chăm sóc cây định kỳ',
  description: 'Kỹ sư đến chăm cây tại nhà, văn phòng, quán theo lịch: kiểm tra cây, bón phân, cắt tỉa, phòng trừ sâu bệnh, thay đất, thay chậu. Khảo sát miễn phí.',
};

export default async function Page() {
  const [fertilizers, projects] = await Promise.all([productsIn('phan-bon'), publishedProjects()]);
  return (
    <ServiceDetail
      c={CARE}
      projects={projects.filter((p) => p.roles.includes('cham-soc'))}
      products={{ title: 'Tự chăm giữa các lần: phân bón', href: '/danh-muc/phan-bon', more: 'Xem tất cả phân bón', list: fertilizers.slice(0, 4) }}
    >
      <CareExtras />
    </ServiceDetail>
  );
}
