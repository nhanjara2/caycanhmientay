import type { Metadata } from 'next';
import { PartnerPage } from '@/components/PartnerPage';
import { getCurrentUser } from '@/server/auth';
import { getPartnerProfile } from '@/server/partners';
import { publishedProjects } from '@/server/projects';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';

export const generateMetadata = (): Promise<Metadata> => withSeo(withShare({
  title: 'Đối tác sỉ — cây cảnh & vật tư giá sỉ',
  description: 'Cung cấp sỉ cây cảnh, cây công trình, phân bón, chậu, vật tư cho đơn vị cảnh quan, nhà thầu, cửa hàng, đại lý. Gần 200 nhà vườn miền Nam, giao toàn quốc.',
  alternates: { canonical: '/doi-tac' },
}));

export default async function Page() {
  const user = await getCurrentUser();
  const [projects, p] = await Promise.all([publishedProjects(), user ? getPartnerProfile(user.id) : null]);
  const profile = p ? { type: p.type, company: p.company ?? '', taxCode: p.taxCode ?? '', area: p.area ?? '' } : null;
  return <PartnerPage projects={projects} profile={profile} />;
}
