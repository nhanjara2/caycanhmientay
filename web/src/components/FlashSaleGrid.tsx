import { allProducts } from '@/server/catalog';
import { ProductGrid } from './ProductCard';

/** Lưới trang Flash sale: sản phẩm đang flash trước, sau đó là sản phẩm đang giảm giá. */
export async function FlashSaleGrid() {
  const all = await allProducts();
  const flash = all.filter((p) => p.flash);
  const onSale = all.filter((p) => !p.flash && p.options.some((o) => o.oldPrice));
  return <ProductGrid products={[...flash, ...onSale]} showFlash />;
}
