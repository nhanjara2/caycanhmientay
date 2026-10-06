import type { Metadata } from 'next';
import { PosScreen } from '@/components/PosScreen';
import { requireAccess, staffName } from '@/server/auth';
import { getCategories } from '@/server/categories';
import { listStores } from '@/server/inventory';
import { posCatalog } from '@/server/pos';

export const metadata: Metadata = { title: 'Bán tại quầy · Admin', robots: { index: false } };

type Props = { searchParams: Promise<{ 'cua-hang'?: string }> };

/** POS toàn màn hình, không có menu admin (dùng trên máy tính bảng tại cửa hàng). Cửa hàng chọn qua ?cua-hang=<id>, mặc định kho chính. */
export default async function Page({ searchParams }: Props) {
  const me = await requireAccess('pos', 'full');
  const [stores, cats, sp] = await Promise.all([listStores(), getCategories(), searchParams]);
  const store = stores.find((s) => s.id === Number(sp['cua-hang'])) ?? stores[0];
  if (!store) return <p style={{ padding: 24 }}>Chưa có cửa hàng nào — thêm cửa hàng trước khi bán tại quầy.</p>;
  const items = await posCatalog(store.id);
  return (
    <PosScreen
      stores={stores.map((s) => ({ id: s.id, name: s.name }))}
      storeId={store.id}
      items={items}
      categories={cats.filter((c) => c.active && items.some((i) => i.category === c.slug)).map((c) => ({ slug: c.slug, name: c.name }))}
      cashier={staffName(me)}
    />
  );
}
