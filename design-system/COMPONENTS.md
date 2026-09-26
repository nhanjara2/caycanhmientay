# Danh sách component

148 component, nhóm theo marker `@dsCard group` trong `preview.html`.
Sinh bằng `node tools/build-index.mjs` — không sửa tay.

Trang đầy đủ (`page`): 47 · có preview: 147 · có hướng dẫn: 147

## — (2)

| Component | Mô tả |
|---|---|
| [Cover](components/Cover/preview.html) | — |
| **VoiceTone** | Giọng văn thương hiệu — áp dụng cho website, tin Zalo, trả lời khách, bài viết, quảng cáo. |

## Admin (18)

| Component | Mô tả |
|---|---|
| [AdminContent](components/AdminContent/preview.html) · *trang* | Soạn bài Góc chăm cây, trang bệnh cây và video. |
| [AdminCustomers](components/AdminCustomers/preview.html) · *trang* | Danh sách khách hàng + bảng chi tiết bên phải (mở khi bấm một dòng, không rời trang). |
| [AdminDelivery](components/AdminDelivery/preview.html) · *trang* | Bảng xếp chuyến giao theo ngày — màn riêng của shop cây vì cây lớn cần xe và người phù hợp. |
| [AdminInventory](components/AdminInventory/preview.html) · *trang* | Tồn kho theo từng kho/cửa hàng. |
| [AdminOrderDetail](components/AdminOrderDetail/preview.html) · *trang* | Chi tiết một đơn phía admin (mở từ mã đơn ở AdminOrders). |
| [AdminPOS](components/AdminPOS/preview.html) · *trang* | Bán tại quầy cho cửa hàng/vườn — màn toàn màn hình, không có menu admin, dùng được trên máy tính bảng. |
| [AdminPromotions](components/AdminPromotions/preview.html) · *trang* | Quản lý khuyến mãi: 4 KpiCard (đang chạy, doanh thu có KM, lượt dùng, chi phí) + bảng. |
| [AdminPurchasing](components/AdminPurchasing/preview.html) · *trang* | Nhập hàng và nhà cung cấp. |
| [AdminReports](components/AdminReports/preview.html) · *trang* | Báo cáo tổng hợp, chọn khoảng thời gian và cửa hàng, xuất Excel. |
| [AdminReviews](components/AdminReviews/preview.html) · *trang* | Duyệt đánh giá và trả lời hỏi đáp. |
| [AdminRoles](components/AdminRoles/preview.html) · *trang* | Phân quyền theo vai trò: ma trận chức năng × vai trò với 3 mức (Toàn quyền primary · Chỉ xem primary-soft · Ẩn surface-sunken). |
| [AdminServiceRequests](components/AdminServiceRequests/preview.html) · *trang* | Quản lý yêu cầu dịch vụ (từ QuoteRequestForm, BusinessLayout, hotline) dạng bảng kéo thả theo giai đoạn: |
| [AdminShell](components/AdminShell/preview.html) | Khung chung của trang quản trị: menu trái 232px nền primary-deep + thanh trên + vùng nội dung trên surface-page. |
| [AdminShippingSettings](components/AdminShippingSettings/preview.html) · *trang* | Cài đặt giao hàng: |
| [DataTable](components/DataTable/preview.html) | Bảng dữ liệu dùng cho mọi danh sách trong admin (đơn hàng, sản phẩm, khách hàng, bài viết…). |
| [KpiCard](components/KpiCard/preview.html) | Ô chỉ số ở đầu trang Tổng quan: nhãn có icon, số lớn 22px, dòng so sánh. |
| [MessageTemplates](components/MessageTemplates/preview.html) · *trang* | Mẫu tin nhắn tự động gửi khách qua Zalo (ZNS/OA), email, SMS dự phòng. |
| [PrintTemplates](components/PrintTemplates/preview.html) | Mẫu in ấn cho vận hành — nền trắng chữ đen, không dùng màu (in nhiệt/đen trắng). |

## App nhân viên (2)

