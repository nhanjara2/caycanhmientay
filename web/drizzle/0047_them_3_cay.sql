-- Thêm 3 cây (10/10/2026, chủ shop nhờ "bổ sung cây môn quan âm, dạ lan thanh, melo"), cùng khuôn với 200 cây nạp ở 0034–0038:
-- quy cách = chiều cao cây (chậu bán riêng), mô tả ngắn, bộ thông số chăm sóc (4 dòng đầu = Ánh sáng, Tưới nước, Đất trồng, Bón phân),
-- tên gọi khác (tìm kiếm), phong thủy (ý nghĩa dân gian), đặc điểm cho bộ lọc / tư vấn chọn cây, mỗi quy cách tồn 10 ở kho mặc định.
--   Môn quan âm = Alocasia × amazonica 'Polly' (giống lai); Môn melo = Alocasia melo (Borneo).
--   Dạ lan thanh: cây họ Ráy, các nguồn không thống nhất tên khoa học (Dieffenbachia / Aglaonema) → để trống dòng "Tên khoa học".
-- Giá do Claude ước theo chiều cao, bám giá các cây họ Ráy đang bán (Vạn niên thanh, Bạch mã hoàng tử…); môn sưu tầm (Polly, Melo) cao hơn.
-- Chủ shop rà lại giá ở /admin/san-pham. Bỏ qua cây đã có (trùng đường dẫn hoặc trùng tên).
CREATE TEMP TABLE "_m47" ("ord" int, "slug" text PRIMARY KEY, "name" text, "sub" text, "extra_subs" jsonb, "spec" text, "lead" text,
  "specs" jsonb, "attrs" jsonb, "fs" jsonb, "kw" jsonb, "options" jsonb);--> statement-breakpoint
INSERT INTO "_m47" VALUES
(1, 'mon-quan-am', 'Môn quan âm', 'cay-de-ban', '["cay-van-phong", "cay-trong-nha"]'::jsonb, 'Để bàn · Văn phòng · Trong nhà',
 'Môn quan âm (Alocasia Polly) có lá hình mũi tên xanh đậm gần như đen bóng, gân trắng bạc nổi rõ, mặt dưới lá ánh tím. Cây nhỏ gọn, hợp để bàn, kệ, phòng khách nơi có ánh sáng tán xạ. Nhựa cây gây ngứa nên để xa tầm tay trẻ nhỏ và thú cưng.',
 '[["Ánh sáng", "Ánh sáng tán xạ sáng, gần cửa sổ; tránh nắng gắt chiếu thẳng làm cháy lá, thiếu sáng lâu thì cuống vươn dài, lá nhạt màu"], ["Tưới nước", "Tưới khi mặt đất khô 2–3cm, khoảng 2 lần/tuần; củ dễ thối nếu úng, không để đọng nước dưới đáy chậu"], ["Đất trồng", "Giá thể thật thoát nước: xơ dừa, vỏ thông hoặc coco chip, đá perlite, trộn ít phân trùn quế"], ["Bón phân", "NPK 20-20-20 pha loãng nửa liều, 2–4 tuần/lần khi cây đang ra lá; mùa lạnh ngưng bón"], ["Nhiệt độ, độ ẩm", "Thích hợp 18–30°C, ưa ẩm cao, phun sương quanh cây; dưới 15°C cây dễ rụng lá, thối củ"], ["Mức độ dễ chăm", "Trung bình — cần chỗ sáng ổn định"], ["Tốc độ sinh trưởng", "Trung bình"], ["Kích thước trưởng thành", "Cao 40–60cm"], ["An toàn thú cưng", "Không — nhựa cây gây ngứa, độc nếu nhai phải (tinh thể canxi oxalat)"], ["Công dụng", "Để bàn, kệ, phòng khách; cây lá đẹp để sưu tầm, làm quà"], ["Cách nhân giống", "Tách củ con, tách bụi"], ["Nguồn gốc", "Giống lai trồng làm cảnh, từ các loài môn Đông Nam Á"], ["Tên khoa học", "Alocasia × amazonica ''Polly''"], ["Sâu bệnh thường gặp", "Nhện đỏ khi khô nóng, rệp sáp; thối củ khi úng nước; lá vàng rụng khi vừa đổi chỗ"], ["Phù hợp với ai", "Người thích cây lá đẹp, có thời gian chăm"]]'::jsonb,
 '{"viTri": ["trong-nha", "van-phong"], "kichThuoc": "nho", "mau": ["xanh-dam", "bac-trang"], "anhSang": ["sang"], "vaiTro": ["de-ban"], "cham": "vua", "thuCung": "doc"}'::jsonb,
 '{"elements": ["moc", "hoa"], "ages": "", "meaning": "Lá vươn thẳng, gân bạc nổi bật; dân gian xem là cây mang may mắn, tài lộc", "placement": "Bàn làm việc, kệ, phòng khách"}'::jsonb,
 '["Trầu bà quan âm", "Môn Polly", "Alocasia Polly", "Alocasia amazonica", "African mask"]'::jsonb,
 '[{"label": "Cao 20–30cm", "price": 45000}, {"label": "Cao 40–60cm", "price": 95000}]'::jsonb),
