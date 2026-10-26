import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutView } from '@/components/AboutView';
import { PolicyArticle } from '@/components/PolicyArticle';
import { getPolicy, policies } from '@/lib/policies';
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
  return p ? withSeo(withShare({ title: p.title, description: p.description, alternates: { canonical: `/chinh-sach/${p.slug}` } })) : { title: 'Không tìm thấy' };
}

/** Trang "Nguồn ảnh minh họa": thêm mục ghi công ảnh triệu chứng bệnh cây (lib/seed-disease-images.ts). */
function diseaseCredits(): Section {
  const names = new Map(seedDiseases.map((d) => [d.slug, d.name]));
  return {
    id: 'anh-benh-cay',
    h: 'Ảnh triệu chứng bệnh cây',
    blocks: [
      'Ảnh đã được cắt khung 4:3 và thu nhỏ; giấy phép CC BY-SA áp dụng cho bản đã chỉnh sửa.',
      { ul: SEED_DISEASE_IMAGES.map((x) => `${names.get(x.disease) ?? x.disease} — ${x.symptom}: ảnh của ${x.author}, ${x.license}, nguồn ${x.url}`) },
    ],
  };
}

/** Ảnh minh họa các nhóm cây công trình ở trang Đối tác sỉ (lib/tree-guides.ts). */
function treeCredits(): Section {
  return {
    id: 'anh-cay-cong-trinh',
    h: 'Ảnh nhóm cây công trình',
    blocks: [
      'Ảnh minh họa nhóm cây ở trang Đối tác sỉ, đã được cắt khung 4:3 và thu nhỏ.',
      { ul: TREE_IMAGE_CREDITS.map((x) => `${x.what}: ảnh của ${x.author}, ${x.license}, nguồn ${x.url}`) },
    ],
  };
}

/** PolicyLayout: trang Giới thiệu viết tay (components/AboutView), các trang khác dựng từ lib/policy-content. */
export default async function Page({ params }: Props) {
  const p = getPolicy((await params).slug);
  if (!p) notFound();
  if (p.slug === 'gioi-thieu') return <AboutView />;

  // Phí giao, vùng giao, khung giờ đọc từ Cài đặt giao hàng để trang luôn khớp giỏ hàng / thanh toán.
  const shipping = policyNeedsShipping(p.slug) ? await getShippingConfig() : DEFAULT_SHIPPING;
  const body = policyBody(p.slug, { shipping });
  if (!body) notFound();

  const sections = p.slug === 'nguon-anh' ? [...body, diseaseCredits(), treeCredits()] : body;

  return <PolicyArticle title={p.title} updated={p.updated} sections={sections} />;
}
