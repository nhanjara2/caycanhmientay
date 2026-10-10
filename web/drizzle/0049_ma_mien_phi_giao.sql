ALTER TABLE "orders" ADD COLUMN "ship_voucher_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ship_voucher_discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN "kind" text DEFAULT 'discount' NOT NULL;--> statement-breakpoint
-- Mã miễn phí giao (chủ shop, 10/10/2026): giảm phí giao tối đa 10.000đ / 20.000đ / 50.000đ cho đơn từ 200.000đ / 400.000đ / 800.000đ tiền hàng.
-- Khách chọn trong hộp "Ưu đãi dành cho bạn" ở giỏ hàng / thanh toán; sửa / tắt ở /admin/khuyen-mai.
INSERT INTO "vouchers" ("code", "label", "kind", "discount_type", "discount_value", "min_order", "per_customer_limit", "active") VALUES
('FREESHIP10', 'Giảm 10.000đ phí giao — đơn từ 200.000đ', 'ship', 'amount', 10000, 200000, 100, true),
('FREESHIP20', 'Giảm 20.000đ phí giao — đơn từ 400.000đ', 'ship', 'amount', 20000, 400000, 100, true),
('FREESHIP50', 'Miễn phí giao tối đa 50.000đ — đơn từ 800.000đ', 'ship', 'amount', 50000, 800000, 100, true)
ON CONFLICT ("code") DO NOTHING;
