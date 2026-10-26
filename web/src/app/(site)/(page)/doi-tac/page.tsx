import type { Metadata } from 'next';
import { PartnerPage } from '@/components/PartnerPage';
import { PARTNER_TYPES, type PartnerType } from '@/lib/partners';
import { getTreeGuide } from '@/lib/tree-guides';
import { listAddresses } from '@/server/addresses';
import { accountPhone, getCurrentUser } from '@/server/auth';
import { getPartnerProfile } from '@/server/partners';
import { publishedProjects } from '@/server/projects';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';

export const generateMetadata = (): Promise<Metadata> => withSeo(withShare({
  title: 'Đối tác sỉ — nguồn cung cây công trình giá tận vườn',
  description: 'Cung cấp sỉ cây bóng mát, cây hoa, cau cọ, cây bụi, cỏ cho nhà thầu cảnh quan, chủ đầu tư, đại lý. Báo giá theo quy cách và số lượng, nguồn cây từ gần 200 nhà vườn miền Nam.',
  alternates: { canonical: '/doi-tac' },
}, { images: ['/images/doi-tac/lang-hoa-sa-dec.jpg'], alt: 'Vườn cây tại Làng hoa Sa Đéc' }));

type Props = { searchParams: Promise<{ loai?: string; nhom?: string }> };

/** ?loai=landscape|project|trade chọn sẵn loại đối tác, ?nhom=<nhóm cây> ghi sẵn nhóm cây vào form báo giá (#bao-gia). */
export default async function Page({ searchParams }: Props) {
  const [{ loai, nhom }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const [projects, p, addr] = await Promise.all([
    publishedProjects(),
    user ? getPartnerProfile(user.id) : null,
    user ? listAddresses(user.id).then((l) => l[0]) : undefined,
  ]);
  const profile = p ? { type: p.type, company: p.company ?? '', taxCode: p.taxCode ?? '', area: p.area ?? '' } : null;
  const group = nhom ? getTreeGuide(nhom) : undefined;
  const type = PARTNER_TYPES.includes(loai as PartnerType) ? (loai as PartnerType) : p?.type ?? (group ? 'project' : undefined);
  return (
    <PartnerPage
      projects={projects}
      profile={profile}
      quote={{
        type,
        items: group ? `${group.title}: ` : undefined,
        company: p?.company ?? '',
        name: user?.name ?? '',
        phone: (user && accountPhone(user)) ?? '',
        address: addr ? `${addr.street}, ${addr.area}` : p?.area ?? '',
      }}
    />
  );
}
