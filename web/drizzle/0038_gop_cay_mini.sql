-- Danh mục cây khớp file Excel gộp "mỗi cây 1 dòng" (08/10/2026, 199 cây; web 200 vì Chuỗi ngọc đã tách Duranta / sen đá ở 0037).
-- (1) Cây mini là CÙNG cây, khác cỡ → gộp làm quy cách "Mini, cao …" của cây thường: Kim tiền, Kim ngân, Lưỡi hổ, Lưỡi hổ vàng, Hồng môn,
--     Lan ý, Ngũ gia bì, Nha đam, Dương xỉ, Phát tài, Thiết mộc lan, Huyết dụ (cây thường hiện thêm ở nhóm Để bàn).
-- (2) Tên khác của cùng một cây → gộp: Hoa mười giờ → Mười giờ, Hoa tigon → Ti gôn, Hoa nguyệt quế → Nguyệt quế, Hoa mai vạn phúc → Mai vạn phúc,
--     Hoa huỳnh anh → Huỳnh anh, Cây hồng lộc → Hồng lộc.
-- Quy cách của cây bị gộp NỐI SAU quy cách sẵn có (không đổi thứ tự cũ: đơn + giỏ hàng tham chiếu theo thứ tự); trùng tên quy cách thì cộng tồn
-- vào quy cách sẵn có. Lô kho, lịch sử kho, dòng đơn, dòng phiếu nhập, ảnh, yêu thích, đánh giá, hỏi đáp, FAQ chuyển sang cây giữ lại; nhóm, tên
-- gọi khác (thêm tên cây bị gộp để tìm kiếm), vị trí đặt, số đã bán được gộp. Mô tả ngắn / dòng nhóm / "Chiều cao" chỉ đổi khi còn đúng chữ cũ.
-- Thiếu một trong hai cây (đã xóa / đổi) thì bỏ qua cặp đó.
CREATE TEMP TABLE "_m38_pair" ("keep" text PRIMARY KEY, "drop" text NOT NULL UNIQUE, "mini" boolean NOT NULL, "spec_old" text, "spec_new" text, "h_old" text, "h_new" text, "lead_old" text, "lead_new" text);--> statement-breakpoint
INSERT INTO "_m38_pair" VALUES
('kim-tien', 'kim-tien-mini', true, 'Văn phòng · Trong nhà · Ban công', 'Văn phòng · Trong nhà · Ban công · Để bàn', '50–60cm', 'Mini 20–30cm, cỡ lớn 50–60cm', 'Kim tiền có lá kép xanh đậm bóng mọc thẳng, gốc là củ trữ nước nên rất chịu hạn và sống khỏe trong phòng máy lạnh. Đây là loại cây được chọn nhiều làm quà khai trương, đặt bàn làm việc hoặc phòng khách.', 'Kim tiền có lá kép xanh đậm bóng mọc thẳng, gốc là củ trữ nước nên rất chịu hạn và sống khỏe trong phòng máy lạnh. Đây là loại cây được chọn nhiều làm quà khai trương, đặt bàn làm việc hoặc phòng khách. Có thêm cỡ mini để bàn, cao 20–30cm.'),
('kim-ngan', 'kim-ngan-mini', true, 'Văn phòng · Trong nhà · Ban công', 'Văn phòng · Trong nhà · Ban công · Để bàn', '50–70cm', 'Mini 20–30cm, cỡ lớn 50–70cm', 'Kim ngân có thân thường được tết bện 3–5 thân, lá kép xòe như bàn tay xanh tươi. Cây chịu bóng khá, dễ chăm, là cây phong thủy phổ biến nơi văn phòng, cửa hàng.', 'Kim ngân có thân thường được tết bện 3–5 thân, lá kép xòe như bàn tay xanh tươi. Cây chịu bóng khá, dễ chăm, là cây phong thủy phổ biến nơi văn phòng, cửa hàng. Có thêm cỡ mini để bàn, cao 20–30cm.'),
('luoi-ho', 'luoi-ho-mini', true, 'Văn phòng · Trong nhà · Ban công', 'Văn phòng · Trong nhà · Ban công · Để bàn', NULL, NULL, 'Lưỡi hổ có lá dày, mọc thẳng đứng, vằn xanh đậm xen xanh nhạt. Cây gần như không cần chăm, chịu hạn và thiếu sáng tốt, thường được đặt trong phòng ngủ, văn phòng.', 'Lưỡi hổ có lá dày, mọc thẳng đứng, vằn xanh đậm xen xanh nhạt. Cây gần như không cần chăm, chịu hạn và thiếu sáng tốt, thường được đặt trong phòng ngủ, văn phòng. Có thêm cỡ mini để bàn, cao 20–30cm.'),
('luoi-ho-vang', 'luoi-ho-vang-mini', true, 'Văn phòng · Trong nhà', 'Văn phòng · Trong nhà · Để bàn', NULL, NULL, 'Lưỡi hổ vàng là giống lưỡi hổ viền lá vàng tươi, nổi bật hơn lưỡi hổ thường. Cây khỏe, chịu hạn, chịu thiếu sáng, hợp đặt văn phòng và phòng khách.', 'Lưỡi hổ vàng là giống lưỡi hổ viền lá vàng tươi, nổi bật hơn lưỡi hổ thường. Cây khỏe, chịu hạn, chịu thiếu sáng, hợp đặt văn phòng và phòng khách. Có thêm cỡ mini để bàn, cao 20–30cm.'),
('hong-mon', 'hong-mon-mini', true, 'Văn phòng · Trong nhà', 'Văn phòng · Trong nhà · Để bàn', NULL, NULL, 'Hồng môn có hoa mo đỏ bóng hình trái tim, nhụy vàng, bền hoa hàng tuần và ra hoa quanh năm khi đủ sáng. Cây hợp đặt bàn, kệ, phòng khách.', 'Hồng môn có hoa mo đỏ bóng hình trái tim, nhụy vàng, bền hoa hàng tuần và ra hoa quanh năm khi đủ sáng. Cây hợp đặt bàn, kệ, phòng khách. Có thêm cỡ mini để bàn, cao 20–30cm.'),
('lan-y', 'lan-y-mini', true, 'Văn phòng · Trong nhà', 'Văn phòng · Trong nhà · Để bàn', NULL, NULL, 'Lan ý có lá xanh đậm bóng và hoa mo trắng thanh khiết vươn cao, ra hoa được trong nhà. Cây chịu bóng, nằm trong danh sách cây lọc không khí nổi tiếng, hợp phòng khách, phòng ngủ.', 'Lan ý có lá xanh đậm bóng và hoa mo trắng thanh khiết vươn cao, ra hoa được trong nhà. Cây chịu bóng, nằm trong danh sách cây lọc không khí nổi tiếng, hợp phòng khách, phòng ngủ. Có thêm cỡ mini để bàn, cao 20–30cm.'),
('ngu-gia-bi', 'ngu-gia-bi-mini', true, 'Văn phòng · Trong nhà · Ban công · Sân vườn', 'Văn phòng · Trong nhà · Ban công · Sân vườn · Để bàn', NULL, NULL, 'Ngũ gia bì có lá kép xòe như bàn tay với 5–8 lá chét bóng, cây phân cành nhiều, dễ tạo tán. Cây vừa đặt trong nhà sáng, vừa trồng ban công, sân vườn, và được tin là giúp đuổi muỗi.', 'Ngũ gia bì có lá kép xòe như bàn tay với 5–8 lá chét bóng, cây phân cành nhiều, dễ tạo tán. Cây vừa đặt trong nhà sáng, vừa trồng ban công, sân vườn, và được tin là giúp đuổi muỗi. Có thêm cỡ mini để bàn, cao 20–30cm.'),
('nha-dam', 'nha-dam-mini', true, 'Văn phòng · Trong nhà · Ban công', 'Văn phòng · Trong nhà · Ban công · Để bàn', NULL, NULL, 'Nha đam có lá dày mọng nước, mép có răng cưa, bên trong chứa gel trong. Cây rất chịu hạn, ưa nắng, dễ trồng ở bàn cửa sổ, ban công.', 'Nha đam có lá dày mọng nước, mép có răng cưa, bên trong chứa gel trong. Cây rất chịu hạn, ưa nắng, dễ trồng ở bàn cửa sổ, ban công. Có thêm cỡ mini để bàn, cao 15–25cm.'),
('duong-xi', 'duong-xi-mini', true, 'Văn phòng · Trong nhà · Ban công · Sân vườn', 'Văn phòng · Trong nhà · Ban công · Sân vườn · Để bàn', NULL, NULL, 'Dương xỉ có lá kép dài mềm mại rủ xuống, xanh mướt, rất hợp chậu treo, giỏ treo. Cây ưa bóng mát, ẩm, giúp ban công, hiên nhà mát mắt.', 'Dương xỉ có lá kép dài mềm mại rủ xuống, xanh mướt, rất hợp chậu treo, giỏ treo. Cây ưa bóng mát, ẩm, giúp ban công, hiên nhà mát mắt. Có thêm cỡ mini để bàn, cao 20–30cm.'),
('phat-tai', 'phat-tai-mini', true, 'Văn phòng · Ban công', 'Văn phòng · Ban công · Để bàn', NULL, NULL, 'Phát tài có thân gỗ thẳng, lá dài xanh bóng mọc thành chùm ở ngọn; cây trưởng thành có thể ra hoa trắng thơm về đêm. Cây chịu bóng, ít sâu bệnh, hợp đặt phòng khách, văn phòng.', 'Phát tài có thân gỗ thẳng, lá dài xanh bóng mọc thành chùm ở ngọn; cây trưởng thành có thể ra hoa trắng thơm về đêm. Cây chịu bóng, ít sâu bệnh, hợp đặt phòng khách, văn phòng. Có thêm cỡ mini để bàn, cao 25–35cm.'),
('thiet-moc-lan', 'thiet-moc-lan-mini', true, 'Văn phòng · Trong nhà · Sân vườn · Công trình', 'Văn phòng · Trong nhà · Sân vườn · Công trình · Để bàn', NULL, NULL, 'Thiết mộc lan là giống phát tài lá có sọc vàng giữa phiến, thân gỗ thẳng, có thể trồng nhiều thân cao thấp trong một chậu. Cây trưởng thành ra chùm hoa trắng thơm, được xem là điềm may.', 'Thiết mộc lan là giống phát tài lá có sọc vàng giữa phiến, thân gỗ thẳng, có thể trồng nhiều thân cao thấp trong một chậu. Cây trưởng thành ra chùm hoa trắng thơm, được xem là điềm may. Có thêm cỡ mini để bàn, cao 25–35cm.'),
('huyet-du', 'huyet-du-mini', true, 'Văn phòng · Trong nhà', 'Văn phòng · Trong nhà · Để bàn', '50–80cm', 'Mini 25–35cm, cỡ lớn 50–80cm', 'Huyết dụ có lá dài màu đỏ tía hoặc hồng đậm, mọc thành chùm ở ngọn thân. Cây vừa trồng chậu trong nhà sáng, vừa trồng viền sân vườn, tạo điểm nhấn màu sắc.', 'Huyết dụ có lá dài màu đỏ tía hoặc hồng đậm, mọc thành chùm ở ngọn thân. Cây vừa trồng chậu trong nhà sáng, vừa trồng viền sân vườn, tạo điểm nhấn màu sắc. Có thêm cỡ mini để bàn, cao 25–35cm.'),
('muoi-gio', 'hoa-muoi-gio', false, 'Ban công', 'Ban công · Sân vườn', '15–25cm', NULL, 'Mười giờ là cây thân thảo mọng nước, hoa nhiều màu nở rộ vào buổi sáng nắng. Cây cực kỳ dễ trồng, chịu nắng nóng, hợp chậu ban công, bồn viền.', NULL),
('ti-gon', 'hoa-tigon', false, 'Sân vườn', 'Sân vườn · Ban công', '0,5–1m', NULL, 'Ti gôn là cây dây leo lá hình tim, hoa nhỏ màu hồng phấn mọc thành chùm dày. Cây lớn rất nhanh, chịu nắng, hợp leo giàn, hàng rào, ban công.', NULL),
('nguyet-que', 'hoa-nguyet-que', false, 'Sân vườn · Công trình', 'Sân vườn · Công trình · Ban công', NULL, NULL, 'Nguyệt quế có tán lá xanh đậm bóng, hoa trắng nhỏ thơm ngát nở nhiều đợt và quả đỏ cam. Cây dễ uốn tạo dáng, hợp trồng chậu sân vườn, hàng rào, bonsai.', NULL),
('mai-van-phuc', 'hoa-mai-van-phuc', false, 'Sân vườn', 'Sân vườn · Ban công', '50–80cm', '40–60cm, 50–80cm', 'Mai vạn phúc có lá xanh bóng, hoa trắng 5 cánh xoắn chong chóng nở quanh năm, mùi thơm nhẹ. Cây ưa nắng, dễ trồng, hợp chậu ban công, bồn hoa, hàng rào thấp.', NULL),
('huynh-anh', 'hoa-huynh-anh', false, 'Sân vườn', 'Sân vườn · Ban công', NULL, NULL, 'Huỳnh anh có hoa vàng tươi hình kèn, lá xanh bóng, ra hoa gần như quanh năm. Cây ưa nắng, lớn nhanh, hợp leo giàn, cổng, hàng rào.', NULL),
('hong-loc', 'cay-hong-loc', false, 'Công trình', 'Công trình · Sân vườn', '80–150cm', '60–100cm, 80–150cm', 'Hồng lộc có lá non đỏ hồng rực rỡ, chuyển xanh khi già, tán dày dễ cắt tỉa. Cây trồng hàng rào, cây tạo hình tròn, viền lối đi, rất được ưa chuộng.', NULL)
;--> statement-breakpoint
DELETE FROM "_m38_pair" m WHERE NOT EXISTS (SELECT 1 FROM "products" p WHERE p.slug = m.keep) OR NOT EXISTS (SELECT 1 FROM "products" p WHERE p.slug = m.drop);--> statement-breakpoint
-- Quy cách của cây bị gộp → vị trí mới trong cây giữ lại
CREATE TEMP TABLE "_m38_opt" AS
SELECT m.keep, m.drop, o.idx AS src_idx, o.price, o.old_price, o.stock,
  CASE WHEN m.mini AND o.label LIKE 'Cao %' THEN 'Mini, cao ' || substr(o.label, 5) ELSE o.label END AS label,
  NULL::int AS dst_idx, false AS dup
