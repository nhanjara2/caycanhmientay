# AddressCard
Danh sách sổ địa chỉ: tiêu đề + nút **Thêm địa chỉ mới**, bên dưới là các thẻ địa chỉ trong một khối `surface`.

Mỗi thẻ: **Tên** | số điện thoại (`ink-muted`) · nhãn **Mặc định** (viền `primary`) · link **Sửa** bên phải → địa chỉ đầy đủ (600) → địa chỉ cũ nếu có → nhãn đặc điểm → dải cảnh báo.

- **Địa giới hành chính mới:** địa chỉ lưu trước khi sáp nhập phường/bỏ cấp quận hiện dòng "Địa chỉ cũ" và dải `warning-soft` "Cập nhật ngay" (mở MapPicker).
- **Nhãn giao hàng** (riêng cho shop cây, giúp điều xe đúng khi giao cây lớn): loại địa chỉ (Nhà riêng, Văn phòng, Công trình) và điều kiện tiếp cận (Xe tải vào được, Hẻm nhỏ – xe máy, Có thang máy).
- Địa chỉ mặc định luôn đứng đầu; tối đa 10 địa chỉ.
