'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { discountPct, isQuote, QUOTE_TEXT, type Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { SALES_PHONE, ZALO_URL } from '@/lib/contact';
import { compact, money } from '@/lib/format';
import { starsText } from '@/lib/reviews';
import { seoNameOf } from '@/lib/seo-name';
import { DeliverToNote } from './DeliverTo';
import { Icon, Thumb } from './Icon';
import { WishlistHeart } from './WishlistHeart';
import { Select } from './Select';

/** Khối mua bên phải trang chi tiết: tên → meta → giá → chọn đơn vị/số lượng → CTA → khuyến mãi → mô tả ngắn → SpecTable. */
export function BuyBox({ product: p, category, wishlisted = false }: {
  product: Product;
  /** Tên danh mục / nhóm con (đọc từ database ở trang). */
  /** `extra` = nhóm con phụ (sản phẩm hiện ở nhiều nhóm). */
  category: { cat: string; sub?: string; extra?: { slug: string; name: string }[] };
  wishlisted?: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [opt, setOpt] = useState(0);
  const [qty, setQty] = useState(1);
  const u = p.options[opt];
  const quote = isQuote(u);
  const pct = discountPct(u);

  // Khi nút "Mua ngay" đã cuộn khỏi màn hình (kể cả khuất sau đầu trang dính) thì hiện thanh mua dính ở đáy — mọi cỡ màn (trang sản phẩm dài ~6 màn hình).
  const ctaRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const head = document.querySelector<HTMLElement>('.app-header');
    const top = head && getComputedStyle(head).position !== 'static' ? head.offsetHeight : 0;
    const io = new IntersectionObserver(([e]) => setBar(!e.isIntersecting && e.boundingClientRect.top < top), { rootMargin: `-${top}px 0px 0px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    document.body.toggleAttribute('data-buybar', bar);
    return () => document.body.removeAttribute('data-buybar');
  }, [bar]);
  const buyNow = () => {
    add(p, opt, qty);
    router.push('/gio-hang');
  };

  return (
    <div className="vx-buy">
      <div className="vx-buy__brand">
        <span className="vx-badge vx-badge--origin">{p.origin}</span>
        <span>Thương hiệu: <a>Cây Cảnh Miền Tây</a></span>
      </div>
      <h1 className="vx-buy__title">{seoNameOf(p)}</h1>
      <div className="vx-buy__meta">
        <span>{p.sku}</span>·
        {p.reviews > 0 ? (
          <>
            <span>{p.rating.toFixed(1)}</span>
            <span className="vx-stars">{starsText(p.rating)}</span>·
            <a href="#danh-gia">{p.reviews} đánh giá</a>
          </>
        ) : <a href="#danh-gia">Chưa có đánh giá</a>}
        ·<span>Đã bán {compact(p.sold)}</span>
      </div>
      <div className="vx-buy__price">
        {quote ? <b className="app-quote">{QUOTE_TEXT}</b> : <><b>{money(u.price)}</b><span>/ {p.unit}</span></>}
      </div>
      {u.oldPrice && !quote && (
        <div className="vx-buy__old">
          <s>{money(u.oldPrice)}</s>
          <span className="vx-badge vx-badge--sale">-{money(u.oldPrice - u.price)}</span>
        </div>
      )}
      {p.options.length > 1 && (
        <div className="vx-opt">
          <span>Chọn quy cách</span>
          <span className="vx-seg" style={{ flexWrap: 'wrap' }}>
            {p.options.map((o, i) => (
              <button key={o.label} type="button" className="vx-chip" aria-pressed={i === opt} onClick={() => setOpt(i)}>
                {o.label}
              </button>
            ))}
          </span>
        </div>
      )}
      {!quote && <div className="vx-opt">
        <span>Chọn số lượng</span>
        <span className="vx-stepper" style={{ justifySelf: 'start' }}>
          <button type="button" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button type="button" aria-label="Tăng" onClick={() => setQty((q) => q + 1)}>+</button>
        </span>
      </div>}
      <DeliverToNote ship={p.ship} />
      {quote ? (
        <div className="vx-buy__cta" ref={ctaRef}>
          <a href={`tel:${SALES_PHONE}`} className="vx-btn vx-btn--primary vx-btn--lg"><Icon name="phone" />Gọi báo giá</a>
          <a href={ZALO_URL} target="_blank" rel="noreferrer" className="vx-btn vx-btn--soft vx-btn--lg"><Icon name="chat" />Hỏi giá qua Zalo</a>
        </div>
      ) : (
        <div className="vx-buy__cta" ref={ctaRef}>
          <button type="button" className="vx-btn vx-btn--primary vx-btn--lg" onClick={buyNow}>
            Mua ngay
          </button>
          <button type="button" className="vx-btn vx-btn--soft vx-btn--lg" onClick={() => add(p, opt, qty)}>
            <Icon name="cart" />
            Thêm vào giỏ
          </button>
        </div>
      )}
      {/* Thanh mua dính đáy: điện thoại = ảnh + tên + giá trên, Gọi / Thêm vào giỏ / Mua ngay dưới; máy tính = một hàng nổi giữa màn hình có chọn quy cách + số lượng */}
      <div className="app-buybar" data-show={bar || undefined} inert={!bar}>
        <div className="app-buybar__prod">
          <span className="app-buybar__img"><Thumb src={p.images?.[0]} icon={p.icon} /></span>
          <span className="app-buybar__info">
            <b className="app-buybar__name" title={seoNameOf(p)}>{p.name}</b>
            <small className="app-buybar__meta">{p.options.length > 1 ? u.label : p.unit}{!quote && qty > 1 && ` · SL ${qty}`}</small>
          </span>
          <span className="app-buybar__price">
            {quote ? <b className="app-quote">{QUOTE_TEXT}</b> : <b>{money(u.price)}</b>}
            {u.oldPrice && !quote && <span><s>{money(u.oldPrice)}</s>{pct > 0 && <em className="vx-badge vx-badge--sale">-{pct}%</em>}</span>}
          </span>
        </div>
        {p.options.length > 1 && (
          <label className="app-buybar__opt">
            <span className="app-sr">Chọn quy cách</span>
            <Select value={opt} onChange={(e) => setOpt(Number(e.target.value))}>
              {p.options.map((o, i) => <option key={o.label} value={i}>{o.label}</option>)}
            </Select>
          </label>
        )}
        {!quote && (
          <span className="vx-stepper app-buybar__qty">
            <button type="button" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button type="button" aria-label="Tăng" onClick={() => setQty((q) => q + 1)}>+</button>
          </span>
        )}
        {quote ? (
          <div className="app-buybar__acts">
            <a href={`tel:${SALES_PHONE}`} className="vx-btn vx-btn--outline vx-btn--lg app-buybar__call"><Icon name="phone" />Gọi</a>
            <a href={ZALO_URL} target="_blank" rel="noreferrer" className="vx-btn vx-btn--primary vx-btn--lg app-buybar__buy">Hỏi giá qua Zalo</a>
          </div>
        ) : (
          <div className="app-buybar__acts">
            <a href={`tel:${SALES_PHONE}`} className="vx-btn vx-btn--outline vx-btn--lg app-buybar__call"><Icon name="phone" />Gọi</a>
            <button type="button" className="vx-btn vx-btn--outline vx-btn--lg app-buybar__add" onClick={() => add(p, opt, qty)}>
              <Icon name="cart" />Thêm vào giỏ
            </button>
            <button type="button" className="vx-btn vx-btn--primary vx-btn--lg app-buybar__buy" onClick={buyNow}>
              <span>Mua ngay</span><small>{money(u.price * qty)}</small>
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <WishlistHeart slug={p.slug} active={wishlisted} className="vx-btn vx-btn--ghost vx-btn--sm" labels={{ on: 'Đã lưu vào yêu thích', off: 'Lưu vào yêu thích' }} />
      </div>
      <div className="vx-promo">
        <div className="vx-promo__head"><Icon name="gift" />Tặng 1 gói phân tan chậm 100g khi mua kèm đất trộn</div>
        <div className="vx-promo__row"><Icon name="chat" />Cần tư vấn? <a href={ZALO_URL} target="_blank" rel="noreferrer" className="vx-link">Chat Zalo với kỹ sư</a></div>
      </div>
      <MoreInfo>
      <p className="vx-lead">{p.lead}</p>
      <dl className="vx-spec-t">
        {p.specs.map(([k, v]) => (
          <SpecRow key={k} k={k} v={v} />
        ))}
        <dt>Danh mục</dt>
        <dd>
          <Link href={`/danh-muc/${p.category}/${p.sub}`} style={{ display: 'inline' }}>{category.sub ?? category.cat}</Link>
          {category.extra?.map((s) => (
            <span key={s.slug}>, <Link href={`/danh-muc/${p.category}/${s.slug}`} style={{ display: 'inline' }}>{s.name}</Link></span>
          ))}
        </dd>
      </dl>
      </MoreInfo>
    </div>
  );
}

/** Mô tả + bảng thông số dài (cây có 15–17 thông số) thì thu gọn, nút "Xem tất cả thông tin" mở ra. */
function MoreInfo({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    // Thu gọn còn 18rem (điện thoại 24rem); chỉ thu khi dài hơn hẳn (> 30rem) để không giấu đi vài dòng lẻ
    const check = () => setLong(el.offsetHeight > 30 * parseFloat(getComputedStyle(document.documentElement).fontSize));
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const toggle = () => {
    setOpen((o) => !o);
    // Thu gọn khi đã cuộn xuống dưới: đưa đầu khối về lại màn hình, khỏi bị hụt mất chỗ đang đọc
    const el = box.current;
    if (open && el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  };
  return (
    <div className="app-more" ref={box} data-long={long || undefined} data-open={open || undefined}>
      <div className="app-more__body" id="thong-tin-sp" onFocusCapture={() => long && setOpen(true)}>
        <div ref={inner}>{children}</div>
      </div>
      {long && (
        <button type="button" className="app-more__btn" aria-expanded={open} aria-controls="thong-tin-sp" onClick={toggle}>
          <Icon name="chevron" />{open ? 'Thu gọn' : 'Xem tất cả thông tin'}
        </button>
      )}
    </div>
  );
}

function SpecRow({ k, v }: { k: string; v: string }) {
  const warn = k === 'An toàn thú cưng' && v.startsWith('Không');
  return (
    <>
      <dt>{k}</dt>
      <dd className={warn ? 'warn' : undefined}>{v}</dd>
    </>
  );
}
