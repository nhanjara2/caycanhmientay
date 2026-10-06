// Mẫu tin nhắn tự động: danh sách sự kiện, nội dung mặc định, biến chèn được. Dùng chung server (gửi) và admin /admin/mau-tin-nhan (sửa).
import { SALES_PHONE } from './contact';

export type NoticeKind = 'order' | 'warranty' | 'care' | 'promo' | 'reply';

export type EventDef = {
  key: string;
  group: 'Đơn hàng' | 'Bảo hành' | 'Hỏi đáp & đánh giá' | 'Khuyến mãi';
  title: string;
  /** Khi nào gửi. */
  trigger: string;
  kind: NoticeKind;
  /** Nội dung mặc định, {biến} + **chữ đậm**. */
  text: string;
  /** Mặc định có gửi thêm Zalo / email không (tin quan trọng). */
  external: boolean;
  vars: string[];
};

/** Biến → mô tả + dữ liệu mẫu cho phần xem trước. {ten_khach} và {hotline} dùng được ở mọi mẫu. */
export const GLOBAL_VARS = ['ten_khach', 'hotline'];
export const VARIABLES: Record<string, { label: string; sample: string }> = {
  ten_khach: { label: 'Tên khách', sample: 'Chị Ngọc' },
  ma_don: { label: 'Mã đơn hàng', sample: 'MT0095398' },
  cua_hang: { label: 'Tên cửa hàng', sample: 'Vườn ươm Quận 7' },
  ma_bh: { label: 'Mã yêu cầu bảo hành', sample: 'BH-0012' },
  ten_cay: { label: 'Tên cây / sản phẩm', sample: 'Lan hồ điệp 2 cành trắng' },
  huong_xu_ly: { label: 'Hướng xử lý bảo hành', sample: 'Đổi cây mới' },
  chi_tiet: { label: 'Chi tiết thêm (đơn đổi, số tiền hoàn)', sample: ' — đơn giao MT0095399' },
  so_tien: { label: 'Số tiền', sample: '450.000đ' },
  ten_san_pham: { label: 'Tên sản phẩm', sample: 'Monstera Deliciosa' },
  nguoi_tra_loi: { label: 'Người trả lời', sample: 'Một khách đã mua' },
  ma_voucher: { label: 'Mã giảm giá', sample: 'CHAOBANMOI' },
  noi_dung_qua: { label: 'Nội dung quà', sample: 'giảm 50.000đ cho đơn từ 300.000đ' },
  han_dung: { label: 'Hạn dùng', sample: '05/11/2026' },
  hotline: { label: 'Hotline shop', sample: SALES_PHONE },
};

