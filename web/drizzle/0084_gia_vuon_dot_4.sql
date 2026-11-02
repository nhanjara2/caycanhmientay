-- Giá theo GIÁ VƯỜN THẬT, đợt 4 (02/11/2026): chủ shop gửi 61 dòng "cây và giá gốc" (= giá tại vườn, khớp cột garden của các cây đã có).
-- Công thức hiện hành (lib/pricing.ts): giá gốc = vườn + 10% · giá lẻ = gốc × 2 · combo 2 cây = lẻ × 2 − 10% · giá gạch = lẻ + 20–30%.
--   * Đã có đúng giá vườn → không đổi (48 dòng).
--   * Thêm 7 cây mới, BẬT BÁN, chưa có ảnh, tồn 10: Sống đời (40.000đ), Đa tâm phúc (75.000đ), Phát tài núi lá kim (1 thân 150.000đ),
--     Trúc bách hợp (170.000đ), Kim tiền (27.000đ + cỡ lớn 120.000đ), Vạn lỗ Thái đột biến (40.000đ), Xẻ (1 thân 50.000đ, 3 thân 180.000đ).
--     Đa tâm phúc, Vạn lỗ Thái đột biến, Xẻ chưa xác định được giống → chỉ mô tả chung.
--   * Thêm quy cách cho cây đã có: Đế vương kim cương "1 thân" 30.000đ (đổi tên cây bỏ chữ "3 thân", quy cách cũ thành "3 thân"),
--     Trầu bà thanh xuân "Chậu C12" 70.000đ, Hạc cam "Cỡ lớn" 70.000đ, Sơn tùng "Cỡ lớn" 150.000đ, Chuối rẻ quạt "Cỡ nhỏ" 50.000đ,
--     Vạn lộc "Cỡ lớn" 40.000đ (sổ ghi "Vạn lộc" và "Vạn lộc đỏ" cùng 40.000đ — Vạn lộc trên web đã là giống lá đỏ).
--   * Chanh tàn đang ẩn mà có trong sổ giá → bật bán.
--   * Mỗi quy cách mới tồn 10 ở kho mặc định ("Tồn đầu kỳ"), lô ghi giá vườn. Chạy lại không nhập trùng.
CREATE TEMP TABLE "_m84" ("ord" int, "slug" text PRIMARY KEY, "name" text, "sub" text, "extra_subs" jsonb, "icon" text, "spec" text, "lead" text,
  "specs" jsonb, "attrs" jsonb, "kw" jsonb, "options" jsonb);--> statement-breakpoint
INSERT INTO "_m84" VALUES
(1, 'song-doi', 'Sống đời', 'cay-ban-cong', '["cay-de-ban"]'::jsonb, 'flower', 'Ban công · Để bàn',
 'Sống đời (trường sinh, hoa đá) là cây mọng nước nở chùm hoa nhỏ đỏ, cam, vàng, hồng kéo dài nhiều tuần. Lá dày bóng, chịu hạn tốt, rất dễ chăm, hợp đặt ban công, bậu cửa sổ hoặc chưng Tết.',
 '[["Ánh sáng","Nơi có nắng, tốt nhất nắng sáng 4–6 giờ/ngày; thiếu sáng ít hoa"],["Tưới nước","Tưới khi đất khô hẳn, 1–2 lần/tuần; cây mọng nước, rất sợ úng"],["Đất trồng","Đất tơi xốp thoát nước nhanh: đất sạch trộn trấu hun, cát, xơ dừa"],["Bón phân","Phân tan chậm hoặc NPK nhiều lân khi ra nụ, 1 lần/tháng"],["Nhiệt độ, độ ẩm","Thích hợp 15–30°C, chịu khô"],["Mức độ dễ chăm","Rất dễ chăm"],["An toàn thú cưng","Không — độc với chó mèo nếu ăn phải"],["Công dụng","Trang trí ban công, cửa sổ, bàn; chưng Tết"],["Cách nhân giống","Giâm lá, giâm cành"],["Nguồn gốc","Madagascar"],["Tên khoa học","Kalanchoe blossfeldiana"],["Sâu bệnh thường gặp","Thối gốc khi úng; rệp sáp"]]'::jsonb,
 '{"cham":"de","viTri":["ban-cong","ngoai-troi"],"anhSang":["sang"],"thuCung":"doc","vaiTro":["de-ban"],"kichThuoc":"nho"}'::jsonb,
 '["Trường sinh","Hoa sống đời","Hoa đá","Kalanchoe"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":40000,"cost":44000,"price":88000,"combo2":158000,"old":109000,"bulky":false}]'::jsonb),
