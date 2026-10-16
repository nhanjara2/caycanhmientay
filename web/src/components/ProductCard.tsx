'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { cheapestOption, discountPct, imageAlt, isQuote, QUOTE_TEXT, type Product } from '@/lib/catalog';
import { responsive } from '@/lib/images';
import { useWishlist } from '@/lib/wishlist';
import { moneyNum } from '@/lib/format';
import { seoNameOf } from '@/lib/seo-name';
import { ClockPercentIcon, VoucherCheckIcon } from './FlashIcons';
import { Art } from './Icon';
import { ProductStickers } from './ProductStickers';
import { inScope, productScopeItem } from '@/lib/voucher-scope';
import { usePublicVouchers } from '@/lib/vouchers-client';
import { WishlistHeart } from './WishlistHeart';

/** Bề rộng ước tính của "giá + đ" tính bằng em (chữ số ~0,66em, dấu chấm ~0,29em, "đ" nhỏ ~0,5em, đo trên Be Vietnam Pro) — CSS (`--w`) dùng để co cỡ giá cho vừa thẻ hẹp. */
const priceEm = (s: string) => { const d = s.replace(/\D/g, '').length; return d * 0.66 + (s.length - d) * 0.29 + 0.5; };

/** Thẻ sản phẩm ở danh sách: không chọn quy cách, không nút thêm vào giỏ (chọn + mua ở trang sản phẩm, kiểu Shopee).
 *  Giá = quy cách rẻ nhất có giá ("Từ …" khi các quy cách khác giá nhau); bấm chỗ nào trên thẻ cũng mở trang sản phẩm. */
/** Bề rộng ảnh thẻ: điện thoại 2 cột, tablet 3 cột, máy tính ~5 cột trong khung ≤ 1280px. */
const CARD_SIZES = '(max-width: 47.9375em) 50vw, (max-width: 63.9375em) 33vw, 260px';

