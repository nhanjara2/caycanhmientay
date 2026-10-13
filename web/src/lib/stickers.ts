import type { IconName } from '@/components/Icon';
import { cheapestOption, discountPct, isQuote, type Product } from './catalog';
import { money } from './format';
import type { ShipRules } from './pricing';
import { WARRANTY_DAYS } from './warranty-labels';

/** Sticker nhỏ ở góc dưới trái ảnh sản phẩm (thẻ + trang chi tiết), kiểu dải nhãn của Shopee. Mỗi sticker khoe một điều CÓ THẬT của sản phẩm đó. */
export type StickerKey = 'sale' | 'real' | 'ship' | 'combo' | 'warranty' | 'genuine';
export type Sticker = { key: StickerKey; big: string; small: string; title: string; icon?: IconName };

/** % giảm đang hiển thị từ mức này trở lên thì có sticker "Siêu sale" (sản phẩm Flash sale luôn có). */
export const SUPER_SALE_PCT = 25;
/** Mua 2 giảm ít hơn mức này thì không khoe. */
const MIN_COMBO_PCT = 5;

/** Các sticker của sản phẩm, xếp theo thứ tự hiện (hàng không đủ chỗ thì cắt từ cuối).
 *  Theo loại: cây sống có "Bảo hành 7 ngày", vật tư / thuốc / phân có "Chính hãng"; còn lại theo dữ liệu từng sản phẩm.
 *  `real` ghi đè việc ảnh đang xem có phải ảnh thật không (trang chi tiết: tùy ảnh đang chọn). */
export function productStickers(p: Product, rules: ShipRules, opts: { real?: boolean } = {}): Sticker[] {
  const out: Sticker[] = [];
  const u = p.options[cheapestOption(p.options)];
  const priced = !!u && !isQuote(u);
  const pct = priced ? discountPct(u) : 0;

  if (p.flash || pct >= SUPER_SALE_PCT) {
    out.push({
      key: 'sale', big: pct > 0 ? `-${pct}%` : 'SALE', small: 'SIÊU SALE',
      title: p.flash ? 'Flash sale: giá sốc, số lượng có hạn' : `Siêu sale: giảm ${pct}%`,
    });
  }
  if (opts.real ?? p.realImg) {
    out.push({ key: 'real', big: '100%', small: 'ẢNH THẬT', title: 'Ảnh thật 100%: ảnh sản phẩm do shop tự chụp' });
  }
  const free = rules[p.ship].freeFrom;
  if (priced && u.price >= free) {
    out.push({
      key: 'ship', big: '', small: 'FREESHIP', icon: 'truck',
      title: free > 0 ? `Miễn phí giao hàng khi mua từ ${money(free)}` : 'Miễn phí giao hàng',
    });
  }
  if (priced && u.combo2) {
    const off = Math.round((1 - u.combo2 / (2 * u.price)) * 100);
    if (off >= MIN_COMBO_PCT) out.push({ key: 'combo', big: `-${off}%`, small: 'MUA 2 CÂY', title: `Mua 2 cùng quy cách giảm thêm ${off}%` });
  }
  if (p.ship === 'plant') {
    out.push({ key: 'warranty', big: `${WARRANTY_DAYS} NGÀY`, small: 'BẢO HÀNH', title: `Cây sống bảo hành ${WARRANTY_DAYS} ngày` });
  } else {
    out.push({ key: 'genuine', big: '', small: 'CHÍNH HÃNG', icon: 'shield', title: 'Vật tư chính hãng' });
  }
  return out;
}
