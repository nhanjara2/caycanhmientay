-- 18/10/2026 — chủ shop chốt: giá vốn = giá gốc + 5%, giá bán lẻ thu về tối thiểu 152% giá vốn (chưa gồm phí giao).
-- Giá sàn = gốc × 1,596 nên giá lẻ đổi từ gốc + 80% lên gốc + 100% (gốc × 2) để còn ~20% cho các khoản giảm:
-- combo 2 cây 10% + mã giảm giá ≤ 5% + phí giao shop chịu ≤ 5% (miễn phí giao từ 700.000đ, mã miễn phí giao ≤ 5% đơn tối thiểu).
-- Quy cách đang bán CAO hơn công thức thì giữ nguyên (chủ shop dặn giữ: Bạch mã hoàng tử, Dương xỉ 40–60cm…); bộ và cây sơ ri (giá đặt tay) không đụng.
CREATE OR REPLACE FUNCTION "_m71_rp"(n numeric) RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT (CASE WHEN n >= 10000 THEN round(n / 1000) * 1000 ELSE round(n / 100) * 100 END)::int
$$;--> statement-breakpoint
CREATE TEMP TABLE "_m71" AS
SELECT po.product_slug, po.idx, "_m71_rp"(po.cost * 2) AS price
FROM "product_options" po
WHERE NOT po.deleted AND po.parts IS NULL AND po.cost IS NOT NULL AND po.price > 0
  AND po.product_slug <> 'cay-so-ri' AND "_m71_rp"(po.cost * 2) > po.price;--> statement-breakpoint
UPDATE "product_options" po SET
  "price" = m.price,
  "combo2" = CASE WHEN po.combo2 IS NULL THEN NULL ELSE "_m71_rp"(m.price * 1.8) END,
  "old_price" = greatest("_m71_rp"(m.price * (1.2 + random() * 0.1)::numeric), m.price + 1000)
FROM "_m71" m WHERE po.product_slug = m.product_slug AND po.idx = m.idx;--> statement-breakpoint
UPDATE "products" SET "updated_at" = now() WHERE "slug" IN (SELECT DISTINCT product_slug FROM "_m71");--> statement-breakpoint
DROP TABLE "_m71";--> statement-breakpoint
DROP FUNCTION "_m71_rp"(numeric);--> statement-breakpoint
-- Mã giảm giá ≤ 5% đơn tối thiểu (mã CAMON đã đúng nhờ mức giảm tối đa); quà tài khoản mới 30.000đ từ 600.000đ.
UPDATE "vouchers" SET "discount_value" = 30000, "min_order" = 600000 WHERE "code" = 'CHAOBANMOI';--> statement-breakpoint
-- Mã miễn phí giao ≤ 5% đơn tối thiểu, bật lại; FREESHIP50 để tắt (phí giao 35.000đ, đơn từ 700.000đ đã miễn phí giao).
UPDATE "vouchers" SET "min_order" = 200000, "label" = 'Giảm 10.000đ phí giao — đơn từ 200.000đ', "active" = true WHERE "code" = 'FREESHIP10';--> statement-breakpoint
UPDATE "vouchers" SET "min_order" = 400000, "label" = 'Giảm 20.000đ phí giao — đơn từ 400.000đ', "active" = true WHERE "code" = 'FREESHIP20';--> statement-breakpoint
UPDATE "vouchers" SET "min_order" = 600000, "label" = 'Giảm 30.000đ phí giao — đơn từ 600.000đ', "active" = true WHERE "code" = 'FREESHIP30';--> statement-breakpoint
UPDATE "vouchers" SET "active" = false WHERE "code" = 'FREESHIP50';--> statement-breakpoint
-- Miễn phí giao từ 700.000đ (35.000đ ≤ 5% tiền hàng) cho cây sống lẫn vật tư; cấu hình có mức theo vùng thì đổi cả 3 vùng.
UPDATE "app_settings" SET "value" = jsonb_set(jsonb_set(
    CASE WHEN "value"->'plant' ? 'regionFree'
      THEN jsonb_set("value", '{plant,regionFree}', '{"hcm": 700000, "west": 700000, "far": 700000}'::jsonb) ELSE "value" END,
    '{plant,freeFrom}', '700000'::jsonb), '{supply,freeFrom}', '700000'::jsonb),
  "updated_at" = now()
WHERE "key" = 'shipping' AND "value" ? 'plant' AND "value" ? 'supply';
