import { discountPct, isSoldOut, type Product } from './catalog';

export const SORTS = [
  { key: 'pho-bien', label: 'Phổ biến' },
  { key: 'ban-chay', label: 'Bán chạy' },
  { key: 'gia-tang', label: 'Giá thấp → cao' },
  { key: 'gia-giam', label: 'Giá cao → thấp' },
  { key: 'giam-nhieu', label: 'Giảm nhiều' },
] as const;

export type SortKey = (typeof SORTS)[number]['key'];

/** Sắp xếp danh sách; sản phẩm hết hàng (mọi quy cách có giá) luôn xuống cuối, giữ nguyên thứ tự trong từng nhóm. */
export function sortProducts(list: Product[], key: string | undefined): Product[] {
  const sorted = rank(list, key);
  return [...sorted.filter((p) => !isSoldOut(p.options)), ...sorted.filter((p) => isSoldOut(p.options))];
}

function rank(list: Product[], key: string | undefined): Product[] {
  const out = [...list];
  // giá thấp nhất có giá; sản phẩm chỉ "Liên hệ báo giá" xếp cuối cả hai chiều
  const prices = (p: Product) => p.options.map((o) => o.price).filter((v) => v > 0);
  const low = (p: Product) => (prices(p).length ? Math.min(...prices(p)) : Number.MAX_SAFE_INTEGER);
  const high = (p: Product) => (prices(p).length ? Math.max(...prices(p)) : -1);
  switch (key) {
    case 'ban-chay': return out.sort((a, b) => b.sold - a.sold);
    case 'gia-tang': return out.sort((a, b) => low(a) - low(b));
    case 'gia-giam': return out.sort((a, b) => high(b) - high(a));
    case 'giam-nhieu': return out.sort((a, b) => discountPct(b.options[0]) - discountPct(a.options[0]));
    default: return out.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
  }
}
