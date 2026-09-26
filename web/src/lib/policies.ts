// Nội dung trang giới thiệu, chính sách, hướng dẫn (PolicyLayout).
// Trang "Giới thiệu" dùng nguyên bài trong design system; các trang khác là bản nháp ngắn
// để thay bằng nội dung chính thức (đặc biệt phần pháp lý).

export type Policy = { slug: string; title: string; group: string; body?: { h: string; p: string[] }[] };

export const POLICY_GROUPS = ['VỀ CÂY CẢNH MIỀN TÂY', 'CHÍNH SÁCH', 'HƯỚNG DẪN & ĐIỀU KHOẢN'] as const;

export const policies: Policy[] = [
  { slug: 'gioi-thieu', title: 'Giới thiệu Cây Cảnh Miền Tây', group: POLICY_GROUPS[0] },
  { slug: 'giay-phep-kinh-doanh', title: 'Giấy phép kinh doanh', group: POLICY_GROUPS[0], body: [
    { h: 'Thông tin doanh nghiệp', p: ['Tên pháp nhân, mã số doanh nghiệp, ngày cấp và nơi cấp điền đúng theo giấy đăng ký kinh doanh.'] },
    { h: 'Giấy chứng nhận đủ điều kiện buôn bán thuốc BVTV', p: ['Số giấy chứng nhận, cơ quan cấp và thời hạn hiệu lực.'] },
  ] },
  { slug: 'quy-che-hoat-dong', title: 'Quy chế hoạt động', group: POLICY_GROUPS[0], body: [
    { h: 'Nguyên tắc chung', p: ['Website thương mại điện tử bán lẻ cây cảnh, vật tư nông nghiệp do Cây Cảnh Miền Tây vận hành.'] },
  ] },
  { slug: 'doi-ngu-chuyen-mon', title: 'Đội ngũ chuyên môn', group: POLICY_GROUPS[0], body: [
    { h: 'Kỹ sư nông nghiệp', p: ['Mọi nội dung chăm cây, bắt bệnh và hướng dẫn dùng thuốc đều được kỹ sư kiểm duyệt trước khi đăng.'] },
  ] },
  { slug: 'giao-hang', title: 'Chính sách giao hàng', group: POLICY_GROUPS[1], body: [
    { h: 'Cây sống', p: ['Giao riêng bằng xe tải nhỏ, chỉ nội thành. Phí 35.000đ, miễn phí cho đơn cây từ 800.000đ.', 'Khách chọn khung giờ giao khi đặt hàng; shop gửi ảnh cây thật trước khi giao.'] },
    { h: 'Vật tư – Thuốc – Phân bón', p: ['Giao nhanh 2 giờ nội thành. Phí 20.000đ, miễn phí cho đơn vật tư từ 300.000đ.'] },
  ] },
  { slug: 'bao-hanh-cay', title: 'Chính sách bảo hành cây', group: POLICY_GROUPS[1], body: [
    { h: 'Thời gian bảo hành', p: ['7 ngày kể từ khi nhận cây. Cây héo, vàng lá bất thường hoặc bệnh được đổi cây mới cùng loại.'] },
    { h: 'Cách gửi yêu cầu', p: ['Vào Tài khoản → Bảo hành cây, chụp 3 ảnh theo gợi ý. Kỹ sư phản hồi trong 24 giờ.'] },
  ] },
  { slug: 'doi-tra', title: 'Chính sách đổi trả', group: POLICY_GROUPS[1], body: [
    { h: 'Vật tư, thuốc, phân bón', p: ['Đổi trả trong 7 ngày nếu còn nguyên tem, chưa mở bao bì.'] },
  ] },
  { slug: 'thanh-toan', title: 'Chính sách thanh toán', group: POLICY_GROUPS[1], body: [
    { h: 'Phương thức', p: ['Tiền mặt khi nhận hàng, chuyển khoản QR, ví MoMo, ZaloPay, thẻ quốc tế. Đơn Flash sale không áp dụng tiền mặt.'] },
  ] },
  { slug: 'dat-coc', title: 'Chính sách đặt cọc (cây lớn, công trình)', group: POLICY_GROUPS[1], body: [
    { h: 'Mức cọc', p: ['Cây lớn đặt trước và công trình sân vườn cọc 30% giá trị, phần còn lại thanh toán khi nhận.'] },
  ] },
  { slug: 'bao-mat', title: 'Chính sách bảo mật dữ liệu cá nhân', group: POLICY_GROUPS[1], body: [
    { h: 'Dữ liệu thu thập', p: ['Số điện thoại đã xác thực, địa chỉ nhận hàng, lịch sử mua để giao cây, bảo hành và nhắc chăm cây.'] },
  ] },
  { slug: 'noi-dung', title: 'Chính sách nội dung', group: POLICY_GROUPS[1], body: [
    { h: 'Kiểm duyệt', p: ['Bài viết và trả lời hỏi đáp được kỹ sư kiểm duyệt; đánh giá của khách được duyệt trước khi hiển thị.'] },
  ] },
  { slug: 'thuoc-bvtv-an-toan', title: 'Hướng dẫn sử dụng thuốc BVTV an toàn', group: POLICY_GROUPS[2], body: [
    { h: 'Trước khi pha', p: ['Đọc kỹ nhãn: hoạt chất, liều pha, thời gian cách ly. Đeo găng tay, khẩu trang.'] },
    { h: 'Sau khi phun', p: ['Rửa tay, tắm; cất thuốc xa tầm tay trẻ em và vật nuôi; không đổ thuốc thừa xuống cống.'] },
  ] },
  { slug: 'huong-dan-mua-hang', title: 'Hướng dẫn mua hàng', group: POLICY_GROUPS[2], body: [
    { h: 'Các bước', p: ['Chọn sản phẩm → Giỏ hàng → Thanh toán: chọn hình thức nhận, khung giờ giao, phương thức thanh toán → Đặt hàng.'] },
  ] },
  { slug: 'tich-diem', title: 'Thể lệ tích điểm thành viên', group: POLICY_GROUPS[2], body: [
    { h: 'Tích điểm', p: ['Mỗi 10.000đ thanh toán được 1 điểm, cộng sau khi nhận hàng.'] },
  ] },
  { slug: 'dieu-khoan', title: 'Điều khoản sử dụng', group: POLICY_GROUPS[2], body: [
    { h: 'Phạm vi', p: ['Điều khoản áp dụng cho mọi khách truy cập và mua hàng tại website.'] },
  ] },
];

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
