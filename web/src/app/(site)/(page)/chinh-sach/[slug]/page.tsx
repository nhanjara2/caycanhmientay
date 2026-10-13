import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutView } from '@/components/AboutView';
import { PolicyArticle } from '@/components/PolicyArticle';
import { getPolicy, policies } from '@/lib/policies';
import { policyBody, policyNeedsShipping } from '@/lib/policy-content';
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

/** PolicyLayout: trang Giới thiệu viết tay (components/AboutView), các trang khác dựng từ lib/policy-content. */
export default async function Page({ params }: Props) {
  const p = getPolicy((await params).slug);
  if (!p) notFound();
  if (p.slug === 'gioi-thieu') return <AboutView />;

  // Phí giao, vùng giao, khung giờ đọc từ Cài đặt giao hàng để trang luôn khớp giỏ hàng / thanh toán.
  const shipping = policyNeedsShipping(p.slug) ? await getShippingConfig() : DEFAULT_SHIPPING;
  const body = policyBody(p.slug, { shipping });
  if (!body) notFound();

  return <PolicyArticle title={p.title} updated={p.updated} sections={body} />;
}
