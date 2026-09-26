'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/catalog';
import { Icon } from './Icon';
import { ProductGrid } from './ProductCard';

const SLOTS = [
  { from: 8, to: 12 },
  { from: 12, to: 16 },
  { from: 20, to: 22 },
];
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
const pad = (n: number) => String(n).padStart(2, '0');

/** Khối Flash sale: dải sun + đồng hồ đếm ngược tới hết khung giờ hiện tại. */
export function FlashSale({ products }: { products: Product[] }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = now?.getHours() ?? 0;
  const active = SLOTS.findIndex((s) => hour >= s.from && hour < s.to);
  const target = SLOTS[active] ?? SLOTS.find((s) => s.from > hour) ?? SLOTS[0];
  let left = 0;
  if (now) {
    const end = new Date(now);
    end.setHours(active >= 0 ? target.to : target.from, 0, 0, 0);
    if (end <= now) end.setDate(end.getDate() + 1);
    left = Math.floor((end.getTime() - now.getTime()) / 1000);
  }

  return (
    <section className="vx-flash" id="flash-sale">
      <div className="vx-flash__bar">
        <span className="vx-flash__title"><Icon name="bolt" />Flash sale giờ vàng</span>
        <span style={{ fontSize: 13 }}>{active >= 0 ? 'Kết thúc sau' : 'Bắt đầu sau'}</span>
        <span className="vx-count" suppressHydrationWarning>
          <b>{pad(Math.floor(left / 3600))}</b>:<b>{pad(Math.floor(left / 60) % 60)}</b>:<b>{pad(left % 60)}</b>
        </span>
        <Link href="/flash-sale" style={{ marginLeft: 'auto', fontWeight: 600 }}>Xem tất cả</Link>
      </div>
      <div className="vx-slots">
        {SLOTS.map((s, i) => (
          <div key={s.from} className="vx-slot" aria-current={i === active ? 'true' : undefined}>
            <b>{hh(s.from)} – {hh(s.to)}</b>
            {i === active ? 'Đang diễn ra' : hour >= s.to ? 'Đã kết thúc' : 'Sắp diễn ra'}
          </div>
        ))}
      </div>
      <div className="vx-pad">
        <ProductGrid products={products} showFlash />
      </div>
    </section>
  );
}
