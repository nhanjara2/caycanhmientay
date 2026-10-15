-- Sản phẩm không áp mã giảm giá / mã miễn phí giao (15/10/2026): tiền của sản phẩm này không tính vào tiền hàng xét mã.
-- Cây sơ ri (bộ 2 cây cao 3m, giá đã chốt, chưa gồm VAT + tiền xe) — chủ shop: "cây này không có voucher".
ALTER TABLE "products" ADD COLUMN "no_voucher" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "products" SET "no_voucher" = true WHERE "slug" = 'cay-so-ri';
