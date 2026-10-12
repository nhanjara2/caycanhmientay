// Bán sỉ cho đối tác (từ 09/10/2026 shop thôi làm dịch vụ, chỉ cung cấp sỉ): nhóm đối tác, trạng thái duyệt, chiết khấu riêng.
// Dùng chung client/server: trang /doi-tac, form Báo giá sỉ (service_requests.service), admin Khách hàng.

import type { IconName } from '@/components/Icon';

export const PARTNER_TYPES = ['landscape', 'project', 'trade'] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_INFO: Record<PartnerType, { label: string; short: string; hint: string; icon: IconName }> = {
  landscape: {
    label: 'Đối tác dịch vụ cảnh quan', short: 'Dịch vụ', icon: 'trees',
    hint: 'Đơn vị thiết kế, thi công sân vườn, chăm sóc cây, cho thuê cây văn phòng — lấy cây và vật tư theo từng công việc.',
  },
  project: {
    label: 'Đối tác công trình', short: 'Công trình', icon: 'truck',
    hint: 'Nhà thầu cảnh quan, chủ đầu tư, khu đô thị, khu du lịch — cây số lượng lớn theo bảng khối lượng, giao chia đợt theo tiến độ.',
  },
  trade: {
    label: 'Đối tác buôn bán', short: 'Buôn bán', icon: 'box',
    hint: 'Cửa hàng, đại lý, vựa cây, người bán online — lấy hàng về bán lại.',
  },
};

export const PARTNER_STATUSES = ['pending', 'approved'] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];
export const PARTNER_STATUS_LABEL: Record<PartnerStatus, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt' };

/** Chiết khấu riêng tối đa admin đặt được cho một đối tác (% trên tiền hàng). */
export const MAX_PARTNER_DISCOUNT = 50;

/**
 * Ảnh minh họa từng nhóm đối tác (public/images/doi-tac/). Công trình + buôn bán: 960×720, ảnh CC0 / phạm vi công cộng — không cần ghi nguồn.
 * Dịch vụ cảnh quan: ảnh chủ shop đưa (736×736, vuông để khung dọc ở trang chủ lẫn khung ngang ở /doi-tac đều cắt được).
 */
export const PARTNER_IMAGE: Record<PartnerType, string> = {
  landscape: '/images/doi-tac/dich-vu-canh-quan.jpg',
  project: '/images/doi-tac/cong-trinh.jpg',
  trade: '/images/doi-tac/buon-ban.jpg',
};

export const WHOLESALE_URL = '/doi-tac';
export const WHOLESALE_QUOTE_URL = '/bao-gia-si';

/** Tiền chiết khấu đối tác trên tiền hàng (làm tròn xuống đến đồng). */
export const partnerDiscountOf = (subtotal: number, pct: number) => (pct > 0 ? Math.floor((subtotal * Math.min(pct, MAX_PARTNER_DISCOUNT)) / 100) : 0);
