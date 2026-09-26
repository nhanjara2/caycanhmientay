# AdminOrders
Danh sách đơn hàng: AdminShell + DataTable.

Luồng xử lý một đơn có cây sống: **Chờ xác nhận** → gọi/nhắn xác nhận khung giờ → **Chuẩn bị cây** (kho chọn cây, chụp và tải ảnh trước khi giao — hệ thống tự gửi ảnh cho khách) → **Xếp chuyến giao** theo khung giờ và điều kiện giao → **Đang giao** → **Đã giao** (tài xế chụp ảnh giao hàng) → bắt đầu tính thời hạn bảo hành cây.

Bấm mã đơn mở trang chi tiết đơn phía admin: cùng thông tin như OrderDetail phía khách, thêm ghi chú nội bộ, lịch sử thao tác, nút đổi trạng thái, tải ảnh cây, in phiếu, hoàn tiền.
