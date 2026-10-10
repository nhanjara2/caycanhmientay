import type { Metadata } from 'next';
import { PartnerPage } from '@/components/PartnerPage';
import { getCurrentUser } from '@/server/auth';
import { getPartnerProfile } from '@/server/partners';
import { publishedProjects } from '@/server/projects';

export const metadata: Metadata = {
  title: 'Đối tác sỉ — cây cảnh & vật tư giá sỉ',
  description: 'Cung cấp sỉ cây cảnh, cây công trình, phân bón, thuốc BVTV và vật tư cho đơn vị dịch vụ cảnh quan, nhà thầu công trình, cửa hàng và đại lý. Nguồn cây từ gần 200 nhà vườn miền Nam, giao toàn quốc.',
};

export default async function Page() {
  const user = await getCurrentUser();
  const [projects, p] = await Promise.all([publishedProjects(), user ? getPartnerProfile(user.id) : null]);
  const profile = p ? { type: p.type, company: p.company ?? '', taxCode: p.taxCode ?? '', area: p.area ?? '' } : null;
  return <PartnerPage projects={projects} profile={profile} />;
}
