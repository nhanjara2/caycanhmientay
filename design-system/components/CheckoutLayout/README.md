# CheckoutLayout
Trang thanh toán 2 cột, học theo trang thanh toán của chuỗi nhà thuốc: cột trái các bước điền thông tin, cột phải OrderSummary dính theo khi cuộn.

Cột trái từ trên xuống: thanh bước (Giỏ hàng › Thanh toán › Hoàn tất) → CheckoutForm → CartItem (chế độ chỉ xem) → PaymentMethods.

- Trang này **ẩn SidebarMenu**, Header rút gọn còn logo + hotline để khách tập trung đặt hàng.
- Cột phải rộng 340px; dưới 1024px dồn thành 1 cột, OrderSummary thành thanh đáy cố định.
- Trang **Giỏ hàng** (bước trước) dùng cùng khung: cột trái là CartItem có bộ tăng giảm + gợi ý mua kèm (đất, chậu, phân cho cây vừa thêm), cột phải là OrderSummary với nút "Tiến hành đặt hàng".
