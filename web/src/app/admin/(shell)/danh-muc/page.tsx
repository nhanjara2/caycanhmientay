import type { Metadata } from 'next';
import Link from 'next/link';
import { MenuToggle, MoveButtons } from '@/components/admin/CategoryAdmin';
import { Icon } from '@/components/Icon';
import { SYSTEM_CATEGORIES } from '@/lib/catalog';
import { requireStaff } from '@/server/auth';
import { categoryProductCounts, getCategories } from '@/server/categories';

export const metadata: Metadata = { title: 'Danh mục & thông số' };

/** Danh mục sản phẩm: thứ tự trên menu, hiện/ẩn, số nhóm con, bộ thông số, số sản phẩm. Sửa chi tiết ở /admin/danh-muc/<slug>. */
export default async function AdminCategoriesPage() {
  const me = await requireStaff();
  const [cats, counts] = await Promise.all([getCategories(), categoryProductCounts()]);
  const isAdmin = me.role === 'admin';

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Danh mục & thông số</h1>
        <span className="acts">
          <Link href="/admin/san-pham" className="vx-btn vx-btn--outline">Sản phẩm</Link>
          {isAdmin && <Link href="/admin/danh-muc/moi" className="vx-btn vx-btn--primary">+ Thêm danh mục</Link>}
        </span>
      </div>
      <div className="ad-card">
        <div className="ad-card__b" style={{ paddingBottom: 0 }}>
          <span className="hint">
            Danh mục và nhóm con hiện ở menu trái, trang chủ, chân trang theo đúng thứ tự dưới đây. Mỗi danh mục có <b>bộ thông số</b> được điền sẵn khi thêm sản phẩm.
            {!isAdmin && ' Chỉ quản trị viên được sửa.'}
          </span>
        </div>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr>
                <th>Danh mục</th><th>Nhóm con</th><th>Bộ thông số</th><th className="num">Sản phẩm</th><th>Trên menu</th>
                {isAdmin && <th>Thứ tự</th>}<th />
              </tr>
            </thead>
            <tbody>
              {cats.map((c, i) => {
                const required = c.specs.filter((f) => f.required).length;
                return (
                  <tr key={c.slug}>
                    <td>
                      <Link href={`/admin/danh-muc/${c.slug}`} className="ad-prod" style={{ color: 'inherit' }}>
                        <span className="ad-thumb" style={{ color: 'var(--primary)' }}><Icon name={c.icon} /></span>
                        <span>
                          <b>{c.name}</b>
                          <small>/danh-muc/{c.slug}{SYSTEM_CATEGORIES[c.slug] ? ' · Hệ thống' : ''}</small>
                        </span>
                      </Link>
                    </td>
                    <td data-label="Nhóm con">
                      {c.subs.length
                        ? <span className="app-catsubs">{c.subs.map((s) => <span key={s.slug} data-off={!s.active || undefined}>{s.name}</span>)}</span>
                        : <span style={{ color: 'var(--danger)' }}>Chưa có nhóm con</span>}
                    </td>
                    <td data-label="Bộ thông số">
                      {c.specs.length ? `${c.specs.length} thông số` : 'Chưa có'}
                      {required > 0 && <small>{required} bắt buộc</small>}
                    </td>
                    <td className="num" data-label="Sản phẩm">
                      {counts[c.slug] ? <Link href={`/admin/san-pham?danh_muc=${c.slug}`}>{counts[c.slug]}</Link> : 0}
                    </td>
                    <td data-label="Trên menu">
                      {isAdmin ? <MenuToggle category={c.slug} active={c.active} /> : <span className={`ad-pill ${c.active ? 'done' : 'wait'}`}>{c.active ? 'Đang hiện' : 'Ẩn'}</span>}
                    </td>
                    {isAdmin && <td data-label="Thứ tự"><MoveButtons category={c.slug} first={i === 0} last={i === cats.length - 1} /></td>}
                    <td data-label="Thao tác"><Link href={`/admin/danh-muc/${c.slug}`} className="vx-btn vx-btn--outline vx-btn--sm">{isAdmin ? 'Sửa' : 'Xem'}</Link></td>
                  </tr>
                );
              })}
              {!cats.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Chưa có danh mục.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>{cats.length} danh mục · {cats.reduce((n, c) => n + c.subs.length, 0)} nhóm con</span></div>
      </div>
    </div>
  );
}
