// Nội dung trang giới thiệu, chính sách, hướng dẫn (PolicyLayout).
// Trang "Giới thiệu" dùng nguyên bài trong design system; các trang khác là bản nháp ngắn
// để thay bằng nội dung chính thức (đặc biệt phần pháp lý).

export type Policy = { slug: string; title: string; group: string; body?: { h: string; p: string[] }[] };

export const POLICY_GROUPS = ['VỀ CÂY CẢNH MIỀN TÂY', 'CHÍNH SÁCH', 'HƯỚNG DẪN & ĐIỀU KHOẢN'] as const;

export const policies: Policy[] = [
  { slug: 'gioi-thieu', title: 'Giới thiệu Cây Cảnh Miền Tây', group: POLICY_GROUPS[0] },
  { slug: 'giay-phep-kinh-doanh', title: 'Giấy phép kinh doanh', group: POLICY_GROUPS[0], body: [
    { h: 'Thông tin doanh nghiệp', p: ['Tên pháp nhân, mã số doanh nghiệp, ngày cấp và nơi cấp điền đúng theo giấy đăng ký kinh doanh.'] },
    { h: 'Giấy chứng nhận đủ điều kiện buôn bán thuốc BVTV', p: ['Số giấy chứng nhận, cơ quan cấp và thời hạn hiệu lực.'] },
  ] },
  { slug: 'quy-che-hoat-dong', title: 'Quy chế hoạt động', group: POLICY_GROUPS[0], body: [
    { h: 'Nguyên tắc chung', p: ['Website thương mại điện tử bán lẻ cây cảnh, vật tư nông nghiệp do Cây Cảnh Miền Tây vận hành.'] },
  ] },
  { slug: 'doi-ngu-chuyen-mon', title: 'Đội ngũ chuyên môn', group: POLICY_GROUPS[0], body: [
    { h: 'Kỹ sư nông nghiệp', p: ['Mọi nội dung chăm cây, bắt bệnh và hướng dẫn dùng thuốc đều được kỹ sư kiểm duyệt trước khi đăng.'] },
  ] },
  { slug: 'giao-hang', title: 'Chính sách giao hàng', group: POLICY_GROUPS[1], body: [
    { h: 'Cây sống', p: ['Giao cây sống toàn quốc, đóng khung chống dập. Phí 35.000đ, miễn phí cho đơn cây từ 800.000đ.', 'Shop gửi ảnh cây thật trước khi giao và nhắn bạn thời gian dự kiến nhận hàng.'] },
    { h: 'Vật tư – Thuốc – Phân bón', p: ['Giao nhanh 2 giờ nội thành. Phí 20.000đ, miễn phí cho đơn vật tư từ 300.000đ.'] },
  ] },
  { slug: 'bao-hanh-cay', title: 'Chính sách bảo hành cây', group: POLICY_GROUPS[1], body: [
    { h: 'Thời gian bảo hành', p: ['7 ngày kể từ khi nhận cây. Cây héo, vàng lá bất thường hoặc bệnh được đổi cây mới cùng loại.'] },
    { h: 'Cách gửi yêu cầu', p: ['Vào Tài khoản → Bảo hành cây, chụp 3 ảnh theo gợi ý. Kỹ sư phản hồi trong 24 giờ.'] },
  ] },
  { slug: 'doi-tra', title: 'Chính sách đổi trả', group: POLICY_GROUPS[1], body: [
    { h: 'Vật tư, thuốc, phân bón', p: ['Đổi trả trong 7 ngày nếu còn nguyên tem, chưa mở bao bì.'] },
  ] },
  { slug: 'thanh-toan', title: 'Chính sách thanh toán', group: POLICY_GROUPS[1], body: [
    { h: 'Phương thức', p: ['Tiền mặt khi nhận hàng, chuyển khoản QR, ví MoMo, ZaloPay, thẻ quốc tế. Đơn Flash sale không áp dụng tiền mặt.'] },
  ] },
  { slug: 'dat-coc', title: 'Chính sách đặt cọc (cây lớn, công trình)', group: POLICY_GROUPS[1], body: [
    { h: 'Mức cọc', p: ['Cây lớn đặt trước và công trình sân vườn cọc 30% giá trị, phần còn lại thanh toán khi nhận.'] },
  ] },
  { slug: 'bao-mat', title: 'Chính sách bảo mật dữ liệu cá nhân', group: POLICY_GROUPS[1], body: [
    { h: 'Dữ liệu thu thập', p: ['Số điện thoại đã xác thực, địa chỉ nhận hàng, lịch sử mua để giao cây, bảo hành và nhắc chăm cây.'] },
  ] },
  { slug: 'noi-dung', title: 'Chính sách nội dung', group: POLICY_GROUPS[1], body: [
    { h: 'Kiểm duyệt', p: ['Bài viết và trả lời hỏi đáp được kỹ sư kiểm duyệt; đánh giá của khách được duyệt trước khi hiển thị.'] },
  ] },
  { slug: 'thuoc-bvtv-an-toan', title: 'Hướng dẫn sử dụng thuốc BVTV an toàn', group: POLICY_GROUPS[2], body: [
    { h: 'Trước khi pha', p: ['Đọc kỹ nhãn: hoạt chất, liều pha, thời gian cách ly. Đeo găng tay, khẩu trang.'] },
    { h: 'Sau khi phun', p: ['Rửa tay, tắm; cất thuốc xa tầm tay trẻ em và vật nuôi; không đổ thuốc thừa xuống cống.'] },
  ] },
  { slug: 'huong-dan-mua-hang', title: 'Hướng dẫn mua hàng', group: POLICY_GROUPS[2], body: [
    { h: 'Các bước', p: ['Chọn sản phẩm → Giỏ hàng → Thanh toán: chọn hình thức nhận, địa chỉ, phương thức thanh toán → Đặt hàng.'] },
  ] },
  { slug: 'tich-diem', title: 'Thể lệ tích điểm thành viên', group: POLICY_GROUPS[2], body: [
    { h: 'Tích điểm', p: ['Mỗi 10.000đ thanh toán được 1 điểm, cộng sau khi nhận hàng.'] },
  ] },
  { slug: 'dieu-khoan', title: 'Điều khoản sử dụng', group: POLICY_GROUPS[2], body: [
    { h: 'Phạm vi', p: ['Điều khoản áp dụng cho mọi khách truy cập và mua hàng tại website.'] },
  ] },
  { slug: 'nguon-anh', title: 'Nguồn ảnh minh họa', group: POLICY_GROUPS[2], body: [
    { h: 'Ảnh minh họa', p: ['Một số sản phẩm đang dùng ảnh minh họa từ Wikimedia Commons theo giấy phép mở (Creative Commons hoặc phạm vi công cộng), không phải ảnh chụp sản phẩm thực tế. Sản phẩm giao cho khách có thể khác ảnh; ảnh sẽ được thay bằng ảnh shop tự chụp.'] },
    { h: 'Tác giả và giấy phép', p: [
    'Philodendron Birkin chậu sứ Ø15: ảnh của Yercaud-elango, CC BY 4.0, nguồn https://commons.wikimedia.org/wiki/File:Philodendron_birkin-5-R.M.Nagar-bengaluru-India.jpg',
    'Trầu bà Nam Mỹ chậu treo: ảnh của Ra Boe, CC BY-SA 3.0 de, nguồn https://commons.wikimedia.org/wiki/File:Wikipedia_13._Fotoworkshop_Botanischer_Garten_Erlangen_2013_by-RaBoe_137.jpg',
    'Kim tiền chậu men xanh: ảnh của Dbwolfe, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Zamioculcas_zamiifolia_Chameleon_1.jpg',
    'Lan hồ điệp 2 cành màu trắng: ảnh của Alvesgaspar, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Phalaenopsis_July_2020-2.jpg',
    'Combo sen đá mix 6 chậu mini: ảnh của brewbooks from near Seattle, USA, CC BY-SA 2.0, nguồn https://commons.wikimedia.org/wiki/File:Flickr_-_brewbooks_-_Succulent_Pot.jpg',
    'Chế phẩm sinh học Trichoderma trị nấm, thối rễ: ảnh của Vicenny, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Trichoderma_asperellum.jpg',
    'Thuốc trừ nấm bệnh Mancozeb 80WP: ảnh của Safapalanadan94, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Knapsack_sprayer.jpg',
    'Dầu khoáng trừ rệp sáp, nhện đỏ: ảnh của Theornamentalist, CC BY-SA 3.0, nguồn https://commons.wikimedia.org/wiki/File:Wikibooks_planting-water.jpg',
    'Phân bón lá kích hoa cho lan: ảnh của PumpkinSky, CC BY-SA 3.0, nguồn https://commons.wikimedia.org/wiki/File:White_Orchid_1_NBG.jpg',
    'Phân tan chậm NPK 14-14-14 cho kiểng lá: ảnh của Rasbak, CC BY-SA 3.0, nguồn https://commons.wikimedia.org/wiki/File:Kalkammonsalpeter.jpg',
    'Phân trùn quế nguyên chất: ảnh của Red58bill, CC BY 3.0, nguồn https://commons.wikimedia.org/wiki/File:Worm.casts.jpg',
    'Đất trộn sẵn chuyên kiểng lá, thoát nước tốt: ảnh của Không rõ tác giả, phạm vi công cộng, nguồn https://commons.wikimedia.org/wiki/File:Pro-Mix_Potting_Soil.jpg',
    'Viên nén xơ dừa ươm hạt (100 viên): ảnh của MatiasMiika, CC BY 3.0, nguồn https://commons.wikimedia.org/wiki/File:Brick_of_coco_coir.JPG',
    'Kéo cắt tỉa cành lưỡi thép SK5: ảnh của KoS, phạm vi công cộng, nguồn https://commons.wikimedia.org/wiki/File:Secateur_ouvert.jpg',
    'Hạt giống rau muống lá tre: ảnh của Wee Hong, CC BY-SA 4.0, nguồn https://commons.wikimedia.org/wiki/File:Ipomoea_aquatica_at_Organic_Unit,_FP,_UPM.jpg',
    'Video nền mai vàng ở trang Cây Tết: video của Lê Hoàng Khanh Lê, giấy phép Pexels (dùng miễn phí), nguồn https://www.pexels.com/video/close-up-on-yellow-flowers-11142501/',
    ] },
  ] },
];

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
