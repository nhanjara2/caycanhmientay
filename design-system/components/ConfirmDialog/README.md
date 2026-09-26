# ConfirmDialog
Hộp xác nhận nhỏ (360px) cho thao tác quan trọng hoặc không hoàn tác được.

- Icon tròn trên cùng: thao tác xóa/hủy (`danger` trên `surface-sunken`) · cảnh báo (`sale` trên `warning-soft`).
- Tiêu đề là **câu hỏi hoặc tình huống cụ thể** ("Hủy đơn hàng #…?"), 1–2 câu nói rõ hậu quả.
- 2 nút ngang nhau: nút an toàn bên trái (outline), nút hành động bên phải; hành động nguy hiểm dùng nút `danger` (`vx-btn--danger`).
- Có thể thêm 1 trường (lý do hủy). Esc/bấm ra ngoài = chọn nút an toàn.
- Chỉ dùng khi không Hoàn tác được; ngược lại dùng Toast có Hoàn tác.
