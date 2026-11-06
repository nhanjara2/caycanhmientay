'use client';

import { useRouter } from '@/components/LocaleLink';
import { useState } from 'react';
import { refreshCartAction } from '@/app/actions/orders';
import { useCart } from '@/lib/cart';

/** Mua lại: thêm các sản phẩm của đơn cũ vào giỏ với giá hiện tại. */
export function ReorderButton({ items, className }: { items: { slug: string; option: number; qty: number }[]; className: string }) {
  const { merge, notify } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await refreshCartAction(items).catch(() => null);
        setBusy(false);
        if (!r || !r.lines.length) { notify('Các sản phẩm trong đơn không còn bán'); return; }
        merge(r.lines);
        router.push('/gio-hang');
      }}
    >
      Mua lại
    </button>
  );
}
