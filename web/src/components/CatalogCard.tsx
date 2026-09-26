import { normalize } from '@/lib/catalog';
import { allProducts } from '@/server/catalog';
import { ProductCard } from './ProductCard';

/** Thẻ sản phẩm trong các view sinh từ preview: tìm sản phẩm thật gần tên nhất để nút "Chọn mua" hoạt động. */
export async function CatalogCard({ name }: { name: string }) {
  const products = await allProducts();
  if (!products.length) return null;
  const words = new Set(normalize(name).split(/\s+/));
  let best = products[0], score = -1;
  for (const p of products) {
    const s = normalize(p.name).split(/\s+/).filter((w) => words.has(w)).length;
    if (s > score) { best = p; score = s; }
  }
  return <ProductCard product={best} showFlash={Boolean(best.flash)} />;
}
