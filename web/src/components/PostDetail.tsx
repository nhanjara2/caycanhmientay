import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { after } from 'next/server';
import { CATEGORIES, categoryOf, plainText, postPath, postState, SECTIONS, sectionOf, tableOfContents, tiktokPlayer, type PostSection } from '@/lib/posts';
import { clipText } from '@/lib/format';
import { SITE_ORIGIN } from '@/lib/site';
import { getCurrentUser } from '@/server/auth';
import { getProducts } from '@/server/catalog';
import { allDiseases } from '@/server/diseases';
import { addPostView, getPost, publishedPosts, type PostFull } from '@/server/posts';
import { PostHelpful, ShareButton } from './PostClient';
import { PostBody, PostLinks, postDate, TikTok, YouTube } from './PostParts';
import { withShare } from '@/lib/seo';
import { responsive } from '@/lib/images';

export type PostPageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ 'xem-truoc'?: string }> };

/** Bài theo slug; `?xem-truoc=1` cho nhân viên xem cả bài chưa đăng (nút Xem trước trong admin). */
async function load({ params, searchParams }: PostPageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const me = sp['xem-truoc'] === '1' ? await getCurrentUser() : null;
  const preview = me?.role === 'staff' || me?.role === 'admin';
  return { post: await getPost(slug, preview), preview };
}

/** Mô tả Google: mô tả SEO admin viết → đoạn dẫn → đoạn văn đầu bài → tiêu đề (không bao giờ rơi về mô tả chung của web). */
const describe = (p: PostFull) => clipText(
  p.seoDescription || plainText(p.excerpt) || plainText(p.body.find((b) => b.type === 'p')?.text ?? '') || p.title, 170);

export async function postMetadata(props: PostPageProps): Promise<Metadata> {
  const { post: p, preview } = await load(props);
  if (!p) return { title: 'Không tìm thấy bài viết' };
  return withShare({
    // Tiêu đề dài thì bỏ đuôi "| Cây Cảnh Miền Tây" cho Google khỏi cắt mất phần cuối tiêu đề.
    title: p.title.length > 45 ? { absolute: p.title } : p.title,
    description: describe(p) || undefined,
    alternates: { canonical: postPath(p) },
    robots: preview && postState(p) !== 'published' ? { index: false } : undefined,
  }, {
    // Ảnh bìa, không có thì ảnh của video YouTube; video TikTok chưa có ảnh bìa → ảnh mặc định.
    images: [p.thumb], alt: p.title,
    type: p.kind === 'video' ? 'video.other' : 'article',
    article: { publishedTime: p.publishedAt, modifiedTime: p.updatedAt, author: p.authorName, section: categoryOf(p.category)?.name, tags: p.tags },
  });
}

/** "Nguyễn Thu Hà" → "TH" (chữ đầu của 2 từ cuối). */
const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase() ?? '').join('');