(2, 'da-tam-phuc', 'Đa tâm phúc', 'cay-van-phong', '["cay-trong-nha"]'::jsonb, 'plant', 'Văn phòng · Trong nhà',
 'Đa tâm phúc là cây cảnh trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt văn phòng, phòng khách, sảnh nơi có ánh sáng. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Nơi sáng, ánh sáng tán xạ hoặc nắng nhẹ buổi sáng"],["Tưới nước","Tưới khi mặt đất khô 2–3cm; không để đọng nước dưới đáy chậu"],["Đất trồng","Đất tơi xốp thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb, '["Đa tâm phúc"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":75000,"cost":83000,"price":166000,"combo2":299000,"old":203000,"bulky":false}]'::jsonb),
(3, 'phat-tai-nui-la-kim', 'Phát tài núi lá kim', 'cay-van-phong', '["cay-trong-nha","cay-cong-trinh"]'::jsonb, 'plant', 'Văn phòng · Trong nhà · Công trình',
 'Phát tài núi lá kim có thân gỗ to, sần như đá núi, ngọn xòe chùm lá nhỏ dài, cứng. Dáng cây vững, sang, được chưng ở sảnh, phòng khách, văn phòng với ý nghĩa tài lộc bền vững. Cây khỏe, chịu hạn, ít sâu bệnh.',
 '[["Ánh sáng","Nơi sáng, chịu được nắng nhẹ lẫn trong nhà có ánh sáng tán xạ"],["Tưới nước","Tưới khi đất khô, 1–2 lần/tuần; thân trữ nước nên rất sợ úng"],["Đất trồng","Đất tơi xốp thoát nước nhanh: đất sạch trộn trấu hun, cát, xơ dừa"],["Bón phân","Phân tan chậm, 2–3 tháng/lần"],["Nhiệt độ, độ ẩm","Thích hợp 18–35°C"],["Mức độ dễ chăm","Dễ chăm"],["An toàn thú cưng","Không — độc với chó mèo nếu ăn phải"],["Công dụng","Trang trí sảnh, phòng khách, văn phòng; quà tặng khai trương"],["Tên khoa học","Dracaena (nhóm phát tài núi)"],["Sâu bệnh thường gặp","Thối gốc khi úng; vàng đầu lá khi thiếu sáng lâu"]]'::jsonb,
 '{"cham":"de","viTri":["trong-nha","van-phong"],"anhSang":["sang","ram"],"thuCung":"doc","vaiTro":["goc"],"kichThuoc":"lon"}'::jsonb,
 '["Phát tài núi","Phát tài núi lá kim","Dracaena"]'::jsonb,
 '[{"label":"1 thân","garden":150000,"cost":165000,"price":330000,"combo2":594000,"old":419000,"bulky":true}]'::jsonb),
(4, 'truc-bach-hop', 'Trúc bách hợp', 'cay-van-phong', '["cay-trong-nha"]'::jsonb, 'plant', 'Văn phòng · Trong nhà',
 'Trúc bách hợp có thân mảnh mọc thành bụi, lá nhỏ xếp xoắn quanh thân, xanh bóng hoặc viền vàng. Dáng cây thanh, gọn, hợp góc phòng khách, văn phòng, sảnh; được xem là cây mang lại bình an, may mắn.',
 '[["Ánh sáng","Ánh sáng tán xạ, chịu được trong nhà; tránh nắng gắt làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, 2 lần/tuần; không để úng"],["Đất trồng","Đất tơi xốp thoát nước: đất sạch trộn xơ dừa, trấu hun"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng"],["Nhiệt độ, độ ẩm","Thích hợp 18–32°C"],["Mức độ dễ chăm","Dễ chăm"],["An toàn thú cưng","Không — độc với chó mèo nếu ăn phải"],["Công dụng","Trang trí góc phòng, văn phòng, sảnh"],["Cách nhân giống","Giâm cành"],["Tên khoa học","Dracaena reflexa"],["Sâu bệnh thường gặp","Thối rễ khi úng; khô đầu lá khi không khí quá khô"]]'::jsonb,
 '{"cham":"de","viTri":["trong-nha","van-phong"],"anhSang":["sang","ram"],"thuCung":"doc","vaiTro":["goc"],"kichThuoc":"lon"}'::jsonb,
 '["Bách hợp","Phất dụ trúc bách hợp","Dracaena reflexa","Song of India"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":170000,"cost":187000,"price":374000,"combo2":673000,"old":468000,"bulky":true}]'::jsonb),
(5, 'kim-tien', 'Kim tiền', 'cay-van-phong', '["cay-de-ban","cay-trong-nha"]'::jsonb, 'plant', 'Văn phòng · Để bàn · Trong nhà',
 'Kim tiền (kim phát tài) có lá kép xanh đậm bóng mọc đối xứng trên cuống mập, củ dưới đất trữ nước nên rất chịu hạn. Cây khỏe, chịu bóng, gần như không cần chăm; được ưa chuộng làm quà khai trương với ý nghĩa tiền tài.',
 '[["Ánh sáng","Chịu bóng tốt, sống được dưới đèn văn phòng; tránh nắng gắt chiếu thẳng"],["Tưới nước","Tưới khi đất khô hẳn, khoảng 1 lần/tuần; củ trữ nước, rất sợ úng"],["Đất trồng","Đất tơi xốp thoát nước: đất sạch trộn trấu hun, xơ dừa"],["Bón phân","NPK 20-20-20 pha loãng, 1–2 tháng/lần"],["Nhiệt độ, độ ẩm","Thích hợp 18–32°C"],["Mức độ dễ chăm","Rất dễ chăm"],["An toàn thú cưng","Không — nhựa có tinh thể canxi oxalat gây ngứa, độc nếu nhai phải"],["Công dụng","Trang trí bàn làm việc, văn phòng, phòng khách; quà khai trương"],["Cách nhân giống","Tách bụi, giâm lá"],["Nguồn gốc","Đông Phi"],["Tên khoa học","Zamioculcas zamiifolia"],["Sâu bệnh thường gặp","Thối củ khi úng; vàng lá khi tưới quá nhiều"]]'::jsonb,
 '{"cham":"de","viTri":["trong-nha","van-phong"],"anhSang":["sang","ram","den"],"thuCung":"doc","vaiTro":["de-ban","goc"],"kichThuoc":"vua"}'::jsonb,
 '["Kim phát tài","Cây kim tiền","Zamioculcas","ZZ plant"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":27000,"cost":30000,"price":60000,"combo2":108000,"old":74000,"bulky":false},
   {"label":"Cỡ lớn","garden":120000,"cost":132000,"price":264000,"combo2":475000,"old":338000,"bulky":false}]'::jsonb),
(6, 'van-lo-thai-dot-bien', 'Vạn lỗ Thái đột biến', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'leaf', 'Trong nhà · Văn phòng',
 'Vạn lỗ Thái đột biến là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb, '["Vạn lỗ","Vạn lỗ đột biến","Monstera"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":40000,"cost":44000,"price":88000,"combo2":158000,"old":106000,"bulky":false}]'::jsonb),
(7, 'cay-xe', 'Xẻ', 'cay-van-phong', '["cay-trong-nha"]'::jsonb, 'plant', 'Văn phòng · Trong nhà',
 'Cây Xẻ trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc, có loại 1 thân và 3 thân. Cây hợp đặt văn phòng, phòng khách, sảnh. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Nơi sáng, ánh sáng tán xạ hoặc nắng nhẹ buổi sáng"],["Tưới nước","Tưới khi mặt đất khô 2–3cm; không để đọng nước dưới đáy chậu"],["Đất trồng","Đất tơi xốp thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb, '["Cây xẻ"]'::jsonb,
 '[{"label":"1 thân","garden":50000,"cost":55000,"price":110000,"combo2":198000,"old":139000,"bulky":false},
   {"label":"3 thân","garden":180000,"cost":198000,"price":396000,"combo2":713000,"old":491000,"bulky":true}]'::jsonb);--> statement-breakpoint
CREATE TEMP TABLE "_m84_new" ("slug" text PRIMARY KEY);--> statement-breakpoint
WITH base AS (
  SELECT greatest(90000, coalesce(max(substring(sku FROM '^MT-(\d+)$')::int), 0)) AS n FROM "products" WHERE sku ~ '^MT-\d+$'
),
todo AS (
  SELECT v.* FROM "_m84" v
  WHERE NOT EXISTS (SELECT 1 FROM "products" e WHERE e.slug = v.slug OR lower(e.name) = lower(v.name))
    AND EXISTS (SELECT 1 FROM "subcategories" s WHERE s.category_slug = 'cay-canh' AND s.slug = v.sub)
),
ins AS (
  INSERT INTO "products" ("slug", "sku", "name", "category", "sub", "extra_subs", "icon", "origin", "ship", "unit", "spec", "lead", "specs", "keywords", "attrs", "active", "created_at")
  SELECT t.slug, 'MT-' || (base.n + row_number() OVER (ORDER BY t.ord)), t.name, 'cay-canh', t.sub,
    coalesce((SELECT jsonb_agg(x) FROM jsonb_array_elements_text(t.extra_subs) x
      WHERE EXISTS (SELECT 1 FROM "subcategories" s WHERE s.category_slug = 'cay-canh' AND s.slug = x)), '[]'::jsonb),
    t.icon, 'Việt Nam', 'plant', 'Chậu', t.spec, t.lead, t.specs, t.kw, t.attrs, true, now() + t.ord * interval '1 millisecond'
  FROM todo t, base
  RETURNING "slug"
)
INSERT INTO "_m84_new" SELECT slug FROM ins;--> statement-breakpoint
INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "old_price", "garden", "cost", "combo2", "bulky", "stock")
SELECT m.slug, (o.ord - 1)::int, o.value->>'label', (o.value->>'price')::int, (o.value->>'old')::int, (o.value->>'garden')::int, (o.value->>'cost')::int,
  (o.value->>'combo2')::int, (o.value->>'bulky')::boolean, 10
FROM "_m84" m JOIN "_m84_new" n ON n.slug = m.slug, jsonb_array_elements(m.options) WITH ORDINALITY AS o(value, ord);--> statement-breakpoint
-- Đế vương kim cương: tên cây bỏ chữ "3 thân", quy cách cũ (vườn 90.000đ) đổi thành "3 thân".
UPDATE "products" SET "name" = 'Đế vương kim cương', "updated_at" = now() WHERE "slug" = 'de-kim-cuong' AND "name" = 'Đế vương kim cương 3 thân';--> statement-breakpoint
UPDATE "product_options" SET "label" = '3 thân' WHERE "product_slug" = 'de-kim-cuong' AND "label" = 'Cỡ tiêu chuẩn' AND "garden" = 90000;--> statement-breakpoint
-- Quy cách mới cho cây đã có, nối sau quy cách đang có; bỏ qua nếu đã có cùng tên quy cách hoặc cùng giá vườn.
CREATE TEMP TABLE "_m84_opt" ("slug" text, "label" text, "garden" int, "cost" int, "price" int, "combo2" int, "old" int, "bulky" boolean);--> statement-breakpoint
INSERT INTO "_m84_opt" VALUES
('de-kim-cuong', '1 thân', 30000, 33000, 66000, 119000, 83000, false),
('thanh-xuan', 'Chậu C12', 70000, 77000, 154000, 277000, 188000, false),
('hac-cam', 'Cỡ lớn', 70000, 77000, 154000, 277000, 196000, false),
('son-tung', 'Cỡ lớn', 150000, 165000, 330000, 594000, 406000, false),
('chuoi-re-quat', 'Cỡ nhỏ', 50000, 55000, 110000, 198000, 139000, false),
('van-loc', 'Cỡ lớn', 40000, 44000, 88000, 158000, 109000, false);--> statement-breakpoint
DELETE FROM "_m84_opt" t WHERE NOT EXISTS (SELECT 1 FROM "products" p WHERE p.slug = t.slug)
  OR EXISTS (SELECT 1 FROM "product_options" o WHERE o.product_slug = t.slug AND NOT o.deleted AND (o.label = t.label OR o.garden = t.garden));--> statement-breakpoint
INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "old_price", "garden", "cost", "combo2", "bulky", "stock")
SELECT t.slug, (SELECT coalesce(max(idx), -1) + 1 FROM "product_options" WHERE product_slug = t.slug), t.label, t.price, t.old, t.garden, t.cost, t.combo2, t.bulky, 10
FROM "_m84_opt" t;--> statement-breakpoint
INSERT INTO "_m84_new" SELECT DISTINCT slug FROM "_m84_opt" ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "products" SET "updated_at" = now() WHERE "slug" IN (SELECT slug FROM "_m84_opt");--> statement-breakpoint
-- Chanh tàn có trong sổ giá → bật bán.
UPDATE "products" SET "active" = true, "updated_at" = now() WHERE "slug" = 'chanh-tan' AND NOT "active";--> statement-breakpoint
-- Tồn đầu kỳ 10 cho mỗi quy cách vừa thêm.
WITH st AS (SELECT id FROM "stores" WHERE "active" ORDER BY is_default DESC, id LIMIT 1),
lots AS (
  INSERT INTO "stock_lots" ("store_id", "product_slug", "option_idx", "qty", "unit_cost")
  SELECT st.id, o.product_slug, o.idx, 10, o.garden
  FROM "product_options" o JOIN "_m84_new" n ON n.slug = o.product_slug, st
  WHERE NOT o.deleted AND NOT EXISTS (SELECT 1 FROM "stock_lots" l WHERE l.product_slug = o.product_slug AND l.option_idx = o.idx)
  RETURNING id, store_id, product_slug, option_idx
)
INSERT INTO "stock_moves" ("product_slug", "option_idx", "store_id", "lot_id", "delta", "after", "reason", "note", "actor")
SELECT product_slug, option_idx, store_id, id, 10, 10, 'import', 'Tồn đầu kỳ', 'Hệ thống' FROM lots;--> statement-breakpoint
DROP TABLE "_m84_opt";--> statement-breakpoint
DROP TABLE "_m84_new";--> statement-breakpoint
DROP TABLE "_m84";
