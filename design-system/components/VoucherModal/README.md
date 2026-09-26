# VoucherModal
Hộp **Ưu đãi dành cho bạn**, mở từ "Thêm ưu đãi" trong OrderSummary. Cấu trúc theo trang dược: ô nhập mã → danh sách ưu đãi cuộn được → chân hộp có số ưu đãi đã chọn + nút **Áp dụng**.

- Ô nhập mã: nút "Áp dụng mã" xám khi trống, chuyển `primary` khi có chữ. Mã sai báo lỗi ngay dưới ô.
- Danh sách **chia 3 nhóm** để khách hiểu nhanh (trang dược trộn chung): **Đang áp dụng**, **Có thể dùng**, **Không dùng chung được**.
- Hệ thống tự chọn sẵn tổ hợp ưu đãi có lợi nhất; khách vẫn bỏ chọn được.
- Khi chọn một ưu đãi làm ưu đãi khác bị loại trừ, ưu đãi kia chuyển xuống nhóm "Không dùng chung được" kèm lý do.
- Thêm cho shop cây: dòng **Dùng điểm thưởng** (công tắc) ngay trên chân hộp; chân hộp hiện **tổng tiết kiệm**.
- Mobile: hộp full màn hình, chân hộp dính đáy.
