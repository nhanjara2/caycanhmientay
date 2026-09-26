# CheckoutForm
Khối thông tin đặt hàng, theo thứ tự: hình thức nhận hàng → Thông tin người đặt → Thông tin nhận hàng → Khung giờ giao → Ghi chú → Hóa đơn điện tử.

- Người đặt: Họ tên, Số điện thoại (bắt buộc), Email (không bắt buộc). 2 cột trên desktop, 1 cột mobile.
- Nhận hàng: công tắc **Giống người đặt** bật sẵn; tắt đi mới hiện ô tên/số người nhận (dùng khi đặt cây làm quà).
- Địa chỉ là ô chọn mở bảng Tỉnh → Quận → Phường + số nhà, mặc định lấy từ ô "Giao đến" trên Header.
- **Khung giờ giao** (riêng cho shop cây): 4–6 ô, ô hết chỗ gạch ngang (`aria-disabled`), ô đang chọn `primary-soft`. Cây lớn cần người nhận có nhà.
- Lỗi hiện dưới ô, chữ `danger`, viền ô `danger`; không dùng hộp thoại.
