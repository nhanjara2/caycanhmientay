# AdminRoles
Phân quyền theo vai trò: **ma trận chức năng × vai trò** với 3 mức (Toàn quyền `primary` · Chỉ xem `primary-soft` · Ẩn `surface-sunken`).

5 vai trò mặc định:
- **Quản lý:** toàn quyền.
- **Chăm sóc khách hàng (CSKH):** đơn hàng, khách hàng, hỏi đáp (toàn quyền); bảo hành, khuyến mãi, sản phẩm (chỉ xem).
- **Kho:** kho (toàn quyền), giao hàng (xếp hàng lên xe), xem đơn và sản phẩm.
- **Kỹ sư:** bảo hành cây, bài viết & bệnh cây, hỏi đáp (toàn quyền); xem khách hàng và sản phẩm.
- **Giao hàng:** chỉ app giao hàng (StaffDeliveryApp).

Mỗi nhân viên gắn 1 vai trò + phạm vi cửa hàng. Thao tác nhạy cảm cần OTP và được ghi nhật ký.
