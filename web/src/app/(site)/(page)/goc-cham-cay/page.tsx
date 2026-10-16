import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/Blocks';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { EmptyPosts, PostMeta, PostThumb } from '@/components/PostParts';
import { CATEGORIES, CATEGORY_DESCRIPTION, categoryOf, durationLabel, isCategory, pageSuffix, plainText, postPath, SECTIONS, sectionOf, VIDEO_PAGE } from '@/lib/posts';
import { publishedPosts, type PostCard } from '@/server/posts';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';
import { responsive } from '@/lib/images';
import { Pager } from '@/components/Pager';
import { one, pageOf, redirectIfNotCanonical, type SearchParams } from '@/lib/url-params';

type Props = { searchParams: Promise<SearchParams> };

const PER_PAGE = 12;
const BASE = SECTIONS.blog.path;
const TONES = ['', 't3', 't2'];

function filters(sp: SearchParams) {
  const c = one(sp['chuyen-muc']);
  const cat = isCategory(c) && sectionOf(c) === 'blog' ? c : undefined;
  const tag = one(sp.the)?.replace(/\s+/g, ' ').trim().slice(0, 30).trim() || undefined;
  const video = one(sp.loai) === 'video';
  const page = pageOf(sp.trang);
  return { cat, tag, video, page };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { cat, tag, video, page } = filters(await searchParams);
  const name = cat ? categoryOf(cat)?.name : tag ? `#${tag}` : video ? 'Video chăm cây' : undefined;
  // SEO: trang chính + từng chuyên mục (kể cả ?trang=n) là trang chuẩn; trang thẻ chủ đề và "Video" (trùng /video) thì noindex.
  const thin = !!tag || video;
  // Chưa có bài nào (trong chuyên mục đang xem) → trang trống, noindex tới khi có bài (tránh soft 404).
  const empty = !(await publishedPosts()).some((p) => sectionOf(p.category) === 'blog' && (!cat || p.category === cat));
  const nth = cat ? pageSuffix(page) : ''; // chỉ trang chuyên mục có phân trang được index
  return withSeo(withShare({
    title: `${name ? `${name} · Góc chăm cây` : 'Góc chăm cây'}${nth}`,
    description: `${cat ? CATEGORY_DESCRIPTION[cat] : 'Kinh nghiệm chăm cây, bắt bệnh, dùng thuốc và phân bón đúng cách từ nhà vườn Cây Cảnh Miền Tây.'}${pageSuffix(cat ? page : 1, ' ')}`,
    alternates: { canonical: thin ? BASE : href({ 'chuyen-muc': cat, trang: cat && page > 1 ? page : undefined }) },
    robots: thin || empty ? { index: false, follow: true } : undefined,
  }));
}

const href = (q: Record<string, string | number | undefined>) => {
  const u = new URLSearchParams(Object.entries(q).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]));
  return u.size ? `${BASE}?${u}` : BASE;
};

function HItem({ p, tone }: { p: PostCard; tone?: string }) {
  return (
    <Link href={postPath(p)} className="vx-hitem">
      <PostThumb p={p} tone={tone} />
      <span><PostMeta p={p} /><b>{p.title}</b></span>
    </Link>
  );
}

function Feat({ p, tone }: { p: PostCard; tone?: string }) {
  return (
    <Link href={postPath(p)} className="vx-feat">
      <PostThumb p={p} tone={tone} />
      <div>
        <b>{p.title}</b>
        {p.excerpt && <p>{plainText(p.excerpt)}</p>}
        <PostMeta p={p} cat={false} />
      </div>
    </Link>
  );
}

function VCard({ p, alt }: { p: PostCard; alt?: boolean }) {
  return (
    <Link href={postPath(p)} className="vx-vcard">
      <span className={alt ? 'vx-vcard__img alt' : 'vx-vcard__img'}>
        {p.thumb && <img {...responsive(p.thumb, '(max-width: 47.9375em) 46vw, 240px', 640)} alt="" loading="lazy" className="app-vbg" />}
        <span className="tag"><Icon name="camera" size={11} />VIDEO</span>
        <span className="play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg></span>
        {p.videoSeconds ? <small>{durationLabel(p.videoSeconds)}</small> : null}
      </span>
      <p>{p.title}</p>
    </Link>
  );
}

