# CartItem
Danh sách sản phẩm trong giỏ, chia **nhóm theo cách giao hàng**: "Cây sống" (giao riêng, chỉ nội thành) và "Vật tư – Thuốc – Phân bón" (giao nhanh).

Mỗi dòng: ảnh 64px → badge Flash sale (nếu có) + tên + đơn vị → giá (giá gạch dưới) → số lượng → dải khuyến mãi bên dưới.

- **Trang giỏ hàng**: số lượng là bộ tăng giảm + nút Xóa. **Trang thanh toán**: chỉ hiện "x1 Chậu".
- Dải khuyến mãi nền `surface-sunken`, chấm tròn `sale`, nhãn "Chỉ còn x/y suất" nền `sale`.
- Dải đầu danh sách nhắc điều kiện freeship (`primary-soft`).
- Nếu giỏ có thuốc BVTV, hộp lưu ý an toàn (`warning-soft`) xuất hiện cuối danh sách.
