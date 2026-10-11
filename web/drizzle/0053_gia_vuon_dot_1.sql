-- Giá theo GIÁ VƯỜN THẬT, đợt 1 (11/10/2026): chủ shop gửi sổ giá nhà vườn 40 dòng (vườn Quang – Làng hoa Sa Đéc, Phương, A Tùng – Cái Bè, Dượng 4)
-- và chốt một công thức chung cho mọi cây: giá gốc = vườn + 10% · giá lẻ = gốc + 80% · combo 2 cây = (lẻ × 2) − 10% · giá gạch = lẻ + 20–30%.
-- Trước đó giá lẻ do Claude ước theo chiều cao, "giá vườn / giá gốc" là số tính ngược (0048) — nhiều cây đang để dưới cả giá vườn thật.
--   1) Sửa giá 16 quy cách đang có (chỉ khi giá còn đúng mức cũ — admin đã sửa tay thì giữ). Cỡ đã khớp với sổ: ghi giá vườn thật;
--      cỡ khác của cùng cây chưa có giá vườn: nhân cùng tỉ lệ (ƯỚC), giá vườn / gốc tính ngược.
--   2) Thêm 4 quy cách cho cây đang có (nối sau, không đổi số thứ tự cũ): Lưỡi hổ chậu C10, Vạn lộc cao 50–60cm, Đế vương xanh 3 thân, Đế vương đỏ chậu C7.
--   3) Thêm 15 cây mới, để ẨN (chủ shop đang tắt bán toàn bộ, ảnh bổ sung sau). Sổ giá ghi theo mã chậu nhựa đen (C7 miệng 15cm, C9 23cm, C10 25cm)
--      nên quy cách mới ghi mã chậu; dòng không ghi cỡ thì "Cỡ tiêu chuẩn". 12 cây kiểng lá / Lài tây CHƯA xác định được giống (tên thương mại của nhà vườn):
--      chỉ có mô tả + cách chăm chung, không ghi tên khoa học / độ an toàn thú cưng — bổ sung khi có ảnh.
--   4) Mỗi quy cách mới tồn 10 ở kho mặc định ("Tồn đầu kỳ", như 0035 / 0047).
CREATE TEMP TABLE "_m53_upd" ("slug" text, "label" text, "was" int, "garden" int, "cost" int, "price" int, "combo2" int, "old" int);--> statement-breakpoint
INSERT INTO "_m53_upd" VALUES
('ngan-hau', 'Cao 30–50cm', 40000, 40000, 44000, 79000, 142000, 95000),
('duoi-cong-tim', 'Cao 30–50cm', 40000, 40000, 44000, 79000, 142000, 99000),
('duoi-cong-tim', 'Cao 20–30cm', 25000, 25000, 27000, 49000, 88000, 59000),
('duoi-cong-xanh', 'Cao 30–50cm', 40000, 40000, 44000, 79000, 142000, 99000),
('duoi-cong-xanh', 'Cao 20–30cm', 25000, 25000, 27000, 49000, 88000, 63000),
('duoi-phung', 'Cao 30–50cm', 40000, 40000, 44000, 79000, 142000, 102000),
('duoi-cong', 'Cao 30–50cm', 45000, 35000, 39000, 70000, 126000, 88000),
('duoi-cong', 'Cao 30–40cm', 38000, 30000, 33000, 59000, 106000, 74000),
('mon-quan-am', 'Cao 20–30cm', 45000, 35000, 39000, 70000, 126000, 88000),
('mon-quan-am', 'Cao 40–60cm', 95000, 75000, 82000, 148000, 266000, 187000),
('da-lan-thanh', 'Cao 40–60cm', 60000, 35000, 39000, 70000, 126000, 85000),
('da-lan-thanh', 'Cao 70–100cm', 130000, 76000, 84000, 152000, 274000, 187000),
('phu-quy', 'Cao 20–30cm', 30000, 18000, 20000, 36000, 65000, 46000),
('ngoc-ngan', 'Cao 30–50cm', 45000, 25000, 28000, 50000, 90000, 62000),
('ngoc-ngan', 'Cao 25–30cm', 30000, 16000, 18000, 33000, 59000, 40000),
('van-nien-thanh', 'Cao 50–60cm', 53000, 30000, 33000, 59000, 106000, 73000);--> statement-breakpoint
UPDATE "product_options" o SET "garden" = u.garden, "cost" = u.cost, "price" = u.price, "combo2" = u.combo2, "old_price" = u.old
FROM "_m53_upd" u WHERE o.product_slug = u.slug AND o.label = u.label AND NOT o.deleted AND o.price = u.was;--> statement-breakpoint
DROP TABLE "_m53_upd";--> statement-breakpoint
CREATE TEMP TABLE "_m53_newopt" ("slug" text, "idx" int);--> statement-breakpoint
CREATE TEMP TABLE "_m53_opt" ("slug" text PRIMARY KEY, "label" text, "garden" int, "cost" int, "price" int, "combo2" int, "old" int);--> statement-breakpoint
INSERT INTO "_m53_opt" VALUES
('luoi-ho', 'Chậu C10 (miệng 25cm)', 70000, 77000, 139000, 250000, 172000),
('van-loc', 'Cao 50–60cm', 27000, 30000, 54000, 97000, 67000),
('trau-ba-de-vuong-xanh', '3 thân', 110000, 121000, 218000, 392000, 269000),
('trau-ba-de-vuong-do', 'Chậu C7 (miệng 15cm)', 40000, 44000, 79000, 142000, 100000);--> statement-breakpoint
WITH ins AS (
  INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "old_price", "garden", "cost", "combo2", "stock")
  SELECT v.slug, (SELECT coalesce(max(e.idx), -1) + 1 FROM "product_options" e WHERE e.product_slug = v.slug), v.label, v.price, v.old, v.garden, v.cost, v.combo2, 0
  FROM "_m53_opt" v
  WHERE EXISTS (SELECT 1 FROM "products" p WHERE p.slug = v.slug)
    AND NOT EXISTS (SELECT 1 FROM "product_options" e WHERE e.product_slug = v.slug AND e.label = v.label)
  RETURNING "product_slug", "idx"
)
INSERT INTO "_m53_newopt" SELECT product_slug, idx FROM ins;--> statement-breakpoint
DROP TABLE "_m53_opt";--> statement-breakpoint
CREATE TEMP TABLE "_m53" ("ord" int, "slug" text PRIMARY KEY, "name" text, "sub" text, "extra_subs" jsonb, "spec" text, "lead" text,
  "specs" jsonb, "attrs" jsonb, "fs" jsonb, "kw" jsonb, "options" jsonb);--> statement-breakpoint
