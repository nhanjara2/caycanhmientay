import type { Metadata } from 'next';
import Link from 'next/link';
import { DiseaseActiveToggle } from '@/components/admin/DiseaseActiveToggle';
import { Icon } from '@/components/Icon';
import { CAUSES, causeOf, isCause, matchesDisease, partName, SEVERITY } from '@/lib/diseases';
import { hasAccess } from '@/lib/permissions';
import { requireAccess } from '@/server/auth';
import { listDiseasesAdmin } from '@/server/diseases';

export const metadata: Metadata = { title: 'Bệnh cây' };

type Props = { searchParams: Promise<{ nguyen_nhan?: string; q?: string }> };

/** Thư viện bệnh cây: danh sách bài, lọc theo nguyên nhân, hiện/ẩn nhanh. */
export default async function AdminDiseasesPage({ searchParams }: Props) {
  const me = await requireAccess('content');
  const sp = await searchParams;
  const cause = isCause(sp.nguyen_nhan) ? sp.nguyen_nhan : undefined;
  const q = sp.q?.slice(0, 60);
  const rows = (await listDiseasesAdmin()).filter((d) => (!cause || d.cause === cause) && (!q || matchesDisease(d, q)));
  const isAdmin = hasAccess(me, 'content', 'full');

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Bệnh cây</h1>
        <span className="acts">
          <Link href="/benh-cay" target="_blank" className="vx-btn vx-btn--outline">Xem trên web</Link>
          {isAdmin && <Link href="/admin/benh-cay/moi" className="vx-btn vx-btn--primary">+ Thêm bài bệnh</Link>}
        </span>
      </div>
      <div className="ad-card">
        <div className="ad-stabs">
          <Link href="/admin/benh-cay" aria-current={!cause ? 'true' : undefined}>Tất cả</Link>
          {CAUSES.map((c) => (
            <Link key={c.key} href={`/admin/benh-cay?nguyen_nhan=${c.key}`} aria-current={cause === c.key ? 'true' : undefined}>{c.name}</Link>
          ))}
        </div>
        <form className="ad-filters" action="/admin/benh-cay">
          {cause && <input type="hidden" name="nguyen_nhan" value={cause} />}
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input className="app-bare" name="q" defaultValue={q} placeholder="Tên bệnh hoặc triệu chứng" aria-label="Tìm bài bệnh" />
          </label>
          <button className="vx-btn vx-btn--outline vx-btn--sm">Tìm</button>
        </form>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr><th>Bệnh</th><th>Nguyên nhân</th><th>Bộ phận</th><th>Mức nguy hiểm</th><th className="num">Sản phẩm</th><th>Cập nhật</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.slug}>
                  <td><Link href={`/admin/benh-cay/${d.slug}`} className="app-rowlink" style={{ color: 'inherit' }}><b>{d.name}</b><small>/benh-cay/{d.slug}</small></Link></td>
                  <td data-label="Nguyên nhân">{causeOf(d.cause)?.name}</td>
                  <td data-label="Bộ phận">{d.parts.map(partName).join(', ')}</td>
                  <td data-label="Mức nguy hiểm" data-m="third">{SEVERITY[d.severity]}</td>
                  <td className="num" data-label="Sản phẩm" data-m="third">{d.products.length}</td>
                  <td data-label="Cập nhật" data-m="third">{d.updatedAt.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td>
                  <td data-label="Trạng thái" data-m="foot">{isAdmin ? <DiseaseActiveToggle slug={d.slug} active={d.active} /> : <span className={`ad-pill ${d.active ? 'done' : 'wait'}`}>{d.active ? 'Đang hiện' : 'Ẩn'}</span>}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Không có bài bệnh.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>{rows.length} bài bệnh</span></div>
      </div>
    </div>
  );
}
