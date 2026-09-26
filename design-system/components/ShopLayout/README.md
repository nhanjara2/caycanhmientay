# ShopLayout
Khung trang cho website nhiều mặt hàng: Header trên cùng, SidebarMenu cố định bên trái, vùng nội dung bên phải.

Thứ tự trong vùng nội dung trang chủ: CollectionStrip → Banner → Flash sale → các khối theo nhóm hàng lớn (Cây cảnh, Thuốc BVTV, Phân bón, Chậu, Đất…), mỗi khối có SectionHeader + chip tab nhóm con + lưới 4–5 ProductCard + "Xem tất cả" → Bắt bệnh cho cây → Góc chăm cây.

- Nội dung rộng tối đa 1200px (không tính sidebar), nền `surface-page`, các khối trên `surface` bo `radius-lg`.
- Trang danh mục dùng cùng khung: vùng phải là tiêu đề + chip lọc + lưới sản phẩm.
- Trang chi tiết sản phẩm và giỏ hàng ẩn sidebar để tập trung vào mua.
