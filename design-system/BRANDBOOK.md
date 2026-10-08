# Cây Cảnh Miền Tây

Hệ thống thiết kế cho website bán cây cảnh, thuốc bảo vệ thực vật, phân bón và vật tư làm vườn. Bố cục học theo siêu thị bách hóa trực tuyến (menu danh mục cố định bên trái, dải bộ sưu tập theo dịp, khối sản phẩm theo từng nhóm hàng) vì shop có nhiều nhóm hàng và nhiều mã; thẻ sản phẩm, flash sale và khối tư vấn học theo chuỗi nhà thuốc. Tất cả chuyển sang tông xanh lá của ngành cây. Tên thương hiệu: **Cây Cảnh Miền Tây**. Website **chỉ dùng giao diện sáng** (không hỗ trợ giao diện tối).

## Câu chuyện thương hiệu

**Cây Cảnh Miền Tây**: cây khỏe từ nhà vườn miền Tây — vùng có nhiều làng nghề cây giống, hoa kiểng lâu đời (như Cái Mơn – Chợ Lách, Sa Đéc). Nội dung và hình ảnh nên nhấn vào **nguồn gốc nhà vườn**, cây được thuần kỹ trước khi bán, và sự chân chất, tận tình khi tư vấn. Giọng văn thân thiện, gần gũi; có thể dùng vài từ quen thuộc của miền Tây ở tiêu đề chiến dịch, nhưng nội dung hướng dẫn vẫn dùng tiếng Việt phổ thông để khách mọi vùng đều hiểu.

## Nguyên tắc

**Danh mục luôn trong tầm mắt.** Trên desktop, SidebarMenu cố định bên trái, nhóm con xổ tại chỗ. Khách chuyển từ cây sang thuốc sang chậu không phải mở menu nào.

**Tìm nhanh trước, đẹp sau.** Khách mua thuốc, phân, đất thường đã biết mình cần gì. Ô tìm kiếm luôn to, luôn ở đầu trang, có từ khóa gợi ý theo mùa vụ.

**Giá rõ theo đơn vị.** Mọi giá đều kèm "/ Chậu", "/ Chai", "/ Bao". Sản phẩm có nhiều quy cách dùng bộ chọn đơn vị ngay trên thẻ.

**Tư vấn là sản phẩm.** Tư vấn chăm cây, bắt bệnh cho cây và tra cứu thuốc được đặt ngang hàng với mua sắm (QuickActions, PlantClinic), như cách nhà thuốc đặt "Tư vấn với dược sĩ".

**Xanh là thương hiệu, cam là khuyến mãi.** `primary` cho mọi hành động mua và điều hướng. `sale` chỉ xuất hiện ở giảm giá. `sun` chỉ trong Flash sale.

## Giọng văn

Thân thiện, rõ ràng, như người bán cây có nghề nói chuyện với khách. Câu ngắn, dùng từ quen thuộc ("tưới khi mặt đất khô 2–3cm" thay vì "duy trì độ ẩm giá thể"). Tên sản phẩm theo công thức: **Loại + tên + đặc điểm chính + quy cách**, ví dụ "Cây Monstera Deliciosa chậu sứ trắng", "Chế phẩm sinh học Trichoderma trị nấm, thối rễ". Với thuốc BVTV luôn có hướng dẫn liều và lưu ý an toàn.

## Màu sắc

Nền trang `surface-page` (xanh xám rất nhạt), các khối đặt trên `surface` trắng bo `radius-lg` để tách lớp. Header và footer dùng `primary-deep`. Nút, giá, link dùng `primary`. Nền icon, chip đang chọn dùng `primary-soft`. Chữ chính `ink`, chữ phụ `ink-muted`. Mọi cặp chữ/nền đạt tối thiểu 4.5:1. **Chỉ có một bộ màu sáng**: không làm giao diện tối, website khai báo `color-scheme: light` để trình duyệt và điện thoại đang bật chế độ tối vẫn hiển thị sáng (ô nhập, thanh cuộn, lịch chọn ngày giữ màu sáng).

## Chữ

