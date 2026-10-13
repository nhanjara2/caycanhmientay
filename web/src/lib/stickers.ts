import type { IconName } from '@/components/Icon';
import { cheapestOption, discountPct, isQuote, type Product } from './catalog';
import { money } from './format';
import type { ShipRules } from './pricing';
import type { PublicVoucher } from './voucher-labels';

/** Sticker nhỏ ở góc dưới trái ảnh sản phẩm (thẻ + trang chi tiết), kiểu dải nhãn của Shopee: mời gọi khách mua, nên hiện cho MỌI sản phẩm có giá
 *  (Freeship, Voucher là ưu đãi toàn shop, không đợi giá sản phẩm đạt ngưỡng); chỉ nội dung phải có thật (có mã đang chạy / có ảnh thật). */
export type StickerKey = 'sale' | 'real' | 'ship' | 'voucher';
export type Sticker = { key: StickerKey; big: string; small: string; title: string; icon?: IconName };

/** % giảm đang hiển thị từ mức này trở lên thì có sticker "Siêu sale" (sản phẩm Flash sale luôn có). */
export const SUPER_SALE_PCT = 25;

/** 50000 → "50K", 1500000 → "1,5TR" — mức giảm ngắn trên ô sticker. */
const shortAmount = (n: number) => (n >= 1e6 ? `${String(n / 1e6).replace('.', ',')}TR` : `${Math.round(n / 1000)}K`);

/** Các sticker của sản phẩm, xếp theo thứ tự hiện (hàng không đủ chỗ thì cắt từ cuối).
 *  `vouchers` = mã đang chạy (usePublicVouchers): Voucher = mã giảm giá dễ đạt nhất, Freeship = mã miễn phí giao dễ đạt nhất hoặc ngưỡng miễn phí giao của nhóm hàng.
 *  `real` ghi đè việc ảnh đang xem có phải ảnh thật không (trang chi tiết: tùy ảnh đang chọn). */
export function productStickers(p: Product, rules: ShipRules, vouchers: PublicVoucher[], opts: { real?: boolean } = {}): Sticker[] {
  const out: Sticker[] = [];
  const u = p.options[cheapestOption(p.options)];
  const priced = !!u && !isQuote(u);
  const pct = priced ? discountPct(u) : 0;
  const easiest = (kind: PublicVoucher['kind']) => vouchers.filter((v) => v.kind === kind).sort((a, b) => a.minOrder - b.minOrder)[0];

  if (p.flash || pct >= SUPER_SALE_PCT) {
    out.push({
      key: 'sale', big: pct > 0 ? `-${pct}%` : 'SALE', small: 'SIÊU SALE',
      title: p.flash ? 'Flash sale: giá sốc, số lượng có hạn' : `Siêu sale: giảm ${pct}%`,
    });
  }
  if (opts.real ?? p.realImg) {
    out.push({ key: 'real', big: '100%', small: 'ẢNH THẬT', title: 'Ảnh thật 100%: ảnh sản phẩm do shop tự chụp' });
  }
  if (priced) {
    const free = rules[p.ship].freeFrom;
    const ship = easiest('ship');
    out.push({
      key: 'ship', big: '', small: 'FREESHIP', icon: 'truck',
      title: ship ? `Mã ${ship.code}: giảm ${money(ship.discountValue)} phí giao cho đơn từ ${money(ship.minOrder)}` : free > 0 ? `Miễn phí giao hàng cho đơn từ ${money(free)}` : 'Miễn phí giao hàng',
    });
    const v = easiest('discount');
    if (v) {
      const off = v.discountType === 'percent' ? `${v.discountValue}%` : money(v.discountValue);
      out.push({
        key: 'voucher', big: v.discountType === 'percent' ? `-${v.discountValue}%` : `-${shortAmount(v.discountValue)}`, small: 'VOUCHER',
        title: `Mã ${v.code}: giảm ${off}${v.minOrder > 0 ? ` cho đơn từ ${money(v.minOrder)}` : ''}`,
      });
    }
  }
  return out;
}
