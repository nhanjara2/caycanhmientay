-- Bỏ các cây cũ (11/10/2026, chủ shop: "các sản phẩm cũ bỏ hết giúp tôi để chuẩn bị cho cây thật việc thật"):
-- xóa mọi cây cảnh KHÔNG có trong sổ giá nhà vườn đợt 1 — đó là các cây nạp từ Excel ở 0034–0047 với giá Claude ước và ảnh minh họa mượn.
-- Giữ 37 cây: 19 cây cũ đã khớp sổ giá + 15 cây mới của 0053 + 3 cây có tên trong sổ nhưng chưa nhập giá (Chuối rẻ quạt, Hoa lài, Ngọc bích).
-- Cây đã có trong đơn hàng thì KHÔNG xóa (bảo hành, Vườn của tôi, báo cáo còn tham chiếu theo slug) — lúc viết web thật chưa có đơn nào.
-- Quy cách, ảnh, yêu thích, đánh giá, hỏi đáp, FAQ riêng xóa theo khóa ngoại; lô / lịch sử kho (không có khóa ngoại) xóa tay — như deleteProduct().
-- Bản sao lưu trước khi xóa (dữ liệu + 202 ảnh) nằm ngoài repo: ../caycanhmientay-backup/2026-10-11-truoc-khi-xoa-cay-cu/.
-- Kèm: đổi tên "Đuôi phụng" thành "Đuôi công phụng" cho đúng tên trong sổ giá (tên cũ giữ làm tên gọi khác để tìm kiếm).
CREATE TEMP TABLE "_m54_keep" ("slug" text PRIMARY KEY);--> statement-breakpoint
INSERT INTO "_m54_keep" VALUES ('van-loc'), ('tung-thom'), ('ngoc-but'), ('duong-xi'), ('phu-quy'), ('ngoc-ngan'), ('luoi-ho'), ('mon-melo'), ('mon-quan-am'), ('da-lan-thanh'), ('ngan-hau'), ('bach-ma-hoang-tu'), ('duoi-cong-tim'), ('duoi-cong-xanh'), ('duoi-cong'), ('duoi-phung'), ('van-nien-thanh'), ('trau-ba-de-vuong-xanh'), ('trau-ba-de-vuong-do'), ('trau-ba-de-vuong-vang'), ('trau-ba-de-vuong-nau'), ('thanh-lam'), ('giu-tien'), ('giu-tien-thai'), ('lindeni'), ('kim-cuong-hong'), ('thanh-xuan'), ('nhu-y'), ('sao-sang'), ('parasol'), ('ngoc-nga'), ('cung-dien-vang'), ('lai-tay'), ('tac-cam-thach-thai'), ('chuoi-re-quat'), ('hoa-lai'), ('ngoc-bich');--> statement-breakpoint
CREATE TEMP TABLE "_m54_del" AS
SELECT p.slug FROM "products" p
WHERE p.category = 'cay-canh'
  AND NOT EXISTS (SELECT 1 FROM "_m54_keep" k WHERE k.slug = p.slug)
  AND NOT EXISTS (SELECT 1 FROM "order_items" i WHERE i.product_slug = p.slug);--> statement-breakpoint
DELETE FROM "stock_moves" WHERE product_slug IN (SELECT slug FROM "_m54_del");--> statement-breakpoint
DELETE FROM "stock_lots" WHERE product_slug IN (SELECT slug FROM "_m54_del");--> statement-breakpoint
DELETE FROM "products" WHERE slug IN (SELECT slug FROM "_m54_del");--> statement-breakpoint
UPDATE "products" SET "name" = 'Đuôi công phụng',
  "keywords" = CASE WHEN "keywords" @> '["Đuôi phụng"]'::jsonb THEN "keywords" ELSE '["Đuôi phụng"]'::jsonb || coalesce("keywords", '[]'::jsonb) END
WHERE slug = 'duoi-phung' AND name = 'Đuôi phụng';--> statement-breakpoint
DROP TABLE "_m54_del";--> statement-breakpoint
DROP TABLE "_m54_keep";
