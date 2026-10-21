-- Giá theo GIÁ VƯỜN THẬT, đợt 3 (21/10/2026): chủ shop gửi 13 dòng giá vườn, không ghi nhà vườn, không ghi cỡ.
-- Công thức hiện hành (lib/pricing.ts): giá gốc = vườn + 10% · giá lẻ = gốc × 2 · combo 2 cây = lẻ × 2 − 10% · giá gạch = lẻ + 20–30%.
--   * Đã có sẵn đúng giá vườn, KHÔNG đổi: Kèn hồng, Cau trắng, Phượng vĩ, Giáng hương, Bàng Đài Loan, Bằng lăng, Dầu rái (280.000đ, đợt 2)
--     và Hoa hồng chậu C8 5 màu (17.000đ, migration 0072).
--   * Thêm 4 cây mới, BẬT BÁN, chưa có ảnh, quy cách "Cỡ tiêu chuẩn", đơn vị "Chậu": Tróc bạc (5.000đ), Ngũ gia bì cẩm thạch (10.000đ),
--     Liễu hai da cẩm thạch (10.000đ), Cây Ruby (70.000đ). Liễu hai da cẩm thạch + Ruby chưa xác định được giống → chỉ mô tả chung.
--     Tróc bạc ghi là Syngonium podophyllum (trầu bà Nam Mỹ lá trắng) — chủ shop xem lại khi có ảnh.
--   * Trầu bà thanh xuân 60.000đ: web đang có quy cách "Chậu C9 (miệng 23cm)" giá vườn 40.000đ → thêm quy cách mới "Cỡ lớn" theo giá 60.000đ
--     (sổ không ghi cỡ; chủ shop sửa tên quy cách cho đúng cỡ).
--   * Mỗi quy cách mới tồn 10 ở kho mặc định ("Tồn đầu kỳ"), lô ghi giá vườn. Chạy lại không nhập trùng.
CREATE TEMP TABLE "_m78" ("ord" int, "slug" text PRIMARY KEY, "name" text, "sub" text, "extra_subs" jsonb, "icon" text, "spec" text, "lead" text,
  "specs" jsonb, "attrs" jsonb, "kw" jsonb, "options" jsonb);--> statement-breakpoint
INSERT INTO "_m78" VALUES
(1, 'troc-bac', 'Tróc bạc', 'cay-de-ban', '["cay-trong-nha","cay-van-phong"]'::jsonb, 'leaf', 'Để bàn · Trong nhà',
 'Tróc bạc (trầu bà Nam Mỹ lá trắng) có lá hình mũi tên, phiến lá xanh nhạt pha trắng bạc. Cây nhỏ gọn, chịu bóng, dễ chăm, hợp để bàn làm việc, kệ sách, cửa sổ hoặc trồng thủy sinh.',
 '[["Ánh sáng","Ánh sáng tán xạ, chịu được đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để úng"],["Đất trồng","Giá thể tơi xốp: đất sạch trộn xơ dừa, trấu hun; trồng trong nước được"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng"],["Nhiệt độ, độ ẩm","Thích hợp 18–30°C, ưa ẩm"],["Mức độ dễ chăm","Dễ chăm"],["An toàn thú cưng","Không — nhựa lá có tinh thể canxi oxalat gây ngứa, độc nếu nhai phải"],["Công dụng","Trang trí bàn làm việc, kệ, cửa sổ; trồng thủy sinh"],["Cách nhân giống","Giâm cành"],["Nguồn gốc","Trung và Nam Mỹ"],["Tên khoa học","Syngonium podophyllum"],["Sâu bệnh thường gặp","Thối rễ khi úng; rệp sáp, nhện đỏ khi khô nóng"]]'::jsonb,
 '{"mau":["bac-trang"],"cham":"de","viTri":["trong-nha","van-phong"],"anhSang":["sang","ram","den"],"thuCung":"doc","vaiTro":["de-ban"],"kichThuoc":"nho"}'::jsonb,
 '["Trầu bà Nam Mỹ","Trầu bà trắng","Syngonium","Arrowhead plant"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":5000,"cost":5500,"price":11000,"combo2":20000,"old":14000,"bulky":false}]'::jsonb),
