import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Product } from '@/lib/catalog';
import { diseaseImageUrl, type Disease } from '@/lib/diseases';
import { postPath } from '@/lib/posts';
import type { PostCard } from '@/server/posts';
import { Art, Icon, type IconName } from '../Icon';
import { PostMeta, PostThumb } from '../PostParts';

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
      {href && <Link href={href} className="hm-head__more">{more}<Icon name="chevron" size={16} /></Link>}
    </div>
  );
}

/** Lối tắt dưới khung đầu trang (thẻ trắng nổi lên nền ảnh). */
export function QuickLinks({ items }: { items: { label: string; sub: string; icon: IconName; href: string }[] }) {
  return (
    <nav className="hm-quick" aria-label="Lối tắt">
      {items.map((q) => (
        <Link key={q.label} href={q.href} className="hm-quick__item app-plain">
          <span className="hm-quick__ic"><Icon name={q.icon} /></span>
          <span><b>{q.label}</b><small>{q.sub}</small></span>
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
            {m.image ? <img src={m.image} alt="" loading="lazy" /> : <span className="hm-tile__art"><Art name={m.icon} /></span>}
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
          <img src={p.images![0]} alt={p.name} loading="lazy" />
          <span className="hm-wall__cap">{p.name}</span>
        </Link>
      ))}
    </div>
  );
}

/** Bệnh cây theo mùa: khung giới thiệu mùa + thẻ bệnh có ảnh triệu chứng. */
export function SeasonDiseases({ season, intro, diseases }: { season: string; intro: string; diseases: Disease[] }) {
  return (
    <div className="hm-season">
      <div className="hm-season__intro">
        <span className="hm-season__tag"><Icon name="rain" />{season}</span>
        <p>{intro}</p>
        <Link href="/benh-cay" className="vx-btn hm-btn-light">Bắt bệnh cho cây</Link>
        <Link href="/danh-muc/thuoc-bvtv" className="hm-season__link">Thuốc BVTV giá sỉ<Icon name="chevron" size={16} /></Link>
      </div>
      <div className="hm-season__cards">
        {diseases.map((d) => {
          const img = d.symptoms.find((s) => s.image)?.image;
          return (
            <Link key={d.slug} href={`/benh-cay/${d.slug}`} className="hm-dcard app-plain">
              <span className="hm-dcard__img">{img ? <img src={diseaseImageUrl(img)} alt="" loading="lazy" /> : <Art name="bug" />}</span>
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
