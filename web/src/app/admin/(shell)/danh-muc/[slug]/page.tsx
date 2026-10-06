import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryForm, SubcategoryManager } from '@/components/admin/CategoryAdmin';
import { SYSTEM_CATEGORIES } from '@/lib/catalog';
import { requireAccess } from '@/server/auth';
import { categoryProductCounts, getCategory } from '@/server/categories';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'moi') return { title: 'Thêm danh mục' };
  return { title: (await getCategory(slug))?.name ?? 'Danh mục' };
}

/** /admin/danh-muc/moi để thêm, /admin/danh-muc/<slug> để sửa thông tin, bộ thông số và nhóm con. */
export default async function AdminCategoryPage({ params }: Props) {
  const me = await requireAccess('products');
  const { slug } = await params;
  const canEdit = me.role === 'admin';
  const creating = slug === 'moi';
  const cat = creating ? undefined : await getCategory(slug);
  if (!creating && !cat) notFound();
  const counts = cat ? await categoryProductCounts() : {};

  return (
    <div className="ad-body app-catpage">
      <div className="ad-title">
        <h1>{cat ? cat.name : 'Thêm danh mục'}</h1>
        <span className="vx-crumb"><Link href="/admin/danh-muc">Danh mục</Link>/<span>{cat ? cat.slug : 'Mới'}</span></span>
        {cat && (
          <span className="acts">
            {(counts[cat.slug] ?? 0) > 0 && <Link href={`/admin/san-pham?danh_muc=${cat.slug}`} className="vx-btn vx-btn--outline">{counts[cat.slug]} sản phẩm</Link>}
            <Link href={`/danh-muc/${cat.slug}`} target="_blank" className="vx-btn vx-btn--outline">Xem trên web</Link>
          </span>
        )}
      </div>
      <CategoryForm
        key={slug}
        initial={cat ? { slug: cat.slug, name: cat.name, icon: cat.icon, active: cat.active, specs: cat.specs } : null}
        system={cat ? SYSTEM_CATEGORIES[cat.slug] ?? null : null}
        productCount={cat ? counts[cat.slug] ?? 0 : 0}
        canEdit={canEdit}
      />
      {cat ? (
        <SubcategoryManager
          category={cat.slug}
          subs={cat.subs.map((s) => ({ ...s, products: counts[`${cat.slug}/${s.slug}`] ?? 0 }))}
          baseSpecs={cat.specs}
          canEdit={canEdit}
        />
      ) : (
        <span className="hint">Tạo danh mục xong sẽ thêm được nhóm con.</span>
      )}
    </div>
  );
}
