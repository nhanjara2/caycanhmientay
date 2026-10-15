ALTER TABLE "products" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
-- Sản phẩm đã có: chưa biết lần sửa cuối → lấy ngày tạo (không lấy "bây giờ", sitemap sẽ báo mọi sản phẩm vừa sửa).
UPDATE "products" SET "updated_at" = "created_at";
