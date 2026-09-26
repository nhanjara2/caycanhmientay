# AddressBookLayout
Trang Sổ địa chỉ trong AccountLayout: AccountSidebar (mục "Sổ địa chỉ nhận hàng" đang chọn) + danh sách AddressCard.

Luồng:
- **Thêm địa chỉ mới** → MapPicker → AddressModal (chế độ thêm, đã điền sẵn phường/tỉnh từ bản đồ) → Lưu.
- **Sửa** → AddressModal (chế độ sửa). Bấm ô Phường/Tỉnh hoặc "Cập nhật ngay" → MapPicker → quay lại AddressModal.
- Cùng AddressModal và MapPicker được dùng lại ở trang thanh toán khi khách đổi địa chỉ giao.
