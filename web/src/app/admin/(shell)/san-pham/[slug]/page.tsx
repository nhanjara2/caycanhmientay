import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductForm, type ProductFormValue } from '@/components/admin/ProductForm';
import type { IconName } from '@/components/Icon';
import { requireAccess } from '@/server/auth';
import { getCategories } from '@/server/categories';
import { getProductAdmin } from '@/server/products-admin';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).slug === 'moi' ? 'Thêm sản phẩm' : 'Sửa sản phẩm' };
}

const NO_FENGSHUI = { elements: [], ages: '', meaning: '', placement: '' };
const NO_ATTRS = { viTri: [], kichThuoc: null, mau: [] };

const EMPTY: ProductFormValue = {
  name: '', category: 'cay-canh', sub: 'kieng-la', icon: 'plant', origin: 'Việt Nam', ship: 'plant', pesticide: false,
  unit: 'Chậu', spec: '', lead: '', active: true, flash: false, video: '', images: [], fengshui: NO_FENGSHUI, attrs: NO_ATTRS,
  specs: [], // form tự điền bộ thông số của danh mục + nhóm con
  options: [{ label: '', price: 0, oldPrice: null, stock: 0 }],
};

/** AdminProductForm: /admin/san-pham/moi để thêm, /admin/san-pham/<slug> để sửa. */
export default async function AdminProductPage({ params }: Props) {
  const me = await requireAccess('products');
  const { slug } = await params;
  let initial = EMPTY;
  if (slug !== 'moi') {
    const p = await getProductAdmin(slug);
    if (!p) notFound();
    initial = {
      slug: p.slug, sku: p.sku, name: p.name, category: p.category, sub: p.sub, icon: p.icon as IconName, origin: p.origin,
      ship: p.ship, pesticide: p.pesticide, unit: p.unit, spec: p.spec, lead: p.lead, specs: p.specs, active: p.active,
      flash: p.flashTotal !== null,
      video: p.youtubeId ? `https://youtu.be/${p.youtubeId}` : '', images: p.images,
      fengshui: p.fengshui ?? NO_FENGSHUI,
      attrs: p.attrs ? { viTri: p.attrs.viTri ?? [], kichThuoc: p.attrs.kichThuoc ?? null, mau: p.attrs.mau ?? [] } : NO_ATTRS,
      options: p.options.map((o) => ({ label: o.label, price: o.price, oldPrice: o.oldPrice, stock: o.stock })),
    };
  }
  return <ProductForm key={slug} initial={initial} categories={await getCategories()} canEdit={me.role === 'admin'} />;
}
