import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DiseaseForm } from '@/components/admin/DiseaseForm';
import type { Disease } from '@/lib/diseases';
import { hasAccess } from '@/lib/permissions';
import { requireAccess } from '@/server/auth';
import { getDiseaseAdmin, listDiseasesAdmin } from '@/server/diseases';
import { listProductsAdmin } from '@/server/products-admin';
import { SeoPanel } from '@/components/admin/SeoPanel';
import { diseaseImageUrl } from '@/lib/diseases';
import { clipText } from '@/lib/format';
import { seoPanelState } from '@/server/seo-cms';

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
  const me = await requireAccess('content');
  const { slug } = await params;
  const initial = slug === 'moi' ? EMPTY : await getDiseaseAdmin(slug);
  if (!initial) notFound();
  const [products, others] = await Promise.all([listProductsAdmin(), listDiseasesAdmin()]);
  const path = `/benh-cay/${initial.slug}`;
  const st = slug === 'moi' ? null : await seoPanelState(path);
  return (
    <>
      <DiseaseForm
        key={slug}
        initial={initial}
        canEdit={hasAccess(me, 'content', 'full')}
        products={products.map((p) => ({ slug: p.slug, name: p.name, sku: p.sku, active: p.active }))}
        diseases={others.filter((d) => d.slug !== initial.slug).map((d) => ({ slug: d.slug, name: d.name }))}
      />
      {st && (
        <div className="ad-body">
          <SeoPanel
            path={path} initial={st.initial} history={st.history} live={st.live} fields={['title', 'description', 'image']}
            canEdit={hasAccess(me, 'content', 'full')} isAdmin={me.role === 'admin'}
            auto={{ title: `${initial.name} | Cây Cảnh Miền Tây`, description: clipText(initial.summary || `${initial.name}: dấu hiệu nhận biết, nguyên nhân, cách xử lý và phòng bệnh.`, 170) }}
            images={initial.symptoms.flatMap((s, i) => (s.image ? [{ url: diseaseImageUrl(s.image), label: `Triệu chứng ${i + 1}` }] : []))}
          />
        </div>
      )}
    </>
  );
}
