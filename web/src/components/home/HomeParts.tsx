import Link from 'next/link';
import type { ReactNode } from 'react';
import { imageAlt, type Product } from '@/lib/catalog';
import { diseaseImageUrl, type Disease } from '@/lib/diseases';
import { categoryOf, postPath } from '@/lib/posts';
import type { PostCard } from '@/server/posts';
import { Art, Icon, type IconName } from '../Icon';
import { PostMeta, PostThumb } from '../PostParts';
import { responsive, thumbUrl } from '@/lib/images';

// Khối trình bày của trang chủ (/) — CSS lớp `hm-*` trong styles/home.css.

/** Tiêu đề khối: chữ lớn + dòng phụ + link "Xem tất cả". */
export function HomeHead({ icon, title, sub, href, more = 'Xem tất cả', light }: {
  icon: IconName; title: ReactNode; sub?: ReactNode; href?: string; more?: string; light?: boolean;
}) {
  return (
    <div className={light ? 'hm-head hm-head--light' : 'hm-head'}>
      <span className="hm-head__mark"><Icon name={icon} /></span>
      <div className="hm-head__t">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {/* "Xem tất cả" chung chung → aria-label ghi rõ đích (chữ link cho Google + trình đọc màn hình) */}
      {href && <Link href={href} className="hm-head__more" aria-label={typeof title === 'string' ? `${more} ${title}` : undefined}>{more}<Icon name="chevron" size={16} /></Link>}
    </div>
  );
}

/** Lối tắt dưới khung đầu trang (thẻ trắng nổi lên nền ảnh). */
export function QuickLinks({ items }: { items: { label: string; icon: IconName; href: string }[] }) {
  return (
    <nav className="hm-quick" aria-label="Lối tắt">
      {items.map((q) => (
        <Link key={q.label} href={q.href} className="hm-quick__item app-plain">
          <span className="hm-quick__ic"><Icon name={q.icon} /></span>
          <span><b>{q.label}</b></span>
        </Link>
      ))}
    </nav>
  );
}

export type MosaicItem = { key: string; name: string; href: string; count: number; icon: IconName; image?: string };

/** Danh mục bằng ảnh: hàng ô nhỏ — ảnh vuông (ảnh sản phẩm bán chạy của nhóm đó) + tên, số sản phẩm bên dưới.
 *  Tối đa 9 ô; máy tính + tablet 6 ô một hàng (`--hm-cols` trong home.css), điện thoại một hàng vuốt ngang. */
