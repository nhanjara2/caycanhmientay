'use client';

import type { Product } from '@/lib/catalog';
import { useShipping } from '@/lib/shipping-client';
import { productStickers } from '@/lib/stickers';
import { Icon } from './Icon';

/** Dải sticker góc dưới trái ảnh sản phẩm. Đặt trong khung ảnh có `position: relative`. Chỉ hiện những ô còn vừa một hàng (CSS ẩn phần tràn). */
export function ProductStickers({ p, size = 'sm', real }: { p: Product; size?: 'sm' | 'lg'; real?: boolean }) {
  const { rules } = useShipping();
  const list = productStickers(p, rules, { real });
  if (!list.length) return null;
  return (
    <div className="app-stk" data-size={size} role="group" aria-label="Điểm nổi bật của sản phẩm">
      {list.map((s) => (
        <span key={s.key} className="app-stk__t" data-k={s.key} title={s.title}>
          <b>{s.icon ? <Icon name={s.icon} /> : s.big}</b>
          <i>{s.small}</i>
        </span>
      ))}
    </div>
  );
}
