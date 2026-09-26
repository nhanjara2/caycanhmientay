'use client';

import Link from 'next/link';
import { useState } from 'react';
import { discountPct, type Product } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { Art } from './Icon';

export function ProductCard({ product: p, showFlash = false }: { product: Product; showFlash?: boolean }) {
  const { add } = useCart();
  const [opt, setOpt] = useState(0);
  const u = p.options[opt];
  const pct = discountPct(u);
  const href = `/san-pham/${p.slug}`;
  return (
    <article className={p.flash ? 'vx-pcard vx-pcard--flash' : 'vx-pcard'}>
      <Link href={href} className="vx-pcard__media" aria-label={p.name}>
        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : <Art name={p.icon} />}
        {p.isNew && <span className="app-pcard__new">Mới</span>}
      </Link>
      <div className="vx-pcard__tags">
        <span className="vx-badge vx-badge--origin">{p.origin}</span>
        {pct > 0 ? <span className="vx-badge vx-badge--sale">-{pct}%</span> : <span />}
      </div>
      <h3 className="vx-pcard__name">
        <Link href={href} className="app-plain">{p.name}</Link>
      </h3>
      <div className="vx-seg">
        {p.options.map((o, i) => (
          <button key={o.label} type="button" className="vx-chip" aria-pressed={i === opt} onClick={() => setOpt(i)}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="vx-price">
        {money(u.price)} <small>/ {p.unit}</small>
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
        <button type="button" className="vx-btn vx-btn--primary vx-btn--block" onClick={() => add(p, opt)}>
          Chọn mua
        </button>
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
