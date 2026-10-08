'use client';

import { useState } from 'react';
import { inSub, type Category, type Product } from '@/lib/catalog';
import { SectionHeader } from './Blocks';
import { ProductGrid } from './ProductCard';

/** Khối một nhóm hàng lớn trên trang chủ: SectionHeader + chip nhóm con + lưới ProductCard. */
export function CategoryBlock({ category: c, products }: { category: Category; products: Product[] }) {
  const subs = c.subs.filter((s) => products.some((p) => inSub(p, s.slug)));
  const [sub, setSub] = useState<string | undefined>(undefined);
  const items = products.filter((p) => !sub || inSub(p, sub)).slice(0, 8);
  if (!products.length) return null;

  return (
    <section className="vx-panel">
      <SectionHeader icon={c.icon} title={c.name} href={`/danh-muc/${c.slug}`} />
      {subs.length > 1 && (
        <div className="vx-tabs" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="vx-chip" aria-pressed={!sub} onClick={() => setSub(undefined)}>Tất cả</button>
          {subs.map((s) => (
            <button key={s.slug} type="button" className="vx-chip" aria-pressed={sub === s.slug} onClick={() => setSub(s.slug)}>
              {s.name}
            </button>
          ))}
        </div>
      )}
      <ProductGrid products={items} />
    </section>
  );
}
