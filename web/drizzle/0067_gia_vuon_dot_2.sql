-- Giá theo GIÁ VƯỜN THẬT, đợt 2 (17/10/2026): chủ shop gửi tiếp sổ giá nhà vườn (dòng 35–61) — vườn Quang (Làng hoa Sa Đéc), chị Phượng (Duy Việt),
-- A Minh (Sa Đéc), Bình An (tỉnh lộ 848), kiểng Phan Oanh (ấp Đông Quới, xã Tân Khánh Đông), Minh Xuyên (đường ĐT 852 mới).
-- Cùng công thức đợt 1: giá gốc = vườn + 10% · giá lẻ = gốc + 80% · combo 2 cây = (lẻ × 2) − 10% · giá gạch = lẻ + 20–30%.
--   * Thêm 24 cây mới, BẬT BÁN luôn (chủ shop dặn 11/10/2026), chưa có ảnh. Sổ không ghi cỡ → quy cách "Cỡ tiêu chuẩn" (Hồng phụng: "Chậu 12" như sổ).
--   * 10 cây chưa xác định được giống (tên thương mại của nhà vườn: Vàng bạc, Bạch trạng, Đế tím Pháp, Hạc cam, Chanh nho, Hồng phụng, Chanh tàn,
--     Đế kim cương, Sơn tùng, Đuôi chồn cúp) + Thiên điểu Thái: chỉ mô tả chung, không tên khoa học / an toàn thú cưng — bổ sung khi có ảnh.
--   * 7 cây công trình vườn Minh Xuyên (280.000đ/cây tại vườn) đánh dấu "cây lớn" (phụ phí giao cây lớn nếu shop có đặt).
--   * Không nhập: Đế xanh 3 thân, Đế nâu 3 thân (đã có từ đợt 1, cùng giá 110.000đ); Đuôi phụng vườn Bình An 30.000đ (web đã có "Đuôi công phụng"
--     cao 30–50cm giá vườn 40.000đ, sổ không ghi cỡ — chờ chủ shop nói là cỡ nào).
--   * Mỗi quy cách tồn 10 ở kho mặc định ("Tồn đầu kỳ"); lô ghi nhà vườn + giá vườn (cột của 0066). Nhà vườn tạo trong bảng suppliers nếu chưa có.
--   * Bỏ qua cây trùng đường dẫn / tên đã có (chạy lại không nhập trùng).
INSERT INTO "suppliers" ("name")
SELECT v.n FROM (VALUES ('Vườn Quang'), ('Vườn chị Phượng (Duy Việt)'), ('Vườn A Minh'), ('Vườn Bình An'), ('Vườn kiểng Phan Oanh'), ('Vườn Minh Xuyên')) v(n)
WHERE NOT EXISTS (SELECT 1 FROM "suppliers" s WHERE lower(s.name) = lower(v.n));--> statement-breakpoint
CREATE TEMP TABLE "_m67" ("ord" int, "slug" text PRIMARY KEY, "name" text, "sub" text, "extra_subs" jsonb, "icon" text, "spec" text, "lead" text,
  "specs" jsonb, "attrs" jsonb, "kw" jsonb, "options" jsonb, "supplier" text);--> statement-breakpoint
