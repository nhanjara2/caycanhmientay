import type { Metadata } from 'next';
import { ServiceDetail } from '@/components/ServiceDetail';
import { CLINIC, ClinicExtras } from '@/components/service-content';
import { productsIn } from '@/server/catalog';

export const metadata: Metadata = {
  title: 'Chữa cây tại nhà',
  description: 'Cây vàng lá, thối rễ, có sâu, nấm? Kỹ sư đến tận nơi tìm nguyên nhân, xử lý tại chỗ và hướng dẫn chăm để cây hồi phục. Gửi ảnh để được xem trước.',
};

export default async function Page() {
  const remedies = await productsIn('thuoc-bvtv');
  return (
    <ServiceDetail
      c={CLINIC}
      products={{ title: 'Thuốc BVTV shop đang có', href: '/danh-muc/thuoc-bvtv', more: 'Tra cứu thuốc BVTV', list: remedies.slice(0, 4) }}
    >
      <ClinicExtras />
    </ServiceDetail>
  );
}
