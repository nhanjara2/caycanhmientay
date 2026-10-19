import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectPublishToggle } from '@/components/admin/ProjectPublishToggle';
import { hasAccess } from '@/lib/permissions';
import { projectImageUrl, projectTypeOf } from '@/lib/projects';
import { requireAccess } from '@/server/auth';
import { listProjectsAdmin } from '@/server/projects';

export const metadata: Metadata = { title: 'Dự án doanh nghiệp' };

/** Công trình đã cung cấp cây: hiện ở trang Đối tác sỉ /doi-tac để đối tác xem năng lực thật của shop. */
export default async function AdminProjectsPage() {
  const me = await requireAccess('content');
  const canEdit = hasAccess(me, 'content', 'full');
  const rows = await listProjectsAdmin();
  const shown = rows.filter((r) => r.published).length;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Dự án doanh nghiệp</h1>
        <span className="acts">
          <Link href="/doi-tac" target="_blank" className="vx-btn vx-btn--outline">Xem trên web</Link>
          {canEdit && <Link href="/admin/du-an/moi" className="vx-btn vx-btn--primary">+ Thêm dự án</Link>}
        </span>
      </div>
      <div className="vx-callout">
        <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></svg>
        <div>
          Mỗi dự án là một công trình shop <b>đã thật sự làm</b> (cung cấp cây, thi công, chăm sóc…), kèm ảnh chụp tại công trình. Dự án đang hiện
          nằm ở mục <b>“Công trình đã cung cấp cây”</b> trang <Link href="/doi-tac" target="_blank">Đối tác sỉ</Link>: có ảnh thì thành thẻ ảnh,
          chưa có ảnh thì là một dòng trong bảng công trình; dự án <b>Nổi bật</b> (cần ảnh) lên đầu trang. Tên và logo của khách hàng <b>chỉ điền khi khách đồng ý công khai</b> — không thì ghi chung, ví dụ “Một khu nghỉ dưỡng tại Phú Quốc”.
        </div>
      </div>
      <div className="ad-card">
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr><th>Dự án</th><th>Loại công trình</th><th>Khách hàng</th><th>Địa điểm</th><th className="num">Năm</th><th className="num">Ảnh</th><th>Trên web</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/du-an/${p.id}`} className="app-rowlink" style={{ color: 'inherit', display: 'flex', gap: 10, alignItems: 'center' }}>
                      {p.images[0]
                        ? <img src={projectImageUrl(p.images[0].file)} alt="" width={64} height={48} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6, flex: 'none' }} />
                        : <span style={{ width: 64, height: 48, borderRadius: 6, border: '1px dashed var(--border)', flex: 'none', display: 'grid', placeItems: 'center', fontSize: '0.6875rem', color: 'var(--ink-muted)' }}>Chưa ảnh</span>}
                      <span><b>{p.featured && <span title="Nổi bật" style={{ color: 'var(--sun)' }}>★ </span>}{p.title}</b><small>/doi-tac/cong-trinh/{p.slug}</small></span>
                    </Link>
                  </td>
                  <td data-label="Loại công trình">{projectTypeOf(p.type).name}</td>
                  <td data-label="Khách hàng">{p.client || <span style={{ color: 'var(--ink-muted)' }}>Không ghi tên</span>}</td>
                  <td data-label="Địa điểm">{p.location || '—'}</td>
                  <td className="num" data-label="Năm" data-m="third">{p.year ?? '—'}</td>
                  <td className="num" data-label="Ảnh" data-m="third">{p.images.length}</td>
                  <td data-label="Trên web" data-m="foot">
                    {canEdit
                      ? <ProjectPublishToggle id={p.id} published={p.published} />
                      : <span className={`ad-pill ${p.published ? 'done' : 'wait'}`}>{p.published ? 'Đang hiện' : 'Ẩn'}</span>}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>
                  Chưa có dự án nào. {canEdit && <Link href="/admin/du-an/moi" style={{ color: 'var(--primary)', fontWeight: 600 }}>Thêm dự án đầu tiên</Link>}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>{rows.length} dự án · {shown} đang hiện trên web</span></div>
      </div>
    </div>
  );
}
