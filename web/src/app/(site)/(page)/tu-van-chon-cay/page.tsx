import type { Metadata } from 'next';
import { PlantAdvisor } from '@/components/PlantAdvisor';
import { SPACE_KINDS, toAdvisorPlant, type SpaceKind } from '@/lib/plant-advisor';
import { allProducts } from '@/server/catalog';

export const metadata: Metadata = {
  title: 'Tư vấn chọn cây',
  description: 'Chọn loại không gian (để bàn, văn phòng, trong nhà, ban công, sân vườn, công trình), trả lời vài câu hỏi để biết nên trồng cây gì, bao nhiêu cây và cao bao nhiêu cho từng vị trí.',
};

type Props = { searchParams: Promise<{ loai?: string }> };

/** Chỉ gửi xuống trình duyệt cây cảnh + hạt giống (góc rau ban công), đã rút gọn. */
export default async function Page({ searchParams }: Props) {
  const [{ loai }, products] = await Promise.all([searchParams, allProducts()]);
  const plants = products.filter((p) => p.category === 'cay-canh' || p.category === 'hat-giong').map(toAdvisorPlant);
  const kind = SPACE_KINDS.find((k) => k === loai) ?? null;
  return <PlantAdvisor plants={plants} initialKind={kind as SpaceKind | null} />;
}