(2, 'ngu-gia-bi-cam-thach', 'Ngũ gia bì cẩm thạch', 'cay-van-phong', '["cay-trong-nha","cay-ban-cong"]'::jsonb, 'plant', 'Văn phòng · Trong nhà · Ban công',
 'Ngũ gia bì cẩm thạch là giống ngũ gia bì lá đốm, mỗi cuống xòe 7–9 lá nhỏ xanh pha vàng kem. Cây khỏe, dễ chăm, chịu được trong nhà lẫn ban công có nắng nhẹ.',
 '[["Ánh sáng","Nơi sáng, có nắng nhẹ buổi sáng hoặc ánh sáng tán xạ; thiếu sáng lá đốm nhạt màu"],["Tưới nước","Tưới khi mặt đất khô, 2–3 lần/tuần; không để úng"],["Đất trồng","Đất tơi xốp thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 hoặc phân tan chậm, 1 lần/tháng"],["Nhiệt độ, độ ẩm","Thích hợp 18–32°C"],["Mức độ dễ chăm","Dễ chăm"],["An toàn thú cưng","Không — lá có tinh thể canxi oxalat, độc nếu nhai phải"],["Công dụng","Trang trí văn phòng, phòng khách, ban công"],["Cách nhân giống","Giâm cành"],["Tên khoa học","Schefflera arboricola ''Variegata''"],["Sâu bệnh thường gặp","Rệp sáp, nhện đỏ; rụng lá khi đổi chỗ đột ngột hoặc úng"]]'::jsonb,
 '{"mau":["vang"],"cham":"de","viTri":["trong-nha","van-phong","ban-cong"],"anhSang":["sang","ram"],"thuCung":"doc","vaiTro":["goc","de-ban"],"kichThuoc":"vua"}'::jsonb,
 '["Ngũ gia bì đốm","Ngũ gia bì vàng","Schefflera"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":10000,"cost":11000,"price":22000,"combo2":40000,"old":27000,"bulky":false}]'::jsonb),
(3, 'lieu-hai-da-cam-thach', 'Liễu hai da cẩm thạch', 'cay-ban-cong', '["cay-san-vuon"]'::jsonb, 'leaf', 'Ban công · Sân vườn',
 'Liễu hai da cẩm thạch là cây cảnh lá đốm trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt ban công, hiên nhà, sân vườn có nắng nhẹ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Nơi sáng, có nắng nhẹ buổi sáng; tránh nắng gắt buổi trưa"],["Tưới nước","Tưới khi mặt đất khô 2–3cm; không để đọng nước dưới đáy chậu"],["Đất trồng","Đất tơi xốp thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng"]]'::jsonb,
 '{"viTri":["ban-cong","ngoai-troi"]}'::jsonb, '["Liễu 2 da cẩm thạch","Liễu hai da"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":10000,"cost":11000,"price":22000,"combo2":40000,"old":28000,"bulky":false}]'::jsonb),
(4, 'cay-ruby', 'Cây Ruby', 'cay-trong-nha', '["cay-van-phong"]'::jsonb, 'leaf', 'Trong nhà · Văn phòng',
 'Cây Ruby là cây kiểng lá trồng chậu, lấy từ nhà vườn ở Làng hoa Sa Đéc. Cây hợp đặt trong nhà, văn phòng, nơi có ánh sáng tán xạ. Mô tả chi tiết về giống cây sẽ được bổ sung cùng hình ảnh.',
 '[["Ánh sáng","Ánh sáng tán xạ, gần cửa sổ có rèm hoặc dưới đèn văn phòng; tránh nắng gắt chiếu thẳng làm cháy lá"],["Tưới nước","Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; không để đọng nước dưới đáy chậu"],["Đất trồng","Giá thể tơi xốp, thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"],["Bón phân","NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang ra lá"]]'::jsonb,
 '{"viTri":["trong-nha","van-phong"]}'::jsonb, '["Ruby"]'::jsonb,
 '[{"label":"Cỡ tiêu chuẩn","garden":70000,"cost":77000,"price":154000,"combo2":277000,"old":191000,"bulky":false}]'::jsonb);--> statement-breakpoint
