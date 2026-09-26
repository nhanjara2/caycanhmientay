# AdminPromotions
Quản lý khuyến mãi: 4 KpiCard (đang chạy, doanh thu có KM, lượt dùng, chi phí) + bảng.

- Tab loại: Flash sale · Voucher (có mã) · Tự động (áp khi đủ điều kiện) · Combo · Điểm thưởng.
- Mỗi dòng: icon theo loại (cùng màu với VoucherItem phía khách), tên + mã, loại giảm, điều kiện, thời gian, **thanh đã dùng / tổng suất**, trạng thái.
- **Quy tắc dùng chung** (nút trên đầu): bảng chọn khuyến mãi nào được cộng dồn với nhau — chính là dữ liệu tạo nhóm "Không dùng chung được" ở VoucherModal.
- Form tạo khuyến mãi: loại → giá trị → điều kiện (nhóm hàng, giá trị đơn, hạng thành viên, **giỏ có cây sống**, khu vực giao) → số suất, giới hạn mỗi khách → thời gian, khung giờ → xem trước thẻ ưu đãi như khách thấy.
