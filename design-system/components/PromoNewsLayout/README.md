# PromoNewsLayout
Trang **Tin khuyến mãi**, cùng khuôn với NewsCategoryLayout, thêm các phần riêng cho khuyến mãi:

- **Nhãn trạng thái** trên mọi bài: Đang diễn ra (`primary`) · Sắp diễn ra (`sun`) · Đã kết thúc (`surface-sunken`, thẻ mờ, xếp cuối) và **thời gian áp dụng**.
- Chip lọc theo trạng thái đầu danh sách.
- Chân thẻ có nút hành động: **Nhận ưu đãi** (lưu voucher vào tài khoản), **Đăng ký** (workshop), **Xem thể lệ**.
- Chuyên mục con: Chương trình khuyến mãi · Ưu đãi thành viên · Ưu đãi thanh toán · Workshop & Sự kiện.
- Cột phải: ô **Nhận tin qua Zalo** (`primary-deep`) và "Sắp hết hạn" để tạo cảm giác cấp bách.
- Mỗi chương trình có **trang thể lệ** riêng (PolicyArticle): thời gian, đối tượng, sản phẩm áp dụng, cách nhận, điều kiện, không áp dụng đồng thời — cần công bố rõ theo quy định về khuyến mại.
- Bài khuyến mãi lấy dữ liệu trạng thái, thời gian từ AdminPromotions để không bị lệch.
