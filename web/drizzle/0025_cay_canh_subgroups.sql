-- Nhóm con của "Cây cảnh" theo thứ tự 01–06: Cây để bàn, Cây văn phòng, Cây trong nhà, Cây ban công, Cây sân vườn, Cây công trình.
-- "Cây sân vườn" đã có từ 0018 (giữ slug, chỉ đổi thứ tự). 5 nhóm cũ (nội thất, kiểng lá, sen đá, lan, bonsai) được ẩn khỏi menu
-- nhưng KHÔNG xóa để sản phẩm đang gắn vào đó không bị mất; admin chuyển sản phẩm rồi xóa ở /admin/danh-muc/cay-canh.
INSERT INTO "subcategories" ("category_slug", "slug", "name", "sort") VALUES
('cay-canh', 'cay-de-ban', 'Cây để bàn', 0),
('cay-canh', 'cay-van-phong', 'Cây văn phòng', 1),
('cay-canh', 'cay-trong-nha', 'Cây trong nhà', 2),
('cay-canh', 'cay-ban-cong', 'Cây ban công', 3),
('cay-canh', 'cay-cong-trinh', 'Cây công trình', 5)
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "subcategories" SET "sort" = 4, "active" = true WHERE "category_slug" = 'cay-canh' AND "slug" = 'cay-san-vuon';--> statement-breakpoint
UPDATE "subcategories" SET "active" = false, "sort" = CASE "slug"
  WHEN 'cay-noi-that' THEN 6
  WHEN 'kieng-la' THEN 7
  WHEN 'sen-da-xuong-rong' THEN 8
  WHEN 'lan' THEN 9
  WHEN 'bonsai' THEN 10
END
WHERE "category_slug" = 'cay-canh' AND "slug" IN ('cay-noi-that', 'kieng-la', 'sen-da-xuong-rong', 'lan', 'bonsai');
