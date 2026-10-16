import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/Blocks';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { one, pageOf, redirectIfNotCanonical, type SearchParams } from '@/lib/url-params';
import { Pager } from '@/components/Pager';
import { Art, Icon } from '@/components/Icon';
import { EmptyPosts, iconOf, PostLinks, postDate } from '@/components/PostParts';
import { FACEBOOK_URL, SALES_PHONE } from '@/lib/contact';
import { CATEGORIES, CATEGORY_DESCRIPTION, categoryOf, isCategory, pageSuffix, plainText, postPath, SECTIONS, sectionOf } from '@/lib/posts';
import { publishedPosts, type PostCard } from '@/server/posts';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';
import { responsive } from '@/lib/images';
import { listingRobots } from '@/lib/seo-rules';

type Props = { searchParams: Promise<SearchParams> };

const PER_PAGE = 10;
const BASE = SECTIONS.news.path;
const NEWS = CATEGORIES.filter((c) => c.section === 'news');
const TONES = ['deep', '', 'promo'];

function filters(sp: SearchParams) {
  const c = one(sp['chuyen-muc']);
  const cat = isCategory(c) && sectionOf(c) === 'news' ? c : undefined;
  return { cat, page: pageOf(sp.trang) };
}

/** Trang 1 có khối bài lớn (1 bài, hoặc 6 bài khi có trên 3 bài); trang 2 trở đi chỉ là danh sách các bài CÒN LẠI —
 *  số bài khối lớn không phụ thuộc trang đang xem, nên không bài nào bị lặp hay bỏ sót giữa các trang. */
const heroCount = (n: number) => Math.min(n, n > 3 ? 6 : 1);

function link(q: { cat?: string; page?: number }) {
  const u = new URLSearchParams();
  if (q.cat) u.set('chuyen-muc', q.cat);
  if (q.page && q.page > 1) u.set('trang', String(q.page));
  return u.size ? `${BASE}?${u}` : BASE;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { cat, page } = filters(await searchParams);
  // Chưa có bài nào (trong chuyên mục đang xem) → trang trống, noindex tới khi có bài (tránh soft 404).
  const empty = !(await publishedPosts()).some((p) => sectionOf(p.category) === 'news' && (!cat || p.category === cat));
  return withSeo(withShare({
    title: `${cat ? `${categoryOf(cat)?.name} · Truyền thông` : 'Truyền thông'}${pageSuffix(page)}`,
    description: `${cat ? CATEGORY_DESCRIPTION[cat] : 'Tin tức, hoạt động cộng đồng, báo chí và tuyển dụng của Cây Cảnh Miền Tây – nhà vườn cây cảnh tại Làng hoa Sa Đéc.'}${pageSuffix(page, ' ')}`,
    alternates: { canonical: link({ cat, page }) },
    robots: listingRobots(empty),
  }));
}

function Img({ p, tone }: { p: PostCard; tone?: string }) {
  return (
    <span className={tone ? `nw-img ${tone}` : 'nw-img'}>
      {p.thumb ? <img {...responsive(p.thumb, '(max-width: 47.9375em) 40vw, 480px', 960)} alt="" loading="lazy" /> : <Art name={iconOf(p.category)} />}
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
  // Mỗi tổ hợp một URL: chuyên mục lạ, tham số thừa, ?trang=1 / abc → 308 về dạng chuẩn.
  redirectIfNotCanonical(BASE, sp, [['chuyen-muc', cat], ['trang', page > 1 ? page : undefined]]);
  // Trang đầu: 1 bài lớn + 5 bài bên cạnh, còn lại xuống danh sách.
  const heroN = heroCount(ordered.length);
  const hero = page === 1 ? ordered.slice(0, heroN) : [];
  const rest = ordered.slice(heroN);
  const pages = Math.max(1, Math.ceil(rest.length / PER_PAGE));
  // Quá số trang → trang cuối (307: số trang đổi theo số bài).
  if (page > pages) redirect(link({ cat, page: pages }));
  const list = rest.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const popular = [...all].filter((p) => p.views > 0).sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="nw-page">
      <div className="nw-top">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, ...(cat ? [{ label: 'Truyền thông', href: BASE }, { label: categoryOf(cat)?.name ?? '' }] : [{ label: 'Truyền thông' }])]} />
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
          <Pager page={page} pages={pages} href={(n) => link({ cat, page: n })} />
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
