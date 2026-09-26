# OrderCard
Thẻ đơn hàng trong danh sách, theo cấu trúc của trang dược:

đầu thẻ: **Đơn hàng ngày** + bút đặt tên đơn · hình thức nhận · mã đơn · **trạng thái** (chấm màu) bên phải → 1–2 dòng sản phẩm (ảnh 56px, tên, đơn vị, giá, số lượng) + "và n sản phẩm khác" → **Xem chi tiết** | **Thành tiền** → chân thẻ: gợi ý + nút hành động.

Màu trạng thái: Đang xử lý `sale` · Đang giao `primary` · Đã giao `success` · Đã hủy `danger` · Trả hàng `ink-muted`.

Nút theo trạng thái:
- **Đang xử lý:** Hủy đơn (chữ `danger`), Xem chi tiết.
- **Đang giao:** Liên hệ shop, Theo dõi đơn; gợi ý khung giờ giao dự kiến.
- **Đã giao:** Đánh giá, **Mua lại**; gợi ý **"Bảo hành cây còn n ngày"** nếu đơn có cây sống.
- **Đã hủy:** Mua lại.