export function CategoryMosaic({ items }: { items: MosaicItem[] }) {
  return (
    <div className="hm-mosaic">
      {items.map((m) => (
        <Link key={m.key} href={m.href} className="hm-tile app-plain">
          <span className="hm-tile__img">
            {m.image ? <img src={thumbUrl(m.image, 320)} alt="" width={320} height={320} loading="lazy" /> : <span className="hm-tile__art"><Art name={m.icon} /></span>}
          </span>
          <span className="hm-tile__txt">
            <b>{m.name}</b>
            <small>{m.count} sản phẩm</small>
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Lưới ảnh "Từ vườn": ảnh thật của sản phẩm, 1 ô lớn + 8 ô nhỏ; bấm vào ảnh mở sản phẩm. */
export function PhotoWall({ products }: { products: Product[] }) {
  return (
    <div className="hm-wall">
      {products.map((p) => (
        <Link key={p.slug} href={`/san-pham/${p.slug}`} className="hm-wall__item app-plain">
          <img {...responsive(p.images![0], '(max-width: 47.9375em) 33vw, 400px', 960)} alt={imageAlt(p, 0)} loading="lazy" />
          <span className="hm-wall__cap">{p.name}</span>
        </Link>
      ))}
    </div>
  );
}

/** Bệnh cây theo mùa: khung giới thiệu mùa + thẻ bệnh có ảnh triệu chứng. */
export function SeasonDiseases({ season, diseases }: { season: string; diseases: Disease[] }) {
  return (
    <div className="hm-season">
      <div className="hm-season__intro">
        <span className="hm-season__tag"><Icon name="rain" />{season}</span>
        <Link href="/benh-cay" className="vx-btn hm-btn-light">Bắt bệnh cho cây</Link>
        <Link href="/goc-cham-cay?chuyen-muc=thuoc-phan-bon" className="hm-season__link">Chọn thuốc &amp; phân bón<Icon name="chevron" size={16} /></Link>
      </div>
      <div className="hm-season__cards">
        {diseases.map((d) => {
          const img = d.symptoms.find((s) => s.image)?.image;
          return (
            <Link key={d.slug} href={`/benh-cay/${d.slug}`} className="hm-dcard app-plain">
              <span className="hm-dcard__img">{img ? <img {...responsive(diseaseImageUrl(img, d.slug), '(max-width: 47.9375em) 44vw, 260px', 640)} alt="" loading="lazy" /> : <Art name="bug" />}</span>
              <span className="hm-dcard__b">
                <b>{d.name}</b>
                <small>{d.summary}</small>
                <span className="hm-dcard__more">Cách xử lý<Icon name="chevron" size={14} /></span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Tin sự kiện / khuyến mãi: bài lớn bên trái + danh sách bên phải (kiểu báo). */
export function NewsBoard({ posts }: { posts: PostCard[] }) {
  const [lead, ...rest] = posts;
  return (
    <div className={rest.length ? 'hm-news' : 'hm-news hm-news--one'}>
      <Link href={postPath(lead)} className="hm-news__lead app-plain">
        <PostThumb p={lead} className="hm-news__img" />
        <PostMeta p={lead} />
        <b>{lead.title}</b>
        {lead.excerpt && <span className="hm-news__ex">{lead.excerpt}</span>}
      </Link>
      {rest.length > 0 && (
        <ul className="hm-news__list">
          {rest.map((p) => (
            <li key={p.id}>
              <Link href={postPath(p)} className="hm-news__row app-plain">
                <PostThumb p={p} className="hm-news__thumb" />
                <span><PostMeta p={p} /><b>{p.title}</b></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Thẻ bài Góc chăm cây. */
export function PostCards({ posts }: { posts: PostCard[] }) {
  return (
    <div className="hm-posts">
      {posts.map((p) => (
        <Link key={p.id} href={postPath(p)} className="hm-post app-plain">
          <PostThumb p={p} className="hm-post__img" />
          <PostMeta p={p} />
          <b>{p.title}</b>
        </Link>
      ))}
    </div>
  );
}

/** Góc chăm cây kiểu Long Châu: chip chuyên mục, 1 bài lớn trái + danh sách bài ảnh nhỏ phải. */
export function CareBoard({ posts, chips }: { posts: PostCard[]; chips: { label: string; href: string }[] }) {
  const [main, ...rest] = posts;
  if (!main) return null;
  return (
    <div className="hm-care">
      {chips.length > 0 && (
        <nav className="hm-care__chips" aria-label="Chuyên mục Góc chăm cây">
          {chips.map((c) => <Link key={c.href} href={c.href} className="hm-care__chip app-plain">{c.label}</Link>)}
        </nav>
      )}
      <div className="hm-care__grid">
        <Link href={postPath(main)} className="hm-care__main app-plain">
          <PostThumb p={main} className="hm-care__img" />
          <span className="hm-care__tag">{categoryOf(main.category)?.name}</span>
          <b>{main.title}</b>
        </Link>
        <ul className="hm-care__list">
          {rest.map((p) => (
            <li key={p.id}>
              <Link href={postPath(p)} className="hm-care__item app-plain">
                <PostThumb p={p} className="hm-care__thumb" />
                <span>
                  <span className="hm-care__tag">{categoryOf(p.category)?.name}</span>
                  <b>{p.title}</b>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Cam kết cuối trang. */
export function TrustRow({ items }: { items: { icon: IconName; b: string; text: string }[] }) {
  return (
    <ul className="hm-trust">
      {items.map((t) => (
        <li key={t.b}>
          <span className="hm-trust__ic"><Icon name={t.icon} /></span>
          <span><b>{t.b}</b><small>{t.text}</small></span>
        </li>
      ))}
    </ul>
  );
}
