// Trang riêng của từng dịch vụ (/dich-vu/...): đường dẫn, tên, icon — dùng chung trang Dịch vụ, thanh chuyển dịch vụ, "Dịch vụ khác".
// Mỗi dịch vụ khớp một lựa chọn của form Đặt lịch khảo sát (lib/service-labels: SERVICE_TYPES, ?loai=).

import type { IconName } from '@/components/Icon';
import { SERVICE_INFO, type ServiceType } from './service-labels';

export const SERVICES_URL = '/dich-vu';
export const QUOTE_URL = '/dich-vu/dat-lich-khao-sat';

export const SERVICE_ORDER: ServiceType[] = ['garden', 'office', 'care', 'clinic'];

/** Ảnh minh họa trong public/images/dich-vu/ (960×720): ảnh CC0 / phạm vi công cộng (StockSnap, Wikimedia Commons) — không bắt buộc ghi nguồn. */
const IMG = (f: string) => `/images/dich-vu/${f}.jpg`;
export const SERVICES_HUB_IMAGE = IMG('dich-vu');
export const BUSINESS_IMAGE = IMG('doanh-nghiep');

export const SERVICE_PAGES: Record<ServiceType, { href: string; name: string; tab: string; icon: IconName; image: string; alt: string; text: string }> = {
  garden: {
    href: '/dich-vu/thiet-ke-thi-cong-san-vuon', name: 'Thiết kế & thi công sân vườn', tab: 'Sân vườn', icon: 'trees', image: IMG('san-vuon'), alt: 'Lối đi lát gỗ giữa sân vườn nhiều cây xanh nhiệt đới',
    text: 'Sân vườn, ban công, sân thượng, tiểu cảnh. Kỹ sư khảo sát, đề xuất cây hợp nắng gió từng vị trí, báo giá rõ từng khoản rồi mới thi công.',
  },
  office: {
    href: '/dich-vu/cho-thue-cay-van-phong', name: 'Cho thuê cây văn phòng', tab: 'Cây văn phòng', icon: 'pot', image: IMG('van-phong'), alt: 'Chậu trầu bà đặt trên bàn làm việc trong văn phòng',
    text: 'Thuê theo gói hoặc theo số lượng cây, đã gồm chậu và kỹ sư chăm định kỳ. Tính chi phí ngay trên trang.',
  },
  care: {
    href: '/dich-vu/cham-soc-cay-dinh-ky', name: 'Chăm sóc cây định kỳ', tab: 'Chăm sóc định kỳ', icon: 'drop', image: IMG('cham-soc'), alt: 'Xẻng nhỏ, đất trồng, chậu cây và kéo cắt tỉa',
    text: 'Kỹ sư đến chăm cây tại nhà, văn phòng, quán theo lịch: bón phân, cắt tỉa, phòng trừ sâu bệnh, thay đất, thay chậu.',
  },
  clinic: {
    href: '/dich-vu/chua-cay-tai-nha', name: 'Chữa cây tại nhà', tab: 'Chữa cây tại nhà', icon: 'bug', image: IMG('chua-cay'), alt: 'Cận cảnh lá cây bị vàng, cháy nâu giữa các gân lá',
    text: 'Cây vàng lá, thối rễ, có sâu, nấm? Kỹ sư đến tận nơi tìm nguyên nhân, xử lý tại chỗ và hướng dẫn chăm để cây hồi phục.',
  },
};

/** Link form khảo sát chọn sẵn dịch vụ. */
export const quoteHref = (t: ServiceType) => `${QUOTE_URL}?loai=${SERVICE_INFO[t].param}`;
