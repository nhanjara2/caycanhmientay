# SidebarMenu
Menu danh mục cố định bên trái, học theo cách siêu thị bách hóa trực tuyến trình bày hàng chục nghìn mã hàng: luôn nhìn thấy, bấm nhóm lớn thì nhóm con xổ ngay tại chỗ (accordion), không che nội dung.

Cấu trúc từ trên xuống:
1. Nhãn **DANH MỤC SẢN PHẨM** (`caption`, `ink-muted`).
2. **Lối tắt khuyến mãi**: Khuyến mãi hot, Flash sale (chữ `sale`), Bán chạy nhất.
3. **9 nhóm cấp 1**, mỗi nhóm có icon `primary`. Nhóm đang mở đổi chữ sang `primary`, mũi tên xoay 90°.
4. **Nhóm cấp 2** thụt vào dưới nhóm cha, kèm số sản phẩm `ink-muted`. Mục đang xem nền `primary-soft`.

Quy tắc:
- Rộng 248px, dính dưới header, tự cuộn bên trong khi dài hơn màn hình.
- Chỉ mở một nhóm cùng lúc; nhóm của trang đang xem mở sẵn.
- Ẩn nhóm con có 0 sản phẩm.
- Dưới 1024px: sidebar ẩn, thay bằng màn Danh mục toàn màn hình (xem MegaMenu).
