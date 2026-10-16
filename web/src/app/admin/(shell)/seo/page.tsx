import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { RedirectAdmin, SeoEditButton } from '@/components/admin/SeoAdmin';
import { auditText, seoDate, seoTime } from '@/lib/seo-cms';
import { plainText } from '@/lib/slug';
import { requireAccess } from '@/server/auth';
import { listRedirects, listSeoAudit } from '@/server/seo-cms';
import { seoIssues, seoPages } from '@/server/seo-report';

export const metadata: Metadata = { title: 'SEO & chuyển hướng' };

const TABS = [
  { key: '', label: 'Trang' },
  { key: 'canh-bao', label: 'Cảnh báo' },
  { key: 'chuyen-huong', label: 'Chuyển hướng' },
  { key: 'nhat-ky', label: 'Nhật ký' },
] as const;

type Props = { searchParams: Promise<{ tab?: string; q?: string; loc?: string }> };

/**
 * Quản lý SEO toàn web (mục 14 checklist SEO, chỉ Quản lý): danh sách mọi trang công khai + SEO đặt tay, cảnh báo thiếu
 * dữ liệu, chuyển hướng, nhật ký thay đổi, file Excel kiểm tra hàng loạt (đọc lại từng trang như Google).
 */
export default async function AdminSeoPage({ searchParams }: Props) {
  await requireAccess('settings');
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab ?? '' : '';
  const q = plainText(sp.q?.slice(0, 80) ?? '');
  const [pages, issues, redirects] = await Promise.all([seoPages(), seoIssues(), listRedirects()]);
  const overrides = pages.filter((p) => p.override).length;
  const inSitemap = pages.filter((p) => p.inSitemap).length;
  const errors = issues.filter((i) => i.level === 'error').length;
  const count = (k: string) => (k === '' ? pages.length : k === 'canh-bao' ? issues.length : k === 'chuyen-huong' ? redirects.length : null);
  const link = (k: string) => `/admin/seo${k ? `?tab=${k}` : ''}`;

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>SEO & chuyển hướng</h1>
        <span className="acts">
          <a href="/sitemap.xml" target="_blank" rel="noopener" className="vx-btn vx-btn--outline">Sitemap</a>
          <a href="/admin/seo/xuat" className="vx-btn vx-btn--primary">Tải Excel kiểm tra SEO</a>
        </span>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
        File Excel mở lại từng trang như Google (mất khoảng 10–60 giây) rồi liệt kê tiêu đề, mô tả, robots, canonical và lỗi của mọi trang.
      </p>

      <div className="ad-kpis">
        <div className="ad-kpi"><span><Icon name="search" />Trang trong sitemap</span><b>{inSitemap}</b><small>{pages.length} trang đang theo dõi</small></div>
        <div className="ad-kpi"><span><Icon name="check" />SEO đặt tay</span><b>{overrides}</b><small>Trang có tiêu đề / mô tả / noindex riêng</small></div>
        <div className="ad-kpi"><span><Icon name="chevron" />Chuyển hướng</span><b>{redirects.length}</b><small>{redirects.reduce((n, r) => n + r.hits, 0)} lượt khách được chuyển</small></div>
        <div className="ad-kpi"><span><Icon name="alert" />Cảnh báo</span><b>{issues.length}</b><small>{errors ? `${errors} lỗi cần sửa` : 'Không có lỗi nặng'}</small></div>
      </div>

      <div className="ad-card">
        <div className="ad-stabs">
          {TABS.map((t) => (
            <Link key={t.key} href={link(t.key)} aria-current={tab === t.key ? 'true' : undefined}>{t.label} {count(t.key) != null && <small>{count(t.key)}</small>}</Link>
          ))}
        </div>

        {tab === '' && (() => {
          const rows = q ? pages.filter((p) => plainText(`${p.path} ${p.kind} ${p.override?.title ?? ''}`).includes(q)) : pages;
          return (
            <>
              <form className="ad-filters" action="/admin/seo">
                <label className="vx-sfind__search">
                  <Icon name="search" />
                  <input className="app-bare" name="q" defaultValue={sp.q} placeholder="Đường dẫn, loại trang" aria-label="Tìm trang" />
                </label>
                <button className="vx-btn vx-btn--outline vx-btn--sm">Lọc</button>
              </form>
              <div className="ad-tablewrap">
                <table className="ad-table app-mtable">
                  <thead><tr><th>Trang</th><th>Loại</th><th>Trạng thái</th><th>SEO đặt tay</th><th>Sửa lần cuối</th><th /></tr></thead>
                  <tbody>
                    {rows.map((p) => {
                      const o = p.override;
                      const tags = o ? [o.title && 'Tiêu đề', o.description && 'Mô tả', o.image && 'Ảnh', o.noindex && 'Ẩn khỏi Google', o.canonical && `Canonical → ${o.canonical}`].filter(Boolean) : [];
                      return (
                        <tr key={p.path}>
                          <td style={{ wordBreak: 'break-all' }}>
                            <a href={p.path} target="_blank" rel="noopener" style={{ color: 'inherit' }}><b>{p.path}</b></a>
                            {p.redirectTo && <small style={{ display: 'block', color: 'var(--ink-muted)' }}>Có chuyển hướng → {p.redirectTo}</small>}
                          </td>
                          <td data-label="Loại" data-m="note early">{p.kind}</td>
                          <td data-label="Trạng thái" data-m="aside">
                            <span className={`ad-pill ${p.inSitemap ? 'done' : p.status === 'Đang ẩn' ? 'wait' : 'prep'}`}>{p.inSitemap ? 'Trong sitemap' : p.status === 'Đang hiện' ? 'Ngoài sitemap' : p.status}</span>
                          </td>
                          <td data-label="SEO đặt tay">{tags.length ? tags.join(' · ') : <span style={{ color: 'var(--ink-muted)' }}>Tự tạo</span>}</td>
                          <td data-label="Sửa lần cuối">{p.lastmod ? seoDate(p.lastmod) : '—'}</td>
                          <td data-m="foot end">
                            <span style={{ display: 'inline-flex', gap: 6 }}>
                              {p.edit && <Link href={`${p.edit}#seo`} className="vx-btn vx-btn--ghost vx-btn--sm">Sửa nội dung</Link>}
                              <SeoEditButton path={p.path.split('?')[0]} live={p.status.startsWith('Đang hiện')}
                                initial={o ? { title: o.title, description: o.description, canonical: o.canonical, noindex: o.noindex, image: o.image } : null} />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!rows.length && <tr><td colSpan={6} data-wide style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)' }}>Không có trang nào khớp.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="ad-pager"><span>Trang có ?tham số (phân trang, chuyên mục) dùng chung SEO đặt tay của trang gốc cho phần “Ẩn khỏi Google”.</span></div>
            </>
          );
        })()}

        {tab === 'canh-bao' && (
          <div className="ad-tablewrap">
            <table className="ad-table app-mtable">
              <thead><tr><th>Trang</th><th>Loại</th><th>Cảnh báo</th><th /></tr></thead>
              <tbody>
                {issues.map((i, n) => (
                  <tr key={`${i.path}-${n}`}>
                    <td style={{ wordBreak: 'break-all' }}><a href={i.path} target="_blank" rel="noopener" style={{ color: 'inherit' }}><b>{i.path}</b></a></td>
                    <td data-label="Loại" data-m="note early">{i.kind}</td>
                    <td data-label="Cảnh báo"><span className={`ad-pill ${i.level === 'error' ? 'new' : 'wait'}`} style={{ marginRight: 6 }}>{i.level === 'error' ? 'Lỗi' : 'Nên sửa'}</span>{i.text}</td>
                    <td data-m="foot end">{i.edit && <Link href={i.edit} className="vx-btn vx-btn--ghost vx-btn--sm">Sửa</Link>}</td>
                  </tr>
                ))}
                {!issues.length && <tr><td colSpan={4} data-wide style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)' }}>Không có cảnh báo nào.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'nhat-ky' && <AuditLog />}
      </div>

      {tab === 'chuyen-huong' && (
        <div style={{ marginTop: 12 }}>
          <RedirectAdmin
            redirects={redirects.map((r) => ({
              fromPath: r.fromPath, toPath: r.toPath, reason: r.reason, note: r.note, hits: r.hits,
              lastHit: r.lastHitAt ? `Gần nhất ${seoTime(r.lastHitAt)}` : null, createdBy: r.createdBy, created: seoTime(r.createdAt),
            }))}
            suggest={[
              ...issues.filter((i) => i.text.startsWith('Trang đã xóa')).map((i) => ({ path: i.path, why: 'đã xóa' })),
              ...pages.filter((p) => p.status === 'Đang ẩn' && !p.redirectTo).map((p) => ({ path: p.path, why: `${p.kind.toLowerCase()} đang ẩn` })),
            ]}
          />
        </div>
      )}
    </div>
  );
}

async function AuditLog() {
  const rows = await listSeoAudit(200);
  return (
    <div className="ad-tablewrap">
      <table className="ad-table app-mtable">
        <thead><tr><th>Lúc</th><th>Trang</th><th>Thay đổi</th><th>Người làm</th></tr></thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td>{seoTime(a.createdAt)}</td>
              <td data-label="Trang" style={{ wordBreak: 'break-all' }}><b>{a.path}</b></td>
              <td data-label="Thay đổi" style={{ wordBreak: 'break-word' }}>{auditText(a.action, a.detail)}</td>
              <td data-label="Người làm" data-m="note">{a.actor}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={4} data-wide style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)' }}>Chưa có thay đổi SEO nào được ghi.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