export function ProductCard({ product: p, showFlash = false, level = 3, eager = false, onRemoveFromWishlist }: {
  product: Product; showFlash?: boolean;
  /** Thẻ ở hàng đầu của trang danh sách (thường là ảnh lớn nhất màn hình đầu) → tải ngay, không lazy. */
  eager?: boolean;
  /** Bậc tiêu đề của tên sản phẩm: 3 khi lưới nằm dưới một <h2> của khối (mặc định), 2 khi lưới nằm ngay dưới <h1> trang (danh mục, tìm kiếm). */
  level?: 2 | 3;
  /** Có thì hiện tim đỏ góc ảnh để bỏ yêu thích (trang /tai-khoan/yeu-thich) — gọi lại khi đã bỏ để ẩn thẻ khỏi lưới. */
  onRemoveFromWishlist?: () => void;
}) {
  const wish = useWishlist();
  const publics = usePublicVouchers();
  // Chỉ mã áp dụng cho sản phẩm này; shop có mã mà không mã nào áp dụng thì không hiện vé
  const vouchers = publics.filter((v) => inScope(v.scope, productScopeItem(p)));
  const showTicket = !p.noVoucher && (vouchers.length > 0 || publics.length === 0);
  const u = p.options[cheapestOption(p.options)];
  const from = p.options.some((o) => o !== u && (isQuote(o) || o.price !== u.price));
  const pct = isQuote(u) ? 0 : discountPct(u);
  const href = `/san-pham/${p.slug}`;
  // tên chi tiết (SEO), CSS cắt còn 2 dòng + "…"; rê chuột xem đủ
  const fullName = seoNameOf(p);
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <article className={p.flash ? 'vx-pcard vx-pcard--flash' : 'vx-pcard'}>
      {/* Lớp link phủ cả thẻ (chạm vào giá / thông số cũng mở trang); ảnh + tên vẫn là link riêng cho bàn phím, trình đọc màn hình */}
      <Link href={href} className="app-pcard__cover" tabIndex={-1} aria-hidden="true"><span className="app-sr">{fullName}</span></Link>
      <div className="app-pcard__mediawrap">
        <Link href={href} className="vx-pcard__media" aria-label={fullName} tabIndex={-1}>
          {p.images?.[0] ? <img {...responsive(p.images[0], CARD_SIZES, 640)} alt={imageAlt(p, 0)} width={600} height={600} loading={eager ? 'eager' : 'lazy'} /> : <Art name={p.icon} />}
        </Link>
        {/* Dải góc dưới trái: ô "Hàng mới" (nếu có) + sticker ưu đãi (ảnh thật, siêu sale, free ship…) cùng một kiểu ô */}
        <ProductStickers p={p} isNew={p.isNew} />
        {/* Có video (YouTube) → biểu tượng play góc dưới phải ảnh, kiểu Shopee; chỉ để báo hiệu, bấm vẫn mở trang sản phẩm */}
        {p.youtubeId && <span className="app-pcard__play" title="Có video" aria-label="Có video"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.6v12.8L18.6 12z" /></svg></span>}
        {/* Tim yêu thích góc trên phải khung ảnh, ngay dưới nhãn -% (cột bên phải: -% rồi tim; bên trái: xuất xứ). Trang Yêu thích: bỏ tim thì gỡ thẻ khỏi lưới. */}
        <WishlistHeart
          slug={p.slug}
          active={onRemoveFromWishlist ? true : wish.has(p.slug)}
          onChange={(active) => { if (!active) onRemoveFromWishlist?.(); }}
          className="wl-heart app-pcard__heart"
        />
      </div>
      <div className="vx-pcard__tags">
        <span className="vx-badge vx-badge--origin">{p.origin}</span>
      </div>
      <H className="vx-pcard__name">
        <Link href={href} className="app-plain" title={fullName}>{fullName}</Link>
      </H>
      <div className="app-pcard__buy">
        {/* Hàng giá gạch + nhãn "-%" nền vàng có đồng hồ báo thức (kiểu Shopee) nằm trên giá. Luôn chiếm chỗ (trống khi không giảm giá) để giá thẳng hàng giữa các thẻ */}
        <div className="app-pcard__was">
          {u.oldPrice && !isQuote(u) && <s>{moneyNum(u.oldPrice)}<span className="app-dong">đ</span></s>}
          {pct > 0 && <span className="app-pcard__off"><ClockPercentIcon />-{pct}%</span>}
        </div>
        <div className="vx-price" style={isQuote(u) ? undefined : { '--w': priceEm(moneyNum(u.price)).toFixed(2), '--from': from ? 1 : 0 } as CSSProperties}>
          {isQuote(u) ? <span className="app-quote">{QUOTE_TEXT}</span> : (
            <>
              <span className="app-pcard__amt">{from && <small>Từ </small>}{moneyNum(u.price)}<span className="app-dong">đ</span></span>
              <small className="app-pcard__unit">/ {p.unit}</small>
              {/* Giá nào cũng kèm vé voucher có dấu tích (chủ shop dặn: giá nào cũng có voucher) */}
              {showTicket && <VoucherCheckIcon title={vouchers.length ? `Đơn này dùng được mã giảm giá: ${(vouchers.find((v) => v.kind === 'discount') ?? vouchers[0]).code}` : 'Có voucher ưu đãi cho đơn này'} />}
            </>
          )}
        </div>
      </div>
      <div className="vx-spec">
        {showFlash && p.flash ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="vx-progress"><i style={{ width: `${(p.flash.sold / p.flash.total) * 100}%` }} /></span>
            <span>{p.flash.sold / p.flash.total > 0.85 ? 'Sắp hết' : `Đã bán ${p.flash.sold}/${p.flash.total}`}</span>
          </span>
        ) : (
          // "Văn phòng · Trong nhà" → mỗi cụm một nhãn viền cam chữ cam (kiểu "Cheap on Shopee")
          p.spec.split(/\s*·\s*/).filter(Boolean).map((t) => <span key={t} className="app-pcard__tag">{t}</span>)
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, showFlash, level }: { products: Product[]; showFlash?: boolean; level?: 2 | 3 }) {
  return (
    <div className="vx-grid app-grid">
      {/* level 2 = lưới là nội dung chính (danh mục, tìm kiếm) → 4 thẻ đầu không lazy-load */}
      {products.map((p, i) => <ProductCard key={p.slug} product={p} showFlash={showFlash} level={level} eager={level === 2 && i < 4} />)}
    </div>
  );
}
