# DataTable
Bảng dữ liệu dùng cho mọi danh sách trong admin (đơn hàng, sản phẩm, khách hàng, bài viết…).

Từ trên xuống: **tab trạng thái** có số đếm → **bộ lọc** (ô tìm + các ô chọn + bộ lọc nhanh) → **thanh thao tác hàng loạt** (`primary-soft`, chỉ hiện khi đã tích chọn) → bảng → phân trang.

- Tiêu đề cột 12px `ink-muted` trên `surface-sunken`; dòng 13px, cao ~52px, dòng phụ 11px `ink-muted`.
- Cột số canh phải, chữ số đều (tabular). Mã đơn đậm `primary`, bấm mở chi tiết.
- **Nhãn trạng thái** (`ad-pill`): Chờ xác nhận `sale` · Chuẩn bị cây `primary` nhạt · Đang giao `primary` đặc · Đã giao `success` · Chờ khách lấy / chờ `ink-muted` · Đã hủy `danger`.
- **Cờ nhỏ** dưới tên sản phẩm (riêng cho shop cây): Có cây sống, Xe tải / Hẻm nhỏ (từ điều kiện giao của địa chỉ), Có thuốc BVTV, **Thiếu ảnh cây** (màu `sale` — chưa được chuyển sang Đang giao khi còn thiếu).
- Thao tác hàng loạt cho đơn: Xác nhận, **Xếp chuyến giao**, In phiếu.
- Bộ lọc giữ nguyên khi quay lại trang; có nút lưu bộ lọc thường dùng.
