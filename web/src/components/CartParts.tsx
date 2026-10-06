'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { type CartLine, type Totals, useCart } from '@/lib/cart';
import { useShipping } from '@/lib/shipping-client';
import { money } from '@/lib/format';
import { Art, Icon } from './Icon';

export function Steps({ step }: { step: 1 | 2 | 3 }) {
  const names = ['Giỏ hàng', 'Thanh toán', 'Hoàn tất'];
  return (
    <div className="vx-steps">
      {names.map((n, i) => (
        <span key={n} style={{ display: 'contents' }}>
          {i > 0 && <Icon name="chevron" size={14} />}
          {i < step ? <b>{n}</b> : <span>{n}</span>}
        </span>
      ))}
    </div>
  );
}

/** Danh sách sản phẩm chia nhóm Cây sống / Vật tư (giao khác nhau, tính phí riêng). */
export function CartList({ editable }: { editable: boolean }) {
  const { lines, totals, setQty, remove } = useCart();
  const { rules } = useShipping();
  const plants = lines.filter((l) => l.snap.ship === 'plant');
  const supplies = lines.filter((l) => l.snap.ship === 'supply');

  return (
    <div className="vx-card">
      <h3 className="vx-card__title">Danh sách sản phẩm</h3>
      <div className="vx-ship-banner">
        <Icon name="truck" />
        <span><b>Miễn phí vận chuyển</b> cho đơn vật tư từ {money(rules.supply.freeFrom)}</span>
      </div>
      {plants.length > 0 && (
        <>
          <div className="vx-group-head">
            <b><Icon name="plant" />Cây sống ({plants.length})</b>
            <small>Đóng khung chống dập · giao toàn quốc</small>
          </div>
          {plants.map((l) => <Item key={`${l.slug}-${l.option}`} l={l} editable={editable} setQty={setQty} remove={remove} />)}
        </>
      )}
      {supplies.length > 0 && (
        <>
          <div className="vx-group-head">
            <b><Icon name="box" />Vật tư – Thuốc – Phân bón ({supplies.length})</b>
            <small>Giao nhanh 2h</small>
          </div>
          {supplies.map((l) => <Item key={`${l.slug}-${l.option}`} l={l} editable={editable} setQty={setQty} remove={remove} />)}
        </>
      )}
      {totals.hasPesticide && (
        <div className="vx-note">
          <Icon name="alert" />
          <div><b>Giỏ có thuốc bảo vệ thực vật.</b> Đọc kỹ hướng dẫn trên bao bì, đeo găng tay khi pha, để xa tầm tay trẻ em và vật nuôi.</div>
        </div>
      )}
    </div>
  );
}

function Item({ l, editable, setQty, remove }: {
  l: CartLine; editable: boolean;
  setQty: (s: string, o: number, q: number) => void; remove: (s: string, o: number) => void;
}) {
  const { snap: p } = l;
  return (
    <div className="vx-item">
      <Link href={`/san-pham/${l.slug}`} className="vx-item__img">{p.image ? <img src={p.image} alt="" /> : <Art name={p.icon} />}</Link>
      <div className="vx-item__info">
        {p.flash && <span><span className="vx-badge vx-badge--sale" style={{ fontSize: 11, padding: '2px 6px' }}><Icon name="bolt" size={12} />Flash sale</span></span>}
        <p className="vx-item__name"><Link href={`/san-pham/${l.slug}`}>{p.name}</Link></p>
        <span className="vx-item__unit">Đơn vị: {p.unit} · {p.label}</span>
      </div>
      <div className="vx-item__price">
        <b>{money(p.price * l.qty)}</b>
        {p.oldPrice && <s className="vx-strike">{money(p.oldPrice * l.qty)}</s>}
      </div>
      {editable ? (
        <div className="vx-item__qty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div className="vx-stepper">
            <button type="button" aria-label="Giảm" onClick={() => setQty(l.slug, l.option, l.qty - 1)}>−</button>
            <span>{l.qty}</span>
            <button type="button" aria-label="Tăng" onClick={() => setQty(l.slug, l.option, l.qty + 1)}>+</button>
          </div>
          <button type="button" className="vx-remove" onClick={() => { if (confirm(`Bỏ "${p.name}" khỏi giỏ hàng?`)) remove(l.slug, l.option); }}>Xóa</button>
        </div>
      ) : (
        <div className="vx-item__qty">x{l.qty} {p.unit}</div>
      )}
    </div>
  );
}

/** OrderSummary: khối tổng tiền cột phải, dính khi cuộn. */
export function OrderSummary({ totals: t, children }: { totals: Totals; children: ReactNode }) {
  const { rules } = useShipping();
  const plantLeft = t.plantSubtotal > 0 && t.plantShip > 0 ? rules.plant.freeFrom - t.plantSubtotal : 0;
  return (
    <aside className="vx-sum">
      <div className="vx-lines">
        <div><span>Tổng tiền</span><b>{money(t.original)}</b></div>
        {t.directDiscount > 0 && <div><span>Giảm giá trực tiếp</span><b className="neg">-{money(t.directDiscount)}</b></div>}
        {t.plantSubtotal > 0 && <div><span>Phí giao cây sống</span>{t.plantShip ? <b>{money(t.plantShip)}</b> : <b className="pos">Miễn phí</b>}</div>}
        {t.supplySubtotal > 0 && <div><span>Phí giao vật tư</span>{t.supplyShip ? <b>{money(t.supplyShip)}</b> : <b className="pos">Miễn phí</b>}</div>}
        {t.voucherDiscount > 0 && <div><span>Mã giảm giá</span><b className="neg">-{money(t.voucherDiscount)}</b></div>}
        {(t.directDiscount > 0 || t.voucherDiscount > 0) && <div><span>Tiết kiệm được</span><b className="neg">{money(t.directDiscount + t.voucherDiscount)}</b></div>}
      </div>
      {plantLeft > 0 && (
        <div className="vx-freeship">
          <span>Mua thêm <b>{money(plantLeft)}</b> để miễn phí giao cây sống</span>
          <div className="bar"><i style={{ width: `${(t.plantSubtotal / rules.plant.freeFrom) * 100}%` }} /></div>
        </div>
      )}
      <div className="vx-total">
        <b>Thành tiền</b>
        <span>
          {(t.directDiscount > 0 || t.voucherDiscount > 0) && <s>{money(t.original + t.plantShip + t.supplyShip)}</s>}
          <span className="amt">{money(t.total)}</span>
        </span>
      </div>
      {children}
    </aside>
  );
}
