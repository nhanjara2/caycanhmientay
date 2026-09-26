import { discountPct, type Product } from './catalog';

export const SORTS = [
  { key: 'pho-bien', label: 'Phổ biến' },
  { key: 'ban-chay', label: 'Bán chạy' },
  { key: 'gia-tang', label: 'Giá thấp → cao' },
  { key: 'gia-giam', label: 'Giá cao → thấp' },
  { key: 'giam-nhieu', label: 'Giảm nhiều' },
] as const;

export type SortKey = (typeof SORTS)[number]['key'];

export function sortProducts(list: Product[], key: string | undefined): Product[] {
  const out = [...list];
  const price = (p: Product) => p.options[0].price;
  switch (key) {
    case 'ban-chay': return out.sort((a, b) => b.sold - a.sold);
    case 'gia-tang': return out.sort((a, b) => price(a) - price(b));
    case 'gia-giam': return out.sort((a, b) => price(b) - price(a));
    case 'giam-nhieu': return out.sort((a, b) => discountPct(b.options[0]) - discountPct(a.options[0]));
    default: return out.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
  }
}