INSERT INTO "_m67" VALUES
(1, 'vang-bac', 'Vàng bạc', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'leaf', 'Trong nhà · Văn phòng',
 'Vàng bạc là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Tên gọi mang ý vàng bạc, tiền tài nên cây hay được chọn làm quà khai trương, tân gia. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb, '[]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":15000,"cost":17000,"price":31000,"combo2":56000,"old":40000,"bulky":false}]'::jsonb, 'Vườn Quang'),
(2, 'bach-trang', 'Bạch trạng', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'leaf', 'Trong nhà · Văn phòng',
 'Bạch trạng là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb, '[]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":50000,"cost":55000,"price":99000,"combo2":178000,"old":121000,"bulky":false}]'::jsonb, 'Vườn Quang'),
(3, 'de-tim-phap', 'Đế tím Pháp', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'leaf', 'Trong nhà · Văn phòng',
 'Đế tím Pháp là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb, '["Đế tím","Đế vương tím"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":50000,"cost":55000,"price":99000,"combo2":178000,"old":126000,"bulky":false}]'::jsonb, 'Vườn Quang'),
(4, 'hac-cam', 'Hạc cam', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'leaf', 'Trong nhà · Văn phòng',
 'Hạc cam là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb, '[]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":50000,"cost":55000,"price":99000,"combo2":178000,"old":125000,"bulky":false}]'::jsonb, 'Vườn Quang'),
(5, 'chanh-nho', 'Chanh nho', 'cay-san-vuon', '[]'::jsonb, 'plant', 'Sân vườn',
 'Chanh nho là cây trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[]'::jsonb,
 '{"viTri":["ngoai-troi"]}'::jsonb, '[]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":30000,"cost":33000,"price":59000,"combo2":106000,"old":74000,"bulky":false}]'::jsonb, 'Vườn Quang'),
(6, 'lan-y-nu-hoang', 'Lan ý nữ hoàng', 'cay-van-phong', '["cay-trong-nha"]'::jsonb, 'flower', 'Văn phòng · Trong nhà',
 'Lan ý nữ hoàng là giống lan ý (Spathiphyllum) cỡ lớn, lá to bản xanh đậm bóng, hoa trắng mo cao vượt tán. Cây chịu bóng, dễ chăm, hợp đặt sàn phòng khách, sảnh, văn phòng.',
 '[["Ánh sáng","Ánh sáng tán xạ hoặc bóng râm; chịu được đèn văn phòng; nắng gắt làm cháy lá"],["Tưới nước","Giữ đất hơi ẩm, tưới 2–3 lần/tuần; lá rũ xuống là cây khát nước, tưới lại cây tươi lên nhanh"],["Đất trồng","Giá thể tơi xốp giữ ẩm: đất sạch trộn xơ dừa, trấu hun"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng; bón thêm lân giúp ra hoa"],["Nhiệt độ, độ ẩm","Thích hợp 18–30°C, ưa ẩm"],["Mức độ dễ chăm","Dễ chăm"],["An toàn thú cưng","Không — lá, hoa có tinh thể canxi oxalat gây ngứa, độc nếu nhai phải"],["Công dụng","Trang trí phòng khách, văn phòng, bàn làm việc; hoa trắng nở nhiều đợt"],["Cách nhân giống","Tách bụi"],["Nguồn gốc","Nam Mỹ"],["Tên khoa học","Spathiphyllum"],["Sâu bệnh thường gặp","Thối rễ khi úng, rệp sáp; chóp lá cháy khi khô hoặc thừa phân"]]'::jsonb,
 '{"mau":["xanh-dam","co-hoa"],"cham":"de","viTri":["trong-nha","van-phong"],"anhSang":["sang","ram","den"],"thuCung":"doc","vaiTro":["goc"],"kichThuoc":"vua"}'::jsonb, '["Lan ý","Bạch môn","Huệ hòa bình","Spathiphyllum","Peace lily"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":70000,"cost":77000,"price":139000,"combo2":250000,"old":176000,"bulky":false}]'::jsonb, 'Vườn Quang'),
(7, 'lan-chi', 'Lan chi', 'cay-de-ban', '["cay-trong-nha","cay-ban-cong"]'::jsonb, 'leaf', 'Để bàn · Treo',
 'Lan chi (cỏ lan chi, dây nhện) có lá dài mảnh, sọc trắng xanh, mọc thành bụi và ra nhánh rủ mang cây con. Cây rất dễ sống, hợp để bàn, kệ hoặc treo ban công.',
 '[["Ánh sáng","Ánh sáng tán xạ hoặc nắng nhẹ buổi sáng; thiếu sáng lá kém sọc"],["Tưới nước","Tưới khi mặt đất khô, 2–3 lần/tuần; rễ củ trữ nước nên chịu hạn được vài ngày"],["Đất trồng","Đất tơi xốp thoát nước: đất sạch trộn xơ dừa, trấu hun"],["Bón phân","NPK pha loãng hoặc phân trùn quế, 1 lần/tháng"],["Mức độ dễ chăm","Rất dễ chăm"],["An toàn thú cưng","An toàn với chó mèo"],["Công dụng","Để bàn, treo ban công, cửa sổ"],["Cách nhân giống","Tách cây con trên nhánh rủ, tách bụi"],["Nguồn gốc","Nam Phi"],["Tên khoa học","Chlorophytum comosum"]]'::jsonb,
 '{"mau":["loang"],"cham":"de","viTri":["trong-nha","van-phong","ban-cong","treo"],"anhSang":["nang-nhe","sang"],"thuCung":"an-toan","vaiTro":["de-ban","treo"],"kichThuoc":"mini"}'::jsonb, '["Cỏ lan chi","Cây dây nhện","Lan chi sọc","Chlorophytum","Spider plant"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":8000,"cost":8800,"price":16000,"combo2":29000,"old":21000,"bulky":false}]'::jsonb, 'Vườn Quang'),
(8, 'hong-phung', 'Hồng phụng', 'cay-san-vuon', '[]'::jsonb, 'plant', 'Chậu 12',
 'Hồng phụng là cây trồng chậu, lấy từ nhà vườn ở Sa Đéc. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[]'::jsonb,
 '{}'::jsonb, '[]'::jsonb, '[{"label":"Chậu 12","garden":130000,"cost":143000,"price":257000,"combo2":463000,"old":330000,"bulky":false}]'::jsonb, 'Vườn chị Phượng (Duy Việt)'),
(9, 'tulip-thai', 'Tulip Thái', 'cay-ban-cong', '["cay-san-vuon"]'::jsonb, 'flower', 'Ban công · Sân vườn',
 'Tulip Thái (nghệ tây Thái) là cây thân củ họ gừng, lá thon dài, hoa hồng tím mọc trên cán cao giống hoa tulip, nở bền nhiều tuần vào mùa mưa. Hợp trồng chậu ban công, sân vườn có nắng.',
 '[["Ánh sáng","Nắng nhẹ đến nắng sáng; nắng gắt buổi trưa làm cháy mép lá"],["Tưới nước","Giữ đất ẩm đều mùa ra lá, ra hoa; mùa khô cây tàn lá, củ nghỉ thì giảm tưới"],["Đất trồng","Đất tơi xốp giàu mùn, thoát nước tốt để củ không thối"],["Bón phân","NPK pha loãng 2 tuần/lần khi cây ra lá, tăng lân khi sắp ra hoa"],["Mức độ dễ chăm","Trung bình"],["Công dụng","Chậu hoa ban công, sân vườn, cắm bình"],["Cách nhân giống","Tách củ"],["Nguồn gốc","Thái Lan, Campuchia"],["Tên khoa học","Curcuma alismatifolia"]]'::jsonb,
 '{"mau":["co-hoa","do-hong"],"cham":"vua","viTri":["ban-cong","ngoai-troi"],"anhSang":["nang-nhe"],"vaiTro":["bon-hoa"],"kichThuoc":"nho"}'::jsonb, '["Nghệ tây Thái","Hoa nghệ Thái","Siam tulip","Curcuma"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":40000,"cost":44000,"price":79000,"combo2":142000,"old":98000,"bulky":false}]'::jsonb, 'Vườn A Minh'),
(10, 'hoa-hong', 'Hoa hồng', 'cay-ban-cong', '["cay-san-vuon"]'::jsonb, 'rose', 'Ban công · Sân vườn',
 'Hoa hồng trồng chậu, hoa nở quanh năm khi đủ nắng và được tỉa cành, bón phân đều. Hợp trồng ban công, sân thượng, sân vườn nhiều nắng.',
 '[["Ánh sáng","Nắng trực tiếp ít nhất 6 giờ/ngày; thiếu nắng cây ít hoa, dễ nấm bệnh"],["Tưới nước","Tưới gốc 1 lần/ngày vào buổi sáng, tránh tưới lên lá và hoa; không để úng"],["Đất trồng","Đất tơi xốp giàu mùn: đất sạch trộn phân bò hoai, trấu hun, xơ dừa"],["Bón phân","Phân hữu cơ hoặc NPK 7–10 ngày/lần; tăng lân, kali khi cây ra nụ"],["Mức độ dễ chăm","Cần chăm kỹ"],["Công dụng","Chậu hoa ban công, sân vườn, cắt cành cắm hoa"],["Cách nhân giống","Giâm cành, ghép"],["Tên khoa học","Rosa"],["Sâu bệnh thường gặp","Đốm đen, phấn trắng, rệp, nhện đỏ, sâu ăn nụ — cần kiểm tra lá thường xuyên"]]'::jsonb,
 '{"mau":["co-hoa","do-hong"],"cham":"kho","viTri":["ban-cong","ngoai-troi"],"anhSang":["nang-gat"],"vaiTro":["bon-hoa"],"kichThuoc":"nho"}'::jsonb, '["Bông hồng","Hồng","Rosa","Rose"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":40000,"cost":44000,"price":79000,"combo2":142000,"old":100000,"bulky":false}]'::jsonb, 'Vườn Bình An'),
(11, 'chanh-tan', 'Chanh tàn', 'cay-san-vuon', '[]'::jsonb, 'plant', 'Sân vườn',
 'Chanh tàn là cây trồng chậu, lấy từ nhà vườn ở Sa Đéc. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[]'::jsonb,
 '{"viTri":["ngoai-troi"]}'::jsonb, '[]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":90000,"cost":99000,"price":178000,"combo2":320000,"old":230000,"bulky":false}]'::jsonb, 'Vườn Bình An'),
(12, 'de-kim-cuong', 'Đế kim cương', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'leaf', 'Trong nhà · Văn phòng',
 'Đế kim cương là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb, '["Đế vương kim cương"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":90000,"cost":99000,"price":178000,"combo2":320000,"old":214000,"bulky":false}]'::jsonb, 'Vườn Bình An'),
(13, 'mai-dia-thao', 'Mai địa thảo', 'cay-ban-cong', '["cay-san-vuon"]'::jsonb, 'flower', 'Ban công · Sân vườn',
 'Mai địa thảo (hoa ngọc thảo) là cây hoa thân mềm, tán thấp, hoa nhiều màu nở dày gần như quanh năm. Hợp trồng chậu ban công, bồn hoa, nơi có nắng nhẹ.',
 '[["Ánh sáng","Nắng nhẹ buổi sáng hoặc bóng râm một phần; nắng gắt buổi trưa làm héo lá"],["Tưới nước","Giữ đất ẩm đều, tưới 1 lần/ngày mùa nắng; không để úng gốc"],["Đất trồng","Đất tơi xốp giàu mùn, thoát nước tốt"],["Bón phân","NPK pha loãng 7–10 ngày/lần, tăng lân để hoa ra đều"],["Mức độ dễ chăm","Trung bình"],["Công dụng","Chậu hoa ban công, bồn hoa, viền lối đi"],["Cách nhân giống","Giâm cành, gieo hạt"],["Tên khoa học","Impatiens"],["Sâu bệnh thường gặp","Thối thân khi úng, nhện đỏ, rệp"]]'::jsonb,
 '{"mau":["co-hoa"],"cham":"vua","viTri":["ban-cong","ngoai-troi"],"anhSang":["nang-nhe","ram"],"vaiTro":["bon-hoa","bui"],"kichThuoc":"mini"}'::jsonb, '["Hoa ngọc thảo","Hoa mai địa thảo","Bóng nước","Impatiens"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":40000,"cost":44000,"price":79000,"combo2":142000,"old":97000,"bulky":false}]'::jsonb, 'Vườn kiểng Phan Oanh'),
(14, 'son-tung', 'Sơn tùng', 'cay-san-vuon', '[]'::jsonb, 'trees', 'Sân vườn',
 'Sơn tùng là cây trồng chậu, lấy từ nhà vườn ở Sa Đéc. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[]'::jsonb,
 '{"viTri":["ngoai-troi"]}'::jsonb, '[]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":130000,"cost":143000,"price":257000,"combo2":463000,"old":311000,"bulky":false}]'::jsonb, 'Vườn kiểng Phan Oanh'),
(15, 'duoi-chon-cup', 'Đuôi chồn cúp', 'cay-san-vuon', '[]'::jsonb, 'trees', 'Sân vườn',
 'Đuôi chồn cúp là cây trồng chậu, lấy từ nhà vườn ở Sa Đéc. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[]'::jsonb,
 '{"viTri":["ngoai-troi"]}'::jsonb, '["Đuôi chồn"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":150000,"cost":165000,"price":297000,"combo2":535000,"old":380000,"bulky":false}]'::jsonb, 'Vườn kiểng Phan Oanh'),
(16, 'thien-dieu-thai', 'Thiên điểu Thái', 'cay-san-vuon', '[]'::jsonb, 'plant', 'Sân vườn',
 'Thiên điểu Thái (nhà vườn còn gọi là chuối cẩm thạch) là cây trồng chậu, lấy từ nhà vườn ở Sa Đéc. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[]'::jsonb,
 '{"viTri":["ngoai-troi"]}'::jsonb, '["Chuối cẩm thạch","Thiên điểu"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":30000,"cost":33000,"price":59000,"combo2":106000,"old":72000,"bulky":false}]'::jsonb, 'Vườn kiểng Phan Oanh'),
(17, 'lan-y', 'Lan ý', 'cay-van-phong', '["cay-de-ban","cay-trong-nha"]'::jsonb, 'flower', 'Văn phòng · Để bàn',
 'Lan ý (bạch môn, huệ hòa bình) có lá xanh đậm bóng, hoa trắng mo nở nhiều đợt trong năm. Cây chịu bóng, dễ chăm, hợp để bàn, kệ, góc phòng khách và văn phòng.',
 '[["Ánh sáng","Ánh sáng tán xạ hoặc bóng râm; chịu được đèn văn phòng; nắng gắt làm cháy lá"],["Tưới nước","Giữ đất hơi ẩm, tưới 2–3 lần/tuần; lá rũ xuống là cây khát nước, tưới lại cây tươi lên nhanh"],["Đất trồng","Giá thể tơi xốp giữ ẩm: đất sạch trộn xơ dừa, trấu hun"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng; bón thêm lân giúp ra hoa"],["Nhiệt độ, độ ẩm","Thích hợp 18–30°C, ưa ẩm"],["Mức độ dễ chăm","Dễ chăm"],["An toàn thú cưng","Không — lá, hoa có tinh thể canxi oxalat gây ngứa, độc nếu nhai phải"],["Công dụng","Trang trí phòng khách, văn phòng, bàn làm việc; hoa trắng nở nhiều đợt"],["Cách nhân giống","Tách bụi"],["Nguồn gốc","Nam Mỹ"],["Tên khoa học","Spathiphyllum"],["Sâu bệnh thường gặp","Thối rễ khi úng, rệp sáp; chóp lá cháy khi khô hoặc thừa phân"]]'::jsonb,
 '{"mau":["xanh-dam","co-hoa"],"cham":"de","viTri":["trong-nha","van-phong"],"anhSang":["sang","ram","den"],"thuCung":"doc","vaiTro":["de-ban"],"kichThuoc":"nho"}'::jsonb, '["Bạch môn","Huệ hòa bình","Spathiphyllum","Peace lily"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":25000,"cost":28000,"price":50000,"combo2":90000,"old":64000,"bulky":false}]'::jsonb, 'Vườn kiểng Phan Oanh'),
(18, 'ken-hong', 'Kèn hồng', 'cay-cong-trinh', '["cay-san-vuon"]'::jsonb, 'tree', 'Công trình · Bóng mát',
 'Kèn hồng (chuông hồng) là cây thân gỗ, tán rộng, mùa khô rụng lá rồi nở kín hoa hồng phớt hình kèn. Trồng đường phố, công viên, khuôn viên công trình.',
 '[["Ánh sáng","Nắng toàn phần"],["Tưới nước","Mới trồng tưới đẫm 1 lần/ngày trong 1–2 tháng đầu; cây đã bén rễ chịu hạn khá, tưới khi đất khô"],["Đất trồng","Đất thịt hoặc đất phù sa thoát nước tốt; hố trồng rộng, trộn phân chuồng hoai"],["Bón phân","Phân chuồng hoai hoặc NPK 2–3 lần/năm trong giai đoạn đầu"],["Mức độ dễ chăm","Dễ chăm"],["Công dụng","Cây bóng mát, cây hoa đường phố, công viên, khuôn viên"],["Nguồn gốc","Trung và Nam Mỹ"],["Tên khoa học","Tabebuia rosea"]]'::jsonb,
 '{"mau":["xanh","co-hoa","do-hong"],"cham":"de","viTri":["ngoai-troi"],"anhSang":["nang-gat"],"vaiTro":["bong-mat"],"kichThuoc":"cay-lon","chiuGio":true}'::jsonb, '["Chuông hồng","Kèn hồng","Tabebuia rosea"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":280000,"cost":308000,"price":554000,"combo2":997000,"old":682000,"bulky":true}]'::jsonb, 'Vườn Minh Xuyên'),
(19, 'cau-trang', 'Cau trắng', 'cay-cong-trinh', '["cay-san-vuon"]'::jsonb, 'palm', 'Công trình · Sân vườn',
 'Cau trắng (cau Manila) thân thẳng, màu xám trắng, tán lá xòe gọn, trái chín đỏ. Cây sạch, ít rụng lá, hợp trồng lối đi, hàng rào, sân vườn và khuôn viên công trình.',
 '[["Ánh sáng","Nắng toàn phần hoặc nắng một phần"],["Tưới nước","Mới trồng tưới 1 lần/ngày; cây đã bén rễ tưới khi đất khô"],["Đất trồng","Đất thoát nước tốt, trộn phân chuồng hoai khi trồng"],["Bón phân","NPK hoặc phân chuồng 2–3 lần/năm"],["Mức độ dễ chăm","Dễ chăm"],["Công dụng","Trồng lối đi, hàng rào, sân vườn, khuôn viên công trình"],["Nguồn gốc","Philippines"],["Tên khoa học","Adonidia merrillii"]]'::jsonb,
 '{"mau":["xanh"],"cham":"de","viTri":["ngoai-troi"],"anhSang":["nang-gat","nang-nhe"],"kichThuoc":"cay-lon","chiuGio":true}'::jsonb, '["Cau Manila","Cau trắng","Adonidia","Veitchia merrillii"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":280000,"cost":308000,"price":554000,"combo2":997000,"old":677000,"bulky":true}]'::jsonb, 'Vườn Minh Xuyên'),
(20, 'phuong-vi', 'Phượng vĩ', 'cay-cong-trinh', '["cay-san-vuon"]'::jsonb, 'tree', 'Công trình · Bóng mát',
 'Phượng vĩ là cây thân gỗ tán rộng xòe như chiếc ô, lá kép lông chim, mùa hè nở rộ hoa đỏ cam. Cây bóng mát quen thuộc của sân trường, công viên, đường phố.',
 '[["Ánh sáng","Nắng toàn phần"],["Tưới nước","Mới trồng tưới đẫm 1 lần/ngày trong 1–2 tháng đầu; cây đã bén rễ chịu hạn khá, tưới khi đất khô"],["Đất trồng","Đất thịt hoặc đất phù sa thoát nước tốt; hố trồng rộng, trộn phân chuồng hoai"],["Bón phân","Phân chuồng hoai hoặc NPK 2–3 lần/năm trong giai đoạn đầu"],["Mức độ dễ chăm","Dễ chăm"],["Công dụng","Cây bóng mát sân trường, công viên, đường phố, khuôn viên"],["Nguồn gốc","Madagascar"],["Tên khoa học","Delonix regia"]]'::jsonb,
 '{"mau":["xanh","co-hoa","do-hong"],"cham":"de","viTri":["ngoai-troi"],"anhSang":["nang-gat"],"vaiTro":["bong-mat"],"kichThuoc":"cay-lon","chiuGio":true}'::jsonb, '["Phượng vỹ","Phượng đỏ","Delonix regia"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":280000,"cost":308000,"price":554000,"combo2":997000,"old":715000,"bulky":true}]'::jsonb, 'Vườn Minh Xuyên'),
(21, 'giang-huong', 'Giáng hương', 'cay-cong-trinh', '["cay-san-vuon"]'::jsonb, 'tree', 'Công trình · Bóng mát',
 'Giáng hương là cây thân gỗ lớn, tán dày, đầu mùa mưa nở hoa vàng thơm. Cây bền, sống lâu, hay trồng đường phố, công viên, khuôn viên cơ quan.',
 '[["Ánh sáng","Nắng toàn phần"],["Tưới nước","Mới trồng tưới đẫm 1 lần/ngày trong 1–2 tháng đầu; cây đã bén rễ chịu hạn khá, tưới khi đất khô"],["Đất trồng","Đất thịt hoặc đất phù sa thoát nước tốt; hố trồng rộng, trộn phân chuồng hoai"],["Bón phân","Phân chuồng hoai hoặc NPK 2–3 lần/năm trong giai đoạn đầu"],["Mức độ dễ chăm","Dễ chăm"],["Công dụng","Cây bóng mát đường phố, công viên, khuôn viên"],["Nguồn gốc","Đông Nam Á"],["Tên khoa học","Pterocarpus macrocarpus"]]'::jsonb,
 '{"mau":["xanh","co-hoa","vang"],"cham":"de","viTri":["ngoai-troi"],"anhSang":["nang-gat"],"vaiTro":["bong-mat"],"kichThuoc":"cay-lon","chiuGio":true}'::jsonb, '["Giáng hương quả to","Pterocarpus"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":280000,"cost":308000,"price":554000,"combo2":997000,"old":711000,"bulky":true}]'::jsonb, 'Vườn Minh Xuyên'),
(22, 'bang-dai-loan', 'Bàng Đài Loan', 'cay-cong-trinh', '["cay-san-vuon"]'::jsonb, 'tree', 'Công trình · Bóng mát',
 'Bàng Đài Loan (tiểu diệp) thân thẳng, cành mọc thành tầng ngang, lá nhỏ xanh mướt, tán gọn đẹp. Hợp trồng sân vườn, lối đi, khuôn viên công trình, quán cà phê.',
 '[["Ánh sáng","Nắng toàn phần"],["Tưới nước","Mới trồng tưới đẫm 1 lần/ngày trong 1–2 tháng đầu; cây đã bén rễ chịu hạn khá, tưới khi đất khô"],["Đất trồng","Đất thịt hoặc đất phù sa thoát nước tốt; hố trồng rộng, trộn phân chuồng hoai"],["Bón phân","Phân chuồng hoai hoặc NPK 2–3 lần/năm trong giai đoạn đầu"],["Mức độ dễ chăm","Dễ chăm"],["Công dụng","Cây bóng mát sân vườn, lối đi, khuôn viên công trình"],["Nguồn gốc","Madagascar"],["Tên khoa học","Terminalia mantaly"]]'::jsonb,
 '{"mau":["xanh"],"cham":"de","viTri":["ngoai-troi"],"anhSang":["nang-gat"],"vaiTro":["bong-mat"],"kichThuoc":"cay-lon","chiuGio":true}'::jsonb, '["Bàng lá nhỏ","Bàng tiểu diệp","Terminalia mantaly"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":280000,"cost":308000,"price":554000,"combo2":997000,"old":668000,"bulky":true}]'::jsonb, 'Vườn Minh Xuyên'),
(23, 'bang-lang', 'Bằng lăng', 'cay-cong-trinh', '["cay-san-vuon"]'::jsonb, 'tree', 'Công trình · Bóng mát',
 'Bằng lăng là cây thân gỗ, lá to, mùa hè nở từng chùm hoa tím. Cây bóng mát quen thuộc của đường phố, sân trường, công viên.',
 '[["Ánh sáng","Nắng toàn phần"],["Tưới nước","Mới trồng tưới đẫm 1 lần/ngày trong 1–2 tháng đầu; cây đã bén rễ chịu hạn khá, tưới khi đất khô"],["Đất trồng","Đất thịt hoặc đất phù sa thoát nước tốt; hố trồng rộng, trộn phân chuồng hoai"],["Bón phân","Phân chuồng hoai hoặc NPK 2–3 lần/năm trong giai đoạn đầu"],["Mức độ dễ chăm","Dễ chăm"],["Công dụng","Cây bóng mát, cây hoa đường phố, sân trường, công viên"],["Nguồn gốc","Nam Á, Đông Nam Á"],["Tên khoa học","Lagerstroemia speciosa"]]'::jsonb,
 '{"mau":["xanh","co-hoa","tim"],"cham":"de","viTri":["ngoai-troi"],"anhSang":["nang-gat"],"vaiTro":["bong-mat"],"kichThuoc":"cay-lon","chiuGio":true}'::jsonb, '["Bằng lăng tím","Lagerstroemia"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":280000,"cost":308000,"price":554000,"combo2":997000,"old":677000,"bulky":true}]'::jsonb, 'Vườn Minh Xuyên'),
(24, 'dau-rai', 'Dầu rái', 'cay-cong-trinh', '["cay-san-vuon"]'::jsonb, 'tree', 'Công trình · Bóng mát',
 'Dầu rái (dầu con rái) là cây thân gỗ lớn, thân thẳng cao, tán gọn trên ngọn. Cây bản địa Nam Bộ, sống lâu, hay trồng đường phố, công viên, khuôn viên lớn.',
 '[["Ánh sáng","Nắng toàn phần"],["Tưới nước","Mới trồng tưới đẫm 1 lần/ngày trong 1–2 tháng đầu; cây đã bén rễ chịu hạn khá, tưới khi đất khô"],["Đất trồng","Đất thịt hoặc đất phù sa thoát nước tốt; hố trồng rộng, trộn phân chuồng hoai"],["Bón phân","Phân chuồng hoai hoặc NPK 2–3 lần/năm trong giai đoạn đầu"],["Mức độ dễ chăm","Dễ chăm"],["Công dụng","Cây bóng mát đường phố, công viên, khuôn viên lớn"],["Nguồn gốc","Đông Nam Á (bản địa Nam Bộ)"],["Tên khoa học","Dipterocarpus alatus"]]'::jsonb,
 '{"mau":["xanh"],"cham":"de","viTri":["ngoai-troi"],"anhSang":["nang-gat"],"vaiTro":["bong-mat"],"kichThuoc":"cay-lon","chiuGio":true}'::jsonb, '["Dầu con rái","Dầu nước","Dipterocarpus alatus"]'::jsonb, '[{"label":"Cỡ tiêu chuẩn","garden":280000,"cost":308000,"price":554000,"combo2":997000,"old":710000,"bulky":true}]'::jsonb, 'Vườn Minh Xuyên');--> statement-breakpoint
CREATE TEMP TABLE "_m67_new" ("slug" text PRIMARY KEY);--> statement-breakpoint
WITH base AS (
  SELECT greatest(90000, coalesce(max(substring(sku FROM '^MT-(\d+)$')::int), 0)) AS n FROM "products" WHERE sku ~ '^MT-\d+$'
),
todo AS (
  SELECT v.* FROM "_m67" v
  WHERE NOT EXISTS (SELECT 1 FROM "products" e WHERE e.slug = v.slug OR lower(e.name) = lower(v.name))
    AND EXISTS (SELECT 1 FROM "subcategories" s WHERE s.category_slug = 'cay-canh' AND s.slug = v.sub)
),
ins AS (
  INSERT INTO "products" ("slug", "sku", "name", "category", "sub", "extra_subs", "icon", "origin", "ship", "unit", "spec", "lead", "specs", "keywords", "attrs", "active", "created_at")
  SELECT t.slug, 'MT-' || (base.n + row_number() OVER (ORDER BY t.ord)), t.name, 'cay-canh', t.sub,
    coalesce((SELECT jsonb_agg(x) FROM jsonb_array_elements_text(t.extra_subs) x
      WHERE EXISTS (SELECT 1 FROM "subcategories" s WHERE s.category_slug = 'cay-canh' AND s.slug = x)), '[]'::jsonb),
    t.icon, 'Việt Nam', 'plant', 'Cây', t.spec, t.lead, t.specs, t.kw, t.attrs, true, now() + t.ord * interval '1 millisecond'
  FROM todo t, base
  RETURNING "slug"
)
INSERT INTO "_m67_new" SELECT slug FROM ins;--> statement-breakpoint
INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "old_price", "garden", "cost", "combo2", "bulky", "stock")
SELECT m.slug, (o.ord - 1)::int, o.value->>'label', (o.value->>'price')::int, (o.value->>'old')::int, (o.value->>'garden')::int, (o.value->>'cost')::int,
  (o.value->>'combo2')::int, (o.value->>'bulky')::boolean, 10
FROM "_m67" m JOIN "_m67_new" n ON n.slug = m.slug, jsonb_array_elements(m.options) WITH ORDINALITY AS o(value, ord);--> statement-breakpoint
WITH st AS (SELECT id FROM "stores" WHERE "active" ORDER BY is_default DESC, id LIMIT 1),
lots AS (
  INSERT INTO "stock_lots" ("store_id", "product_slug", "option_idx", "qty", "supplier_id", "unit_cost")
  SELECT st.id, m.slug, (o.ord - 1)::int, 10, (SELECT s.id FROM "suppliers" s WHERE lower(s.name) = lower(m.supplier) LIMIT 1), (o.value->>'garden')::int
  FROM "_m67" m JOIN "_m67_new" n ON n.slug = m.slug, jsonb_array_elements(m.options) WITH ORDINALITY AS o(value, ord), st
  RETURNING id, store_id, product_slug, option_idx
)
INSERT INTO "stock_moves" ("product_slug", "option_idx", "store_id", "lot_id", "delta", "after", "reason", "note", "actor")
SELECT product_slug, option_idx, store_id, id, 10, 10, 'import', 'Tồn đầu kỳ', 'Hệ thống' FROM lots;--> statement-breakpoint
DROP TABLE "_m67_new";--> statement-breakpoint
DROP TABLE "_m67";
