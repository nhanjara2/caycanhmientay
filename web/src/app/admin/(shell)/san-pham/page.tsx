import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductActiveToggle } from '@/components/admin/ProductActiveToggle';
import { ProductDeleteButton } from '@/components/admin/ProductDeleteButton';
import { Icon, Thumb } from '@/components/Icon';
import { categoryLabel, findCategory } from '@/lib/catalog';
import { money } from '@/lib/format';
import { requireAccess } from '@/server/auth';
import { getCategories } from '@/server/categories';
import { MIN_STOCK } from '@/server/inventory';
import { listProductsAdmin } from '@/server/products-admin';

export const metadata: Metadata = { title: 'Sản phẩm' };

type Props = { searchParams: Promise<{ danh_muc?: string; q?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const me = await requireAccess('products');
  const sp = await searchParams;
  const categories = await getCategories();
  const category = findCategory(categories, sp.danh_muc ?? '')?.slug;
  const q = sp.q?.slice(0, 60);
  const rows = await listProductsAdmin({ category, q });
  const isAdmin = me.role === 'admin';

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Sản phẩm</h1>
        <span className="acts">
          <Link href="/admin/danh-muc" className="vx-btn vx-btn--outline">Danh mục & thông số</Link>
          {isAdmin && <Link href="/admin/san-pham/moi" className="vx-btn vx-btn--primary">+ Thêm sản phẩm</Link>}
        </span>
      </div>
      <div className="ad-card">
        <div className="ad-stabs">
          <Link href="/admin/san-pham" aria-current={!category ? 'true' : undefined}>Tất cả</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/admin/san-pham?danh_muc=${c.slug}`} aria-current={category === c.slug ? 'true' : undefined}>{c.name}</Link>
          ))}
        </div>
        <form className="ad-filters" action="/admin/san-pham">
          {category && <input type="hidden" name="danh_muc" value={category} />}
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input className="app-bare" name="q" defaultValue={q} placeholder="Tên hoặc SKU" aria-label="Tìm sản phẩm" />
          </label>
          <button className="vx-btn vx-btn--outline vx-btn--sm">Tìm</button>
        </form>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr><th>Sản phẩm</th><th>Danh mục</th><th className="num">Giá từ</th><th className="num">Tồn</th><th className="num">Đã bán</th><th>Trạng thái</th>{isAdmin && <th />}</tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const label = categoryLabel(categories, r.category, r.sub);
                return (
                  <tr key={r.slug}>
                    <td>
                      <Link href={`/admin/san-pham/${r.slug}`} className="ad-prod app-rowlink" style={{ color: 'inherit' }}>
                        <span className="ad-thumb"><Thumb src={r.image} icon={r.icon} /></span>
                        <span><b>{r.name}</b><small>{r.sku} · {r.variants} quy cách{r.pesticide ? ' · Thuốc BVTV' : ''}</small></span>
                      </Link>
                    </td>
                    <td data-label="Danh mục" data-m="note early">{label.cat}<small>{label.sub}</small></td>
                    <td className="num" data-label="Giá từ" data-m="third">{r.minPrice ? <>{money(r.minPrice)}<small>/ {r.unit}</small></> : 'Liên hệ'}</td>
                    <td className="num" data-label="Tồn" data-m="third">{(r.stock ?? 0) < MIN_STOCK ? <b style={{ color: 'var(--sale)' }}>{r.stock ?? 0}</b> : r.stock}</td>
                    <td className="num" data-label="Đã bán" data-m="third">{r.sold}</td>
                    <td data-label="Trạng thái" data-m="foot">{isAdmin ? <ProductActiveToggle slug={r.slug} active={r.active} /> : <span className={`ad-pill ${r.active ? 'done' : 'wait'}`}>{r.active ? 'Đang bán' : 'Ẩn'}</span>}</td>
                    {isAdmin && <td data-label="Thao tác" data-m="foot end"><ProductDeleteButton slug={r.slug} name={r.name} /></td>}
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Không có sản phẩm.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>{rows.length} sản phẩm</span></div>
      </div>
    </div>
  );
}
