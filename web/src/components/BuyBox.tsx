'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getCategory, type Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { compact, money } from '@/lib/format';
import { Icon } from './Icon';
import { WishlistHeart } from './WishlistHeart';

/** Khối mua bên phải trang chi tiết: tên → meta → giá → chọn đơn vị/số lượng → CTA → khuyến mãi → mô tả ngắn → SpecTable. */
export function BuyBox({ product: p, wishlisted = false }: { product: Product; wishlisted?: boolean }) {
  const { add } = useCart();
  const router = useRouter();
  const [opt, setOpt] = useState(0);
  const [qty, setQty] = useState(1);
  const u = p.options[opt];
  const cat = getCategory(p.category);
  const sub = cat?.subs.find((s) => s.slug === p.sub);

  return (
    <div className="vx-buy">
      <div className="vx-buy__brand">
        <span className="vx-badge vx-badge--origin">{p.origin}</span>
        <span>Thương hiệu: <a>Cây Cảnh Miền Tây</a></span>
      </div>
      <h1 className="vx-buy__title">{p.name}</h1>
      <div className="vx-buy__meta">
        <span>{p.sku}</span>·<span>{p.rating.toFixed(1)}</span>
        <span className="vx-stars">{'★'.repeat(Math.round(p.rating))}{'☆'.repeat(5 - Math.round(p.rating))}</span>·
        <a href="#danh-gia">{p.reviews} đánh giá</a>·<span>Đã bán {compact(p.sold)}</span>
      </div>
      <div className="vx-buy__price">
        <b>{money(u.price)}</b>
        <span>/ {p.unit}</span>
      </div>
      {u.oldPrice && (
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
      <div className="vx-opt">
        <span>Chọn số lượng</span>
        <span className="vx-stepper" style={{ justifySelf: 'start' }}>
          <button type="button" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button type="button" aria-label="Tăng" onClick={() => setQty((q) => q + 1)}>+</button>
        </span>
      </div>
      <div className="vx-buy__cta">
        <button
          type="button"
          className="vx-btn vx-btn--primary vx-btn--lg"
          onClick={() => {
            add(p, opt, qty);
            router.push('/gio-hang');
          }}
        >
          Chọn mua
        </button>
        <button type="button" className="vx-btn vx-btn--soft vx-btn--lg" onClick={() => add(p, opt, qty)}>
          <Icon name="cart" />
          Thêm vào giỏ
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <WishlistHeart slug={p.slug} active={wishlisted} className="vx-btn vx-btn--ghost vx-btn--sm" labels={{ on: 'Đã lưu vào yêu thích', off: 'Lưu vào yêu thích' }} />
      </div>
      <div className="vx-promo">
        <div className="vx-promo__head"><Icon name="gift" />Tặng 1 gói phân tan chậm 100g khi mua kèm đất trộn</div>
        <div className="vx-promo__row"><Icon name="chat" />Cần tư vấn? <a href="https://zalo.me" target="_blank" rel="noreferrer" className="vx-link">Chat Zalo với kỹ sư</a></div>
      </div>
      <p className="vx-lead">{p.lead}</p>
      <dl className="vx-spec-t">
        {p.specs.map(([k, v]) => (
          <SpecRow key={k} k={k} v={v} />
        ))}
        <dt>Danh mục</dt>
        <dd>
          <Link href={`/danh-muc/${p.category}/${p.sub}`} style={{ display: 'inline' }}>{sub?.name ?? cat?.name}</Link>
        </dd>
      </dl>
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
