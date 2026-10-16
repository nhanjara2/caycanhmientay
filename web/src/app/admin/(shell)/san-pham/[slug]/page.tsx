import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ProductForm, type ProductFormValue } from '@/components/admin/ProductForm';
import type { IconName } from '@/components/Icon';
import { requireAccess } from '@/server/auth';
import { getCategories } from '@/server/categories';
import { getProductAdmin } from '@/server/products-admin';
import { SeoPanel } from '@/components/admin/SeoPanel';
import { clipText } from '@/lib/format';
import { seoPanelState } from '@/server/seo-cms';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).slug === 'moi' ? 'Thêm sản phẩm' : 'Sửa sản phẩm' };
}

const NO_FENGSHUI = { elements: [], ages: '', meaning: '', placement: '' };
const NO_ATTRS = { viTri: [], kichThuoc: null, mau: [], anhSang: [], vaiTro: [], cham: null, thuCung: null, chiuGio: false };

const EMPTY: ProductFormValue = {
  name: '', seoName: '', category: 'cay-canh', sub: '', extraSubs: [], icon: 'plant', origin: 'Việt Nam', ship: 'plant', pesticide: false, noVoucher: false,
  unit: 'Chậu', spec: '', lead: '', keywords: '', active: true, flash: false, video: '', images: [], fengshui: NO_FENGSHUI, attrs: NO_ATTRS,
  specs: [], // form tự điền bộ thông số của danh mục + nhóm con
  options: [{ label: '', price: 0, oldPrice: null, garden: null, cost: null, combo2: null, bulky: false, stock: 0 }],
};

/** AdminProductForm: /admin/san-pham/moi để thêm, /admin/san-pham/<slug> để sửa. */
export default async function AdminProductPage({ params }: Props) {
  const me = await requireAccess('products');
  const { slug } = await params;
  let initial = EMPTY;
  let seo: ReactNode = null;
  if (slug !== 'moi') {
    const p = await getProductAdmin(slug);
    if (!p) notFound();
    initial = {
      slug: p.slug, sku: p.sku, name: p.name, seoName: p.seoName ?? '', category: p.category, sub: p.sub, extraSubs: p.extraSubs, icon: p.icon as IconName, origin: p.origin,
      ship: p.ship, pesticide: p.pesticide, noVoucher: p.noVoucher, unit: p.unit, spec: p.spec, lead: p.lead, keywords: p.keywords.join(', '), specs: p.specs, active: p.active,
      flash: p.flashTotal !== null,
      video: p.youtubeId ? `https://youtu.be/${p.youtubeId}` : '', images: p.images,
      fengshui: p.fengshui ?? NO_FENGSHUI,
      attrs: p.attrs ? {
        viTri: p.attrs.viTri ?? [], kichThuoc: p.attrs.kichThuoc ?? null, mau: p.attrs.mau ?? [],
        anhSang: p.attrs.anhSang ?? [], vaiTro: p.attrs.vaiTro ?? [], cham: p.attrs.cham ?? null, thuCung: p.attrs.thuCung ?? null, chiuGio: p.attrs.chiuGio ?? false,
      } : NO_ATTRS,
      options: p.options.map((o) => ({ idx: o.idx, label: o.label, price: o.price, oldPrice: o.oldPrice, garden: o.garden, cost: o.cost, combo2: o.combo2, bulky: o.bulky, stock: o.stock })),
    };
    const path = `/san-pham/${p.slug}`;
    const st = await seoPanelState(path);
    seo = (
      <SeoPanel
        path={path} initial={st.initial} history={st.history} live={st.live} fields={['description', 'image']}
        canEdit={me.role === 'admin'} isAdmin={me.role === 'admin'}
        note="Tiêu đề Google = ô Tên chi tiết (SEO) ở trên. Đường dẫn sản phẩm cố định (đơn hàng, kho, bảo hành tham chiếu theo đường dẫn)."
        auto={{ description: clipText(p.lead, 170) }}
        images={p.images.map((im, i) => ({ url: im.url, label: i ? `Ảnh phụ ${i}` : 'Ảnh chính' }))}
      />
    );
  }
  return (
    <>
      <ProductForm key={slug} initial={initial} categories={await getCategories()} canEdit={me.role === 'admin'} />
      {seo && <div className="ad-body">{seo}</div>}
    </>
  );
}
