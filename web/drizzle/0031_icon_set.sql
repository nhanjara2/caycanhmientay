-- Bộ icon mới (08/10/2026, components/Icon.tsx): các tên cũ vẫn còn, nhưng 'drop' nay là giọt nước tưới, 'box' là thùng hàng,
-- 'flask' là bình thuốc, 'leaf' là chiếc lá, 'tool' là cờ lê, 'gauge' là đồng hồ đo — không còn hợp với danh mục.
-- Đổi icon của 6 danh mục mẫu sang tên mới, CHỈ khi danh mục vẫn đang dùng icon mặc định (admin đã tự chọn icon khác thì giữ).
UPDATE "categories" SET "icon" = 'spray' WHERE "slug" = 'thuoc-bvtv' AND "icon" = 'flask';--> statement-breakpoint
UPDATE "categories" SET "icon" = 'fertilizer' WHERE "slug" = 'phan-bon' AND "icon" = 'drop';--> statement-breakpoint
UPDATE "categories" SET "icon" = 'soil' WHERE "slug" = 'dat-gia-the' AND "icon" = 'box';--> statement-breakpoint
UPDATE "categories" SET "icon" = 'terrarium' WHERE "slug" = 'trang-tri' AND "icon" = 'leaf';--> statement-breakpoint
UPDATE "categories" SET "icon" = 'shovel' WHERE "slug" = 'dung-cu' AND "icon" = 'tool';--> statement-breakpoint
UPDATE "categories" SET "icon" = 'autowater' WHERE "slug" = 'thiet-bi' AND "icon" = 'gauge';--> statement-breakpoint
-- Icon thay ảnh của sản phẩm chưa có ảnh: phân bón đang là giọt nước / thùng hàng → bao phân; đất – giá thể đang là chậu / thùng → đất trồng;
-- sen đá – xương rồng đang là bông hoa → xương rồng.
UPDATE "products" SET "icon" = 'fertilizer' WHERE "category" = 'phan-bon' AND "icon" IN ('drop', 'box');--> statement-breakpoint
UPDATE "products" SET "icon" = 'soil' WHERE "category" = 'dat-gia-the' AND "icon" IN ('pot', 'box');--> statement-breakpoint
UPDATE "products" SET "icon" = 'cactus' WHERE "category" = 'cay-canh' AND "sub" = 'sen-da-xuong-rong' AND "icon" = 'flower';
