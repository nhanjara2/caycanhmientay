'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { type CartLine, type Totals, useCart } from '@/lib/cart';
import { minOrderShort, plantFeeVaries, type LinePrice } from '@/lib/pricing';
import { REGION_LABEL } from '@/lib/shipping';
import { useShipping } from '@/lib/shipping-client';
import { money } from '@/lib/format';
import { voucherTiers, voucherValueText } from '@/lib/voucher-labels';
import { usePublicVouchers } from '@/lib/vouchers-client';
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
  const vouchers = usePublicVouchers();
  const priced = (l: CartLine) => totals.lines[lines.indexOf(l)];
  const plants = lines.filter((l) => l.snap.ship === 'plant');
  const supplies = lines.filter((l) => l.snap.ship === 'supply');

  return (
    <div className="vx-card">
      <h3 className="vx-card__title">Danh sách sản phẩm</h3>
      <div className="vx-ship-banner">
        <Icon name="truck" />
        <span>
          <b>Miễn phí vận chuyển</b> cho đơn vật tư từ {money(rules.supply.freeFrom)} · Mua 2 cây cùng loại có giá combo
          {vouchers.length > 0 && <> · Đơn từ {money(vouchers[0].minOrder)} có mã ưu đãi</>}
        </span>
      </div>
      {plants.length > 0 && (
        <>
          <div className="vx-group-head">
            <b><Icon name="plant" />Cây sống ({plants.length})</b>
            <small>Đóng khung chống dập · giao toàn quốc</small>
          </div>
          {plants.map((l) => <Item key={`${l.slug}-${l.option}`} l={l} pr={priced(l)} editable={editable} setQty={setQty} remove={remove} />)}
        </>
      )}
      {supplies.length > 0 && (
        <>
          <div className="vx-group-head">
            <b><Icon name="box" />Vật tư – Thuốc – Phân bón ({supplies.length})</b>
            <small>Giao nhanh 2h</small>
          </div>
          {supplies.map((l) => <Item key={`${l.slug}-${l.option}`} l={l} pr={priced(l)} editable={editable} setQty={setQty} remove={remove} />)}
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

function Item({ l, pr, editable, setQty, remove }: {
  l: CartLine; pr?: LinePrice; editable: boolean;
  setQty: (s: string, o: number, q: number) => void; remove: (s: string, o: number) => void;
}) {
  const { snap: p } = l;
  return (
    <div className="vx-item">
      <Link href={`/san-pham/${l.slug}`} className="vx-item__img">{p.image ? <img src={p.image} alt="" /> : <Art name={p.icon} />}</Link>
      <div className="vx-item__info">
        {p.flash && <span><span className="vx-badge vx-badge--sale" style={{ fontSize: '0.6875rem', padding: '2px 6px' }}><Icon name="bolt" size={12} />Flash sale</span></span>}
        <p className="vx-item__name"><Link href={`/san-pham/${l.slug}`}>{p.name}</Link></p>
        <span className="vx-item__unit">Đơn vị: {p.unit} · {p.label}</span>
        {pr && pr.combos > 0 && <span className="app-tier">Combo 2 {p.unit.toLowerCase()} ×{pr.combos}: −{money(pr.comboSaving)}</span>}
        {pr && pr.combos === 0 && l.qty === 1 && p.combo2 && p.combo2 < 2 * p.price && (
          <span className="app-tier app-tier--hint">Thêm 1 {p.unit.toLowerCase()} nữa: 2 {p.unit.toLowerCase()} chỉ {money(p.combo2)}</span>
        )}
      </div>
      <div className="vx-item__price">
        <b>{money(pr ? pr.total : p.price * l.qty)}</b>
        {pr ? pr.strike > pr.total && <s className="vx-strike">{money(pr.strike)}</s> : p.oldPrice && <s className="vx-strike">{money(p.oldPrice * l.qty)}</s>}
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

/** OrderSummary: khối tổng tiền cột phải, dính khi cuộn. `voucher` = dòng "Ưu đãi dành cho bạn" (VoucherBox) mở hộp chọn mã;
 *  `voucherHint` (giỏ hàng): thêm gợi ý mua thêm để dùng mã giảm cao hơn. */
export function OrderSummary({ totals: t, voucherHint = false, voucher, delivery = 'ship', children }: { totals: Totals; voucherHint?: boolean; voucher?: ReactNode; delivery?: 'ship' | 'pickup'; children: ReactNode }) {
  const { rules, minOrder } = useShipping();
  // Đơn giao hàng cần đủ tiền hàng tối thiểu (Cài đặt giao hàng); nhận tại vườn không giới hạn.
  const short = minOrderShort(t.goods, minOrder, delivery);
  const vouchers = usePublicVouchers();
  const plantLeft = t.plantSubtotal > 0 && t.plantShip > 0 ? rules.plant.freeFrom - t.plantSubtotal : 0;
  // Chưa biết nơi nhận mà các vùng khác phí: số hiện là tạm tính
  const estimate = delivery === 'ship' && t.plantSubtotal > 0 && !t.shipRegion && plantFeeVaries(rules.plant);
  // Phí giao luôn hiện đủ theo bảng phí; đủ mức miễn phí giao thì có thêm dòng "Giảm phí giao" trừ ra (chữ "Miễn phí" chỉ còn khi không có phí để tính, vd. nhận tại vườn).
  const plantGross = t.plantShip + t.plantShipFree;
  const supplyGross = t.supplyShip + t.supplyShipFree;
  // Tổng tiền tính theo giá bán (giá lẻ). Giá gạch ngang chỉ để hiện % giảm ở từng sản phẩm — không cộng vào tổng,
  // không tính vào "Tiết kiệm được" (chỉ gồm khoản bớt thật: combo, giảm phí giao, mã, chiết khấu đối tác).
  const saved = t.comboDiscount + t.plantShipFree + t.supplyShipFree + t.voucherDiscount + t.shipVoucherDiscount + t.partnerDiscount;
  const tiers = voucherHint ? voucherTiers(vouchers, t.goods) : { best: null, next: null };
  return (
    <aside className="vx-sum">
      <div className="vx-lines">
        <div><span>Tổng tiền</span><b>{money(t.subtotal)}</b></div>
        {t.comboDiscount > 0 && <div><span>Combo 2 cây</span><b className="neg">-{money(t.comboDiscount)}</b></div>}
        {t.plantSubtotal > 0 && <div><span>Phí giao cây sống{t.shipRegion && plantFeeVaries(rules.plant) ? ` (${REGION_LABEL[t.shipRegion]})` : ''}</span>{plantGross ? <b>{money(plantGross)}</b> : <b className="pos">Miễn phí</b>}</div>}
        {t.bulkyShip > 0 && <div className="app-ship-sub"><span>Gồm phụ phí cây lớn</span><b>{money(t.bulkyShip)}</b></div>}
        {t.plantShipFree > 0 && <div><span>Giảm phí giao cây sống</span><b className="neg">-{money(t.plantShipFree)}</b></div>}
        {t.supplySubtotal > 0 && <div><span>Phí giao vật tư</span>{supplyGross ? <b>{money(supplyGross)}</b> : <b className="pos">Miễn phí</b>}</div>}
        {t.supplyShipFree > 0 && <div><span>Giảm phí giao vật tư</span><b className="neg">-{money(t.supplyShipFree)}</b></div>}
        {t.shipVoucherDiscount > 0 && <div><span>Mã miễn phí giao</span><b className="neg">-{money(t.shipVoucherDiscount)}</b></div>}
        {t.voucherDiscount > 0 && <div><span>Mã giảm giá</span><b className="neg">-{money(t.voucherDiscount)}</b></div>}
        {t.partnerDiscount > 0 && <div><span>Chiết khấu đối tác</span><b className="neg">-{money(t.partnerDiscount)}</b></div>}
        {saved > 0 && <div><span>Tiết kiệm được</span><b className="neg">{money(saved)}</b></div>}
      </div>
      {estimate && <p className="app-ship-est" role="status">Phí giao cây sống đang tạm tính theo mức thấp nhất; phí chính xác theo tỉnh / thành bạn nhận hàng.</p>}
      {voucher}
      {short > 0 && (
        <div className="vx-freeship app-minorder" role="status">
          <span>Đơn giao hàng từ <b>{money(minOrder)}</b> — mua thêm <b>{money(short)}</b> để được giao</span>
          <div className="bar"><i style={{ width: `${Math.min(100, (t.goods / minOrder) * 100)}%` }} /></div>
        </div>
      )}
      {!short && tiers.next && (
        <div className="vx-freeship app-minorder" role="status">
          <span>Mua thêm <b>{money(tiers.next.minOrder - t.goods)}</b> để dùng mã <b>{tiers.next.code}</b> — {voucherValueText(tiers.next, money).toLowerCase()}</span>
          <div className="bar"><i style={{ width: `${Math.min(100, (t.goods / tiers.next.minOrder) * 100)}%` }} /></div>
        </div>
      )}
      {plantLeft > 0 && (
        <div className="vx-freeship">
          <span>Mua thêm <b>{money(plantLeft)}</b> để miễn phí giao cây sống{t.bulkyShip > 0 ? ' (chưa gồm phụ phí cây lớn)' : ''}</span>
          <div className="bar"><i style={{ width: `${(t.plantSubtotal / rules.plant.freeFrom) * 100}%` }} /></div>
        </div>
      )}
      <div className="vx-total">
        <b>Thành tiền</b>
        <span>
          {saved > 0 && <s>{money(t.subtotal + plantGross + supplyGross)}</s>}
          <span className="amt">{money(t.total)}</span>
        </span>
      </div>
      {children}
    </aside>
  );
}