INSERT INTO "_m53" VALUES
(1, 'trau-ba-de-vuong-vang', 'Trầu bà đế vương vàng', 'cay-van-phong', '["cay-trong-nha"]'::jsonb, 'Văn phòng · Trong nhà',
 'Trầu bà đế vương vàng thuộc nhóm trầu bà đế vương (Philodendron), lá to bản, lá non màu vàng chanh rồi ngả xanh vàng khi già. Cây khỏe, chịu bóng, hợp đặt phòng khách, sảnh, văn phòng.',
 '[["Ánh sáng","Ánh sáng tán xạ, chịu bóng râm tốt; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2–3 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Đất tơi xốp thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","Phân tan chậm hoặc NPK 20-20-20 pha loãng, 1 lần/tháng"],["Nhiệt độ, độ ẩm","Thích hợp 18–32°C, ưa ẩm; tránh gió máy lạnh thổi thẳng vào cây"],["Mức độ dễ chăm","Dễ chăm"],["Tốc độ sinh trưởng","Chậm đến trung bình"],["Kích thước trưởng thành","Cao 50–100cm, tán rộng"],["An toàn thú cưng","Không — nhựa cây gây ngứa, độc nếu nhai phải (tinh thể canxi oxalat)"],["Công dụng","Trang trí sảnh, phòng khách, văn phòng; quà tặng"],["Cách nhân giống","Tách chồi con"],["Nguồn gốc","Nam Mỹ (giống lai)"],["Sâu bệnh thường gặp","Thối gốc khi úng nước, rệp sáp, nhện đỏ; lá vàng nếu thiếu sáng lâu ngày"],["Phù hợp với ai","Văn phòng, gia đình muốn cây lá to sang trọng"]]'::jsonb,
 '{"mau":["vang","xanh"],"cham":"de","viTri":["van-phong","trong-nha"],"anhSang":["sang","ram"],"thuCung":"doc","kichThuoc":"vua"}'::jsonb,
 NULL,
 '["Đế vương","Đế vàng","Philodendron Imperial"]'::jsonb,
 '[{"label":"Chậu C9 (miệng 23cm)","garden":40000,"cost":44000,"price":79000,"combo2":142000,"old":98000}]'::jsonb),
