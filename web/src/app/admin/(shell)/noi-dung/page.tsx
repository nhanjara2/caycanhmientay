import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, Thumb } from '@/components/Icon';
import { normalize } from '@/lib/catalog';
import { categoryOf, postPath, postState, SECTIONS, sectionOf, STATE_LABELS, type PostState } from '@/lib/posts';
import { requireAccess } from '@/server/auth';
import { listPostsAdmin } from '@/server/posts';

export const metadata: Metadata = { title: 'Bài viết & video' };

type Props = { searchParams: Promise<{ tt?: string; muc?: string; loai?: string; q?: string }> };

const TABS: { key: PostState | ''; label: string }[] = [
  { key: '', label: 'Tất cả' }, { key: 'published', label: 'Đã đăng' }, { key: 'scheduled', label: 'Lên lịch' },
  { key: 'review', label: 'Chờ duyệt' }, { key: 'draft', label: 'Nháp' },
];

const date = (d: Date | null) => (d ? d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—');

/** Bài viết & video: danh sách bài Góc chăm cây + Truyền thông, lọc theo trạng thái / mục / loại. */
export default async function AdminPostsPage({ searchParams }: Props) {
  await requireAccess('content');
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tt)?.key ?? '';
  const muc = sp.muc === 'blog' || sp.muc === 'news' ? sp.muc : '';
  const loai = sp.loai === 'video' || sp.loai === 'article' ? sp.loai : '';
  const q = sp.q?.slice(0, 60).trim() ?? '';
  const terms = normalize(q).split(/\s+/).filter(Boolean);

  const all = (await listPostsAdmin()).map((p) => ({ ...p, state: postState(p) }));
  const scoped = all.filter((p) => (!muc || sectionOf(p.category) === muc) && (!loai || p.kind === loai)
    && terms.every((t) => normalize(`${p.title} ${p.tags.join(' ')} ${p.authorName}`).includes(t)));
  const rows = scoped.filter((p) => !tab || p.state === tab);
  const count = (k: PostState | '') => scoped.filter((p) => !k || p.state === k).length;
  const link = (patch: Record<string, string>) => {
    const u = new URLSearchParams(Object.entries({ tt: tab, muc, loai, q, ...patch }).filter(([, x]) => x));
    return `/admin/noi-dung${u.size ? `?${u}` : ''}`;
  };

  return (
    <div className="ad-body">
      <div className="ad-title">
        <h1>Bài viết & video</h1>
        <span className="acts">
          <Link href={SECTIONS.blog.path} target="_blank" className="vx-btn vx-btn--outline">Xem trên web</Link>
          <Link href="/admin/noi-dung/moi?loai=video" className="vx-btn vx-btn--outline">+ Thêm video</Link>
          <Link href="/admin/noi-dung/moi" className="vx-btn vx-btn--primary">+ Viết bài</Link>
        </span>
      </div>
      <div className="ad-card">
        <div className="ad-stabs">
          {TABS.map((t) => (
            <Link key={t.key} href={link({ tt: t.key })} aria-current={tab === t.key ? 'true' : undefined}>{t.label} <small>{count(t.key)}</small></Link>
          ))}
        </div>
        <form className="ad-filters" action="/admin/noi-dung">
          {tab && <input type="hidden" name="tt" value={tab} />}
          <label className="vx-sfind__search">
            <Icon name="search" />
            <input className="app-bare" name="q" defaultValue={q} placeholder="Tiêu đề, thẻ chủ đề, tác giả" aria-label="Tìm bài" />
          </label>
          <select className="vx-input" name="muc" defaultValue={muc} aria-label="Mục">
            <option value="">Mọi mục</option>
            <option value="blog">{SECTIONS.blog.name}</option>
            <option value="news">{SECTIONS.news.name}</option>
          </select>
          <select className="vx-input" name="loai" defaultValue={loai} aria-label="Loại">
            <option value="">Bài viết & video</option>
            <option value="article">Chỉ bài viết</option>
            <option value="video">Chỉ video</option>
          </select>
          <button className="vx-btn vx-btn--outline vx-btn--sm">Lọc</button>
        </form>
        <div className="ad-tablewrap">
          <table className="ad-table app-mtable">
            <thead>
              <tr><th>Bài</th><th>Chuyên mục</th><th>Tác giả</th><th>Trạng thái</th><th className="num">Lượt xem</th><th className="num">Hữu ích</th><th>Ngày đăng</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const s = STATE_LABELS[p.state];
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/noi-dung/${p.id}`} className="ad-prod" style={{ color: 'inherit' }}>
                        <span className="ad-thumb"><Thumb src={p.thumb} icon={categoryOf(p.category)?.icon ?? 'leaf'} /></span>
                        <span>
                          <b>{p.kind === 'video' && <span className="vx-badge vx-badge--sale" style={{ marginRight: 6 }}>VIDEO</span>}{p.title}</b>
                          <small>{postPath(p)}{p.featured ? ' · ★ Nổi bật' : ''}</small>
                        </span>
                      </Link>
                    </td>
                    <td data-label="Chuyên mục">{categoryOf(p.category)?.name ?? p.category}<small style={{ display: 'block', color: 'var(--ink-muted)' }}>{SECTIONS[sectionOf(p.category)].name}</small></td>
                    <td data-label="Tác giả">{p.authorName || 'Cây Cảnh Miền Tây'}{p.reviewerName && <small style={{ display: 'block', color: 'var(--ink-muted)' }}>KD: {p.reviewerName}</small>}</td>
                    <td data-label="Trạng thái"><span className={`ad-pill ${s.pill}`}>{s.label}</span></td>
                    <td className="num" data-label="Lượt xem">{p.views.toLocaleString('vi-VN')}</td>
                    <td className="num" data-label="Hữu ích">{p.helpfulYes + p.helpfulNo ? `${p.helpfulYes}/${p.helpfulYes + p.helpfulNo}` : '—'}</td>
                    <td data-label="Ngày đăng">{date(p.publishedAt)}<small style={{ display: 'block', color: 'var(--ink-muted)' }}>Sửa {date(p.updatedAt)}</small></td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr><td colSpan={7} data-wide style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>
                  {all.length ? 'Không có bài nào khớp bộ lọc.' : <>Chưa có bài nào. <Link href="/admin/noi-dung/moi">Viết bài đầu tiên</Link> hoặc <Link href="/admin/noi-dung/moi?loai=video">thêm video</Link>.</>}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="ad-pager"><span>{rows.length} bài · Hữu ích = số người bấm “Có” / tổng người trả lời</span></div>
      </div>
    </div>
  );
}
