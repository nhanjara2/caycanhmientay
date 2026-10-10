-- Các mức giá cho mỗi quy cách (10/10/2026, chủ shop): Giá tại vườn → Giá gốc = vườn + 10% → Giá lẻ (giá bán) = gốc + 80%
-- → Combo 2 cây = (lẻ × 2) − 10%; giá gạch ngang = lẻ + ngẫu nhiên 20–30% để hiện % giảm. Giá sỉ công trình: liên hệ báo giá.
-- Công thức ở lib/pricing.ts. Đơn ghi thêm tiền giảm combo.
-- Giá đang bán trên web GIỮ NGUYÊN làm giá lẻ (chủ shop chọn) → tính ngược giá gốc, giá tại vườn; thêm combo + giá gạch ngang.
-- Làm tròn như roundPrice(): từ 10.000đ tròn nghìn, dưới đó tròn trăm. Quy cách "Liên hệ báo giá" (giá 0) giữ nguyên;
-- quy cách đã có giá gạch ngang cao hơn giá lẻ (admin tự đặt) giữ giá đó.
ALTER TABLE "orders" ADD COLUMN "combo_discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_options" ADD COLUMN "garden" integer;--> statement-breakpoint
ALTER TABLE "product_options" ADD COLUMN "cost" integer;--> statement-breakpoint
ALTER TABLE "product_options" ADD COLUMN "combo2" integer;--> statement-breakpoint
WITH a AS (
  SELECT "product_slug", "idx", "price" AS r, "old_price" AS old,
    (CASE WHEN "price" / 1.8 >= 10000 THEN round("price" / 1.8 / 1000) * 1000 ELSE round("price" / 1.8 / 100) * 100 END)::int AS c,
    (CASE WHEN "price" * 1.8 >= 10000 THEN round("price" * 1.8 / 1000) * 1000 ELSE round("price" * 1.8 / 100) * 100 END)::int AS cb,
    "price" * (1.2 + random() * 0.1) AS f
  FROM "product_options" WHERE "price" > 0 AND "cost" IS NULL
), b AS (
  SELECT a.*,
    (CASE WHEN c / 1.1 >= 10000 THEN round(c / 1.1 / 1000) * 1000 ELSE round(c / 1.1 / 100) * 100 END)::int AS g,
    (CASE WHEN f >= 10000 THEN round(f / 1000) * 1000 ELSE round(f / 100) * 100 END)::int AS fr
  FROM a
)
UPDATE "product_options" o
SET "garden" = b.g, "cost" = b.c, "combo2" = b.cb,
  "old_price" = CASE
    WHEN b.old IS NOT NULL AND b.old > b.r THEN b.old
    WHEN b.fr > b.r THEN b.fr
    ELSE b.r + CASE WHEN b.r >= 10000 THEN 1000 ELSE 100 END
  END
FROM b WHERE o."product_slug" = b."product_slug" AND o."idx" = b."idx";--> statement-breakpoint
-- Mã giảm giá theo giá trị đơn (chủ shop): CAMON5 / 10 / 15 / 20 — giảm 5 / 10 / 15 / 20% cho đơn từ 1 / 2 / 3 / 4 triệu tiền hàng.
-- Mỗi đơn một mã; mỗi khách dùng được nhiều lần (100 lượt). Sửa / tắt ở /admin/khuyen-mai. Mã đã có thì giữ nguyên.
INSERT INTO "vouchers" ("code", "label", "discount_type", "discount_value", "min_order", "per_customer_limit", "active") VALUES
('CAMON5', 'Cảm ơn bạn — giảm 5% đơn từ 1 triệu', 'percent', 5, 1000000, 100, true),
('CAMON10', 'Cảm ơn bạn — giảm 10% đơn từ 2 triệu', 'percent', 10, 2000000, 100, true),
('CAMON15', 'Cảm ơn bạn — giảm 15% đơn từ 3 triệu', 'percent', 15, 3000000, 100, true),
('CAMON20', 'Cảm ơn bạn — giảm 20% đơn từ 4 triệu', 'percent', 20, 4000000, 100, true)
ON CONFLICT ("code") DO NOTHING;