Một họ chữ: **Be Vietnam Pro** (Google Fonts), được thiết kế cho tiếng Việt nên dấu hiển thị chuẩn. Trọng lượng 400 cho nội dung, 600 cho nhãn và tên sản phẩm, 700 cho tiêu đề và giá. Chữ nội dung 14px, tên sản phẩm 14px/600 tối đa 2 dòng, giá 18px/700.

## Bố cục trang

Mọi trang mua sắm dùng ShopLayout: Header dính trên cùng, SidebarMenu 248px bên trái, vùng nội dung bên phải (tối đa 1200px).

Vùng nội dung trang chủ, từ trên xuống: CollectionStrip (bộ sưu tập theo dịp) → Banner → QuickActions → Flash sale → một khối cho mỗi nhóm hàng lớn (Cây cảnh, Thuốc BVTV, Phân bón, Chậu, Đất – Giá thể…), mỗi khối gồm SectionHeader + chip tab nhóm con + lưới ProductCard → Bắt bệnh cho cây → Góc chăm cây → Footer. Các khối cách nhau `space-4` đến `space-8`.

Trang danh mục: cùng khung, vùng phải là tiêu đề + chip lọc + lưới sản phẩm. Trang chi tiết và giỏ hàng ẩn sidebar.

## Giỏ hàng và thanh toán

Hai bước, cùng khung 2 cột (CheckoutLayout), ẩn SidebarMenu. **Giỏ hàng**: CartItem có bộ tăng giảm + gợi ý mua kèm, OrderSummary với nút "Tiến hành đặt hàng". **Thanh toán**: DeliveryToggle → CheckoutForm → CartItem chỉ xem → PaymentMethods, OrderSummary với nút "Đặt hàng".

Ưu đãi chọn qua VoucherModal (mở từ "Thêm ưu đãi"): ô nhập mã, danh sách chia nhóm Đang áp dụng / Có thể dùng / Không dùng chung được, dùng điểm thưởng, tổng tiết kiệm ở chân hộp.

Ba điểm riêng của shop cây so với trang dược: giỏ **tách nhóm Cây sống và Vật tư** vì giao khác nhau và tính phí riêng; có **khung giờ giao** vì cây lớn cần người nhận; giỏ có **thuốc BVTV** thì hiện lưu ý an toàn và ô xác nhận trước khi đặt.

## Trang chi tiết sản phẩm

Cấu trúc học theo trang chi tiết của chuỗi nhà thuốc (ProductDetailLayout): breadcrumb → ProductGallery + BuyBox → ProductContent có mục lục dính → Thường mua kèm → FAQ → Reviews → QnA, cùng StickyBuyBar khi cuộn.

Chỉnh cho ngành cây: ảnh ghi **ngày chụp tại vườn** và có video; chọn **kích thước cây** bên cạnh đơn vị; nút phụ là **Tư vấn Zalo**; SpecTable có bộ trường riêng cho cây, thuốc BVTV, phân bón và vật tư; nội dung được **kỹ sư nông nghiệp kiểm duyệt**; đánh giá có bộ lọc **ảnh thực tế**; khối gợi ý là **Thường mua kèm** (đất, thuốc, phân, chậu) thay vì sản phẩm tương tự.

## Tài khoản

Cấu trúc học theo trang cá nhân của chuỗi nhà thuốc (AccountLayout): AccountMenu xổ từ tên người dùng trên Header; trang tài khoản gồm AccountSidebar (thẻ hồ sơ + danh sách mục) bên trái và nội dung bên phải, ví dụ ProfileForm với ô nhập nhãn nổi.

Các mục riêng của shop cây thay cho lịch tiêm và đơn thuốc: **Vườn của tôi** (cây đã mua), **Lịch chăm cây** (nhắc tưới, bón, thay chậu, gửi qua Zalo), **Bảo hành cây** (đổi cây trong 7 ngày kèm ảnh), **Lịch hẹn dịch vụ**. Thẻ hồ sơ hiện hạng thành viên, điểm thưởng và voucher để khuyến khích mua lại.

