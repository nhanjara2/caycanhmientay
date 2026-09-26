import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductActiveToggle } from '@/components/admin/ProductActiveToggle';
import { Art, Icon, type IconName } from '@/components/Icon';
import { categories, getCategory } from '@/lib/catalog';
import { money } from '@/lib/format';
import { requireStaff } from '@/server/auth';
import { MIN_STOCK } from '@/server/inventory';
import { listProductsAdmin } from '@/server/products-admin';

export const metadata: Metadata = { title: 'Sản phẩm' };

type Props = { searchParams: Promise<{ danh_muc?: string; q?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const me = await requireStaff();
  const sp = await searchParams;
  const category = getCategory(sp.danh_muc ?? '')?.slug;
  const q = sp.q?.slice(0, 60);
  const rows = await listProductsAdmin({ category, q });
  const isAdmin = me.role === 'admin';

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Sản phẩm</h1>
        {isAdmin && <span className="acts"><Link href="/admin/san-pham/moi" className="vx-btn vx-btn--primary">+ Thêm sản phẩm</Link></span>}
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
          <table className="ad-table">
            <thead>
              <tr><th>Sản phẩm</th><th>Danh mục</th><th className="num">Giá từ</th><th className="num">Tồn</th><th className="num">Đã bán</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cat = getCategory(r.category);
                return (
                  <tr key={r.slug}>
                    <td>
                      <Link href={`/admin/san-pham/${r.slug}`} className="ad-prod" style={{ color: 'inherit' }}>
                        <span className="ad-thumb"><Art name={r.icon as IconName} /></span>
                        <span><b>{r.name}</b><small>{r.sku} · {r.variants} quy cách{r.pesticide ? ' · Thuốc BVTV' : ''}</small></span>
                      </Link>
                    </td>
                    <td>{cat?.name}<small>{cat?.subs.find((s) => s.slug === r.sub)?.name}</small></td>
                    <td className="num">{money(r.minPrice ?? 0)}<small>/ {r.unit}</small></td>
                    <td className="num">{(r.stock ?? 0) < MIN_STOCK ? <b style={{ color: 'var(--sale)' }}>{r.stock ?? 0}</b> : r.stock}</td>
                    <td className="num">{r.sold}</td>
                    <td>{isAdmin ? <ProductActiveToggle slug={r.slug} active={r.active} /> : <span className={`ad-pill ${r.active ? 'done' : 'wait'}`}>{r.active ? 'Đang bán' : 'Ẩn'}</span>}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Không có sản phẩm.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>{rows.length} sản phẩm</span></div>
      </div>
    </div>
  );
}
