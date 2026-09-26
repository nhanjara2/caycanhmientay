# OrderDetail
Chi tiết một đơn hàng, 2 cột như trang dược: cột trái thông tin đơn, cột phải khối **Thông tin thanh toán** dạng hóa đơn (mép dưới răng cưa).

Cột trái:
1. Đầu: Đơn hàng ngày + trạng thái + menu (Hủy / Hỗ trợ), hình thức nhận · mã đơn + **Sao chép**.
2. Trạng thái: thời gian, tiêu đề lớn ("Giao hàng thành công"), lời nhắn, OrderTimeline.
3. Người nhận | Giao đến (hoặc Nhận tại vườn), kèm điều kiện giao.
4. **Dải bảo hành cây** (`primary-soft`) + nút **Yêu cầu bảo hành** — chỉ khi đơn có cây sống và còn hạn.
5. **Ảnh cây trước khi giao** (riêng cho shop cây) — căn cứ khi xử lý bảo hành.
6. Danh sách sản phẩm, mỗi dòng có link **Xem cách chăm sóc** (cây) hoặc **Xem cách dùng và liều pha** (thuốc).

Cột phải: các dòng tiền, Thành tiền, phương thức + trạng thái thanh toán, nút **Mua lại**, **Đánh giá sản phẩm**, **Tải hóa đơn điện tử**. Mobile: cột phải xuống dưới, nút Mua lại dính đáy màn hình.
