import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PolicyArticle } from '@/components/PolicyArticle';
import { getTreeGuide, TREE_GUIDES, treeGuidePath } from '@/lib/tree-guides';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';

type Props = { params: Promise<{ slug: string }> };

const NAV = [{ group: 'Cây công trình', items: TREE_GUIDES.map((g) => ({ href: treeGuidePath(g.slug), title: g.title })) }];

export function generateStaticParams() {
  return TREE_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = getTreeGuide((await params).slug);
  return g ? withSeo(withShare({ title: g.title, description: g.description, alternates: { canonical: treeGuidePath(g.slug) } })) : { title: 'Không tìm thấy' };
}

export default async function Page({ params }: Props) {
  const g = getTreeGuide((await params).slug);
  if (!g) notFound();
  return <PolicyArticle title={g.title} updated={g.updated} sections={g.sections} crumbs={[{ label: 'Đối tác sỉ', href: '/doi-tac#cay-cong-trinh' }]} nav={NAV} />;
}
