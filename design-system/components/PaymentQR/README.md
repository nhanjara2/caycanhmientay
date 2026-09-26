# PaymentQR
Màn chờ **chuyển khoản QR** sau khi bấm Đặt hàng với phương thức Chuyển khoản.

- **Đồng hồ giữ đơn** (`sale` trên `warning-soft`), thường 15 phút.
- Mã **VietQR** đã điền sẵn số tiền và nội dung; bên cạnh là bảng thông tin: số tiền, **nội dung chuyển khoản = mã đơn** (nền vàng nhạt, nhấn mạnh không sửa), ngân hàng, số tài khoản, chủ tài khoản — mỗi dòng có Sao chép.
- **Đang chờ thanh toán** với chấm nhấp nháy; hệ thống tự nhận tiền (qua đối soát ngân hàng/cổng thanh toán) và tự chuyển sang OrderSuccessLayout.
- 3 bước hướng dẫn ngắn; nút **Lưu ảnh mã QR** (mobile: dùng khi chuyển bằng app trên cùng điện thoại) và **Đổi phương thức**.
- Cột phải: tóm tắt tiền + ghi chú hết hạn.
- Mã QR trong design system chỉ là hình minh họa.
