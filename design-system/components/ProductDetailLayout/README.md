# ProductDetailLayout
Trang chi tiết sản phẩm hoàn chỉnh, cấu trúc học theo trang chi tiết của chuỗi nhà thuốc:

breadcrumb → **ProductGallery + BuyBox** (2 cột bằng nhau trong một khối `surface`) → **ProductContent** (mục lục + bài viết + kiểm duyệt chuyên môn) → **Thường mua kèm** (lưới ProductCard: đất, thuốc, phân, chậu phù hợp) → **FAQ** → **Reviews** → **QnA** → footer; **StickyBuyBar** hiện khi cuộn qua BuyBox.

- Trang này ẩn SidebarMenu, nội dung rộng tối đa 1200px.
- Mobile: 1 cột; ảnh trượt ngang full width, BuyBox ngay dưới ảnh, mục lục chuyển thành hàng tab cuộn ngang dính dưới header.
- "Thường mua kèm" thay cho "Sản phẩm liên quan" của trang dược: với cây, gợi ý vật tư chăm sóc bán được nhiều hơn gợi ý cây tương tự.
