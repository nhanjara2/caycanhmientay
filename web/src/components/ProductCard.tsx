'use client';

import Link from 'next/link';
import { cheapestOption, discountPct, isQuote, QUOTE_TEXT, type Product } from '@/lib/catalog';
import { useWishlist } from '@/lib/wishlist';
import { money } from '@/lib/format';
import { seoNameOf } from '@/lib/seo-name';
import { Art } from './Icon';
import { WishlistHeart } from './WishlistHeart';

/** Thẻ sản phẩm ở danh sách: không chọn quy cách, không nút thêm vào giỏ (chọn + mua ở trang sản phẩm, kiểu Shopee).
 *  Giá = quy cách rẻ nhất có giá ("Từ …" khi các quy cách khác giá nhau); bấm chỗ nào trên thẻ cũng mở trang sản phẩm. */
export function ProductCard({ product: p, showFlash = false, onRemoveFromWishlist }: {
  product: Product; showFlash?: boolean;
  /** Có thì hiện tim đỏ góc ảnh để bỏ yêu thích (trang /tai-khoan/yeu-thich) — gọi lại khi đã bỏ để ẩn thẻ khỏi lưới. */
  onRemoveFromWishlist?: () => void;
}) {
  const wish = useWishlist();
  const u = p.options[cheapestOption(p.options)];
  const from = p.options.some((o) => o !== u && (isQuote(o) || o.price !== u.price));
  const pct = isQuote(u) ? 0 : discountPct(u);
  const href = `/san-pham/${p.slug}`;
  // tên chi tiết (SEO), CSS cắt còn 2 dòng + "…"; rê chuột xem đủ
  const fullName = seoNameOf(p);
  return (
    <article className={p.flash ? 'vx-pcard vx-pcard--flash' : 'vx-pcard'}>
      {/* Lớp link phủ cả thẻ (chạm vào giá / thông số cũng mở trang); ảnh + tên vẫn là link riêng cho bàn phím, trình đọc màn hình */}
      <Link href={href} className="app-pcard__cover" tabIndex={-1} aria-hidden="true" />
      <div className="app-pcard__mediawrap">
        <Link href={href} className="vx-pcard__media" aria-label={fullName}>
          {p.images?.[0] ? <img src={p.images[0]} alt={fullName} loading="lazy" /> : <Art name={p.icon} />}
          {p.isNew && <span className="app-pcard__new">Mới</span>}
        </Link>
        {/* Tim yêu thích góc dưới phải khung ảnh (trên trái là xuất xứ, trên phải -%, dưới trái nhãn Mới). Trang Yêu thích: bỏ tim thì gỡ thẻ khỏi lưới. */}
        <WishlistHeart
          slug={p.slug}
          active={onRemoveFromWishlist ? true : wish.has(p.slug)}
          onChange={(active) => { if (!active) onRemoveFromWishlist?.(); }}
          className="wl-heart app-pcard__heart"
        />
      </div>
      <div className="vx-pcard__tags">
        <span className="vx-badge vx-badge--origin">{p.origin}</span>
        {pct > 0 ? <span className="vx-badge vx-badge--sale">-{pct}%</span> : <span />}
      </div>
      <h3 className="vx-pcard__name">
        <Link href={href} className="app-plain" title={fullName}>{fullName}</Link>
      </h3>
      <div className="vx-price">
        {isQuote(u) ? <span className="app-quote">{QUOTE_TEXT}</span> : <>{from && <small>Từ </small>}{money(u.price)} <small>/ {p.unit}</small></>}
      </div>
      <div className="vx-strike" style={u.oldPrice && !isQuote(u) ? undefined : { visibility: 'hidden' }}>
        {u.oldPrice && !isQuote(u) ? money(u.oldPrice) : '.'}
      </div>
      <div className="vx-spec">
        {showFlash && p.flash ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="vx-progress"><i style={{ width: `${(p.flash.sold / p.flash.total) * 100}%` }} /></span>
            <span>{p.flash.sold / p.flash.total > 0.85 ? 'Sắp hết' : `Đã bán ${p.flash.sold}/${p.flash.total}`}</span>
          </span>
        ) : (
          p.spec
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, showFlash }: { products: Product[]; showFlash?: boolean }) {
  return (
    <div className="vx-grid app-grid">
      {products.map((p) => <ProductCard key={p.slug} product={p} showFlash={showFlash} />)}
    </div>
  );
}
