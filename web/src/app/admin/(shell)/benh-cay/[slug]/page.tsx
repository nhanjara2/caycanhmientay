import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DiseaseForm } from '@/components/admin/DiseaseForm';
import type { Disease } from '@/lib/diseases';
import { requireStaff } from '@/server/auth';
import { getDiseaseAdmin, listDiseasesAdmin } from '@/server/diseases';
import { listProductsAdmin } from '@/server/products-admin';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).slug === 'moi' ? 'Thêm bài bệnh' : 'Sửa bài bệnh' };
}

const EMPTY: Disease = {
  slug: '', name: '', aliases: [], cause: 'nam', parts: ['la'], plants: [], severity: 2, spread: '', season: '', summary: '',
  symptoms: [{ part: 'la', text: '' }], confusions: [], steps: [{ title: '', detail: '' }], prevention: [], safety: '', products: [], active: true,
};

/** /admin/benh-cay/moi để thêm, /admin/benh-cay/<slug> để sửa. */
export default async function AdminDiseasePage({ params }: Props) {
  const me = await requireStaff();
  const { slug } = await params;
  const initial = slug === 'moi' ? EMPTY : await getDiseaseAdmin(slug);
  if (!initial) notFound();
  const [products, others] = await Promise.all([listProductsAdmin(), listDiseasesAdmin()]);
  return (
    <DiseaseForm
      key={slug}
      initial={initial}
      canEdit={me.role === 'admin'}
      products={products.map((p) => ({ slug: p.slug, name: p.name, sku: p.sku, active: p.active }))}
      diseases={others.filter((d) => d.slug !== initial.slug).map((d) => ({ slug: d.slug, name: d.name }))}
    />
  );
}
