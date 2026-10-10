'use client';

import { useEffect, useState } from 'react';
import { publicVouchersAction } from '@/app/actions/vouchers';
import type { PublicVoucher } from './voucher-labels';

// Danh sách mã công khai tải một lần mỗi lần mở trang (dùng chung giỏ hàng, thanh toán, trang sản phẩm).
let cache: Promise<PublicVoucher[]> | null = null;

export function usePublicVouchers() {
  const [list, setList] = useState<PublicVoucher[]>([]);
  useEffect(() => {
    let live = true;
    cache ??= publicVouchersAction().catch(() => { cache = null; return []; });
    cache.then((l) => { if (live) setList(l); });
    return () => { live = false; };
  }, []);
  return list;
}
