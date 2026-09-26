# PaymentMethods
Danh sách phương thức thanh toán dạng radio, mỗi dòng có ô logo 32px, tên và dòng mô tả.

- Thứ tự: Tiền mặt khi nhận (COD) → Chuyển khoản QR → MoMo → ZaloPay → Thẻ quốc tế/Apple Pay.
- Dòng đang chọn nền `primary-soft`, radio `primary`.
- Dòng không khả dụng mờ đi (`aria-disabled`) kèm lý do, ví dụ COD không áp dụng cho đơn Flash sale hoặc đơn cây lớn trên 2 triệu.
- Ô logo: dùng logo chính thức do đối tác thanh toán cung cấp khi tích hợp; trong design system tạm là icon.