(2, 'trau-ba-de-vuong-nau', 'Trầu bà đế vương nâu', 'cay-van-phong', '["cay-trong-nha"]'::jsonb, 'Văn phòng · Trong nhà',
 'Trầu bà đế vương nâu thuộc nhóm trầu bà đế vương (Philodendron), lá to bản màu nâu đỏ sẫm, bóng. Cây khỏe, chịu bóng, hợp đặt phòng khách, sảnh, văn phòng. Có thêm chậu 3 thân, tán dày.',
 '[["Ánh sáng","Ánh sáng tán xạ, chịu bóng râm tốt; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2–3 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Đất tơi xốp thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","Phân tan chậm hoặc NPK 20-20-20 pha loãng, 1 lần/tháng"],["Nhiệt độ, độ ẩm","Thích hợp 18–32°C, ưa ẩm; tránh gió máy lạnh thổi thẳng vào cây"],["Mức độ dễ chăm","Dễ chăm"],["Tốc độ sinh trưởng","Chậm đến trung bình"],["Kích thước trưởng thành","Cao 50–100cm, tán rộng"],["An toàn thú cưng","Không — nhựa cây gây ngứa, độc nếu nhai phải (tinh thể canxi oxalat)"],["Công dụng","Trang trí sảnh, phòng khách, văn phòng; quà tặng"],["Cách nhân giống","Tách chồi con"],["Nguồn gốc","Nam Mỹ (giống lai)"],["Sâu bệnh thường gặp","Thối gốc khi úng nước, rệp sáp, nhện đỏ; lá vàng nếu thiếu sáng lâu ngày"],["Phù hợp với ai","Văn phòng, gia đình muốn cây lá to sang trọng"]]'::jsonb,
 '{"mau":["xanh-dam"],"cham":"de","viTri":["van-phong","trong-nha"],"anhSang":["sang","ram"],"thuCung":"doc","kichThuoc":"vua"}'::jsonb,
 NULL,
 '["Đế vương","Đế nâu","Philodendron Imperial"]'::jsonb,
 '[{"label":"Chậu C9 (miệng 23cm)","garden":35000,"cost":39000,"price":70000,"combo2":126000,"old":86000},{"label":"3 thân","garden":110000,"cost":121000,"price":218000,"combo2":392000,"old":267000}]'::jsonb),
