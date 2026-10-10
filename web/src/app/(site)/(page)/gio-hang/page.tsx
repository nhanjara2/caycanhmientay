'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { refreshCartAction } from '@/app/actions/orders';
import { EmptyState } from '@/components/Blocks';
import { CartList, OrderSummary, Steps } from '@/components/CartParts';
import { Icon } from '@/components/Icon';
import { VoucherBox } from '@/components/VoucherBox';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { WHOLESALE_QUOTE_URL } from '@/lib/partners';
import { withVouchers } from '@/lib/pricing';
import { useAppliedVouchers } from '@/lib/voucher-pick';

export default function CartPage() {
  const { lines, totals, ready, replace } = useCart();
  const { user } = useAuth();
  // Khách chọn mã ngay ở giỏ (hộp "Ưu đãi dành cho bạn"); mã đã chọn theo sang trang thanh toán
  const vouchers = useAppliedVouchers({ items: lines.map(({ slug, option, qty }) => ({ slug, option, qty })), phone: user?.phone ?? '', delivery: 'ship', enabled: ready });
  const [notice, setNotice] = useState('');
  const refreshed = useRef(false);

  // Giá trong giỏ là bản chụp lúc thêm; mở giỏ thì lấy lại giá hiện tại từ server.
  useEffect(() => {
    if (!ready || refreshed.current || !lines.length) return;
    refreshed.current = true;
    refreshCartAction(lines.map(({ slug, option, qty }) => ({ slug, option, qty })))
      .then((r) => {
        const priceChanged = r.lines.some((n) => {
          const old = lines.find((l) => l.slug === n.slug && l.option === n.option);
          return old && (old.snap.price !== n.snap.price || old.snap.combo2 !== n.snap.combo2 || old.snap.oldPrice !== n.snap.oldPrice);
        });
        if (r.changed || priceChanged) {
          replace(r.lines);
          setNotice(r.changed ? 'Một số sản phẩm không còn bán đã được bỏ khỏi giỏ.' : 'Giá một số sản phẩm đã được cập nhật.');
        }
      })
      .catch(() => {});
  }, [ready, lines, replace]);

  if (!ready) return <div className="vx-checkout app-page" style={{ minHeight: 400 }} />;

  if (!lines.length) {
    return (
      <div className="vx-checkout app-page" style={{ gridTemplateColumns: '1fr' }}>
        <EmptyState
          icon="cart"
          title="Giỏ hàng đang trống"
          text="Chọn cây và vật tư — mua 2 cây cùng loại có giá combo. Cần số lượng lớn cho công trình thì gửi danh sách để shop báo giá sỉ."
          action={<Link className="vx-btn vx-btn--primary" href="/danh-muc/cay-canh">Xem cây cảnh</Link>}
        />
      </div>
    );
  }

  return (
    <div className="vx-checkout app-page">
      <div className="vx-checkout__main">
        <Steps step={1} />
        {notice && <div className="vx-note" role="status"><Icon name="alert" /><div>{notice}</div></div>}
        <CartList editable />
      </div>
      <OrderSummary
        totals={withVouchers(totals, vouchers.applied.discount?.discount ?? 0, vouchers.applied.ship?.discount ?? 0)}
        voucherHint
        voucher={<VoucherBox state={vouchers} goods={totals.goods} shipFee={totals.plantShip + totals.supplyShip} />}
      >
        <Link href="/thanh-toan" className="vx-btn vx-btn--primary vx-btn--lg vx-btn--block">Tiến hành đặt hàng</Link>
        <Link href={WHOLESALE_QUOTE_URL} className="vx-btn vx-btn--outline vx-btn--block">Gửi danh sách, nhận báo giá sỉ</Link>
        <Link href="/danh-muc" className="vx-btn vx-btn--ghost vx-btn--block">Tiếp tục mua sắm</Link>
      </OrderSummary>
    </div>
  );
}
