# AdminDashboard
Trang **Tổng quan** khi đăng nhập admin:

tiêu đề + chọn khoảng thời gian + Xuất báo cáo + **Tạo đơn tại quầy** → 4 KpiCard → biểu đồ doanh thu theo ngày | **Việc cần xử lý** → doanh thu theo nhóm hàng | tồn kho cần chú ý.

- **Việc cần xử lý** là khối quan trọng nhất: mỗi dòng là số đếm + mô tả + nút Xử lý dẫn thẳng tới danh sách đã lọc. Số đỏ (`sale`) cho việc ảnh hưởng trực tiếp tới khách: đơn chờ xác nhận, **cây chưa có ảnh trước khi giao**, bảo hành chờ duyệt.
- Tồn kho cần chú ý gồm cả **thuốc/phân sắp hết hạn**.
- Biểu đồ vẽ bằng thư viện biểu đồ khi làm thật; cột hôm nay `primary`, các ngày trước `primary-soft`.
- Nội dung đổi theo vai trò: kỹ sư chỉ thấy bảo hành, hỏi đáp, bài viết chờ duyệt; kho chỉ thấy tồn kho và đơn cần chuẩn bị.