FROM "_m38_pair" m JOIN "product_options" o ON o.product_slug = m.drop;--> statement-breakpoint
UPDATE "_m38_opt" t SET dst_idx = o.idx, dup = true FROM "product_options" o WHERE o.product_slug = t.keep AND o.label = t.label;--> statement-breakpoint
UPDATE "_m38_opt" t SET dst_idx = x.n
FROM (
  SELECT t2.drop, t2.src_idx,
    (SELECT coalesce(max(o.idx), -1) FROM "product_options" o WHERE o.product_slug = t2.keep) + row_number() OVER (PARTITION BY t2.keep ORDER BY t2.src_idx) AS n
  FROM "_m38_opt" t2 WHERE NOT t2.dup
) x
WHERE t.drop = x.drop AND t.src_idx = x.src_idx;--> statement-breakpoint
INSERT INTO "product_options" ("product_slug", "idx", "label", "price", "old_price", "stock")
SELECT keep, dst_idx, label, price, old_price, stock FROM "_m38_opt" WHERE NOT dup;--> statement-breakpoint
UPDATE "product_options" o SET "stock" = o.stock + t.s
FROM (SELECT keep, dst_idx, sum(stock)::int AS s FROM "_m38_opt" WHERE dup GROUP BY keep, dst_idx) t
WHERE o.product_slug = t.keep AND o.idx = t.dst_idx;--> statement-breakpoint
UPDATE "stock_lots" l SET "product_slug" = t.keep, "option_idx" = t.dst_idx FROM "_m38_opt" t WHERE l.product_slug = t.drop AND l.option_idx = t.src_idx;--> statement-breakpoint
UPDATE "stock_moves" s SET "product_slug" = t.keep, "option_idx" = t.dst_idx FROM "_m38_opt" t WHERE s.product_slug = t.drop AND s.option_idx = t.src_idx;--> statement-breakpoint
UPDATE "order_items" i SET "product_slug" = t.keep, "option_idx" = t.dst_idx FROM "_m38_opt" t WHERE i.product_slug = t.drop AND i.option_idx = t.src_idx;--> statement-breakpoint
UPDATE "purchase_receipt_lines" r SET "product_slug" = t.keep, "option_idx" = t.dst_idx FROM "_m38_opt" t WHERE r.product_slug = t.drop AND r.option_idx = t.src_idx;--> statement-breakpoint
-- Quy cách trùng tên: hai lô cùng cửa hàng / số lô / hạn dùng → gộp thành một lô
CREATE TEMP TABLE "_m38_lot" AS
SELECT l.id, min(l.id) OVER (PARTITION BY l.store_id, l.product_slug, l.option_idx, l.lot_code, l.expiry) AS keep_id
FROM "stock_lots" l WHERE l.product_slug IN (SELECT keep FROM "_m38_pair");--> statement-breakpoint
DELETE FROM "_m38_lot" WHERE id = keep_id;--> statement-breakpoint
UPDATE "stock_lots" l SET "qty" = l.qty + x.q FROM (SELECT d.keep_id, sum(s.qty)::int AS q FROM "_m38_lot" d JOIN "stock_lots" s ON s.id = d.id GROUP BY d.keep_id) x WHERE l.id = x.keep_id;--> statement-breakpoint
UPDATE "stock_moves" s SET "lot_id" = d.keep_id FROM "_m38_lot" d WHERE s.lot_id = d.id;--> statement-breakpoint
DELETE FROM "stock_lots" WHERE id IN (SELECT id FROM "_m38_lot");--> statement-breakpoint
-- Ảnh nối sau ảnh của cây giữ lại; yêu thích / đánh giá chuyển nếu người đó chưa có ở cây giữ lại
UPDATE "product_images" i SET "product_slug" = m.keep, "idx" = i.idx + 1 + (SELECT coalesce(max(k.idx), -1) FROM "product_images" k WHERE k.product_slug = m.keep)
FROM "_m38_pair" m WHERE i.product_slug = m.drop;--> statement-breakpoint
UPDATE "wishlists" w SET "product_slug" = m.keep FROM "_m38_pair" m
WHERE w.product_slug = m.drop AND NOT EXISTS (SELECT 1 FROM "wishlists" x WHERE x.user_id = w.user_id AND x.product_slug = m.keep);--> statement-breakpoint
UPDATE "reviews" r SET "product_slug" = m.keep FROM "_m38_pair" m
WHERE r.product_slug = m.drop AND NOT EXISTS (SELECT 1 FROM "reviews" x WHERE x.user_id = r.user_id AND x.product_slug = m.keep);--> statement-breakpoint
UPDATE "questions" q SET "product_slug" = m.keep FROM "_m38_pair" m WHERE q.product_slug = m.drop;--> statement-breakpoint
UPDATE "faqs" f SET "product_slug" = m.keep FROM "_m38_pair" m WHERE f.product_slug = m.drop;--> statement-breakpoint
-- Thông tin cây giữ lại
UPDATE "products" k SET
  "extra_subs" = (
    SELECT coalesce(jsonb_agg(s ORDER BY ord), '[]'::jsonb) FROM (
      SELECT s, min(ord) AS ord FROM (
        SELECT e AS s, n AS ord FROM jsonb_array_elements_text(k.extra_subs) WITH ORDINALITY AS a(e, n)
        UNION ALL SELECT d.sub, 100
        UNION ALL SELECT e, 100 + n FROM jsonb_array_elements_text(d.extra_subs) WITH ORDINALITY AS b(e, n)
      ) u WHERE s <> k.sub GROUP BY s
    ) v
  ),
  "keywords" = (
    SELECT coalesce(jsonb_agg(w ORDER BY ord), '[]'::jsonb) FROM (
      SELECT w, min(ord) AS ord FROM (
        SELECT e AS w, n AS ord FROM jsonb_array_elements_text(k.keywords) WITH ORDINALITY AS a(e, n)
        UNION ALL SELECT d.name, 100
        UNION ALL SELECT e, 100 + n FROM jsonb_array_elements_text(d.keywords) WITH ORDINALITY AS b(e, n)
      ) u WHERE lower(w) <> lower(k.name) GROUP BY w
    ) v
  ),
  "attrs" = CASE
    WHEN k.attrs IS NULL THEN d.attrs
    WHEN d.attrs IS NULL OR d.attrs->'viTri' IS NULL THEN k.attrs
    ELSE jsonb_set(k.attrs, '{viTri}', (
      SELECT coalesce(jsonb_agg(v ORDER BY ord), '[]'::jsonb) FROM (
        SELECT v, min(ord) AS ord FROM (
          SELECT e AS v, n AS ord FROM jsonb_array_elements_text(coalesce(k.attrs->'viTri', '[]'::jsonb)) WITH ORDINALITY AS a(e, n)
          UNION ALL SELECT e, 100 + n FROM jsonb_array_elements_text(d.attrs->'viTri') WITH ORDINALITY AS b(e, n)
        ) u GROUP BY v
      ) x))
  END,
  "fengshui" = coalesce(k.fengshui, d.fengshui),
  "youtube_id" = coalesce(k.youtube_id, d.youtube_id),
  "sold" = k.sold + d.sold,
  "spec" = CASE WHEN k.spec = m.spec_old THEN m.spec_new ELSE k.spec END,
  "lead" = CASE WHEN m.lead_new IS NOT NULL AND k.lead = m.lead_old THEN m.lead_new ELSE k.lead END,
  "specs" = CASE WHEN m.h_new IS NULL THEN k.specs ELSE (
    SELECT jsonb_agg(CASE WHEN e->>0 = 'Chiều cao' AND e->>1 = m.h_old THEN jsonb_build_array('Chiều cao', m.h_new) ELSE e END ORDER BY n)
    FROM jsonb_array_elements(k.specs) WITH ORDINALITY AS z(e, n)
  ) END
FROM "_m38_pair" m JOIN "products" d ON d.slug = m.drop
WHERE k.slug = m.keep;--> statement-breakpoint
-- Xóa cây đã gộp (quy cách, yêu thích / đánh giá còn trùng xóa theo khóa ngoại)
DELETE FROM "products" WHERE "slug" IN (SELECT drop FROM "_m38_pair");--> statement-breakpoint
DROP TABLE "_m38_lot";--> statement-breakpoint
DROP TABLE "_m38_opt";--> statement-breakpoint
DROP TABLE "_m38_pair";
