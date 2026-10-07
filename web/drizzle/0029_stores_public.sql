ALTER TABLE "stores" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "open_24h" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "open_from" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "open_to" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "services" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
-- Cửa hàng thật duy nhất hiện có: Vườn ươm Làng hoa Sa Đéc (chủ shop cung cấp 07/10/2026). Hiện trên trang Hệ thống cửa hàng.
-- Chỉ thêm khi database đã có cửa hàng (database mới tinh thì seed.ts tự tạo cùng các cửa hàng mẫu). Các cửa hàng mẫu cũ có is_public = false.
INSERT INTO "stores" ("code", "name", "address", "lat", "lng", "is_default", "active", "is_public", "phone", "contact_name", "open_24h", "services")
SELECT 'SD', 'Vườn ươm Cây Cảnh Miền Tây', 'Làng hoa Sa Đéc, Phường Sa Đéc, Tỉnh Đồng Tháp', 10.349176, 105.731775, false, true, true, '0703005001', 'Lê Hoài Nhân', true, '["nursery","clinic"]'::jsonb
WHERE EXISTS (SELECT 1 FROM "stores")
ON CONFLICT ("code") DO NOTHING;