/** Góc chăm cây: bài viết + video ngắn soạn ở /admin/noi-dung (BlogLayout). */
export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { cat, tag, video, page } = filters(sp);
  const all = (await publishedPosts()).filter((p) => sectionOf(p.category) === 'blog');
  const listing = cat || tag || video;
  // Mỗi tổ hợp một URL: chuyên mục / loại lạ, thẻ rỗng, tham số thừa, ?trang=1 / abc, trang chính có ?trang → 308 về dạng chuẩn.
  redirectIfNotCanonical(BASE, sp, [['chuyen-muc', cat], ['the', tag], ['loai', video ? 'video' : undefined], ['trang', listing && page > 1 ? page : undefined]]);

  const used = new Set(all.map((p) => p.category));
  const chips = CATEGORIES.filter((c) => c.section === 'blog' && (used.has(c.key) || c.key === cat));
  const videos = [...all.filter((p) => p.kind === 'video' && p.featured), ...all.filter((p) => p.kind === 'video' && !p.featured)];

  const tags = new Map<string, number>();
  for (const p of all) for (const t of p.tags) tags.set(t, (tags.get(t) ?? 0) + 1);
  const topTags = [...tags].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi')).slice(0, 8);
  const experts = new Map<string, { title: string; n: number }>();
  for (const p of all) {
    if (!p.reviewerName) continue;
    const e = experts.get(p.reviewerName);
    experts.set(p.reviewerName, { title: e?.title || p.reviewerTitle, n: (e?.n ?? 0) + 1 });
  }

  const heading = cat ? categoryOf(cat)!.name : tag ? `#${tag}` : video ? 'Video chăm cây' : 'Góc chăm cây';

  const top = (
    <section className="vx-blogtop">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, ...(listing ? [{ label: 'Góc chăm cây', href: BASE }, { label: heading }] : [{ label: 'Góc chăm cây' }])]} />
      <h1>{heading}</h1>
      {(chips.length > 0 || videos.length > 0) && (
        <div className="vx-row app-chiprow">
          <Link href={BASE} className="vx-chip" aria-pressed={!listing}>Tất cả</Link>
          {videos.length > 0 && <Link href={href({ loai: 'video' })} className="vx-chip" aria-pressed={video && !cat}>Video</Link>}
          {chips.map((c) => <Link key={c.key} href={href({ 'chuyen-muc': c.key })} className="vx-chip" aria-pressed={cat === c.key}>{c.name}</Link>)}
        </div>
      )}
      {!listing && <Hero posts={all} />}
    </section>
  );

  const side = (topTags.length > 0 || experts.size > 0) && (
    <div className="vx-blog__side">
      {topTags.length > 0 && (
        <aside className="vx-topics">
          <h2>Chủ đề nổi bật</h2>
          {topTags.map(([t, n]) => (
            <Link key={t} href={href({ the: t })} aria-current={t === tag ? 'true' : undefined}><b># {t}</b><small>{n} bài viết</small></Link>
          ))}
        </aside>
      )}
      {experts.size > 0 && (
        <aside className="vx-experts">
          <h2>Đội ngũ chuyên môn</h2>
          {[...experts].slice(0, 6).map(([name, e]) => (
            <div key={name} className="vx-expert-row">
              <span className="vx-avatar">{name.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase()).join('')}</span>
              <span>{e.title && <small>{e.title}</small>}<b>{name}</b><span className="sp">Kiểm duyệt {e.n} bài</span></span>
            </div>
          ))}
        </aside>
      )}
    </div>
  );

  if (!all.length) {
    return <>{top}<div className="vx-blog app-blog-solo"><div className="vx-blog__main"><EmptyPosts text="Góc chăm cây đang được biên soạn" /></div></div></>;
  }

  if (listing) {
    const rows = all.filter((p) => (!cat || p.category === cat) && (!tag || p.tags.includes(tag)) && (!video || p.kind === 'video'));
    const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const q = { 'chuyen-muc': cat, the: tag, loai: video ? 'video' : undefined };
    // Quá số trang → trang cuối (307: số trang đổi theo số bài).
    if (page > pages) redirect(href({ ...q, trang: pages > 1 ? pages : undefined }));
    const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    return (
      <>
        {top}
        <div className={side ? 'vx-blog' : 'vx-blog app-blog-solo'}>
          <div className="vx-blog__main">
            <section className="vx-cblock">
              {!shown.length ? (
                <p className="app-muted">Chưa có bài nào trong mục này. <Link href={BASE}>Xem tất cả bài</Link></p>
              ) : video && !cat && !tag ? (
                <div className="vx-vrow app-vgrid">{shown.map((p, i) => <VCard key={p.id} p={p} alt={i % 2 === 1} />)}</div>
              ) : (
                <div className="app-plist">{shown.map((p, i) => <Feat key={p.id} p={p} tone={TONES[i % 3]} />)}</div>
              )}
              {/* Thẻ chủ đề / Video là trang noindex → link phân trang nofollow */}
              <Pager page={page} pages={pages} href={(n) => href({ ...q, trang: n > 1 ? n : undefined })} nofollow={!!tag || video} />
            </section>
          </div>
          {side}
        </div>
      </>
    );
  }

  const promo = all.filter((p) => categoryOf(p.category)?.promo).slice(0, 3);
  const blocks = CATEGORIES.filter((c) => c.section === 'blog' && !('promo' in c))
    .map((c) => ({ c, posts: all.filter((p) => p.category === c.key && p.kind === 'article') }))
    .filter((x) => x.posts.length);

  return (
    <>
      {top}
      <div className={side ? 'vx-blog' : 'vx-blog app-blog-solo'}>
        <div className="vx-blog__main">
          {videos.length > 0 && (
            <section className="vx-cblock">
              <div className="vx-sect">
                <h2 style={{ fontSize: '1.125rem' }}><span className="vx-sect__mark"><Icon name="camera" /></span>Video ngắn</h2>
                <Link href={VIDEO_PAGE} className="vx-link" aria-label="Xem tất cả video ngắn">Xem tất cả <Icon name="chevron" size={14} /></Link>
              </div>
              <div className="vx-vrow">{videos.slice(0, 6).map((p, i) => <VCard key={p.id} p={p} alt={i % 2 === 1} />)}</div>
            </section>
          )}
          {blocks.map(({ c, posts }) => (
            <section key={c.key} className="vx-cblock">
              <div className="vx-cblock__head">
                <h2>{c.name}</h2>
                {posts.length > 5 && <Link href={href({ 'chuyen-muc': c.key })} className="vx-link" aria-label={`Xem tất cả bài ${c.name}`}>Xem tất cả <Icon name="chevron" size={14} /></Link>}
              </div>
              <div className={posts.length === 1 ? 'vx-cblock__top app-cblock-one' : 'vx-cblock__top'}>
                {posts.slice(0, 2).map((p, i) => <Feat key={p.id} p={p} tone={i ? undefined : 't3'} />)}
              </div>
              {posts.length > 2 && (
                <div className="vx-cblock__bot">
                  {posts.slice(2, 5).map((p) => <Link key={p.id} href={postPath(p)}><b>{p.title}</b><PostMeta p={p} cat={false} /></Link>)}
                </div>
              )}
            </section>
          ))}
          {promo.length > 0 && (
            <section className="vx-cblock">
              <div className="vx-sect">
                <h2 style={{ fontSize: '1.125rem' }}><span className="vx-sect__mark"><Icon name="gift" /></span>Tin khuyến mãi & Sự kiện</h2>
              </div>
              <div className="vx-promo-row">
                {promo.map((p) => (
                  <Link key={p.id} href={postPath(p)} className="vx-promo-card">
                    <PostThumb p={p} />
                    <PostMeta p={p} />
                    <b>{p.title}</b>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
        {side}
      </div>
    </>
  );
}

/**
 * Khối đầu trang: bài viết nổi bật (admin ghim) rồi bài viết mới nhất. Video có hàng "Video ngắn" riêng —
 * video Nổi bật chỉ đứng đầu hàng đó, trang chủ và trang /video.
 */
function Hero({ posts }: { posts: PostCard[] }) {
  const articles = posts.filter((p) => p.kind === 'article');
  const ordered = [...articles.filter((p) => p.featured), ...articles.filter((p) => !p.featured)];
  if (!ordered.length) return null;
  const [main, ...rest] = ordered;
  return (
    <div className={rest.length ? 'vx-hero' : 'vx-hero app-hero-solo'}>
      <Link href={postPath(main)} className="vx-hero__main">
        <PostThumb p={main} />
        <PostMeta p={main} />
        <h2>{main.title}</h2>
        {main.excerpt && <p>{plainText(main.excerpt)}</p>}
      </Link>
      {rest.length > 0 && <div className="vx-hero__list">{rest.slice(0, 5).map((p, i) => <HItem key={p.id} p={p} tone={TONES[(i + 1) % 3]} />)}</div>}
    </div>
  );
}
