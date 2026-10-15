import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Art, Icon } from '@/components/Icon';
import { EmptyPosts, iconOf, PostLinks, postDate } from '@/components/PostParts';
import { FACEBOOK_URL, SALES_PHONE } from '@/lib/contact';
import { CATEGORIES, categoryOf, isCategory, plainText, postPath, SECTIONS, sectionOf } from '@/lib/posts';
import { publishedPosts, type PostCard } from '@/server/posts';

type SP = { 'chuyen-muc'?: string; trang?: string };
type Props = { searchParams: Promise<SP> };

const PER_PAGE = 10;
const BASE = SECTIONS.news.path;
const NEWS = CATEGORIES.filter((c) => c.section === 'news');
const TONES = ['deep', '', 'promo'];

function filters(sp: SP) {
  const cat = isCategory(sp['chuyen-muc']) && sectionOf(sp['chuyen-muc']) === 'news' ? sp['chuyen-muc'] : undefined;
  const page = Math.max(1, Math.min(500, Number.parseInt(sp.trang ?? '1', 10) || 1));
  return { cat, page };
}

function link(q: { cat?: string; page?: number }) {
  const u = new URLSearchParams();
  if (q.cat) u.set('chuyen-muc', q.cat);
  if (q.page && q.page > 1) u.set('trang', String(q.page));
  return u.size ? `${BASE}?${u}` : BASE;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { cat, page } = filters(await searchParams);
  return {
    title: cat ? `${categoryOf(cat)?.name} · Truyền thông` : 'Truyền thông',
    description: 'Tin tức, hoạt động cộng đồng, báo chí và tuyển dụng của Cây Cảnh Miền Tây.',
    alternates: { canonical: link({ cat, page }) },
  };
}

function Img({ p, tone }: { p: PostCard; tone?: string }) {
  return (
    <span className={tone ? `nw-img ${tone}` : 'nw-img'}>
      {p.thumb ? <img src={p.thumb} alt="" loading="lazy" /> : <Art name={iconOf(p.category)} />}
    </span>
  );
}

const Tag = ({ p }: { p: PostCard }) => <span className="nw-tag">{categoryOf(p.category)?.name}</span>;

/** Truyền thông: tin công ty soạn ở /admin/noi-dung (NewsCategoryLayout). */
export default async function NewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { cat, page } = filters(sp);
  const all = (await publishedPosts()).filter((p) => sectionOf(p.category) === 'news');
  const rows = all.filter((p) => !cat || p.category === cat);
  const ordered = [...rows.filter((p) => p.featured), ...rows.filter((p) => !p.featured)];
  // Trang đầu: 1 bài lớn + 5 bài bên cạnh, còn lại xuống danh sách.
  const hero = page === 1 ? ordered.slice(0, ordered.length > 3 ? 6 : 1) : [];
  const rest = ordered.slice(hero.length);
  const pages = Math.max(1, Math.ceil(rest.length / PER_PAGE));
  // Mỗi trang một đường dẫn: ?trang=1 / abc / quá số trang → về đúng trang.
  if (sp.trang !== undefined && (page > pages || sp.trang !== (page > 1 ? String(page) : undefined))) redirect(link({ cat, page: Math.min(page, pages) }));
  const list = rest.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const popular = [...all].filter((p) => p.views > 0).sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="nw-page">
      <div className="nw-top">
        <div className="vx-crumb">
          <Link href="/">Trang chủ</Link>/{cat ? <><Link href={BASE}>Truyền thông</Link>/<span>{categoryOf(cat)?.name}</span></> : <span>Truyền thông</span>}
        </div>
        <h1>Truyền thông</h1>
        {all.length > 0 && <div className="nw-subs">
          {NEWS.map((c) => (
            <Link key={c.key} href={cat === c.key ? BASE : link({ cat: c.key })} className="nw-sub" aria-current={cat === c.key ? 'true' : undefined}>
              <span><Icon name={c.icon} /></span>
              <b>{c.name}</b>
              <small>{all.filter((p) => p.category === c.key).length} bài viết</small>
            </Link>
          ))}
        </div>}
        {hero.length > 0 && (
          <div className={hero.length > 1 ? 'nw-hero' : 'nw-hero app-hero-solo'}>
            <Link href={postPath(hero[0])} className="nw-hero__main">
              <Img p={hero[0]} tone="deep" />
              <span className="nw-row"><Tag p={hero[0]} /><span className="vx-meta">{postDate(hero[0].publishedAt)}</span></span>
              <h2>{hero[0].title}</h2>
            </Link>
            {hero.length > 1 && (
              <div className="nw-side">
                {hero.slice(1).map((p, i) => (
                  <Link key={p.id} href={postPath(p)} className="nw-sitem">
                    <Img p={p} tone={TONES[i % 3]} />
                    <span><span className="nw-row"><Tag p={p} /></span><b>{p.title}</b></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="nw-body">
        <div className="nw-list">
          {!rows.length && (
            <EmptyPosts
              text={cat ? 'Chưa có bài trong mục này' : 'Chưa có bài truyền thông nào'}
              hint={<>Tin tức, hoạt động cộng đồng và bài báo về shop sẽ đăng ở đây. Theo dõi <a href={FACEBOOK_URL} target="_blank" rel="noreferrer">Facebook của shop</a> để xem tin mới, hoặc xem <Link href="/goc-cham-cay">Góc chăm cây</Link>.</>}
            />
          )}
          {list.map((p, i) => (
            <Link key={p.id} href={postPath(p)} className="nw-card">
              <Img p={p} tone={TONES[(i + 1) % 3]} />
              <span>
                <span className="nw-row"><Tag p={p} /><span className="vx-meta">{postDate(p.publishedAt)}</span></span>
                <b>{p.title}</b>
                {p.excerpt && <p>{plainText(p.excerpt)}</p>}
              </span>
            </Link>
          ))}
          {pages > 1 && (
            <nav className="app-pager" aria-label="Trang">
              {page > 1 && <Link href={link({ cat, page: page - 1 })} className="vx-btn vx-btn--outline vx-btn--sm">‹ Bài mới hơn</Link>}
              <span>Trang {page}/{pages}</span>
              {page < pages && <Link href={link({ cat, page: page + 1 })} className="vx-btn vx-btn--outline nw-more">Xem thêm bài viết</Link>}
            </nav>
          )}
        </div>
        <aside className="nw-aside">
          <PostLinks title="Xem nhiều" posts={popular} extra={(p) => `${(p as PostCard).views.toLocaleString('vi-VN')} lượt xem`} />
          <div className="nw-box">
            <h3>Liên hệ báo chí</h3>
            <span style={{ fontSize: '0.8125rem', lineHeight: '20px' }}>
              Email: <a href="mailto:nhanjara@gmail.com" style={{ display: 'inline', padding: 0, border: 0 }}>nhanjara@gmail.com</a><br />
              Điện thoại: <a href={`tel:${SALES_PHONE}`} style={{ display: 'inline', padding: 0, border: 0 }}>{SALES_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</a>
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
