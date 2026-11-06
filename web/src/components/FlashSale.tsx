'use client';

import Link from '@/components/LocaleLink';
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
const VN_OFFSET_MS = 7 * 3600_000;

/** Đồng hồ Flash sale: khung giờ đang chạy (-1 = ngoài giờ) và số giây còn lại tới hết khung / tới khung kế tiếp. */
function useFlashClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Khung giờ theo giờ Việt Nam (UTC+7, không đổi giờ mùa hè) — máy khách đặt múi giờ khác vẫn thấy đúng giờ của shop.
  const vn = now ? new Date(now.getTime() + VN_OFFSET_MS) : null;
  const hour = vn?.getUTCHours() ?? 0;
  const active = SLOTS.findIndex((s) => hour >= s.from && hour < s.to);
  const target = SLOTS[active] ?? SLOTS.find((s) => s.from > hour) ?? SLOTS[0];
  let left = 0;
  if (vn) {
    const end = new Date(vn);
    end.setUTCHours(active >= 0 ? target.to : target.from, 0, 0, 0);
    if (end <= vn) end.setUTCDate(end.getUTCDate() + 1);
    left = Math.floor((end.getTime() - vn.getTime()) / 1000);
  }
  return { hour, active, left };
}

function Countdown({ left }: { left: number }) {
  return (
    <span className="vx-count" suppressHydrationWarning>
      <b>{pad(Math.floor(left / 3600))}</b>:<b>{pad(Math.floor(left / 60) % 60)}</b>:<b>{pad(left % 60)}</b>
    </span>
  );
}

/** Dải Flash sale nằm trên khung giá trang sản phẩm (kiểu Shopee): tên chương trình + đếm ngược. Tách riêng để chỉ dải này vẽ lại mỗi giây. */
export function FlashPriceBar() {
  const { active, left } = useFlashClock();
  return (
    <div className="app-ppflash">
      <span className="app-ppflash__t"><Icon name="bolt" />Flash sale</span>
      <span className="app-ppflash__end">
        {/* Khung giá hẹp (điện thoại, tablet): nhãn rút gọn (data-short) cho cả dải vừa một hàng */}
        <span className="app-ppflash__k" data-short={active >= 0 ? 'Còn' : 'Mở sau'}><span>{active >= 0 ? 'Kết thúc sau' : 'Bắt đầu sau'}</span></span>
        <Countdown left={left} />
      </span>
    </div>
  );
}

/** Khối Flash sale: dải sun + đồng hồ đếm ngược tới hết khung giờ hiện tại. */
export function FlashSale({ products }: { products: Product[] }) {
  const { hour, active, left } = useFlashClock();

  return (
    <section className="vx-flash" id="flash-sale">
      <div className="vx-flash__bar">
        <h2 className="vx-flash__title"><Icon name="bolt" />Flash sale giờ vàng</h2>
        <span style={{ fontSize: '0.8125rem' }}>{active >= 0 ? 'Kết thúc sau' : 'Bắt đầu sau'}</span>
        <Countdown left={left} />
        <Link href="/flash-sale" style={{ marginLeft: 'auto', fontWeight: 600 }} aria-label="Xem tất cả Flash sale">Xem tất cả</Link>
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
