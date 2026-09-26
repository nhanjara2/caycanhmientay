# AddressModal
Hộp thoại **Thêm / Chỉnh sửa địa chỉ**, rộng tối đa 560px, nền mờ phía sau.

Thứ tự: tiêu đề + nút đóng → **Thông tin người nhận** (Họ tên, Số điện thoại – ô nhãn nổi) → **Địa chỉ nhận hàng**: ô chọn Phường/Tỉnh (bấm mở MapPicker; nếu là địa chỉ cũ thì kèm dải cảnh báo) + ô số nhà, tên đường → **Loại địa chỉ** → **Điều kiện giao cây lớn** → công tắc **Mặc định** → **Xóa địa chỉ** (chữ `danger`, chỉ khi sửa) → nút **Cập nhật** / **Lưu địa chỉ** ở chân hộp, luôn hiện.

- Chế độ thêm mới: tiêu đề "Thêm địa chỉ mới", không có Xóa; mở ra thì tự đề xuất MapPicker trước.
- **Điều kiện giao cây lớn** là phần thêm cho shop cây: chip chọn nhiều, dùng để xếp xe và người giao.
- Xóa địa chỉ cần xác nhận lần hai.
- Mobile: hộp chiếm toàn màn hình, trượt từ dưới lên.