**Đăng nhập:** AuthModal gộp đăng nhập và đăng ký. Cách chính là số điện thoại + OTP (gửi qua Zalo, SMS dự phòng); thêm **Tiếp tục với Google**, Zalo, Apple (SocialButtons, dùng logo chính thức của từng bên). Tài khoản định danh bằng **SĐT đã xác thực**: đăng nhập Google lần đầu sẽ xin thêm SĐT (giải thích lý do: giao cây, bảo hành, nhắc chăm cây); nếu SĐT đã có tài khoản thì **liên kết**, không tạo trùng. Quản lý các cách đăng nhập ở LinkedAccounts. Bản điện thoại: MobileAuth.

Sổ địa chỉ (AddressBookLayout) gồm AddressCard, AddressModal (thêm/sửa) và MapPicker (chọn trên bản đồ). Địa chỉ lưu theo **địa giới hành chính mới** (Phường, Tỉnh/Thành); địa chỉ cũ được giữ để đối chiếu và nhắc cập nhật. Riêng cho shop cây: mỗi địa chỉ có **điều kiện giao cây lớn** (xe tải vào được, hẻm nhỏ, thang máy, cầu thang bộ) và MapPicker báo ngay địa chỉ có nằm trong **vùng giao cây sống** hay không.

Đơn hàng (OrdersLayout, OrderDetailLayout) gồm OrderTabs, OrderCard, OrderTimeline và OrderDetail. Riêng cho shop cây: bước **Chuẩn bị cây** trong tiến trình đơn, **ảnh cây trước khi giao** làm căn cứ bảo hành, dải **Bảo hành cây còn n ngày** kèm nút Yêu cầu bảo hành, và tab **Trả hàng – Bảo hành**.

## Góc chăm cây (tin tức)

Trang nội dung (BlogLayout) học theo trang Góc sức khỏe của chuỗi nhà thuốc: BlogHero (chip chuyên mục + 1 bài lớn và 5 bài nhỏ) → ShortVideoRow (video dọc 9:16) → các khối chuyên mục (BlogCategoryBlock, xen BlogFeatureBlock kiểu tạp chí) → Tin khuyến mãi & Sự kiện; cột phải có TopicList và ExpertList. Nội dung là kênh kéo khách từ Google và mạng xã hội, nên mỗi bài Bắt bệnh cây và Thuốc & Phân bón đều gắn sản phẩm liên quan.

## Trang thông tin (giới thiệu, chính sách)

PolicyLayout: PolicyNav bên trái (chia nhóm Về Cây Cảnh Miền Tây / Chính sách / Hướng dẫn & Điều khoản) + PolicyArticle (tiêu đề, ngày cập nhật, mục đánh số La Mã, khối trích dẫn, ô số liệu, bảng, hộp ghi chú, phản hồi "Có hữu ích?"). Học theo trang giới thiệu của chuỗi nhà thuốc; thêm Chính sách bảo hành cây, Chính sách đặt cọc cây lớn và Hướng dẫn dùng thuốc BVTV an toàn.

## Footer

Footer dùng chung (thành phần Footer), theo footer chuỗi nhà thuốc: dải "Ghé thăm vườn và cửa hàng" (`primary-deep`) → dải đăng ký nhận lịch chăm cây theo mùa (`primary-soft`) → 5 cột (Về Cây Cảnh Miền Tây, Danh mục, Tìm hiểu thêm, Tổng đài + Chứng nhận, Kết nối + QR Zalo + Thanh toán) → dòng pháp lý. Logo đối tác, huy hiệu Bộ Công Thương dùng file chính thức; thông tin pháp nhân điền đúng theo giấy đăng ký kinh doanh.

## Hệ thống cửa hàng

StoreLocatorLayout: StoreFinder (tab Tìm cửa hàng / Gần bạn, ô tìm, chọn nhanh khu vực, chip lọc Vườn ươm – Có workshop – Đang mở, danh sách kết quả) + StoreDetail (bản đồ, địa chỉ mới/cũ, trạng thái mở cửa, tiện ích, Xem chỉ đường, Gọi tư vấn, **Đặt lịch đến xem cây**, 6 lợi ích mua tại cửa hàng). Học theo trang hệ thống nhà thuốc.

## Tìm hiểu bệnh cây trồng

