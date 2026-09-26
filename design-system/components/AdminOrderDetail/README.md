# AdminOrderDetail
Chi tiết một đơn phía admin (mở từ mã đơn ở AdminOrders).

- Đầu trang: mã đơn + trạng thái, nút In phiếu · Hoàn tiền · **nút chuyển trạng thái kế tiếp** (bị khóa khi thiếu điều kiện, ví dụ chưa đủ ảnh cây).
- **Thanh tiến trình** 5 bước (xong `primary-soft`, hiện tại `primary`).
- Cột trái: sản phẩm (kèm **kho, vị trí kệ/nhà lưới**), **Ảnh cây trước khi giao** (bắt buộc, tối thiểu 2 ảnh, tự gửi khách khi lưu), **ghi chú nội bộ** (nền `warning-soft`, gõ @ để nhắc đồng nghiệp — khách không thấy).
- Cột phải: khách hàng và **điều kiện giao**, khung giờ, chuyến được gán; thanh toán và số tiền thu hộ; **lịch sử thao tác** (ai, lúc nào, làm gì).
- Hoàn tiền và sửa đơn sau khi xác nhận cần quyền Quản lý + OTP (AdminRoles).
