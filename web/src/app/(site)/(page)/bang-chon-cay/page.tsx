import type { Metadata } from 'next';
import { PlantPicker } from '@/components/PlantPicker';
import { PICKER_PLANTS, PICKER_URL, type PickerItem } from '@/lib/plant-picker';
import { allProducts } from '@/server/catalog';
import { withShare } from '@/lib/seo';
import { withSeo } from '@/server/seo-cms';

export const generateMetadata = (): Promise<Metadata> => withSeo(withShare({
  title: 'Bảng chọn cây có ảnh',
  description: `${PICKER_PLANTS.length} loại cây có sẵn tại vườn Sa Đéc, có ảnh, lọc theo vị trí đặt, ánh sáng, kích thước. Chọn cây và số lượng rồi gửi shop qua Zalo để nhận báo giá.`,
  alternates: { canonical: PICKER_URL },
}));

/** Cây có sản phẩm trên web (đang bán) lấy ảnh đại diện + giá thấp nhất từ sản phẩm; cây khác giữ ảnh minh họa. */
export default async function Page() {
  const bySlug = new Map((await allProducts()).map((p) => [p.slug, p]));
  const items: PickerItem[] = PICKER_PLANTS.map((plant) => {
    const p = plant.slug ? bySlug.get(plant.slug) : undefined;
    if (!p) return { ...plant, slug: undefined, photo: plant.img };
    const price = p.options.length ? Math.min(...p.options.map((o) => o.price)) : undefined;
    return { ...plant, photo: p.images?.[0] ?? plant.img, real: Boolean(p.images?.length), price, unit: p.unit };
  });
  return <PlantPicker items={items} />;
}
