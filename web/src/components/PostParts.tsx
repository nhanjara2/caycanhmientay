import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import type { Product } from '@/lib/catalog';
import {
  categoryOf, durationLabel, parseInline, postImageUrl, postPath, tableOfContents, youtubeEmbed, type PostBlock,
} from '@/lib/posts';
import { Art, Icon, type IconName } from './Icon';
import { ArticleProducts } from './PostClient';

export const postDate = (d: Date) => d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });

type CardLike = { slug: string; category: string; kind: string; title: string; thumb: string | null; readMinutes: number; videoSeconds: number | null; publishedAt: Date };

export const iconOf = (category: string): IconName => categoryOf(category)?.icon ?? 'leaf';

/** Ảnh thẻ bài: ảnh bìa / ảnh video, chưa có thì hình minh họa theo chuyên mục. */
export function PostThumb({ p, className = 'vx-thumbimg', tone }: { p: Pick<CardLike, 'thumb' | 'category' | 'title'>; className?: string; tone?: string }) {
  return (
    <span className={tone ? `${className} ${tone}` : className}>
      {p.thumb ? <img src={p.thumb} alt="" loading="lazy" /> : <Art name={iconOf(p.category)} />}
    </span>
  );
}

/** "Chăm sóc cây · 22/09/2026 · 6 phút đọc" */
export function PostMeta({ p, cat = true }: { p: CardLike; cat?: boolean }) {
  return (
    <span className="vx-meta">
      {cat && <><span className="cat">{categoryOf(p.category)?.name}</span>·</>}
      <span>{postDate(p.publishedAt)}</span>·
      <span>{p.kind === 'video' ? (durationLabel(p.videoSeconds) || 'Video') : `${p.readMinutes} phút đọc`}</span>
    </span>
  );
}

/** Chữ trong đoạn văn: **đậm**, [chữ](link); xuống dòng giữ nguyên. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((x, i) => {
        const v = x.v.split('\n').map((line, j) => <Fragment key={j}>{j > 0 && <br />}{line}</Fragment>);
        if (x.t === 'b') return <b key={i}>{v}</b>;
        if (x.t === 'a') {
          return x.href.startsWith('/')
            ? <Link key={i} href={x.href}>{v}</Link>
            : <a key={i} href={x.href} target="_blank" rel="noopener noreferrer nofollow">{v}</a>;
        }
        return <Fragment key={i}>{v}</Fragment>;
      })}
    </>
  );
}

export function YouTube({ id, title, vertical }: { id: string; title: string; vertical?: boolean }) {
  return (
    <div className={vertical ? 'app-yt app-yt--v' : 'app-yt'}>
      <iframe src={youtubeEmbed(id)} title={title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" />
    </div>
  );
}

const NOTE_ICON = <svg className="vx-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></svg>;

/** Nội dung bài. `products`: sản phẩm đang bán, theo slug (ẩn/ngừng bán thì tự bỏ khỏi khối). */
export function PostBody({ body, products }: { body: PostBlock[]; products: Map<string, Product> }) {
  const ids = new Map(tableOfContents(body).map((t) => [t.index, t.id]));
  const out: ReactNode[] = body.map((b, i) => {
    switch (b.type) {
      case 'h2': return <h2 key={i} id={ids.get(i)}>{b.text}</h2>;
      case 'h3': return <h3 key={i}>{b.text}</h3>;
      case 'p': return b.text.split(/\n{2,}/).map((para, j) => <p key={`${i}-${j}`}><Rich text={para} /></p>);
      case 'list': {
        const L = b.ordered ? 'ol' : 'ul';
        return <L key={i}>{b.items.map((x, j) => <li key={j}><Rich text={x} /></li>)}</L>;
      }
      case 'image':
        return (
          <figure key={i} className="ar-fig">
            <img src={postImageUrl(b.file)} alt={b.caption} loading="lazy" />
            {b.caption && <figcaption>{b.caption}</figcaption>}
          </figure>
        );
      case 'video':
        return (
          <figure key={i} className="ar-fig">
            <YouTube id={b.youtubeId} title={b.caption || 'Video'} />
            {b.caption && <figcaption>{b.caption}</figcaption>}
          </figure>
        );
      case 'table': {
        const [head, ...rows] = b.rows;
        return (
          <div key={i} className="ar-table">
            <table>
              <thead><tr>{head.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
              <tbody>{rows.map((r, x) => <tr key={x}>{r.map((c, j) => <td key={j}><Rich text={c} /></td>)}</tr>)}</tbody>
            </table>
          </div>
        );
      }
      case 'note':
        return <div key={i} className="vx-note">{NOTE_ICON}<div><b>{b.title}:</b> <Rich text={b.text} /></div></div>;
      case 'products': {
        const list = b.slugs.map((s) => products.get(s)).filter((p) => p !== undefined);
        return list.length ? <ArticleProducts key={i} title={b.title} products={list} /> : null;
      }
    }
  });
  return <>{out}</>;
}

/** Danh sách bài dạng chữ (cột phải): tiêu đề + chuyên mục. */
export function PostLinks({ title, posts, extra }: { title: string; posts: { slug: string; category: string; title: string }[]; extra?: (p: { slug: string; category: string; title: string }) => ReactNode }) {
  if (!posts.length) return null;
  return (
    <div className="nw-box">
      <h3>{title}</h3>
      {posts.map((p) => (
        <Link key={p.slug} href={postPath(p)}>{p.title}<small>{extra ? extra(p) : categoryOf(p.category)?.name}</small></Link>
      ))}
    </div>
  );
}

export function EmptyPosts({ text }: { text: string }) {
  return (
    <div className="vx-cblock app-empty-posts">
      <Icon name="leaf" size={32} />
      <b>{text}</b>
      <span>Quay lại sau nhé — hoặc xem <Link href="/benh-cay">thư viện bệnh cây</Link>.</span>
    </div>
  );
}
