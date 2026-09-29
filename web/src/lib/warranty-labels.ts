// Nhãn bảo hành cây — dùng chung trang khách và admin.

/** Chip triệu chứng (WarrantyRequest) — form khách + nhân viên tạo thay khách. */
export const SYMPTOMS = ['Lá vàng', 'Lá mềm, rũ', 'Đốm nâu', 'Rụng lá', 'Thối gốc', 'Có sâu, rệp', 'Dập, gãy khi nhận'] as const;

/** Mã yêu cầu bảo hành hiển thị: BH-0012. */
export const warrantyCode = (id: number) => `BH-${String(id).padStart(4, '0')}`;

export const WARRANTY_RESOLUTION_LABEL = {
  replace: 'Đổi cây mới',
  rescue: 'Hướng dẫn cứu cây + tặng vật tư',
  refund: 'Hoàn tiền',
  reject: 'Từ chối',
} as const;

export const WARRANTY_RESOLUTION_HINT = {
  replace: 'Tự tạo đơn đổi 0đ, giao lại cùng địa chỉ và khung giờ',
  rescue: 'Gửi hướng dẫn, tạo đơn tặng Trichoderma 0đ',
  refund: 'Ghi nhận số tiền, kế toán chuyển xong thì xác nhận',
  reject: 'Bắt buộc nêu lý do',
} as const;

export const WARRANTY_STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' } as const;

export const REFUND_STATUS_LABEL = { pending: 'Chờ hoàn tiền', done: 'Đã hoàn tiền' } as const;