CREATE TEMP TABLE "_m78_new" ("slug" text PRIMARY KEY);--> statement-breakpoint
WITH base AS (
  SELECT greatest(90000, coalesce(max(substring(sku FROM '^MT-(\d+)$')::int), 0)) AS n FROM "products" WHERE sku ~ '^MT-\d+$'
),
todo AS (
  SELECT v.* FROM "_m78" v
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
INSERT INTO "_m78_new" SELECT slug FROM ins;--> statement-breakpoint
INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "old_price", "garden", "cost", "combo2", "bulky", "stock")
SELECT m.slug, (o.ord - 1)::int, o.value->>'label', (o.value->>'price')::int, (o.value->>'old')::int, (o.value->>'garden')::int, (o.value->>'cost')::int,
  (o.value->>'combo2')::int, (o.value->>'bulky')::boolean, 10
FROM "_m78" m JOIN "_m78_new" n ON n.slug = m.slug, jsonb_array_elements(m.options) WITH ORDINALITY AS o(value, ord);--> statement-breakpoint
-- Trầu bà thanh xuân: quy cách "Cỡ lớn" giá vườn 60.000đ, nối sau quy cách đang có.
INSERT INTO "_m78_new"
SELECT 'thanh-xuan' WHERE EXISTS (SELECT 1 FROM "products" WHERE slug = 'thanh-xuan')
  AND NOT EXISTS (SELECT 1 FROM "product_options" WHERE product_slug = 'thanh-xuan' AND (label = 'Cỡ lớn' OR garden = 60000));--> statement-breakpoint
INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "old_price", "garden", "cost", "combo2", "bulky", "stock")
SELECT 'thanh-xuan', (SELECT coalesce(max(idx), -1) + 1 FROM "product_options" WHERE product_slug = 'thanh-xuan'), 'Cỡ lớn', 132000, 166000, 60000, 66000, 238000, false, 10
WHERE EXISTS (SELECT 1 FROM "_m78_new" WHERE slug = 'thanh-xuan');--> statement-breakpoint
UPDATE "products" SET "updated_at" = now() WHERE "slug" = 'thanh-xuan' AND EXISTS (SELECT 1 FROM "_m78_new" WHERE slug = 'thanh-xuan');--> statement-breakpoint
-- Tồn đầu kỳ 10 cho mỗi quy cách vừa thêm (cây mới + quy cách mới của Trầu bà thanh xuân).
WITH st AS (SELECT id FROM "stores" WHERE "active" ORDER BY is_default DESC, id LIMIT 1),
lots AS (
  INSERT INTO "stock_lots" ("store_id", "product_slug", "option_idx", "qty", "unit_cost")
  SELECT st.id, o.product_slug, o.idx, 10, o.garden
  FROM "product_options" o JOIN "_m78_new" n ON n.slug = o.product_slug, st
  WHERE NOT o.deleted AND NOT EXISTS (SELECT 1 FROM "stock_lots" l WHERE l.product_slug = o.product_slug AND l.option_idx = o.idx)
  RETURNING id, store_id, product_slug, option_idx
)
INSERT INTO "stock_moves" ("product_slug", "option_idx", "store_id", "lot_id", "delta", "after", "reason", "note", "actor")
SELECT product_slug, option_idx, store_id, id, 10, 10, 'import', 'Tồn đầu kỳ', 'Hệ thống' FROM lots;--> statement-breakpoint
DROP TABLE "_m78_new";--> statement-breakpoint
DROP TABLE "_m78";