| Component | Mô tả |
|---|---|
| [StaffDeliveryApp](components/StaffDeliveryApp/preview.html) | App (hoặc web mobile) cho tài xế giao hàng — vai trò Giao hàng chỉ thấy phần này. |
| [StaffWarehouseApp](components/StaffWarehouseApp/preview.html) | App cho nhân viên kho / vườn — vai trò Kho. |

## Bắt bệnh cây (2)

| Component | Mô tả |
|---|---|
| [DiseaseGroupGrid](components/DiseaseGroupGrid/preview.html) | Lưới nhóm bệnh theo nguyên nhân, học theo khối "Nhóm bệnh chuyên khoa" của trang dược: 4 cột, mỗi ô có ảnh tròn 72px, tên nhóm, số bài viết. |
| [PlantPartMap](components/PlantPartMap/preview.html) | Tra cứu bệnh theo bộ phận của cây, học theo khối "Cơ thể người" của trang tìm hiểu bệnh bên dược: |

## Bố cục (31)

| Component | Mô tả |
|---|---|
| [AccountLayout](components/AccountLayout/preview.html) · *trang* | Khung chung cho mọi trang tài khoản: Header → breadcrumb → lưới 2 cột (AccountSidebar 290px | nội dung). |
| [AddressBookLayout](components/AddressBookLayout/preview.html) · *trang* | Trang Sổ địa chỉ trong AccountLayout: AccountSidebar (mục "Sổ địa chỉ nhận hàng" đang chọn) + danh sách AddressCard. |
| [AdminDashboard](components/AdminDashboard/preview.html) · *trang* | Trang Tổng quan khi đăng nhập admin: |
| [AdminOrders](components/AdminOrders/preview.html) · *trang* | Danh sách đơn hàng: AdminShell + DataTable. |
| [AdminProductForm](components/AdminProductForm/preview.html) · *trang* | Form thêm / sửa sản phẩm, 2 cột: nội dung chính bên trái, thiết lập bên phải; thanh Lưu dính đáy. |
| [AdminWarranty](components/AdminWarranty/preview.html) · *trang* | Xử lý một yêu cầu bảo hành cây — màn riêng của shop cây, không có bên trang dược. |
| [ArticleDetailLayout](components/ArticleDetailLayout/preview.html) · *trang* | Trang bài viết Góc chăm cây, 3 cột: mục lục dính (220px) | bài (tối đa 720px, chữ 16px, dòng 27px — dễ đọc lâu) | cột phải dính (280px). |
| [BlogLayout](components/BlogLayout/preview.html) · *trang* | Trang chủ Góc chăm cây, bố cục theo trang Góc sức khỏe của chuỗi nhà thuốc: |
| [BusinessLayout](components/BusinessLayout/preview.html) · *trang* | Trang Khách doanh nghiệp: |
| [CampaignLayout](components/CampaignLayout/preview.html) · *trang* | Trang chiến dịch theo mùa, ví dụ Cây Tết đặt trước. Dùng cùng khuôn cho Trung thu, 20/10, khai trương mùa cuối năm. |
| [CheckoutLayout](components/CheckoutLayout/preview.html) · *trang* | Trang thanh toán 2 cột, học theo trang thanh toán của chuỗi nhà thuốc: cột trái các bước điền thông tin, cột phải OrderSummary dính theo khi cuộn. |
| [DiseaseDetailLayout](components/DiseaseDetailLayout/preview.html) · *trang* | Trang chi tiết một bệnh trong thư viện bệnh cây: |
| [DiseaseLibraryLayout](components/DiseaseLibraryLayout/preview.html) · *trang* | Trang Tìm hiểu bệnh cây trồng: Header → breadcrumb → tiêu đề canh giữa + dòng dẫn sang Bắt bệnh cho cây (PlantClinic) → ô tìm theo triệu chứng → Pl… |
| [FlashSaleLayout](components/FlashSaleLayout/preview.html) · *trang* | Trang Flash sale đầy đủ (mở từ khối FlashSale trên trang chủ và lối tắt ở SidebarMenu): |
| [Footer](components/Footer/preview.html) | Footer chung cho mọi trang, cấu trúc theo footer chuỗi nhà thuốc: |
| [NewsCategoryLayout](components/NewsCategoryLayout/preview.html) · *trang* | Trang Truyền thông (tin hoạt động công ty): Header → breadcrumb → NewsHero → danh sách NewsListCard + cột phải 280px (Xem nhiều, Liên hệ báo chí kè… |
| [NotFoundPage](components/NotFoundPage/preview.html) · *trang* | Trang 404 (không tìm thấy): số 404 lớn primary-soft với chiếc lá thay số 0, tiêu đề vui nhẹ, giải thích ngắn, ô tìm kiếm, 2 nút Về trang chủ · Xem… |
| [OrderDetailLayout](components/OrderDetailLayout/preview.html) · *trang* | Trang chi tiết đơn hàng: Header → breadcrumb (Trang chủ / Tài khoản / Đơn hàng của tôi / Chi tiết đơn hàng) → OrderDetail toàn chiều rộng (ẩn Accou… |
| [OrdersLayout](components/OrdersLayout/preview.html) · *trang* | Trang Đơn hàng của tôi trong AccountLayout: AccountSidebar + OrderTabs + danh sách OrderCard (tải thêm khi cuộn, 10 đơn mỗi lần). |
| [OrderSuccessLayout](components/OrderSuccessLayout/preview.html) · *trang* | Trang Đặt hàng thành công: |
| [PolicyLayout](components/PolicyLayout/preview.html) · *trang* | Khung chung cho mọi trang giới thiệu, chính sách, hướng dẫn, điều khoản: Header → breadcrumb → 2 cột (PolicyNav 260px | PolicyArticle) trên nền sur… |
| [ProductDetailLayout](components/ProductDetailLayout/preview.html) · *trang* | Trang chi tiết sản phẩm hoàn chỉnh, cấu trúc học theo trang chi tiết của chuỗi nhà thuốc: |
| [ProductListingLayout](components/ProductListingLayout/preview.html) · *trang* | Trang danh mục / danh sách sản phẩm trên desktop, trong ShopLayout (SidebarMenu trái): |
| [PromoNewsLayout](components/PromoNewsLayout/preview.html) · *trang* | Trang Tin khuyến mãi, cùng khuôn với NewsCategoryLayout, thêm các phần riêng cho khuyến mãi: |
| [QuoteRequestForm](components/QuoteRequestForm/preview.html) · *trang* | Form Đặt lịch khảo sát & báo giá cho mọi dịch vụ; mở từ các nút CTA ở trang dịch vụ (điền sẵn dịch vụ, số cây từ máy tính ước tính). |
| [SearchResultsLayout](components/SearchResultsLayout/preview.html) · *trang* | Trang kết quả tìm kiếm, trong ShopLayout: |
| [SectionHeader](components/SectionHeader/preview.html) | Tiêu đề mỗi khối trên trang chủ: ô icon vuông màu primary, tiêu đề heading-1/20px, link "Xem tất cả" bên phải. |
| [ServiceDetailLayout](components/ServiceDetailLayout/preview.html) · *trang* | Trang chi tiết một dịch vụ, ví dụ Cho thuê cây văn phòng: |
| [ServicesHubLayout](components/ServicesHubLayout/preview.html) · *trang* | Trang Dịch vụ (menu Dịch vụ sân vườn ở Header/Footer): trang giới thiệu dạng landing, mục tiêu là nhận yêu cầu khảo sát / báo giá. |
| [ShopLayout](components/ShopLayout/preview.html) · *trang* | Khung trang cho website nhiều mặt hàng: Header trên cùng, SidebarMenu cố định bên trái, vùng nội dung bên phải. |
| [StoreLocatorLayout](components/StoreLocatorLayout/preview.html) · *trang* | Trang Hệ thống cửa hàng: Header → breadcrumb → tiêu đề + giờ mở cửa chung → 2 cột (StoreFinder 360px | StoreDetail). |

## Chi tiết sản phẩm (8)

| Component | Mô tả |
|---|---|
| [BuyBox](components/BuyBox/preview.html) | Khối mua bên phải trang chi tiết, theo đúng thứ tự của trang dược: |
| [FAQ](components/FAQ/preview.html) | Câu hỏi thường gặp dạng accordion, 4–6 câu, câu đầu mở sẵn. |
| [ProductContent](components/ProductContent/preview.html) | Phần nội dung dài dưới khối mua: mục lục dính bên trái, bài viết bên phải. |
| [ProductGallery](components/ProductGallery/preview.html) | Khối ảnh bên trái trang chi tiết: ảnh chính vuông, hàng ảnh nhỏ, ghi chú và 3 cam kết. |
| [QnA](components/QnA/preview.html) | Khối hỏi đáp công khai dưới đánh giá: ô nhập câu hỏi → chip sắp xếp → danh sách câu hỏi và trả lời. |
| [Reviews](components/Reviews/preview.html) | Khối đánh giá: điểm trung bình + phân bố sao → chip lọc → danh sách đánh giá → "Xem thêm". |
| [SpecTable](components/SpecTable/preview.html) | Bảng thông số 2 cột (nhãn ink-muted 140px, giá trị ink), đặt trong BuyBox dưới đoạn mô tả ngắn. Dòng có link phụ ("Tra cứu giấy phép", "Xem các mẫu… |
| [StickyBuyBar](components/StickyBuyBar/preview.html) | Thanh mua dính ở đáy màn hình, hiện khi khách cuộn qua khỏi BuyBox (khi đọc mô tả, đánh giá). |

## Cửa hàng (2)

| Component | Mô tả |
|---|---|
| [StoreDetail](components/StoreDetail/preview.html) | Thông tin cửa hàng đang chọn, theo trang hệ thống nhà thuốc: |
| [StoreFinder](components/StoreFinder/preview.html) | Cột tìm cửa hàng, theo trang hệ thống nhà thuốc: |

## Điều hướng (6)

| Component | Mô tả |
|---|---|
| [Header](components/Header/preview.html) | Header gọn 2 tầng trên nền primary-deep, đi cùng SidebarMenu (không còn hàng menu ngang trên desktop). |
| [MegaMenu](components/MegaMenu/preview.html) | Bảng danh mục 2 cột: cột trái là nhóm cấp 1, lưới phải là nhóm cấp 2 kèm ảnh nhỏ. |
| [NotificationCenter](components/NotificationCenter/preview.html) | Trung tâm thông báo, mở từ nút chuông trên Header (số chưa đọc sale). Mobile: trang riêng từ chuông ở MobileShell. |
| [QuickActions](components/QuickActions/preview.html) | Hàng lối tắt ngay dưới banner, giống hàng "Cần mua thuốc / Tư vấn với dược sĩ / Đơn của tôi" của chuỗi nhà thuốc. |
| [SearchSuggest](components/SearchSuggest/preview.html) | Hộp gợi ý hiện ngay khi gõ vào ô tìm kiếm trên Header (sau 2 ký tự, trễ ~150ms). |
| [SidebarMenu](components/SidebarMenu/preview.html) | Menu danh mục cố định bên trái, học theo cách siêu thị bách hóa trực tuyến trình bày hàng chục nghìn mã hàng: luôn nhìn thấy, bấm nhóm lớn thì nhóm… |

## Đơn hàng (4)

| Component | Mô tả |
|---|---|
| [OrderCard](components/OrderCard/preview.html) | Thẻ đơn hàng trong danh sách, theo cấu trúc của trang dược: |
| [OrderDetail](components/OrderDetail/preview.html) | Chi tiết một đơn hàng, 2 cột như trang dược: cột trái thông tin đơn, cột phải khối Thông tin thanh toán dạng hóa đơn (mép dưới răng cưa). |
| [OrderTabs](components/OrderTabs/preview.html) | Tiêu đề "Đơn hàng của tôi" kèm nút tìm đơn và menu thêm, bên dưới là hàng tab trạng thái. |
| [OrderTimeline](components/OrderTimeline/preview.html) | Thanh tiến trình 5 bước của đơn: Đặt hàng → Xác nhận → Chuẩn bị cây → Đang giao → Đã giao. |

## Giỏ hàng (9)

| Component | Mô tả |
|---|---|
| [CartItem](components/CartItem/preview.html) | Danh sách sản phẩm trong giỏ, chia nhóm theo cách giao hàng: "Cây sống" (giao riêng, chỉ nội thành) và "Vật tư – Thuốc – Phân bón" (giao nhanh). |
| [CheckoutForm](components/CheckoutForm/preview.html) | Khối thông tin đặt hàng, theo thứ tự: hình thức nhận hàng → Thông tin người đặt → Thông tin nhận hàng → Khung giờ giao → Ghi chú → Hóa đơn điện tử. |
| [DeliveryToggle](components/DeliveryToggle/preview.html) | Công tắc 2 lựa chọn ở đầu trang thanh toán: Giao tận nơi hoặc Nhận tại vườn/cửa hàng. |
| [GiftOptions](components/GiftOptions/preview.html) | Tùy chọn quà tặng trong trang thanh toán (bật công tắc "Đây là quà tặng"), và trên chi tiết sản phẩm thuộc danh mục Quà tặng cây. |
| [MiniCart](components/MiniCart/preview.html) | Hai phản hồi sau khi thêm vào giỏ, trên desktop: |
| [OrderSummary](components/OrderSummary/preview.html) | Khối tổng tiền cột phải, dính theo khi cuộn (sticky) trên desktop; trên mobile thu thành thanh đáy cố định (Thành tiền + nút Đặt hàng), bấm vào mở… |
| [PaymentMethods](components/PaymentMethods/preview.html) | Danh sách phương thức thanh toán dạng radio, mỗi dòng có ô logo 32px, tên và dòng mô tả. |
| [PaymentQR](components/PaymentQR/preview.html) | Màn chờ chuyển khoản QR sau khi bấm Đặt hàng với phương thức Chuyển khoản. |
| [VoucherModal](components/VoucherModal/preview.html) | Hộp Ưu đãi dành cho bạn, mở từ "Thêm ưu đãi" trong OrderSummary. Cấu trúc theo trang dược: ô nhập mã → danh sách ưu đãi cuộn được → chân hộp có số… |

## Góc chăm cây (6)

| Component | Mô tả |
|---|---|
| [BlogCategoryBlock](components/BlogCategoryBlock/preview.html) | Khối một chuyên mục trên trang Góc chăm cây, cấu trúc như trang dược: |
| [BlogFeatureBlock](components/BlogFeatureBlock/preview.html) | Biến thể khối chuyên mục kiểu tạp chí: 1 bài lớn bên trái (ảnh 16:10, tiêu đề 20px) + 4 bài nhỏ bên phải. Học theo khối "Người cao tuổi" của trang… |
| [BlogHero](components/BlogHero/preview.html) | Đầu trang "Góc chăm cây": breadcrumb → tiêu đề 28px → hàng chip chuyên mục → khối nổi bật: 1 bài lớn (ảnh 16:9, chuyên mục, ngày, thời gian đọc, ti… |
| [ExpertList](components/ExpertList/preview.html) | Thẻ Đội ngũ chuyên môn ở cột phải: avatar tròn 40px, chức danh (11px ink-muted), tên (600), lĩnh vực. |
| [ShortVideoRow](components/ShortVideoRow/preview.html) | Hàng video ngắn dạng dọc 9:16, 6 thẻ, cuộn ngang có nút mũi tên. |
| [TopicList](components/TopicList/preview.html) | Thẻ Chủ đề nổi bật ở cột phải: nền primary-soft, mỗi dòng là thẻ hashtag (# Tên chủ đề, 600) + số bài viết (ink-muted), 6–8 chủ đề, cuối có Xem tất… |

## Hành động (2)

| Component | Mô tả |
|---|---|
| [Button](components/Button/preview.html) | Nút bấm dạng viên thuốc (bo tròn radius-pill), học theo nút "Chọn mua" của các trang thương mại dược phẩm. |
| [ContactFab](components/ContactFab/preview.html) | Nút liên hệ nổi cố định góc phải dưới, luôn hiện trên mọi trang. |

## Hiển thị (6)

| Component | Mô tả |
|---|---|
| [Badge](components/Badge/preview.html) | Nhãn nhỏ gắn trên thẻ sản phẩm và trang chi tiết. |
| [ConfirmDialog](components/ConfirmDialog/preview.html) | Hộp xác nhận nhỏ (360px) cho thao tác quan trọng hoặc không hoàn tác được. |
| [CookieConsent](components/CookieConsent/preview.html) | Xin đồng ý cookie và dữ liệu cá nhân khi khách vào website lần đầu. |
| [EmptyState](components/EmptyState/preview.html) | Trạng thái trống và lỗi, dùng chung cho mọi màn. |
| [Skeleton](components/Skeleton/preview.html) | Khung chờ tải, giữ đúng hình dạng nội dung thật để trang không bị nhảy khi dữ liệu về. |
| [Toast](components/Toast/preview.html) | Thông báo nhỏ sau một thao tác, nền ink chữ surface, bo radius-md. |

## Mobile (18)

| Component | Mô tả |
|---|---|
| [MobileAccount](components/MobileAccount/preview.html) | Tab Tài khoản trên điện thoại (thay AccountSidebar): |
| [MobileAddress](components/MobileAddress/preview.html) | Sổ địa chỉ trên điện thoại: |
| [MobileAuth](components/MobileAuth/preview.html) | Đăng nhập trên điện thoại: màn toàn màn hình trượt từ dưới lên, nút ✕ để đóng; cùng các bước như AuthModal. |
| [MobileBlog](components/MobileBlog/preview.html) | Góc chăm cây trên điện thoại: |
| [MobileCart](components/MobileCart/preview.html) | Giỏ hàng trên điện thoại: |
| [MobileCategory](components/MobileCategory/preview.html) | Màn Danh mục (tab thứ 2) — thay cho SidebarMenu trên điện thoại, kiểu màn danh mục 2 cột quen thuộc của app siêu thị: |
| [MobileCheckout](components/MobileCheckout/preview.html) | Thanh toán trên điện thoại — 1 cột, mỗi phần là một khối surface có thể bấm để sửa: |
| [MobileDiseaseLibrary](components/MobileDiseaseLibrary/preview.html) | Thư viện bệnh cây trên điện thoại (bản mobile của DiseaseLibraryLayout): |
| [MobileGarden](components/MobileGarden/preview.html) | Vườn của tôi và Lịch chăm cây trên điện thoại (vào từ Tài khoản, hoặc từ thông báo nhắc việc). |
| [MobileHome](components/MobileHome/preview.html) | Trang chủ trên điện thoại, cùng thứ tự với desktop nhưng xếp 1 cột: |
| [MobileNews](components/MobileNews/preview.html) | Trang Tin khuyến mãi / Truyền thông trên điện thoại: |
| [MobileOrders](components/MobileOrders/preview.html) | Đơn hàng trên điện thoại: |
| [MobilePlantClinic](components/MobilePlantClinic/preview.html) | Tab Bắt bệnh (nút giữa thanh đáy) — tính năng riêng của Cây Cảnh Miền Tây, bản mobile của PlantClinic: |
| [MobileProductDetail](components/MobileProductDetail/preview.html) | Chi tiết sản phẩm trên điện thoại (ẩn thanh điều hướng đáy): |
| [MobileProductList](components/MobileProductList/preview.html) | Danh sách sản phẩm trên điện thoại: |
| [MobileShell](components/MobileShell/preview.html) | Khung chung trên điện thoại (thiết kế ở khung 390 × 844, dùng tốt từ 360px). |
| [MobileStores](components/MobileStores/preview.html) | Hệ thống cửa hàng trên điện thoại: |
| [MobileVoucher](components/MobileVoucher/preview.html) | Hộp ưu đãi dạng toàn màn hình trên điện thoại (VoucherModal): nút đóng ✕ trái, ô nhập mã, danh sách 3 nhóm (Đang áp dụng / Có thể dùng / Không dùng… |

## Nhập liệu (1)

| Component | Mô tả |
|---|---|
| [Chip](components/Chip/preview.html) | Chip lọc nhanh và bộ chọn đơn vị tính. |

## Nội dung (2)

| Component | Mô tả |
|---|---|
| [ArticleCard](components/ArticleCard/preview.html) | Thẻ bài viết cho mục "Góc chăm cây": ảnh 16:9, nhãn chuyên mục, tiêu đề tối đa 2 dòng, ngày đăng. |
| [PlantClinic](components/PlantClinic/preview.html) | Khối "Bắt bệnh cho cây", tương đương khối kiểm tra sức khỏe của trang dược: khách chọn triệu chứng → trả lời 3–5 câu hỏi → nhận chẩn đoán, cách xử… |

## Tablet (2)

| Component | Mô tả |
|---|---|
| [TabletHome](components/TabletHome/preview.html) | Trang chủ trên tablet dọc (768–1023px, thiết kế ở 820px): |
| [TabletProductDetail](components/TabletProductDetail/preview.html) | Chi tiết sản phẩm trên tablet dọc: |

## Tài khoản (13)

| Component | Mô tả |
|---|---|
| [AccountMenu](components/AccountMenu/preview.html) | Menu tài khoản xổ xuống khi rê chuột/bấm vào tên người dùng trên Header, cạnh nút Giỏ hàng có số lượng. |
| [AccountSidebar](components/AccountSidebar/preview.html) | Cột trái các trang tài khoản: thẻ hồ sơ nền primary-deep + danh sách mục. |
| [AddressCard](components/AddressCard/preview.html) | Danh sách sổ địa chỉ: tiêu đề + nút Thêm địa chỉ mới, bên dưới là các thẻ địa chỉ trong một khối surface. |
| [AddressModal](components/AddressModal/preview.html) | Hộp thoại Thêm / Chỉnh sửa địa chỉ, rộng tối đa 560px, nền mờ phía sau. |
| [AuthModal](components/AuthModal/preview.html) | Hộp Đăng nhập / Đăng ký gộp làm một (không tách 2 trang), mở từ "Đăng nhập" trên Header, khi thêm vào giỏ lần đầu, hoặc khi bấm Nhận ưu đãi. Rộng 4… |
| [CareScheduleLayout](components/CareScheduleLayout/preview.html) · *trang* | Lịch chăm cây — tính năng giữ khách quay lại của Cây Cảnh Miền Tây. |
| [LinkedAccounts](components/LinkedAccounts/preview.html) | Mục Đăng nhập & bảo mật trong trang Tài khoản (thêm vào AccountSidebar, dưới Thông tin cá nhân). |
| [MapPicker](components/MapPicker/preview.html) | Hộp chọn vị trí trên bản đồ: ô tìm kiếm nổi trên bản đồ, ghim cố định giữa khung (kéo bản đồ để đặt), nhắc "Kéo bản đồ để đặt ghim", nút Vị trí của… |
| [MyGardenLayout](components/MyGardenLayout/preview.html) · *trang* | Vườn của tôi — danh sách cây của khách (mua tại Cây Cảnh Miền Tây tự vào, cây mua nơi khác thêm tay). |
| [ProfileForm](components/ProfileForm/preview.html) | Form thông tin cá nhân trong khối surface có tiêu đề, nội dung canh giữa rộng tối đa 420px. |
| [SocialButtons](components/SocialButtons/preview.html) | Nút đăng nhập bằng tài khoản bên ngoài, cao 44px, bo viên thuốc, logo đặt trái, chữ canh giữa "Tiếp tục với …". |
| [WarrantyRequest](components/WarrantyRequest/preview.html) · *trang* | Form gửi yêu cầu bảo hành cây phía khách (phía admin là AdminWarranty). 3 bước: Chọn cây → Chụp ảnh & mô tả → Gửi. |
| [WishlistLayout](components/WishlistLayout/preview.html) · *trang* | Sản phẩm yêu thích: lưới ProductCard (3 cột trong khung tài khoản) có nút tim đỏ sale để bỏ lưu. |

## Thương hiệu (4)

| Component | Mô tả |
|---|---|
| [LogoBrief](components/LogoBrief/preview.html) | Bản brief gửi designer làm logo và bộ nhận diện, dạng văn bản 1 trang (có thể xuất PDF gửi đi). |
| [LogoDirections](components/LogoDirections/preview.html) | 3 hướng logo cho Cây Cảnh Miền Tây — là phác thảo định hướng để chọn ý, không phải logo cuối cùng. Logo chính thức nên do designer vẽ lại (xem Logo… |
| [PhotoGuide](components/PhotoGuide/preview.html) | Hướng dẫn chụp ảnh sản phẩm — ảnh là yếu tố quyết định website trông chuyên nghiệp. |
| [PhotoShotList](components/PhotoShotList/preview.html) | Danh sách ảnh cần chụp cho từng loại hàng — dùng làm checklist cho người chụp và cho màn AdminProductForm (thiếu ảnh bắt buộc thì cảnh báo). |

## Thương mại (6)

| Component | Mô tả |
|---|---|
| [CareInfo](components/CareInfo/preview.html) | Khối thông số trên trang chi tiết, ngay dưới giá. |
| [CategoryTile](components/CategoryTile/preview.html) | Ô danh mục nổi bật: icon/ảnh 56px trên primary-soft, tên danh mục, số sản phẩm ink-muted. |
| [CollectionStrip](components/CollectionStrip/preview.html) | Dải bộ sưu tập theo dịp và nhu cầu, đặt trên cùng vùng nội dung, như dải "Tết Trung Thu / Tiệc tại gia" của siêu thị bách hóa. |
| [FilterBar](components/FilterBar/preview.html) | Thanh bộ lọc trên trang danh mục desktop (đặt ngang, vì cột trái đã dành cho SidebarMenu). |
| [FlashSale](components/FlashSale/preview.html) | Khối khuyến mãi theo khung giờ: dải sun có đồng hồ đếm ngược, hàng khung giờ, lưới ProductCard kèm thanh "Đã bán". |
| [ProductCard](components/ProductCard/preview.html) | Thẻ sản phẩm dùng chung cho cây, thuốc, phân bón và vật tư, theo cấu trúc thẻ của chuỗi nhà thuốc. |

## Tin tức (2)

| Component | Mô tả |
|---|---|
| [NewsHero](components/NewsHero/preview.html) | Đầu trang tin tức (Truyền thông, Tin khuyến mãi), học theo trang tin của chuỗi nhà thuốc: |
| [NewsListCard](components/NewsListCard/preview.html) | Thẻ tin dạng ngang dùng cho danh sách bên dưới khối nổi bật: ảnh 200px (16:10) trái → nhãn chuyên mục + ngày → tiêu đề 16px → tóm tắt 2 dòng ink-mu… |

## Trang thông tin (2)

| Component | Mô tả |
|---|---|
| [PolicyArticle](components/PolicyArticle/preview.html) | Bài viết giới thiệu / chính sách, rộng tối đa 760px để dễ đọc (chữ 15px, dòng 25px). |
| [PolicyNav](components/PolicyNav/preview.html) | Menu trái của các trang giới thiệu, chính sách, điều khoản ("Bài viết trong danh mục"), dính khi cuộn. |
