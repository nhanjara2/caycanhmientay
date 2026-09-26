# ProductListingLayout
Trang **danh mục / danh sách sản phẩm** trên desktop, trong ShopLayout (SidebarMenu trái):

breadcrumb → đầu trang (tên danh mục + số sản phẩm, hàng **danh mục con** có ảnh nhỏ cuộn ngang) → **FilterBar** → lưới ProductCard 4 cột (5 cột khi màn ≥ 1440px) → **Xem thêm** kèm thanh tiến độ "đang xem n / tổng" (thay phân trang số, giữ vị trí khi quay lại) → đoạn **mô tả danh mục** thu gọn (cho SEO).

- Đang tải: lưới Skeleton; không có kết quả: EmptyState "Không có cây phù hợp" kèm nút bỏ bớt bộ lọc.
- Tablet: lưới 3 cột, FilterBar thu thành "Lọc" + "Sắp xếp"; mobile: xem MobileProductList.
