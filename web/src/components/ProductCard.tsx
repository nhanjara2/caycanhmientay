'use client';

import Link from 'next/link';
import { useState } from 'react';
import { discountPct, isQuote, QUOTE_TEXT, type Product } from '@/lib/catalog';
import { ZALO_URL } from '@/lib/contact';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { money } from '@/lib/format';
import { seoNameOf } from '@/lib/seo-name';
import { Art } from './Icon';
import { WishlistHeart } from './WishlistHeart';

export function ProductCard({ product: p, showFlash = false, onRemoveFromWishlist }: {
  product: Product; showFlash?: boolean;
  /** Có thì hiện tim đỏ góc ảnh để bỏ yêu thích (trang /tai-khoan/yeu-thich) — gọi lại khi đã bỏ để ẩn thẻ khỏi lưới. */
  onRemoveFromWishlist?: () => void;
}) {
  const { add } = useCart();
  const wish = useWishlist();
  const [opt, setOpt] = useState(0);
  const u = p.options[opt];
  const pct = discountPct(u);
  const href = `/san-pham/${p.slug}`;
  // tên chi tiết (SEO), CSS cắt còn 2 dòng + "…"; rê chuột xem đủ
  const fullName = seoNameOf(p);
  // Nhãn ngắn, ít quy cách (Chậu men / Chỉ cây) → chip; nhãn dài như "Chậu 20–25cm, cao 50–70cm" hay nhiều quy cách → ô chọn rộng hết thẻ
  const chips = p.options.length <= 3 && p.options.every((o) => o.label.length <= 14);
  return (
    <article className={p.flash ? 'vx-pcard vx-pcard--flash' : 'vx-pcard'}>
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
      {chips ? (
        <div className="vx-seg app-pcard__chips">
          {p.options.map((o, i) => (
            <button key={o.label} type="button" className="vx-chip" aria-pressed={i === opt} onClick={() => setOpt(i)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : p.options.length === 1 ? (
        <div className="app-pcard__one">{u.label}</div>
      ) : (
        <label className="app-pcard__opt">
          <span className="app-pcard__optn">{p.options.length} quy cách</span>
          {/* Ô hiện đủ chữ (xuống dòng được); select thật phủ trong suốt lên trên để vẫn là ô chọn gốc của máy */}
          <span className="app-pcard__optbox">
            <span aria-hidden>{u.label}</span>
            <select value={opt} onChange={(e) => setOpt(Number(e.target.value))} aria-label={`Chọn quy cách ${p.name}`}>
              {p.options.map((o, i) => <option key={o.label} value={i}>{o.label}</option>)}
            </select>
          </span>
        </label>
      )}
      <div className="vx-price">
        {isQuote(u) ? <span className="app-quote">{QUOTE_TEXT}</span> : <>{money(u.price)} <small>/ {p.unit}</small></>}
      </div>
      <div className="vx-strike" style={u.oldPrice ? undefined : { visibility: 'hidden' }}>
        {u.oldPrice ? money(u.oldPrice) : '.'}
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
      <div className="vx-pcard__foot">
        {isQuote(u) ? (
          <a href={ZALO_URL} target="_blank" rel="noreferrer" className="vx-btn vx-btn--outline vx-btn--block">Hỏi giá qua Zalo</a>
        ) : (
          <button type="button" className="vx-btn vx-btn--primary vx-btn--block" onClick={() => add(p, opt)}>
            Thêm vào giỏ
          </button>
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
