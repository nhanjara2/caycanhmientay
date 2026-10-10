import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutView } from '@/components/AboutView';
import { PolicyArticle } from '@/components/PolicyArticle';
import { getPolicy, policies } from '@/lib/policies';
import { policyBody, policyNeedsShipping, type Section } from '@/lib/policy-content';
import { SEED_DISEASE_IMAGES } from '@/lib/seed-disease-images';
import { SEED_PRODUCT_IMAGES } from '@/lib/seed-product-images';
import { seedDiseases } from '@/lib/seed-diseases';
import { DEFAULT_SHIPPING } from '@/lib/shipping';
import { getShippingConfig } from '@/server/shipping';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPolicy((await params).slug);
  return p ? { title: p.title, description: p.description } : { title: 'Không tìm thấy' };
}

/** Trang "Nguồn ảnh minh họa": thêm mục ghi công ảnh triệu chứng bệnh cây (lib/seed-disease-images.ts). */
function diseaseCredits(): Section {
  const names = new Map(seedDiseases.map((d) => [d.slug, d.name]));
  return {
    id: 'anh-benh-cay',
    h: 'Ảnh triệu chứng bệnh cây',
    blocks: [
      'Ảnh triệu chứng trong Thư viện bệnh cây chụp trên nhiều loại cây khác nhau. Ảnh đã được cắt khung 4:3 và thu nhỏ; giấy phép CC BY-SA áp dụng cho bản đã chỉnh sửa.',
      { ul: SEED_DISEASE_IMAGES.map((x) => `${names.get(x.disease) ?? x.disease} — ${x.symptom}: ảnh của ${x.author}, ${x.license}, nguồn ${x.url}`) },
    ],
  };
}

/** Trang "Nguồn ảnh minh họa": ghi công ảnh minh họa nạp sẵn cho sản phẩm chưa có ảnh (lib/seed-product-images.ts). */
function productCredits(): Section {
  return {
    id: 'anh-san-pham',
    h: 'Ảnh minh họa sản phẩm cây cảnh',
    blocks: [
      'Ảnh đúng loài (hoặc loài gần giống), đã được cắt khung vuông và thu nhỏ; giấy phép CC BY-SA áp dụng cho bản đã chỉnh sửa.',
      { ul: SEED_PRODUCT_IMAGES.map((x) => `${x.name}: ảnh của ${x.author}, ${x.license}, nguồn ${x.url}`) },
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
  const sections = p.slug === 'nguon-anh' ? [...body, productCredits(), diseaseCredits()] : body;

  return <PolicyArticle title={p.title} updated={p.updated} sections={sections} />;
}