(2, 'da-lan-thanh', 'Dạ lan thanh', 'cay-van-phong', '["cay-trong-nha"]'::jsonb, 'Văn phòng · Trong nhà',
 'Dạ lan thanh là cây họ Ráy có lá to bầu dục đầu nhọn, viền xanh đậm, giữa lá xanh bạc điểm đốm trắng, gân nổi rõ; thân mập, lá mọc thành cụm ở ngọn. Cây chịu bóng, ưa ẩm, dễ chăm, hợp phòng khách, văn phòng, sảnh. Nhựa cây gây ngứa nên để xa tầm tay trẻ nhỏ.',
 '[["Ánh sáng", "Ánh sáng tán xạ, chịu bóng râm tốt; tránh nắng gắt chiếu thẳng làm cháy lá"], ["Tưới nước", "Giữ đất hơi ẩm, tưới khi mặt đất khô 2–3cm, khoảng 2–3 lần/tuần; không để đọng nước dưới đáy chậu"], ["Đất trồng", "Đất tơi xốp thoát nước: đất sạch trộn xơ dừa, trấu hun, phân trùn quế"], ["Bón phân", "Phân tan chậm hoặc NPK 20-20-20 pha loãng, 1 lần/tháng khi cây đang lớn; cây đã đủ dáng thì bón thưa"], ["Nhiệt độ, độ ẩm", "Thích hợp 18–30°C, ưa ẩm, phun sương lá; tránh gió máy lạnh thổi thẳng vào cây"], ["Mức độ dễ chăm", "Dễ chăm"], ["Tốc độ sinh trưởng", "Trung bình"], ["Kích thước trưởng thành", "Cao 50cm–1m"], ["An toàn thú cưng", "Không — nhựa cây gây ngứa, độc nếu nhai phải (tinh thể canxi oxalat)"], ["Công dụng", "Trang trí phòng khách, văn phòng, sảnh, quán cà phê"], ["Cách nhân giống", "Giâm thân, tách bụi"], ["Nguồn gốc", "Cây nhiệt đới họ Ráy (Araceae)"], ["Sâu bệnh thường gặp", "Đốm lá, thối gốc khi úng nước, rệp sáp, nhện đỏ; lá vàng nếu thiếu sáng lâu ngày"], ["Phù hợp với ai", "Gia đình, văn phòng, người mới trồng cây"]]'::jsonb,
 '{"viTri": ["van-phong", "trong-nha"], "kichThuoc": "vua", "mau": ["xanh", "bac-trang"], "anhSang": ["sang", "ram"], "vaiTro": ["goc"], "cham": "de", "thuCung": "doc"}'::jsonb,
 '{"elements": ["moc", "hoa"], "ages": "", "meaning": "Xanh tốt quanh năm, tượng trưng cho sức khỏe, sung túc, sống lâu; dân gian tin cây giúp xua khí xấu", "placement": "Phòng khách, sảnh, góc văn phòng"}'::jsonb,
 '[]'::jsonb,
 '[{"label": "Cao 40–60cm", "price": 60000}, {"label": "Cao 70–100cm", "price": 130000}]'::jsonb),
