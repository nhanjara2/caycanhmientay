'use client';

import { useTranslations } from 'next-intl';
import type { Product } from '@/lib/catalog';
import { useShipping } from '@/lib/shipping-client';
import { CARD_STICKERS, DETAIL_STICKERS, productStickers } from '@/lib/stickers';
import { useStickerDay } from '@/lib/stickers-client';
import { usePublicVouchers } from '@/lib/vouchers-client';

/** Dải sticker góc dưới trái ảnh sản phẩm. Đặt trong khung ảnh có `position: relative`. Thẻ sản phẩm (cỡ nhỏ) đúng 2 ô; ảnh lớn trang chi tiết tối đa 4 ô. */
export function ProductStickers({ p, size = 'sm', real, isNew }: { p: Product; size?: 'sm' | 'lg'; real?: boolean; /** Thẻ sản phẩm hàng mới: thêm ô "HÀNG MỚI" ở đầu dải (ngoài số ô giới hạn). */ isNew?: boolean }) {
  const t = useTranslations('stk');
  const { rules } = useShipping();
  const vouchers = usePublicVouchers();
  const day = useStickerDay();
  const list = productStickers(p, { rules, vouchers, day }, { real, limit: size === 'sm' ? CARD_STICKERS : DETAIL_STICKERS });
  if (!list.length && !isNew) return null;
  return (
    <div className="app-stk" data-size={size} role="group" aria-label={t('aria')}>
      {isNew && <span className="app-stk__t" data-k="new" title={t('newTitle')}><i>{t('new1')}</i><b>{t('new2')}</b></span>}
      {list.map((s) => (
        <span key={s.key} className="app-stk__t" data-k={s.key} title={s.title}>
          <i>{s.small}</i>
          <b>{s.big}</b>
        </span>
      ))}
    </div>
  );
}
