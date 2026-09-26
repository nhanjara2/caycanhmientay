# ProductCard
Thẻ sản phẩm dùng chung cho cây, thuốc, phân bón và vật tư, theo cấu trúc thẻ của chuỗi nhà thuốc.

Thứ tự từ trên xuống: ảnh vuông (badge xuất xứ trái, badge giảm giá phải) → tên 2 dòng → bộ chọn đơn vị → giá `primary` kèm "/ đơn vị" → giá gạch → quy cách `ink-muted` → nút Chọn mua full width.

- Giá luôn ghi rõ đơn vị: / Chậu, / Chai, / Bao, / Gói. Khách mua vật tư so sánh theo đơn vị.
- Cây: quy cách là chiều cao + đường kính chậu. Thuốc/phân: dung tích, khối lượng. Đất: thể tích + thành phần chính.
- Ảnh cây chụp nền trơn sáng, cùng góc; ảnh thuốc/phân chụp chính diện bao bì. Bên trong khung dùng `surface-sunken`.
- Lưới: 5 cột desktop, 2 cột mobile, gap `space-4`/`space-3`.
- Không đặt nhiều hơn 2 badge trên ảnh.
