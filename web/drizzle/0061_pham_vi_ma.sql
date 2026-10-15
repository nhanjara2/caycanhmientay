-- Phạm vi áp dụng của mã giảm giá (15/10/2026): danh mục / nhóm con / sản phẩm; null = mọi sản phẩm (mã cũ giữ nguyên).
ALTER TABLE "vouchers" ADD COLUMN "scope" jsonb;