(3, 'thanh-lam', 'Thanh lam', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Thanh lam là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Chậu C11","garden":60000,"cost":66000,"price":119000,"combo2":214000,"old":150000}]'::jsonb),
(4, 'giu-tien', 'Giữ tiền', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Giữ tiền là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Tên gọi mang ý giữ tiền tài nên cây hay được chọn làm quà khai trương, tân gia. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Chậu C9 (miệng 23cm)","garden":30000,"cost":33000,"price":59000,"combo2":106000,"old":72000}]'::jsonb),
(5, 'giu-tien-thai', 'Giữ tiền Thái', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Giữ tiền Thái là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Tên gọi mang ý giữ tiền tài nên cây hay được chọn làm quà khai trương, tân gia. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":30000,"cost":33000,"price":59000,"combo2":106000,"old":75000}]'::jsonb),
(6, 'lindeni', 'Lindeni', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Lindeni là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":40000,"cost":44000,"price":79000,"combo2":142000,"old":99000}]'::jsonb),
(7, 'kim-cuong-hong', 'Kim cương hồng', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Kim cương hồng là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":50000,"cost":55000,"price":99000,"combo2":178000,"old":119000}]'::jsonb),
(8, 'thanh-xuan', 'Thanh xuân', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Thanh xuân là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Chậu C9 (miệng 23cm)","garden":40000,"cost":44000,"price":79000,"combo2":142000,"old":102000}]'::jsonb),
(9, 'nhu-y', 'Như ý', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Như ý là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":40000,"cost":44000,"price":79000,"combo2":142000,"old":99000}]'::jsonb),
(10, 'sao-sang', 'Sao sáng', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Sao sáng là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":40000,"cost":44000,"price":79000,"combo2":142000,"old":100000}]'::jsonb),
(11, 'parasol', 'Parasol', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Parasol là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":50000,"cost":55000,"price":99000,"combo2":178000,"old":120000}]'::jsonb),
(12, 'ngoc-nga', 'Ngọc ngà', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Ngọc ngà là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":45000,"cost":50000,"price":90000,"combo2":162000,"old":111000}]'::jsonb),
(13, 'cung-dien-vang', 'Cung điện vàng', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'Trong nhà · Văn phòng',
 'Cung điện vàng là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":50000,"cost":55000,"price":99000,"combo2":178000,"old":127000}]'::jsonb),
(14, 'lai-tay', 'Lài tây', 'cay-san-vuon', '[]'::jsonb, 'Sân vườn',
 'Lài tây là cây trồng sân vườn, lấy từ nhà vườn ở Cái Bè. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[]'::jsonb,
 '{"viTri":["ngoai-troi"]}'::jsonb,
 NULL,
 '[]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":7000,"cost":7700,"price":14000,"combo2":25000,"old":18000}]'::jsonb),
(15, 'tac-cam-thach-thai', 'Tắc cẩm thạch Thái', 'cay-san-vuon', '["cay-ban-cong"]'::jsonb, 'Sân vườn · Ban công',
 'Tắc cẩm thạch Thái là giống tắc (quất) lá đốm: lá xanh viền và loang trắng kem, trái non có sọc xanh, chín chuyển vàng cam. Cây vừa làm cảnh vừa lấy trái, hợp trồng chậu ở sân, ban công nhiều nắng.',
 '[["Ánh sáng","Nắng toàn phần, ít nhất 6 giờ/ngày; thiếu nắng cây ít hoa trái, lá kém đốm"],["Tưới nước","Tưới 1 lần/ngày mùa nắng; giữ ẩm đều khi ra hoa, nuôi trái; không để úng"],["Đất trồng","Đất thịt giàu mùn, thoát nước tốt; trồng chậu cần chậu có lỗ thoát nước"],["Bón phân","Phân chuồng hoai + NPK định kỳ 1–2 tháng/lần; tăng kali khi nuôi trái"],["Nhiệt độ, độ ẩm","Thích hợp 22–35°C"],["Mức độ dễ chăm","Trung bình"],["Tốc độ sinh trưởng","Trung bình, chậm hơn tắc lá xanh"],["Công dụng","Làm cảnh sân vườn, ban công, chưng Tết, lấy trái"],["Cách nhân giống","Chiết cành, ghép"],["Tên khoa học","Citrus × microcarpa (dạng lá đốm)"],["Sâu bệnh thường gặp","Rệp, sâu vẽ bùa, nhện đỏ, nấm bệnh trên lá"],["Phù hợp với ai","Gia đình có sân, ban công nắng; người chơi cây Tết"]]'::jsonb,
 '{"mau":["xanh","bac-trang"],"cham":"vua","viTri":["ngoai-troi","ban-cong"],"anhSang":["nang-gat"],"kichThuoc":"vua"}'::jsonb,
 '{"ages":"","meaning":"Trái sai, chín vàng tượng trưng cho tài lộc, sung túc","elements":["kim","tho"],"placement":"Sân trước, ban công nắng, phòng khách dịp Tết"}'::jsonb,
 '["Tắc cam thạch thái","Tắc cẩm thạch","Quất cẩm thạch","Tắc lá sọc"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":90000,"cost":99000,"price":178000,"combo2":320000,"old":222000}]'::jsonb);--> statement-breakpoint
CREATE TEMP TABLE "_m53_new" ("slug" text PRIMARY KEY);--> statement-breakpoint
WITH base AS (
  SELECT greatest(90000, coalesce(max(substring(sku FROM '^MT-(\d+)$')::int), 0)) AS n FROM "products" WHERE sku ~ '^MT-\d+$'
),
todo AS (
  SELECT v.* FROM "_m53" v
  WHERE NOT EXISTS (SELECT 1 FROM "products" e WHERE e.slug = v.slug OR lower(e.name) = lower(v.name))
    AND EXISTS (SELECT 1 FROM "subcategories" s WHERE s.category_slug = 'cay-canh' AND s.slug = v.sub)
),
ins AS (
  INSERT INTO "products" ("slug", "sku", "name", "category", "sub", "extra_subs", "icon", "origin", "ship", "unit", "spec", "lead", "specs", "keywords", "fengshui", "attrs", "active", "created_at")
  SELECT t.slug, 'MT-' || (base.n + row_number() OVER (ORDER BY t.ord)), t.name, 'cay-canh', t.sub,
    coalesce((SELECT jsonb_agg(x) FROM jsonb_array_elements_text(t.extra_subs) x
      WHERE EXISTS (SELECT 1 FROM "subcategories" s WHERE s.category_slug = 'cay-canh' AND s.slug = x)), '[]'::jsonb),
    'plant', 'Việt Nam', 'plant', 'Cây', t.spec, t.lead, t.specs, t.kw, t.fs, t.attrs, false, now() + t.ord * interval '1 millisecond'
  FROM todo t, base
  RETURNING "slug"
)
INSERT INTO "_m53_new" SELECT slug FROM ins;--> statement-breakpoint
WITH ins AS (
  INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "old_price", "garden", "cost", "combo2", "stock")
  SELECT m.slug, (o.ord - 1)::int, o.value->>'label', (o.value->>'price')::int, (o.value->>'old')::int, (o.value->>'garden')::int, (o.value->>'cost')::int, (o.value->>'combo2')::int, 0
  FROM "_m53" m JOIN "_m53_new" n ON n.slug = m.slug, jsonb_array_elements(m.options) WITH ORDINALITY AS o(value, ord)
  RETURNING "product_slug", "idx"
)
INSERT INTO "_m53_newopt" SELECT product_slug, idx FROM ins;--> statement-breakpoint
WITH st AS (SELECT id FROM "stores" WHERE "active" ORDER BY is_default DESC, id LIMIT 1),
lots AS (
  INSERT INTO "stock_lots" ("store_id", "product_slug", "option_idx", "qty")
  SELECT st.id, t.slug, t.idx, 10 FROM "_m53_newopt" t, st
  RETURNING id, store_id, product_slug, option_idx
),
mv AS (
  INSERT INTO "stock_moves" ("product_slug", "option_idx", "store_id", "lot_id", "delta", "after", "reason", "note", "actor")
  SELECT product_slug, option_idx, store_id, id, 10, 10, 'import', 'Tồn đầu kỳ', 'Hệ thống' FROM lots
)
UPDATE "product_options" o SET "stock" = 10
FROM "_m53_newopt" t, st WHERE o.product_slug = t.slug AND o.idx = t.idx;--> statement-breakpoint
DROP TABLE "_m53_new";--> statement-breakpoint
DROP TABLE "_m53";--> statement-breakpoint
DROP TABLE "_m53_newopt";