export const EVENTS: EventDef[] = [
  { key: 'order_placed', group: 'Đơn hàng', title: 'Đã nhận đơn', trigger: 'Khách đặt hàng thành công (khách có tài khoản)', kind: 'order', external: false, vars: ['ma_don'], text: 'Đã nhận đơn **{ma_don}**' },
  { key: 'order_confirmed', group: 'Đơn hàng', title: 'Xác nhận đơn', trigger: 'Nhân viên bấm "Xác nhận đơn"', kind: 'order', external: false, vars: ['ma_don'], text: 'Đơn **{ma_don}** đã được xác nhận' },
  { key: 'order_preparing', group: 'Đơn hàng', title: 'Đang chuẩn bị cây', trigger: 'Đơn chuyển sang "Chuẩn bị cây"', kind: 'order', external: false, vars: ['ma_don'], text: 'Shop đang chuẩn bị cây cho đơn **{ma_don}**' },
  { key: 'order_shipping', group: 'Đơn hàng', title: 'Đang giao', trigger: 'Kho giao đơn cho tài xế', kind: 'order', external: true, vars: ['ma_don'], text: 'Đơn **{ma_don}** đang được giao đến bạn' },
  { key: 'order_arrived', group: 'Đơn hàng', title: 'Tài xế đã đến', trigger: 'Tài xế bấm "Đã đến" trên app giao hàng', kind: 'order', external: true, vars: ['ma_don'], text: 'Tài xế đã đến giao đơn **{ma_don}**' },
  { key: 'order_delivered', group: 'Đơn hàng', title: 'Đã giao + cảm ơn', trigger: 'Đơn chuyển sang "Đã giao"', kind: 'order', external: false, vars: ['ma_don'], text: 'Đơn **{ma_don}** đã giao thành công. Cảm ơn bạn!' },
  { key: 'order_cancelled', group: 'Đơn hàng', title: 'Đơn bị hủy', trigger: 'Đơn bị hủy', kind: 'order', external: true, vars: ['ma_don'], text: 'Đơn **{ma_don}** đã bị hủy' },
  { key: 'order_paid', group: 'Đơn hàng', title: 'Đã nhận thanh toán', trigger: 'Nhân viên xác nhận đã nhận tiền (chuyển khoản / ví / thẻ)', kind: 'order', external: false, vars: ['ma_don'], text: 'Shop đã nhận thanh toán đơn **{ma_don}**' },
  { key: 'pos_thanks', group: 'Đơn hàng', title: 'Cảm ơn mua tại cửa hàng', trigger: 'Bán tại quầy cho khách có tài khoản (theo SĐT)', kind: 'order', external: false, vars: ['cua_hang', 'ma_don'], text: 'Cảm ơn bạn đã mua hàng tại {cua_hang} — đơn **{ma_don}**' },

  { key: 'warranty_from_review', group: 'Bảo hành', title: 'Shop tạo bảo hành từ đánh giá', trigger: 'Nhân viên tạo yêu cầu bảo hành thay khách từ đánh giá xấu', kind: 'warranty', external: false, vars: ['ma_bh', 'ten_cay'], text: 'Shop đã tạo yêu cầu bảo hành **#{ma_bh}** cho **{ten_cay}** từ đánh giá của bạn — kỹ sư sẽ liên hệ trong 24 giờ' },
  { key: 'warranty_decided', group: 'Bảo hành', title: 'Kết quả bảo hành', trigger: 'Kỹ sư quyết định hướng xử lý (đổi cây, cứu cây, hoàn tiền, từ chối)', kind: 'warranty', external: true, vars: ['ma_bh', 'huong_xu_ly', 'chi_tiet'], text: 'Kỹ sư đã phản hồi yêu cầu bảo hành #{ma_bh}: **{huong_xu_ly}**{chi_tiet}' },
  { key: 'warranty_refunded', group: 'Bảo hành', title: 'Đã hoàn tiền', trigger: 'Quản lý xác nhận đã chuyển tiền hoàn', kind: 'warranty', external: true, vars: ['so_tien', 'ma_bh'], text: 'Đã hoàn **{so_tien}** cho yêu cầu bảo hành #{ma_bh}' },

  { key: 'question_answered', group: 'Hỏi đáp & đánh giá', title: 'Shop trả lời câu hỏi', trigger: 'Shop trả lời câu hỏi của khách lần đầu', kind: 'reply', external: true, vars: ['ten_san_pham'], text: 'Shop đã trả lời câu hỏi của bạn về **{ten_san_pham}**' },
  { key: 'question_peer_answer', group: 'Hỏi đáp & đánh giá', title: 'Khách / nhân viên trả lời thêm', trigger: 'Có người trả lời câu hỏi của khách (đã hiện công khai)', kind: 'reply', external: false, vars: ['nguoi_tra_loi', 'ten_san_pham'], text: '{nguoi_tra_loi} vừa trả lời câu hỏi của bạn về **{ten_san_pham}**' },
  { key: 'review_replied', group: 'Hỏi đáp & đánh giá', title: 'Shop trả lời đánh giá', trigger: 'Shop trả lời đánh giá của khách lần đầu', kind: 'reply', external: false, vars: ['ten_san_pham'], text: 'Shop đã trả lời đánh giá của bạn về **{ten_san_pham}**' },

  { key: 'welcome_gift', group: 'Khuyến mãi', title: 'Quà tài khoản mới', trigger: 'Khách đăng nhập lần đầu và còn quà chào mừng', kind: 'promo', external: false, vars: ['ma_voucher', 'noi_dung_qua', 'han_dung'], text: 'Chào mừng bạn! Tặng bạn mã **{ma_voucher}**: {noi_dung_qua}, dùng đến {han_dung}.' },
];

export const EVENT_KEYS = EVENTS.map((e) => e.key);
export const eventOf = (key: string) => EVENTS.find((e) => e.key === key);
export const GROUPS = ['Đơn hàng', 'Bảo hành', 'Hỏi đáp & đánh giá', 'Khuyến mãi'] as const;

export const TEXT_MAX = 400;

/** Thay {biến} bằng giá trị; biến lạ / thiếu → để trống. */
export function renderText(text: string, vars: Record<string, string | number | undefined>) {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? (k === 'hotline' ? SALES_PHONE : '')));
}

export const sampleVars = (): Record<string, string> => Object.fromEntries(Object.entries(VARIABLES).map(([k, v]) => [k, v.sample]));

/** Biến trong nội dung không thuộc danh sách của sự kiện (gõ sai tên). */
export function unknownVars(text: string, vars: string[]) {
  const ok = new Set([...vars, ...GLOBAL_VARS]);
  return [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((k) => !ok.has(k)))];
}
