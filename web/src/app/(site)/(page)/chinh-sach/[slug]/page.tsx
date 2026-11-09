import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutView } from '@/components/AboutView';
import { PolicyArticle } from '@/components/PolicyArticle';
import { getPolicy, policies, policyDescription, policyTitle } from '@/lib/policies';
import { currentLang } from '@/i18n/request';
import { policyBody, policyNeedsShipping, type Section } from '@/lib/policy-content';
import { SEED_DISEASE_IMAGES } from '@/lib/seed-disease-images';
import { seedDiseases } from '@/lib/seed-diseases';
import { DEFAULT_SHIPPING } from '@/lib/shipping';
import { TREE_IMAGE_CREDITS } from '@/lib/tree-guides';
import { getShippingConfig } from '@/server/shipping';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPolicy((await params).slug);
  const lang = await currentLang();
  return p ? withSeo(withShare({ title: policyTitle(p, lang), description: policyDescription(p, lang), alternates: { canonical: `/chinh-sach/${p.slug}` } })) : { title: 'Không tìm thấy' };
}

/** Trang "Nguồn ảnh minh họa": thêm mục ghi công ảnh triệu chứng bệnh cây (lib/seed-disease-images.ts). */
function diseaseCredits(en: boolean): Section {
  const names = new Map(seedDiseases.map((d) => [d.slug, d.name]));
  return {
    id: 'anh-benh-cay',
    h: en ? 'Plant-disease symptom photos' : 'Ảnh triệu chứng bệnh cây',
    blocks: [
      en ? 'Images were cropped to 4:3 and resized; CC BY-SA applies to the edited versions.' : 'Ảnh đã được cắt khung 4:3 và thu nhỏ; giấy phép CC BY-SA áp dụng cho bản đã chỉnh sửa.',
      { ul: SEED_DISEASE_IMAGES.map((x) => `${names.get(x.disease) ?? x.disease} — ${x.symptom}: ${en ? 'photo by' : 'ảnh của'} ${x.author}, ${x.license}, ${en ? 'source' : 'nguồn'} ${x.url}`) },
    ],
  };
}

/** Ảnh minh họa các nhóm cây công trình ở trang Đối tác sỉ (lib/tree-guides.ts). */
function treeCredits(en: boolean): Section {
  return {
    id: 'anh-cay-cong-trinh',
    h: en ? 'Landscape plant group photos' : 'Ảnh nhóm cây công trình',
    blocks: [
      en ? 'Illustrations of plant groups on the Wholesale partners page, cropped to 4:3 and resized.' : 'Ảnh minh họa nhóm cây ở trang Đối tác sỉ, đã được cắt khung 4:3 và thu nhỏ.',
      { ul: TREE_IMAGE_CREDITS.map((x) => `${x.what}: ${en ? 'photo by' : 'ảnh của'} ${x.author}, ${x.license}, ${en ? 'source' : 'nguồn'} ${x.url}`) },
    ],
  };
}

/** PolicyLayout: trang Giới thiệu viết tay (components/AboutView), các trang khác dựng từ lib/policy-content. */
export default async function Page({ params }: Props) {
  const p = getPolicy((await params).slug);
  if (!p) notFound();
  const lang = await currentLang();
  const en = lang === 'en';
  if (p.slug === 'gioi-thieu') return <AboutView lang={lang} />;

  // Phí giao, vùng giao, khung giờ đọc từ Cài đặt giao hàng để trang luôn khớp giỏ hàng / thanh toán.
  const shipping = policyNeedsShipping(p.slug) ? await getShippingConfig() : DEFAULT_SHIPPING;
  const body = policyBody(p.slug, { shipping }, lang);
  if (!body) notFound();

  const sections = p.slug === 'nguon-anh' ? [...body, diseaseCredits(en), treeCredits(en)] : body;

  return <PolicyArticle title={policyTitle(p, lang)} updated={p.updated} sections={sections} lang={lang} />;
}
