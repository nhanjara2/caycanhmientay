ALTER TABLE "stores" ADD COLUMN "kind" text DEFAULT 'store' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "note" text;
--> statement-breakpoint
-- Đối tác cung cấp tro trấu: Hoa Kiểng Tro Trấu Phương Linh (Sa Đéc), chủ shop cung cấp 07/10/2026. Chỉ hiện trên trang Hệ thống cửa hàng
-- (kind = 'partner', active = false → không vào Kho / POS / nhập hàng). Địa chỉ ghi đúng như danh thiếp; tọa độ lấy từ ghim Google Maps.
-- Chỉ thêm khi database đã có cửa hàng (database mới tinh thì seed.ts tự tạo).
INSERT INTO "stores" ("code", "name", "address", "lat", "lng", "is_default", "active", "is_public", "kind", "phone", "note", "services")
SELECT 'PL', 'Hoa Kiểng Tro Trấu Phương Linh', 'Ngay cầu Sa Nhiên 2, Ấp Khánh Nhơn, Xã Tân Khánh Đông, TP. Sa Đéc, Đồng Tháp', 10.3411553, 105.7344338, false, false, true, 'partner', '0707873425',
  'Đối tác cung cấp tro trấu cho Cây Cảnh Miền Tây. Bán sỉ và lẻ tro trấu, sơ dừa, phân rơm, phân bò, cỏ nhung, hoa kiểng, vỏ nhựa các loại.', '["supply"]'::jsonb
WHERE EXISTS (SELECT 1 FROM "stores")
ON CONFLICT ("code") DO NOTHING;
