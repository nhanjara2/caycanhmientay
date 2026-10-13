'use client';

import { useEffect, useState } from 'react';
import { stickerDayAction } from '@/app/actions/stickers';
import type { ActiveStickerDay } from './sticker-days';

// Ngày đặc biệt hôm nay tải một lần mỗi lần mở trang (mọi thẻ sản phẩm dùng chung).
let cache: Promise<ActiveStickerDay | null> | null = null;

export function useStickerDay() {
  const [day, setDay] = useState<ActiveStickerDay | null>(null);
  useEffect(() => {
    let live = true;
    cache ??= stickerDayAction().catch(() => { cache = null; return null; });
    cache.then((d) => { if (live) setDay(d); });
    return () => { live = false; };
  }, []);
  return day;
}