export async function PostDetail({ section, ...props }: PostPageProps & { section: PostSection }) {
  const { post: p, preview } = await load(props);
  if (!p) notFound();
  if (sectionOf(p.category) !== section) permanentRedirect(postPath(p));
  const state = postState(p);
  if (state === 'published' && !preview) after(() => addPostView(p.id).catch(() => {}));

  const slugs = [...new Set(p.body.flatMap((b) => (b.type === 'products' ? b.slugs : [])))];
  const [found, all, diseases] = await Promise.all([getProducts(slugs), publishedPosts(), p.diseases.length ? allDiseases() : []]);
  const products = new Map(found.map((x) => [x.slug, x]));
  const others = all.filter((x) => x.id !== p.id && sectionOf(x.category) === section);
  const score = (x: (typeof others)[number]) => Number(x.category === p.category) * 2 + x.tags.filter((t) => p.tags.includes(t)).length;
  const related = [...others].sort((a, b) => score(b) - score(a)).slice(0, 4);
  const linked = diseases.filter((d) => p.diseases.includes(d.slug));
  const toc = tableOfContents(p.body);
  const cat = categoryOf(p.category);
  const sec = SECTIONS[section];
  const author = p.authorName || 'Cây Cảnh Miền Tây';
  const edited = p.updatedAt.getTime() - p.publishedAt.getTime() > 86_400_000;

  const base = SITE_ORIGIN;
  const ld = p.kind === 'video' && (p.youtubeId || p.tiktokId)
    ? {
      '@context': 'https://schema.org', '@type': 'VideoObject', name: p.title, description: describe(p) || p.title,
      thumbnailUrl: p.thumb ? (p.thumb.startsWith('/') ? base + p.thumb : p.thumb) : undefined,
      uploadDate: p.publishedAt.toISOString(), embedUrl: p.tiktokId ? tiktokPlayer(p.tiktokId) : `https://www.youtube.com/embed/${p.youtubeId}`,
      duration: p.videoSeconds ? `PT${p.videoSeconds}S` : undefined,
    }
    : {
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: describe(p) || undefined,
      image: p.thumb ? [p.thumb.startsWith('/') ? base + p.thumb : p.thumb] : undefined,
      datePublished: p.publishedAt.toISOString(), dateModified: p.updatedAt.toISOString(),
      author: { '@type': p.authorName ? 'Person' : 'Organization', name: author },
      publisher: { '@type': 'Organization', name: 'Cây Cảnh Miền Tây' },
    };

  return (
    <div className="ar-page">
      <nav className="vx-toc" aria-label={toc.length ? 'Mục lục' : 'Chuyên mục'}>
        {toc.length ? (
          <>
            <b className="app-toc-h">MỤC LỤC</b>
            {toc.map((t) => <a key={t.id} href={`#${t.id}`}>{t.text}</a>)}
          </>
        ) : (
          <>
            <b className="app-toc-h">CHUYÊN MỤC</b>
            {CATEGORIES.filter((c) => c.section === section).map((c) => (
              <Link key={c.key} href={`${sec.path}?chuyen-muc=${c.key}`} aria-current={c.key === p.category ? 'true' : undefined}>{c.name}</Link>
            ))}
          </>
        )}
      </nav>

      <article className="ar-main">
        {preview && state !== 'published' && (
          <div className="vx-note app-preview-note">
            <b>Bản xem trước</b> — bài {state === 'scheduled' ? `lên lịch đăng lúc ${p.publishedAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` : 'chưa đăng'}, khách chưa thấy.
            <Link href={`/admin/noi-dung/${p.id}`}>Quay lại sửa</Link>
          </div>
        )}
        <div className="vx-crumb">
          <Link href={sec.path}>{sec.name}</Link>/{cat ? <Link href={`${sec.path}?chuyen-muc=${cat.key}`}>{cat.name}</Link> : null}
        </div>
        <h1>{p.title}</h1>
        {p.excerpt && <p className="ar-lead">{plainText(p.excerpt)}</p>}
        <div className="ar-by">
          <span className="vx-avatar">{initials(author)}</span>
          <span>
            <b>{author}</b>
            {p.reviewerName && <>{' · Kiểm duyệt: '}<b>{p.reviewerName}</b>{p.reviewerTitle && `, ${p.reviewerTitle}`}</>}
            <small>
              {postDate(p.publishedAt)}{edited && ` · Cập nhật ${postDate(p.updatedAt)}`}
              {p.kind === 'article' && ` · ${p.readMinutes} phút đọc`}
              {p.reviewerName && <> · <span className="vx-badge vx-badge--success">Đã kiểm duyệt</span></>}
            </small>
          </span>
          <span className="acts"><ShareButton title={p.title} /></span>
        </div>

        {p.kind === 'video' && p.tiktokId ? <TikTok id={p.tiktokId} title={p.title} />
          : p.kind === 'video' && p.youtubeId
          ? <YouTube id={p.youtubeId} title={p.title} vertical={p.videoVertical} />
          : p.coverFile && <div className="ar-cover app-ar-cover"><img {...responsive(p.thumb!, '(max-width: 47.9375em) 100vw, 800px')} alt={p.title} fetchPriority="high" /></div>}

        {toc.length > 1 && (
          <details className="app-ar-toc">
            <summary>Mục lục bài viết</summary>
            {toc.map((t) => <a key={t.id} href={`#${t.id}`}>{t.text}</a>)}
          </details>
        )}

        <PostBody body={p.body} products={products} slug={p.slug} title={p.title} />

        {p.tags.length > 0 && section === 'blog' && (
          <div className="ad-tags app-ar-tags">
            {p.tags.map((t) => <Link key={t} href={`${sec.path}?the=${encodeURIComponent(t)}`} className="vx-chip">#{t}</Link>)}
          </div>
        )}
        {state === 'published' && <PostHelpful id={p.id} />}
      </article>

      <aside className="ar-side">
        {section === 'blog' ? (
          <div className="ar-cta">
            <b>Cây của bạn có dấu hiệu lạ?</b>
            <span>Tra triệu chứng trong thư viện bệnh cây, hoặc gửi ảnh để kỹ sư xem giúp.</span>
            <Link href="/benh-cay" className="vx-btn">Bắt bệnh cho cây</Link>
          </div>
        ) : (
          <div className="nw-box">
            <h3>Về {sec.name}</h3>
            {CATEGORIES.filter((c) => c.section === 'news').map((c) => (
              <Link key={c.key} href={`${sec.path}?chuyen-muc=${c.key}`}>{c.name}</Link>
            ))}
          </div>
        )}
        {linked.length > 0 && (
          <div className="nw-box">
            <h3>Bệnh nhắc tới trong bài</h3>
            {linked.map((d) => <Link key={d.slug} href={`/benh-cay/${d.slug}`}>{d.name}<small>Thư viện bệnh cây</small></Link>)}
          </div>
        )}
        <PostLinks title={section === 'blog' ? 'Bài liên quan' : 'Tin khác'} posts={related} />
      </aside>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </div>
  );
}