(3, 'mon-melo', 'Môn melo', 'cay-de-ban', '["cay-trong-nha"]'::jsonb, 'Để bàn · Trong nhà',
 'Môn melo (Alocasia melo) có lá dày, cứng, mặt lá sần nhám như da tê giác, màu xanh xám, gân lõm sâu. Cây nhỏ gọn, lớn chậm, là loại môn sưu tầm được người chơi cây lá ưa chuộng; hợp để bàn, kệ nơi có ánh sáng tán xạ. Nhựa cây gây ngứa nên để xa tầm tay trẻ nhỏ và thú cưng.',
 '[["Ánh sáng", "Ánh sáng tán xạ sáng; tránh nắng trực tiếp làm cháy lá"], ["Tưới nước", "Tưới khi mặt đất khô 2–3cm, khoảng 1–2 lần/tuần; lá dày nên chịu khô hơn các loại môn khác, úng nước dễ thối củ"], ["Đất trồng", "Giá thể thật thoát nước, ít đất: vỏ thông hoặc coco chip, xơ dừa, đá perlite, đá bọt"], ["Bón phân", "NPK 20-20-20 pha loãng nửa liều, 1 lần/tháng khi cây đang ra lá"], ["Nhiệt độ, độ ẩm", "Thích hợp 20–30°C, ưa ẩm cao; tránh gió máy lạnh thổi thẳng vào cây"], ["Mức độ dễ chăm", "Trung bình — cần chỗ sáng ổn định"], ["Tốc độ sinh trưởng", "Chậm"], ["Kích thước trưởng thành", "Cao 30–60cm"], ["An toàn thú cưng", "Không — nhựa cây gây ngứa, độc nếu nhai phải (tinh thể canxi oxalat)"], ["Công dụng", "Để bàn, kệ; cây lá lạ để sưu tầm"], ["Cách nhân giống", "Tách củ con, tách bụi"], ["Nguồn gốc", "Rừng nhiệt đới Sabah, đảo Borneo (Malaysia)"], ["Tên khoa học", "Alocasia melo"], ["Sâu bệnh thường gặp", "Nhện đỏ, rệp sáp; thối củ khi úng nước"], ["Phù hợp với ai", "Người chơi cây lá sưu tầm, thích lá lạ"]]'::jsonb,
 '{"viTri": ["trong-nha", "van-phong"], "kichThuoc": "mini", "mau": ["xanh"], "anhSang": ["sang"], "vaiTro": ["de-ban"], "cham": "vua", "thuCung": "doc"}'::jsonb,
 '{"elements": ["moc", "hoa"], "ages": "", "meaning": "Lá dày, cứng cáp tượng trưng cho sự vững vàng, bền bỉ và may mắn", "placement": "Bàn làm việc, kệ sách"}'::jsonb,
 '["Môn da tê giác", "Melo", "Alocasia melo", "Alocasia rugosa"]'::jsonb,
 '[{"label": "Cao 15–25cm", "price": 80000}, {"label": "Cao 30–40cm", "price": 150000}]'::jsonb);--> statement-breakpoint
CREATE TEMP TABLE "_m47_new" ("slug" text PRIMARY KEY);--> statement-breakpoint
WITH base AS (
  SELECT greatest(90000, coalesce(max(substring(sku FROM '^MT-(\d+)$')::int), 0)) AS n FROM "products" WHERE sku ~ '^MT-\d+$'
),
todo AS (
  SELECT v.* FROM "_m47" v
  WHERE NOT EXISTS (SELECT 1 FROM "products" e WHERE e.slug = v.slug OR lower(e.name) = lower(v.name))
    AND EXISTS (SELECT 1 FROM "subcategories" s WHERE s.category_slug = 'cay-canh' AND s.slug = v.sub)
),
ins AS (
  INSERT INTO "products" ("slug", "sku", "name", "category", "sub", "extra_subs", "icon", "origin", "ship", "unit", "spec", "lead", "specs", "keywords", "fengshui", "attrs", "active", "created_at")
  SELECT t.slug, 'MT-' || (base.n + row_number() OVER (ORDER BY t.ord)), t.name, 'cay-canh', t.sub,
    coalesce((SELECT jsonb_agg(x) FROM jsonb_array_elements_text(t.extra_subs) x
      WHERE EXISTS (SELECT 1 FROM "subcategories" s WHERE s.category_slug = 'cay-canh' AND s.slug = x)), '[]'::jsonb),
    'plant', 'Việt Nam', 'plant', 'Cây', t.spec, t.lead, t.specs, t.kw, t.fs, t.attrs, true, now() + t.ord * interval '1 millisecond'
  FROM todo t, base
  RETURNING "slug"
)
INSERT INTO "_m47_new" SELECT slug FROM ins;--> statement-breakpoint
INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "stock")
SELECT m.slug, (o.ord - 1)::int, o.value->>'label', (o.value->>'price')::int, 0
FROM "_m47" m JOIN "_m47_new" n ON n.slug = m.slug, jsonb_array_elements(m.options) WITH ORDINALITY AS o(value, ord);--> statement-breakpoint
-- Tồn đầu kỳ 10 / quy cách ở kho mặc định (như các cây khác ở 0035–0036)
WITH st AS (SELECT id FROM "stores" WHERE "active" ORDER BY is_default DESC, id LIMIT 1),
tgt AS (
  SELECT o.product_slug, o.idx FROM "product_options" o
  WHERE o.product_slug IN (SELECT slug FROM "_m47_new") AND o.price > 0
),
lots AS (
  INSERT INTO "stock_lots" ("store_id", "product_slug", "option_idx", "qty")
  SELECT st.id, t.product_slug, t.idx, 10 FROM tgt t, st
  RETURNING id, store_id, product_slug, option_idx
),
mv AS (
  INSERT INTO "stock_moves" ("product_slug", "option_idx", "store_id", "lot_id", "delta", "after", "reason", "note", "actor")
  SELECT product_slug, option_idx, store_id, id, 10, 10, 'import', 'Tồn đầu kỳ', 'Hệ thống' FROM lots
)
UPDATE "product_options" o SET "stock" = 10
FROM tgt t, st WHERE o.product_slug = t.product_slug AND o.idx = t.idx;--> statement-breakpoint
DROP TABLE "_m47_new";--> statement-breakpoint
DROP TABLE "_m47";