DiseaseLibraryLayout, học theo trang tìm hiểu bệnh của chuỗi nhà thuốc: ô tìm theo triệu chứng → PlantPartMap (hình cây với đường chỉ tới hoa, lá, quả, thân – cành, gốc – cổ rễ, rễ, toàn cây; danh sách bệnh theo bộ phận có lọc loại cây và phân trang) → DiseaseGroupGrid (12 nhóm theo nguyên nhân: nấm, vi khuẩn, virus, sâu hại, nhện – rệp – bọ trĩ, dinh dưỡng, sinh lý…). Mỗi trang bệnh gắn thuốc và vật tư đề xuất, kèm liều dùng và lưu ý an toàn; nối với PlantClinic để khách chưa rõ bệnh được hỏi đáp từng bước.

## Kích thước màn hình

Ba mốc dùng thống nhất cho mọi trang:
- **Mobile < 768px** (thiết kế ở 390px, hỗ trợ từ 360px): thanh điều hướng đáy 5 tab (Trang chủ, Danh mục, **Bắt bệnh**, Giỏ hàng, Tài khoản); lưới sản phẩm 2 cột; bộ lọc, chọn đơn vị, địa chỉ, ưu đãi mở dạng bảng trượt từ dưới hoặc toàn màn hình; trang mua hàng có thanh dính đáy.
- **Tablet 768–1023px** (thiết kế ở 820px): header 1 hàng có nút **Danh mục** mở SidebarMenu dạng bảng trượt trái; lưới 3 cột; chi tiết sản phẩm giữ 2 cột; mục lục thành tab dính; hộp thoại giữ dạng hộp giữa màn hình; vẫn có thanh điều hướng đáy.
- **Desktop ≥ 1024px:** các bố cục ShopLayout, ProductDetailLayout… như đã mô tả.

Các màn mobile nằm ở nhóm **Mobile** (MobileShell, MobileHome, MobileCategory, MobileProductList, MobileProductDetail, MobileCart, MobileCheckout, MobileAccount, MobileOrders, MobileAddress, MobileVoucher, MobilePlantClinic, MobileBlog, MobileDiseaseLibrary, MobileStores) và **Tablet** (TabletHome, TabletProductDetail). Vùng bấm tối thiểu 44 × 44px trên cảm ứng. Tab giữa **Bắt bệnh** (MobilePlantClinic) là điểm khác biệt của shop trên mobile: chụp ảnh gửi kỹ sư hoặc trả lời 5 câu hỏi để có kết quả và sản phẩm đề xuất.

## Admin (trang quản trị)

Dùng chung token màu, font và thành phần với giao diện khách, nhưng **mật độ cao hơn**: chữ 13px, nút bo `radius-md`, khoảng cách `space-3`, nhiều bảng. Khung AdminShell: menu trái `primary-deep` chia nhóm Tổng quan / Bán hàng / Hàng hóa / Nội dung / Hệ thống, chọn cửa hàng, tìm nhanh Ctrl K. Các màn chính: AdminDashboard (KpiCard, biểu đồ, **Việc cần xử lý**), AdminOrders (DataTable với tab trạng thái, bộ lọc, thao tác hàng loạt, cờ Có cây sống / Thiếu ảnh cây / Có thuốc BVTV), AdminProductForm (loại sản phẩm quyết định thông số; thuốc BVTV bắt buộc số đăng ký, hoạt chất, cách ly), AdminWarranty (so sánh ảnh trước khi giao với ảnh khách gửi, kỹ sư chọn hướng xử lý). Các màn quản trị khác: AdminInventory (tồn theo kho, lô và hạn dùng, cây quản lý theo từng cây), AdminCustomers (bảng chi tiết có **vườn của khách**), AdminPromotions (khuyến mãi và quy tắc dùng chung), AdminContent (soạn bài có khối sản phẩm, kiểm duyệt kỹ sư, kiểm tra an toàn thuốc), AdminDelivery (**bảng xếp chuyến** theo khung giờ và điều kiện giao), AdminReports (có tỉ lệ bảo hành theo loại cây, tỉ lệ bán kèm, hiệu quả Bắt bệnh cây), AdminRoles (ma trận quyền). Mỗi vai trò (quản lý, kho, chăm sóc khách hàng, kỹ sư, giao hàng) chỉ thấy menu của mình.

