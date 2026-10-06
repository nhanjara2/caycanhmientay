'use client';

import { useMemo, useState } from 'react';
import { discountPct, type Product } from '@/lib/catalog';
import { EmptyState } from './Blocks';
import { ProductCard } from './ProductCard';

/** Lưới sản phẩm yêu thích: lọc Tất cả / Đang giảm giá, tim đỏ để bỏ lưu (gỡ khỏi lưới ngay khi bấm). */
export function WishlistGrid({ products }: { products: Product[] }) {
  const [items, setItems] = useState(products);
  const [tab, setTab] = useState<'all' | 'sale'>('all');
  const onSale = useMemo(() => items.filter((p) => discountPct(p.options[0]) > 0), [items]);
  const shown = tab === 'sale' ? onSale : items;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div className="gd-head">
        <h2>Sản phẩm yêu thích <small style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink-muted)' }}>({items.length})</small></h2>
        <span className="acts">
          <span className="vx-seg">
            <button type="button" className="vx-chip" aria-pressed={tab === 'all'} onClick={() => setTab('all')}>Tất cả</button>
            <button type="button" className="vx-chip" aria-pressed={tab === 'sale'} onClick={() => setTab('sale')}>Đang giảm giá{onSale.length ? ` (${onSale.length})` : ''}</button>
          </span>
        </span>
      </div>
      {shown.length > 0 ? (
        <div className="vx-grid app-grid">
          {shown.map((p) => (
            <ProductCard key={p.slug} product={p} onRemoveFromWishlist={() => setItems((cur) => cur.filter((x) => x.slug !== p.slug))} />
          ))}
        </div>
      ) : (
        <EmptyState icon="pin" title={tab === 'sale' ? 'Chưa có sản phẩm nào đang giảm giá' : 'Chưa có sản phẩm yêu thích'} text="Bấm tim ở trang chi tiết sản phẩm để lưu vào đây." />
      )}
    </div>
  );
}
