import { cheapestOption, discountPct, isQuote, type Product } from './catalog';
import { money } from './format';
import type { ShipRules } from './pricing';
import type { ActiveStickerDay } from './sticker-days';
import { inScope, productScopeItem } from './voucher-scope';
import type { PublicVoucher } from './voucher-labels';

/** Sticker nhỏ ở góc dưới trái ảnh sản phẩm (thẻ + trang chi tiết), kiểu dải nhãn của Shopee: mời gọi khách mua, chỉ là điểm nhấn nên nhỏ, không cần đọc kỹ.
 *  Mỗi ô: dòng nhỏ trên (`small`) + chữ lớn dưới (`big`), màu theo `key` trong CSS (.app-stk__t[data-k]). */
export type StickerKey = 'day' | 'sale' | 'real' | 'ship' | 'voucher' | 'mall' | 'cheap';
export type Sticker = { key: StickerKey; small: string; big: string; title: string };

/** % giảm đang hiện từ mức này trở lên thì có sticker "Siêu sale" (sản phẩm Flash sale luôn có). */
export const SUPER_SALE_PCT = 25;
/** Số sticker trên thẻ sản phẩm (khung nhỏ) và ở ảnh lớn trang chi tiết. */
export const CARD_STICKERS = 2;
export const DETAIL_STICKERS = 4;

/** Băm chuỗi → số (FNV-1a) để "ngẫu nhiên" mà cố định theo từng sản phẩm: tải lại trang, thẻ ở trang khác vẫn ra đúng sticker đó. */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export type StickerContext = { rules: ShipRules; vouchers: PublicVoucher[]; day: ActiveStickerDay | null };

/** Các sticker của sản phẩm, đã xếp thứ tự hiện, cắt còn `limit` ô.
 *  Thứ tự: ngày đặc biệt hôm nay (nếu có) → điều có thật của sản phẩm (siêu sale, ảnh thật) → các ô mời gọi chọn "ngẫu nhiên" theo sản phẩm
 *  (Voucher Extra, Shop Mall, Shop siêu rẻ, Freeship — mỗi sản phẩm một thứ tự riêng).
 *  `real` ghi đè việc ảnh đang xem có phải ảnh thật không (trang chi tiết: tùy ảnh đang chọn). */
export function productStickers(p: Product, ctx: StickerContext, opts: { real?: boolean; limit?: number } = {}): Sticker[] {
  const u = p.options[cheapestOption(p.options)];
  const priced = !!u && !isQuote(u);
  const pct = priced ? discountPct(u) : 0;
  const easiest = (kind: PublicVoucher['kind']) => ctx.vouchers.filter((v) => v.kind === kind && inScope(v.scope, productScopeItem(p))).sort((a, b) => a.minOrder - b.minOrder)[0];

  const first: Sticker[] = [];
  if (ctx.day) first.push({ key: 'day', small: ctx.day.text, big: ctx.day.label, title: ctx.day.title });
  if (p.flash || pct >= SUPER_SALE_PCT) {
    first.push({ key: 'sale', small: 'SIÊU SALE', big: pct > 0 ? `-${pct}%` : 'SALE', title: p.flash ? 'Flash sale: giá sốc, số lượng có hạn' : `Siêu sale: giảm ${pct}%` });
  }
  if (opts.real ?? p.realImg) first.push({ key: 'real', small: 'ẢNH THẬT', big: '100%', title: 'Ảnh thật 100%: ảnh sản phẩm do shop tự chụp' });

  const pool: Sticker[] = [{ key: 'mall', small: 'SHOP', big: 'MALL', title: 'Cây Cảnh Miền Tây: cây và vật tư chính hãng, bảo hành cây sống' }];
  if (priced) {
    pool.push({ key: 'cheap', small: 'SHOP', big: 'SIÊU RẺ', title: 'Giá tại vườn, mua nhiều càng rẻ' });
    const free = ctx.rules[p.ship].freeFrom;
    const ship = easiest('ship');
    // Sản phẩm không áp mã (giá đã chốt, tiền xe tính riêng): không có ô Free ship / Voucher Extra
    if (!p.noVoucher) pool.push({
      key: 'ship', small: 'FREE', big: 'SHIP',
      title: ship ? `Mã ${ship.code}: giảm ${money(ship.discountValue)} phí giao cho đơn từ ${money(ship.minOrder)}` : free > 0 ? `Miễn phí giao hàng cho đơn từ ${money(free)}` : 'Miễn phí giao hàng',
    });
    const v = p.noVoucher ? undefined : easiest('discount');
    if (v) {
      const off = v.discountType === 'percent' ? `${v.discountValue}%` : money(v.discountValue);
      pool.push({ key: 'voucher', small: 'VOUCHER', big: 'EXTRA', title: `Mã ${v.code}: giảm ${off}${v.minOrder > 0 ? ` cho đơn từ ${money(v.minOrder)}` : ''}` });
    }
  }
  pool.sort((a, b) => hash(`${p.slug}:${a.key}`) - hash(`${p.slug}:${b.key}`));

  return [...first, ...pool].slice(0, opts.limit ?? DETAIL_STICKERS);
}