**Vận hành bổ sung:** AdminOrderDetail (tiến trình, ảnh cây bắt buộc, ghi chú nội bộ, lịch sử), AdminPOS (bán tại quầy, nhận diện thành viên bằng SĐT, gửi hóa đơn + lịch chăm qua Zalo), AdminPurchasing (phiếu nhập, đề xuất nhập, nhận hàng có số lô và hạn dùng), AdminReviews (duyệt đánh giá, trả lời hỏi đáp, gợi ý trả lời), AdminServiceRequests (bảng giai đoạn yêu cầu dịch vụ), AdminShippingSettings (bản đồ vùng giao, phí, khung giờ và số đơn tối đa), MessageTemplates (mẫu Zalo/email có biến và xem trước), PrintTemplates (phiếu giao A6, hóa đơn K80).

**App nhân viên** (mobile): StaffDeliveryApp cho tài xế (chuyến, điểm dừng, COD, chụp ảnh cây tại nơi giao) và StaffWarehouseApp cho kho (soạn hàng theo ca, vị trí kệ, lô, **chụp ảnh cây trước khi giao**, quét mã vạch). Nút to, dùng một tay.

## Truyền thông và Tin khuyến mãi

Hai trang tin dùng chung khuôn, học theo trang tin của chuỗi nhà thuốc: NewsHero (tiêu đề canh giữa, ô chuyên mục con, 1 bài lớn + 5 bài nhỏ) → danh sách NewsListCard (thẻ ngang) + cột phải. **NewsCategoryLayout** (Truyền thông: tin tức & sự kiện, hoạt động cộng đồng, báo chí, tuyển dụng; có khối liên hệ báo chí). **PromoNewsLayout** (Tin khuyến mãi): mọi bài có **trạng thái** Đang diễn ra / Sắp diễn ra / Đã kết thúc, thời gian áp dụng, nút Nhận ưu đãi / Đăng ký / Xem thể lệ; dữ liệu lấy từ AdminPromotions; mỗi chương trình có trang thể lệ riêng. Bản điện thoại: MobileNews.

## Tìm kiếm, danh mục và phản hồi

- **Trang danh mục desktop:** ProductListingLayout (danh mục con có ảnh, FilterBar ngang với nút xổ chọn nhiều có số đếm, nhãn đang lọc, sắp xếp, lưới 4 cột, "Xem thêm" có thanh tiến độ, mô tả SEO).
- **Tìm kiếm:** SearchSuggest (gợi ý khi gõ: từ khóa, danh mục, bệnh cây, sản phẩm, bài viết; hiểu tiếng Việt không dấu và tên gọi khác) và SearchResultsLayout (tab Sản phẩm / Bài viết / Bệnh cây / Video, sửa lỗi gõ, dải mời Bắt bệnh cây khi tìm theo triệu chứng, "Nhờ shop tìm cây" khi không có kết quả).
- **Sau khi mua:** MiniCart (thông báo đã thêm + thường mua kèm; giỏ thu nhỏ), PaymentQR (VietQR, nội dung = mã đơn, đồng hồ giữ đơn, tự nhận tiền), OrderSuccessLayout (mã đơn, giao hàng, thanh toán, 3 việc nên làm tiếp).
- **Trạng thái chung:** EmptyState, Skeleton, Toast (có Hoàn tác), ConfirmDialog (nút `vx-btn--danger`), NotFoundPage, CookieConsent (3 nút ngang hàng, tùy chỉnh theo nhóm).

## Vườn của tôi, lịch chăm cây và các trang con

- **MyGardenLayout** (Vườn của tôi): thẻ từng cây với ảnh khách cập nhật, tình trạng, tuổi cây, việc tiếp theo, hạn bảo hành; thêm được cây mua nơi khác.
- **CareScheduleLayout** (Lịch chăm cây): lịch tuần/tháng/theo cây, việc hôm nay có hướng dẫn cụ thể, nút Bắt bệnh và **Mua phân** ngay trong việc, tự dời lịch tưới theo thời tiết, nhắc qua Zalo.
- **WarrantyRequest** (khách gửi bảo hành): 3 ảnh theo gợi ý, chip triệu chứng, vị trí đặt, tần suất tưới, các bước xử lý sau khi gửi.
- **NotificationCenter** (chuông): tab theo loại, nút hành động trong thông báo (xem ảnh cây, mở lịch chăm).
- **WishlistLayout**: nhãn Giảm giá từ khi lưu / Có hàng lại / Hết hàng, báo khi thay đổi.
- **ArticleDetailLayout** và **DiseaseDetailLayout**: trang bài viết (mục lục, kỹ sư kiểm duyệt, khối "Dùng trong bài này") và trang một bệnh (thông tin nhanh, triệu chứng theo bộ phận, dễ nhầm với, các bước xử lý, sản phẩm xử lý).
- Bản điện thoại: MobileGarden.

## Dịch vụ, doanh nghiệp, quà tặng và chiến dịch

- **ServicesHubLayout** (trang Dịch vụ): hero có nút Đặt lịch khảo sát miễn phí, 4 dịch vụ có "giá từ", quy trình 5 bước, công trình đã làm, đánh giá, CTA.
- **ServiceDetailLayout** (ví dụ Cho thuê cây văn phòng): bảng 3 gói, **máy tính ước tính chi phí**, cây thường dùng.
- **QuoteRequestForm**: dịch vụ → không gian (diện tích, nắng, ảnh, phong cách) → ngân sách → lịch khảo sát → liên hệ.
- **BusinessLayout** (khách doanh nghiệp): giá sỉ theo bậc, VAT và công nợ, người phụ trách riêng, quà tặng số lượng lớn.
- **GiftOptions** (trong thanh toán): gói quà, thiệp có **QR hướng dẫn chăm cây**, người nhận, ẩn giá, giữ bí mật, gửi ảnh lúc giao; xem trước thiệp.
- **CampaignLayout** (ví dụ Cây Tết đặt trước): đếm ngược, 4 bước đặt cọc 30%, lọc theo loại cây, **lịch giao theo ngày có số chuyến còn lại**.
- **FlashSaleLayout**: khung giờ trong ngày, đếm ngược, giới hạn mua mỗi khách, thanh đã bán, nút Nhắc tôi cho khung sắp tới.

## Bộ nhận diện (nhóm Thương hiệu)

- **LogoDirections:** 3 hướng logo phác thảo (A – Lá & dòng sông, khuyến nghị; B – Chậu hình chiếc xuồng; C – Tàu dừa trong vòng tròn), cách dùng đúng/sai, vùng an toàn, kích thước tối thiểu, bảng màu thương hiệu. Logo chính thức do designer hoàn thiện.
- **LogoBrief:** bản brief gửi designer (thương hiệu, khách hàng, cảm giác mong muốn, yêu cầu kỹ thuật, nơi dùng, bàn giao, quy trình).
- **PhotoGuide** và **PhotoShotList:** quy cách ảnh, đúng/sai, dụng cụ, danh sách ảnh bắt buộc theo từng loại hàng và ảnh cây trước khi giao.
- **VoiceTone:** 4 tính cách giọng văn, bảng Không nên / Nên, từ nên dùng và tránh dùng.

## Hình ảnh và biểu tượng

Ảnh sản phẩm là thứ quyết định độ chuyên nghiệp: nền trơn sáng, cùng góc chụp, cùng tỉ lệ vuông. Cây chụp cả chậu; thuốc, phân chụp chính diện bao bì. Biểu tượng dùng kiểu nét (outline) 1.8px, bo đầu nét tròn, màu `primary`, đặt trong ô `primary-soft`. Nguồn hình (từ 08/10/2026): bộ **Lucide** (lucide.dev), hình Lucide không có thì lấy **Tabler** / **Iconoir** hoặc vẽ riêng theo cùng khung 24px, nét tròn; web gom tất cả trong `web/src/components/Icon.tsx`. Logo tạm: chữ "Cây Cảnh Miền Tây" 22px/700 kèm biểu tượng lá, cho đến khi có logo chính thức theo LogoBrief. Chi tiết chụp ảnh xem PhotoGuide.

## Mobile

Phần lớn khách mua bằng điện thoại, nên mọi màn được thiết kế cho mobile trước (xem mục Kích thước màn hình). ContactFab (chat Zalo) luôn hiện.
